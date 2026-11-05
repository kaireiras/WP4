<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ApRegistry;
use App\Services\InferenceService;
use App\Services\IntegrationLog;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Daemon inferensi: berjalan terus, memproses seluruh AP tiap 15 detik,
 * dan menyinkronkan metadata model (model:sync) tiap 30 menit.
 *
 * Pengganti scheduler, supaya bootstrap/app.php milik tim backend tidak
 * perlu diubah. Cara pakai:
 *   php artisan inference:daemon          # jalan terus
 *   php artisan inference:daemon --once   # satu putaran, untuk pengujian
 *
 * Di production dijalankan oleh service `inference` dari compose.ml.yml:
 *   docker compose -f compose.yml -f compose.ml.yml up -d inference
 */
class InferenceDaemon extends Command
{
    protected $signature = 'inference:daemon {--once : Satu putaran saja, untuk pengujian}';

    protected $description = 'Jalankan inferensi ML untuk seluruh AP terus-menerus (tiap 15 detik)';

    private const POLL_INTERVAL_S = 15;

    private const MODEL_SYNC_INTERVAL_S = 1800;

    public function handle(InferenceService $inference): int
    {
        $log = IntegrationLog::inference();
        $lastModelSync = microtime(true) - self::MODEL_SYNC_INTERVAL_S;

        while (true) {
            $started = microtime(true);

            try {
                $aps = ApRegistry::all();
            } catch (Throwable $e) {
                $log->error('gagal membaca daftar AP: '.$e->getMessage());
                $this->error("Gagal membaca daftar AP: {$e->getMessage()}");

                if ($this->option('once')) {
                    return Command::FAILURE;
                }

                $this->waitNextRound();

                continue;
            }

            [$predicted, $skipped, $failed] = $this->runRound($inference, $aps, $log);

            $elapsedMs = (int) round((microtime(true) - $started) * 1000);

            $this->info(sprintf(
                'Putaran selesai: %d AP, %d diprediksi, %d dilewati, %d gagal (%d ms)',
                $aps->count(),
                $predicted,
                $skipped,
                $failed,
                $elapsedMs,
            ));

            if (microtime(true) - $lastModelSync >= self::MODEL_SYNC_INTERVAL_S) {
                $lastModelSync = microtime(true);
                $this->syncModel($log);
            }

            if ($this->option('once')) {
                return Command::SUCCESS;
            }

            $this->waitNextRound();
        }
    }

    /**
     * Proses semua AP satu kali. Kegagalan satu AP tidak menghentikan yang lain.
     *
     * @return array{0: int, 1: int, 2: int} [diprediksi, dilewati, gagal]
     */
    private function runRound(InferenceService $inference, Collection $aps, LoggerInterface $log): array
    {
        $predicted = $skipped = $failed = 0;

        foreach ($aps as $ap) {
            try {
                $prediction = $inference->processAp((string) $ap->ap_id);

                if ($prediction === null) {
                    $skipped++;
                } else {
                    $predicted++;
                }
            } catch (Throwable $e) {
                $failed++;
                $log->error("inferensi gagal untuk {$ap->ap_id}: ".$e->getMessage(), [
                    'ap_id' => $ap->ap_id,
                ]);
            }
        }

        $log->info('satu putaran selesai', [
            'aps' => $aps->count(),
            'predicted' => $predicted,
            'skipped' => $skipped,
            'failed' => $failed,
        ]);

        return [$predicted, $skipped, $failed];
    }

    private function syncModel(LoggerInterface $log): void
    {
        try {
            $this->call('model:sync');
        } catch (Throwable $e) {
            $log->error('model:sync gagal: '.$e->getMessage());
        }
    }

    private function waitNextRound(): void
    {
        sleep(self::POLL_INTERVAL_S);
    }
}
