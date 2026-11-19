<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\OccupancyUpdated;
use App\Exceptions\MlRequestException;
use App\Exceptions\MlUnavailableException;
use App\Models\ApRoom;
use App\Models\OccupancyPrediction;
use Illuminate\Support\Facades\DB;

/**
 * Integrasi model ML WP-3 (serve.py) ke sistem monitoring WP-4.
 *
 * Alur satu AP:
 *  1. Ambil polling terakhir yang sukses (poll_ok = 1) dari poll_log.
 *  2. Deduplikasi: satu (ap_id, ts) cukup diprediksi sekali.
 *  3. Panggil POST /predict WP-3 dengan {ap_id, ts}. ts dikirim APA ADANYA
 *     (WIB tanpa zona) — jangan konversi timezone.
 *  4. Sinkronkan versi model (model_versions) dari respons /predict + GET /model.
 *  5. Simpan prediksi, broadcast OccupancyUpdated, lalu evaluasi alert.
 *  6. Kalau ML service mati: fallback heuristik dari n_clients
 *     (bisa dimatikan lewat ML_FALLBACK=false, wajib mati saat evaluasi WP-5).
 *
 * Hasil null berarti "tidak ada prediksi untuk polling ini" (polling gagal,
 * belum ada, atau sudah diprediksi) — BUKAN error sistem.
 */
class InferenceService
{
    public function __construct(
        private readonly MlClient $ml,
        private readonly AlertService $alerts,
        private readonly ModelVersionService $modelVersions,
    ) {}

    public function processAp(string $apId): ?OccupancyPrediction
    {
        // 1. Polling terakhir AP ini.
        $latestPoll = DB::table('poll_log')
            ->where('ap_id', $apId)
            ->orderByDesc('ts')
            ->first();

        if (! $latestPoll) {
            IntegrationLog::inference()->debug('tidak ada polling di poll_log', ['ap_id' => $apId]);

            return null;
        }

        if (! (bool) $latestPoll->poll_ok) {
            IntegrationLog::inference()->debug('polling gagal (poll_ok=0), dilewati', [
                'ap_id' => $apId,
                'ts' => $latestPoll->ts,
            ]);

            return null;
        }

        // 2. ts dikirim apa adanya ke WP-3. MySQL DATETIME = "YYYY-MM-DD HH:MM:SS".
        //    Bentuk lain (berzona / berdetik pecahan) ditolak supaya tidak salah zona.
        $ts = $this->normalizeTs((string) $latestPoll->ts);

        if ($ts === null) {
            IntegrationLog::inference()->warning('format ts poll_log tidak didukung', [
                'ap_id' => $apId,
                'ts' => $latestPoll->ts,
            ]);

            return null;
        }

        // 3. Deduplikasi: jangan prediksi polling yang sama dua kali.
        $existing = OccupancyPrediction::where('ap_id', $apId)->where('ts', $ts)->first();

        if ($existing) {
            IntegrationLog::inference()->debug('polling sudah pernah diprediksi, dilewati', [
                'ap_id' => $apId,
                'ts' => $ts,
                'prediction_id' => $existing->id,
            ]);

            return $existing;
        }

        $roomId = $this->roomOf($apId);

        // 4. Inferensi WP-3.
        try {
            $mlResult = $this->ml->predict($apId, $ts);
            $source = 'ml';
        } catch (MlUnavailableException $e) {
            IntegrationLog::inference()->warning('service ML tidak tersedia: '.$e->getMessage(), [
                'ap_id' => $apId,
                'ts' => $ts,
            ]);

            if (! config('ml.fallback', true)) {
                IntegrationLog::inference()->error('fallback dimatikan (ML_FALLBACK=false), prediksi dilewati', [
                    'ap_id' => $apId,
                    'ts' => $ts,
                ]);

                return null;
            }

            $mlResult = $this->fallbackResult((int) $latestPoll->n_clients);
            $source = 'fallback';
        } catch (MlRequestException $e) {
            IntegrationLog::inference()->error('input ditolak service ML: '.$e->getMessage(), [
                'ap_id' => $apId,
                'ts' => $ts,
            ]);

            return null;
        }

        // 404/409 dari WP-3: polling belum ada / gagal — bukan error, tidak ada prediksi.
        if ($mlResult === null) {
            IntegrationLog::inference()->info('tidak ada prediksi dari service ML (404/409)', [
                'ap_id' => $apId,
                'ts' => $ts,
            ]);

            return null;
        }

        // 5. Sinkronisasi model_versions (GET /model hanya saat versi baru).
        $modelVersionId = $this->ensureModelVersion($mlResult['model_version'] ?? null);

        // 6. Simpan prediksi.
        $prediction = OccupancyPrediction::create([
            'ts' => $ts,
            'ap_id' => $apId,
            'room_id' => $roomId,
            'estimated_count' => (int) $mlResult['estimated_count'],
            'level' => $mlResult['level'],
            'confidence' => (float) $mlResult['confidence'],
            'model_version_id' => $modelVersionId,
        ]);

        broadcast(new OccupancyUpdated($prediction));

        // 7. Evaluasi alert (transisi + cooldown di dalam AlertService).
        $alert = $this->alerts->evaluate($prediction);

        IntegrationLog::inference()->info('prediksi tersimpan', [
            'ap_id' => $apId,
            'room_id' => $roomId,
            'ts' => $ts,
            'estimated_count' => $prediction->estimated_count,
            'level' => $prediction->level,
            'confidence' => $prediction->confidence,
            'model_version_id' => $modelVersionId,
            'source' => $source,
            'alert_id' => $alert?->id,
        ]);

        return $prediction;
    }

    /**
     * ts dikirim ke WP-3 persis seperti di database (WIB tanpa zona).
     * serve.py menganggap input naive berada di DB_TZ (Asia/Jakarta).
     */
    private function normalizeTs(string $ts): ?string
    {
        return preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $ts) === 1 ? $ts : null;
    }

    /**
     * Room untuk AP ini. Satu AP bisa terdaftar di beberapa ruangan di ap_rooms —
     * untuk prediksi dipakai ruangan pertama, dan situasi itu dilog sebagai warning.
     */
    private function roomOf(string $apId): string
    {
        $rooms = ApRoom::where('ap_id', $apId)->pluck('room_id');

        if ($rooms->isEmpty()) {
            IntegrationLog::inference()->warning('AP tidak terdaftar di ap_rooms', ['ap_id' => $apId]);

            return 'UNKNOWN';
        }

        if ($rooms->count() > 1) {
            IntegrationLog::inference()->warning('AP terdaftar di beberapa ruangan, dipakai yang pertama', [
                'ap_id' => $apId,
                'rooms' => $rooms->all(),
            ]);
        }

        return $rooms->first();
    }

    /**
     * Pastikan versi model dari respons WP-3 ada di model_versions dan aktif.
     * GET /model hanya dipanggil ketika muncul versi baru (tidak tiap polling).
     */
    private function ensureModelVersion(?string $version): int
    {
        if ($version === null) {
            // Fallback / respons tanpa versi: tetap pakai versi yang sedang aktif.
            return $this->modelVersions->activeId();
        }

        if ($this->modelVersions->isActive($version)) {
            return $this->modelVersions->activeId();
        }

        $metrics = null;
        $info = $this->ml->modelInfo();

        if (is_array($info) && is_array($info['metrics'] ?? null)) {
            $metrics = $info['metrics'];
        }

        return $this->modelVersions->activate($version, $metrics)->id;
    }

    /**
     * Fallback heuristik saat ML service mati: level dari n_clients,
     * pita level mengikuti dokumen MVP (LOW<=10, MEDIUM<=25, HIGH<=40).
     */
    private function fallbackResult(int $nClients): array
    {
        $level = match (true) {
            $nClients > 40 => 'CROWDED',
            $nClients > 25 => 'HIGH',
            $nClients > 10 => 'MEDIUM',
            default => 'LOW',
        };

        return [
            'estimated_count' => $nClients,
            'level' => $level,
            'confidence' => (float) config('ml.fallback_confidence', 0.5),
            'model_version' => null,
        ];
    }
}
