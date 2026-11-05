<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ModelVersion;
use Illuminate\Support\Facades\DB;

/**
 * Sinkronisasi tabel model_versions dengan service ML WP-3.
 *
 * Tabel model_versions dipakai oleh occupancy_predictions (FK) dan halaman /model.
 * Setiap kali /predict mengembalikan model_version baru, baris baru dibuat aktif
 * dan metriknya dilengkapi dari GET /model (hanya sekali per versi baru).
 *
 * Model ModelVersion milik tim backend TIDAK diubah (fillable-nya tidak
 * menyertakan kolom metrik), jadi penulisan memakai forceFill().
 */
class ModelVersionService
{
    /**
     * ID model_version yang sedang aktif (dipakai sebagai nilai default FK).
     */
    public function activeId(): int
    {
        return (int) (ModelVersion::where('is_active', true)->value('id') ?? 1);
    }

    /**
     * Apakah versi ini sudah menjadi versi yang sedang aktif?
     * Dipakai supaya GET /model hanya dipanggil saat ada versi baru.
     */
    public function isActive(string $version): bool
    {
        return ModelVersion::where('is_active', true)->where('version', $version)->exists();
    }

    /**
     * Aktifkan versi tertentu sebagai model aktif. Kalau versinya sama dengan
     * yang sedang aktif, tidak melakukan apa-apa.
     *
     * @param  array<string, mixed>|null  $metrics  metrik dari GET /model WP-3
     */
    public function activate(string $version, ?array $metrics = null): ModelVersion
    {
        $active = ModelVersion::where('is_active', true)->first();

        if ($active && $active->version === $version) {
            return $active;
        }

        $mapped = $this->mapMetrics($metrics);

        $row = DB::transaction(function () use ($version, $mapped) {
            ModelVersion::where('is_active', true)->update(['is_active' => false]);

            $row = ModelVersion::where('version', $version)->first() ?? new ModelVersion;

            $row->forceFill([
                'version' => $version,
                'is_active' => true,
                'deployed_at' => now(),
                ...$mapped,
            ])->save();

            return $row;
        });

        IntegrationLog::ml()->info('versi model baru diaktifkan', [
            'version' => $version,
            'metrics' => $mapped,
        ]);

        return $row;
    }

    /**
     * Metrik GET /model WP-3 -> kolom tabel model_versions.
     * Struktur metrics dari serve.py: {mae, rmse, accuracy, f1_score,
     * precision_score, recall_score} (semuanya float, sudah dibulatkan WP-3).
     *
     * @param  array<string, mixed>|null  $metrics
     * @return array<string, float|null>
     */
    private function mapMetrics(?array $metrics): array
    {
        $out = [];

        foreach (['accuracy', 'f1_score', 'precision_score', 'recall_score', 'mae', 'rmse'] as $key) {
            $value = $metrics[$key] ?? null;
            $out[$key] = is_numeric($value) ? (float) $value : null;
        }

        return $out;
    }
}
