<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Modul 2 MVP — Crowd Detection TANPA Machine Learning.
 *
 * Klasifikasi tingkat kepadatan ruangan berdasarkan n_clients
 * dengan logika if-else, sesuai dokumen MVP PMLD:
 *
 *   LOW      : 0–10   (kepadatan rendah)
 *   MEDIUM   : 11–25  (kepadatan sedang)
 *   HIGH     : 26–40  (kepadatan tinggi)
 *   CROWDED  : >40    (kepadatan sangat tinggi, memicu alert)
 *
 * Jika polling gagal (poll_ok = FALSE), hasilnya UNKNOWN —
 * dashboard wajib menampilkan ERROR/UNKNOWN, BUKAN LOW.
 */
class OccupancyClassifier
{
    public const LEVEL_LOW = 'LOW';
    public const LEVEL_MEDIUM = 'MEDIUM';
    public const LEVEL_HIGH = 'HIGH';
    public const LEVEL_CROWDED = 'CROWDED';
    public const LEVEL_UNKNOWN = 'UNKNOWN';

    /** Batas klasifikasi sesuai dokumen MVP (dapat disesuaikan kesepakatan tim). */
    public const LOW_MAX = 10;
    public const MEDIUM_MAX = 25;
    public const HIGH_MAX = 40;

    /**
     * Klasifikasikan jumlah client menjadi tingkat kepadatan.
     * Hanya dipakai untuk polling yang berhasil (poll_ok = TRUE).
     */
    public function classify(int $nClients): string
    {
        if ($nClients <= self::LOW_MAX) {
            return self::LEVEL_LOW;
        }

        if ($nClients <= self::MEDIUM_MAX) {
            return self::LEVEL_MEDIUM;
        }

        if ($nClients <= self::HIGH_MAX) {
            return self::LEVEL_HIGH;
        }

        return self::LEVEL_CROWDED;
    }

    /**
     * Evaluasi satu polling lengkap.
     *
     * @return array{level: string, count: int}
     *         - poll_ok = FALSE atau n_clients null -> level UNKNOWN, count 0
     *         - selainnya -> level hasil klasifikasi, count = n_clients
     */
    public function evaluate(?int $nClients, bool $pollOk): array
    {
        if (! $pollOk || $nClients === null) {
            return [
                'level' => self::LEVEL_UNKNOWN,
                'count' => 0,
            ];
        }

        return [
            'level' => $this->classify($nClients),
            'count' => $nClients,
        ];
    }
}
