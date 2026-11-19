<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\MlRequestException;
use App\Exceptions\MlUnavailableException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Klien tipis ke service inferensi WP-3 (serve.py, Flask).
 *
 * Kontrak mengikuti serve.py milik WP-3:
 *   POST /predict  {"ap_id": string, "ts": "YYYY-MM-DD HH:MM:SS"}
 *      200 -> {ap_id, ts, estimated_count, level, confidence, model_version}
 *      400 -> input salah
 *      404 -> polling belum ada di poll_log
 *      409 -> polling gagal (poll_ok = 0)
 *      503 -> database tidak terjangkau dari sisi service ML
 *   GET  /model    -> {version, name, features, metrics, metrics_from, data, sklearn}
 *   GET  /health   -> {ok: true, model_version}
 *
 * PENTING: `ts` dikirim apa adanya dari kolom poll_log.ts (WIB tanpa zona waktu).
 * Jangan konversi timezone di sisi Laravel — serve.py menganggap input naive
 * berada di zona DB_TZ (Asia/Jakarta).
 */
class MlClient
{
    public const LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CROWDED'];

    /**
     * Minta prediksi untuk satu polling (ap_id, ts).
     *
     * @return array{ap_id:string, ts:string, estimated_count:int, level:string,
     *               confidence:float, model_version:string|null}|null
     *         null = tidak ada prediksi (404 polling belum ada / 409 polling gagal).
     *
     * @throws MlRequestException input ditolak (400) — bug di sisi kita, tidak di-fallback.
     * @throws MlUnavailableException service tidak bisa dipakai (retry habis / respons tidak valid).
     */
    public function predict(string $apId, string $ts): ?array
    {
        $started = microtime(true);
        $payload = ['ap_id' => $apId, 'ts' => $ts];
        $maxAttempts = max(1, (int) config('ml.retries', 2)) + 1;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                $response = Http::timeout((int) config('ml.timeout', 5))
                    ->post((string) config('ml.url'), $payload);
            } catch (ConnectionException $e) {
                IntegrationLog::ml()->warning('koneksi ke service ML gagal', [
                    'ap_id' => $apId,
                    'ts' => $ts,
                    'attempt' => $attempt,
                    'error' => $e->getMessage(),
                    'latency_ms' => $this->elapsed($started),
                ]);
                if ($attempt >= $maxAttempts) {
                    throw new MlUnavailableException("koneksi ke service ML gagal: {$e->getMessage()}");
                }
                $this->backoff();

                continue;
            }

            $status = $response->status();

            if ($response->successful()) {
                $result = $this->validate($response->json(), $apId, $ts);
                IntegrationLog::ml()->info('predict ok', [
                    'ap_id' => $apId,
                    'ts' => $ts,
                    'attempt' => $attempt,
                    'latency_ms' => $this->elapsed($started),
                    'model_version' => $result['model_version'] ?? null,
                ]);

                return $result;
            }

            IntegrationLog::ml()->warning('predict gagal', [
                'ap_id' => $apId,
                'ts' => $ts,
                'attempt' => $attempt,
                'status' => $status,
                'latency_ms' => $this->elapsed($started),
            ]);

            // 404/409 bukan error infra: polling memang belum siap / gagal di sisi WP-2.
            // Sesuai kontrak WP-3, tidak ada prediksi dan tidak boleh di-fallback.
            if (in_array($status, [404, 409], true)) {
                return null;
            }

            // 400 = payload kita salah. Tidak ada gunanya retry/fallback.
            if ($status === 400) {
                throw new MlRequestException(
                    "service ML menolak input (400) untuk ap_id={$apId} ts={$ts}"
                );
            }

            // 503 / 5xx lainnya: error sementara, coba lagi.
            if ($attempt >= $maxAttempts) {
                throw new MlUnavailableException(
                    "service ML memberi status {$status} setelah {$attempt} percobaan"
                );
            }
            $this->backoff();
        }

        // Tidak mungkin sampai sini, hanya pengaman.
        throw new MlUnavailableException('service ML tidak terjangkau');
    }

    /**
     * Metadata model aktif dari GET /model (dipakai sinkronisasi tabel model_versions).
     *
     * @return array<string, mixed>|null
     */
    public function modelInfo(): ?array
    {
        $started = microtime(true);

        try {
            $response = Http::timeout((int) config('ml.timeout', 5))
                ->get((string) config('ml.model_url'));
        } catch (ConnectionException $e) {
            IntegrationLog::ml()->warning('GET /model gagal: '.$e->getMessage(), [
                'latency_ms' => $this->elapsed($started),
            ]);

            return null;
        }

        if (! $response->successful()) {
            IntegrationLog::ml()->warning('GET /model gagal', [
                'status' => $response->status(),
                'latency_ms' => $this->elapsed($started),
            ]);

            return null;
        }

        $info = $response->json();

        return is_array($info) ? $info : null;
    }

    /**
     * Liveness service ML (GET /health). Tidak melempar exception.
     */
    public function health(): bool
    {
        try {
            return Http::timeout(3)
                ->get((string) config('ml.health_url'))
                ->successful();
        } catch (ConnectionException) {
            return false;
        }
    }

    /**
     * Validasi respons 200 dari /predict. Bentuk tidak valid dianggap service
     * tidak bisa dipakai (MlUnavailableException) supaya bisa di-fallback.
     *
     * @return array{ap_id:string, ts:string, estimated_count:int, level:string,
     *               confidence:float, model_version:string|null}
     */
    private function validate(mixed $data, string $apId, string $ts): array
    {
        $ok = is_array($data)
            && isset($data['estimated_count'])
            && is_numeric($data['estimated_count'])
            && isset($data['level'])
            && in_array($data['level'], self::LEVELS, true)
            && isset($data['confidence'])
            && is_numeric($data['confidence'])
            && (float) $data['confidence'] >= 0
            && (float) $data['confidence'] <= 1;

        if (! $ok) {
            throw new MlUnavailableException(
                "respons /predict tidak valid untuk ap_id={$apId} ts={$ts}"
            );
        }

        return [
            'ap_id' => (string) ($data['ap_id'] ?? $apId),
            'ts' => (string) ($data['ts'] ?? $ts),
            'estimated_count' => max(0, (int) round((float) $data['estimated_count'])),
            'level' => (string) $data['level'],
            'confidence' => round((float) $data['confidence'], 3),
            'model_version' => isset($data['model_version']) && is_string($data['model_version'])
                ? $data['model_version']
                : null,
        ];
    }

    private function backoff(): void
    {
        usleep(max(0, (int) config('ml.retry_delay_ms', 500)) * 1000);
    }

    private function elapsed(float $started): int
    {
        return (int) round((microtime(true) - $started) * 1000);
    }
}
