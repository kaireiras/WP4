<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\MlClient;
use App\Services\ModelVersionService;
use Illuminate\Console\Command;

/**
 * Sinkronkan metadata model ML aktif (GET /model milik WP-3) ke tabel
 * model_versions. Berguna untuk halaman /model dan audit versi.
 *
 * Dipanggil otomatis oleh daemon inference:daemon (setiap 30 menit) dan
 * bisa dijalankan manual: php artisan model:sync
 */
class SyncModelInfo extends Command
{
    protected $signature = 'model:sync';

    protected $description = 'Sinkronkan metadata model ML WP-3 ke tabel model_versions';

    public function handle(MlClient $ml, ModelVersionService $modelVersions): int
    {
        $info = $ml->modelInfo();

        if (! is_array($info) || empty($info['version']) || ! is_string($info['version'])) {
            $this->error('Gagal mengambil metadata model dari service ML (GET /model).');

            return Command::FAILURE;
        }

        $metrics = is_array($info['metrics'] ?? null) ? $info['metrics'] : null;
        $row = $modelVersions->activate($info['version'], $metrics);

        $this->info(sprintf(
            'Model aktif: %s (id=%d) | MAE=%s RMSE=%s accuracy=%s',
            $row->version,
            $row->id,
            $row->mae ?? '-',
            $row->rmse ?? '-',
            $row->accuracy ?? '-',
        ));

        return Command::SUCCESS;
    }
}
