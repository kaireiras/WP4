<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Collection;

class ApRoomHelper
{
    /**
     * Ekstrak nama ruangan dari ap_id (bagian setelah tanda '-'), misal: AP1-CU205 -> CU205.
     */
    public static function extractRoomName(?string $apId, ?string $fallbackRoom = null): string
    {
        if ($apId !== null && $apId !== '' && str_contains($apId, '-')) {
            $room = substr($apId, strpos($apId, '-') + 1);
            if ($room !== '') {
                return $room;
            }
        }

        if ($fallbackRoom !== null && $fallbackRoom !== '') {
            return $fallbackRoom;
        }

        return $apId ?? 'UNKNOWN';
    }

    /**
     * Prioritas level okupansi untuk penggabungan beberapa AP dalam satu ruangan.
     */
    public static function levelPriority(?string $level): int
    {
        return match (strtoupper((string) $level)) {
            'CROWDED' => 4,
            'HIGH' => 3,
            'MEDIUM' => 2,
            default => 1,
        };
    }

    /**
     * Ambil level tertinggi dari kumpulan level.
     */
    public static function maxLevel(iterable $levels): string
    {
        $bestLevel = 'LOW';
        $bestPriority = 0;

        foreach ($levels as $level) {
            $normalized = strtoupper((string) ($level ?: 'LOW'));
            $priority = self::levelPriority($normalized);
            if ($priority > $bestPriority) {
                $bestPriority = $priority;
                $bestLevel = $normalized;
            }
        }

        return $bestLevel;
    }

    /**
     * Gabungkan daftar alert dengan ruangan (dari ap_id) dan waktu triggered_at yang sama.
     */
    public static function mergeAlerts(Collection $alerts): Collection
    {
        return $alerts
            ->groupBy(function ($alert) {
                $roomName = self::extractRoomName($alert->ap_id, $alert->room_id);
                $ts = $alert->triggered_at instanceof \DateTimeInterface
                    ? $alert->triggered_at->format('Y-m-d H:i:s')
                    : (string) $alert->triggered_at;

                return $roomName . '|' . $ts;
            })
            ->map(function (Collection $group) {
                $first = $group->first();
                $roomName = self::extractRoomName($first->ap_id, $first->room_id);
                $apIds = $group->pluck('ap_id')->filter()->unique()->values()->all();

                return [
                    'id' => $first->id,
                    'ap_id' => implode(', ', $apIds),
                    'ap_ids' => $apIds,
                    'room_id' => $roomName,
                    'level' => self::maxLevel($group->pluck('level')),
                    'estimated_count' => (int) $group->sum('estimated_count'),
                    'status' => $group->contains('status', 'ACTIVE') ? 'ACTIVE' : $first->status,
                    'triggered_at' => $first->triggered_at,
                    'acknowledged_at' => $group->contains('status', 'ACTIVE') ? null : $first->acknowledged_at,
                ];
            })
            ->values();
    }
}
