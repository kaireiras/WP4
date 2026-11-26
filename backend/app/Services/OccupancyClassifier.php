<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Modul 2 MVP — Crowd Detection TANPA Machine Learning.
 *
 * Klasifikasi tingkat kepadatan ruangan berdasarkan total n_clients
 * per ruangan (menggabungkan seluruh AP di ruangan yang sama)
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
     * Ekstrak room_id dari ap_id (bagian setelah tanda "-" terakhir, misal AP1-CU205 -> CU205).
     */
    public function extractRoomId(string $apId): string
    {
        if (! str_contains($apId, '-')) {
            return $apId;
        }

        $pos = strrpos($apId, '-');

        return $pos !== false ? substr($apId, $pos + 1) : $apId;
    }

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

    /**
     * Evaluasi seluruh polling AP dalam satu ruangan yang sama.
     * Total client dari AP yang poll_ok = TRUE dijumlahkan terlebih dahulu sebelum diklasifikasikan.
     *
     * @param  iterable<int|string, array<string, mixed>|object>  $apPolls
     * @return array{level: string, count: int, poll_ok: ?bool}
     */
    public function evaluateRoom(iterable $apPolls): array
    {
        $hasAnyPoll = false;
        $hasSuccessPoll = false;
        $totalClients = 0;

        foreach ($apPolls as $poll) {
            $hasAnyPoll = true;
            $pollOkRaw = is_array($poll) ? ($poll['poll_ok'] ?? null) : ($poll->poll_ok ?? null);
            $nClientsRaw = is_array($poll) ? ($poll['n_clients'] ?? null) : ($poll->n_clients ?? null);

            if ($pollOkRaw !== null && (bool) $pollOkRaw && $nClientsRaw !== null) {
                $hasSuccessPoll = true;
                $totalClients += max(0, (int) $nClientsRaw);
            }
        }

        if (! $hasAnyPoll) {
            return [
                'level' => self::LEVEL_UNKNOWN,
                'count' => 0,
                'poll_ok' => null,
            ];
        }

        if (! $hasSuccessPoll) {
            return [
                'level' => self::LEVEL_UNKNOWN,
                'count' => 0,
                'poll_ok' => false,
            ];
        }

        return [
            'level' => $this->classify($totalClients),
            'count' => $totalClients,
            'poll_ok' => true,
        ];
    }

    /**
     * Kelompokkan daftar polling AP berdasarkan ruangan terlebih dahulu, lalu hitung status per ruangan.
     *
     * @param  iterable<int|string, array<string, mixed>|object>  $apPolls
     * @return array<string, array{
     *     room_id: string,
     *     ap_ids: array<int, string>,
     *     level: string,
     *     count: int,
     *     poll_ok: ?bool,
     *     ts: ?string,
     *     ap_counts: array<string, int>
     * }>
     */
    public function evaluateByRooms(iterable $apPolls): array
    {
        $grouped = [];

        foreach ($apPolls as $poll) {
            $apId = (string) (is_array($poll) ? ($poll['ap_id'] ?? '') : ($poll->ap_id ?? ''));
            if ($apId === '') {
                continue;
            }

            $roomId = $this->extractRoomId($apId);
            $grouped[$roomId][] = $poll;
        }

        $results = [];

        foreach ($grouped as $roomId => $roomPolls) {
            $roomEval = $this->evaluateRoom($roomPolls);
            $apIds = [];
            $apCounts = [];
            $latestTs = null;

            foreach ($roomPolls as $poll) {
                $apId = (string) (is_array($poll) ? ($poll['ap_id'] ?? '') : ($poll->ap_id ?? ''));
                $pollOkRaw = is_array($poll) ? ($poll['poll_ok'] ?? null) : ($poll->poll_ok ?? null);
                $nClientsRaw = is_array($poll) ? ($poll['n_clients'] ?? null) : ($poll->n_clients ?? null);
                $ts = is_array($poll) ? ($poll['ts'] ?? null) : ($poll->ts ?? null);

                if (! in_array($apId, $apIds, true)) {
                    $apIds[] = $apId;
                }

                $apCounts[$apId] = ($pollOkRaw !== null && (bool) $pollOkRaw && $nClientsRaw !== null)
                    ? max(0, (int) $nClientsRaw)
                    : 0;

                if ($ts !== null && ($latestTs === null || (string) $ts > $latestTs)) {
                    $latestTs = (string) $ts;
                }
            }

            $results[$roomId] = [
                'room_id' => $roomId,
                'ap_ids' => $apIds,
                'level' => $roomEval['level'],
                'count' => $roomEval['count'],
                'poll_ok' => $roomEval['poll_ok'],
                'ts' => $latestTs,
                'ap_counts' => $apCounts,
            ];
        }

        return $results;
    }
}
