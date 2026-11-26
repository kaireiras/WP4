<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\CrowdedAlert;
use App\Models\Alert;
use App\Models\OccupancyPrediction;

/**
 * Logika pembuatan alert dari hasil prediksi okupansi.
 *
 * Aturan (bisa diubah lewat config ml.alert / .env):
 *  1. Hanya level di trigger_levels yang memicu alert (default: CROWDED).
 *  2. Prediksi dengan confidence di bawah min_confidence diabaikan.
 *  3. Alert dibuat saat TRANSISI MASUK level pemicu (prediksi sebelumnya bukan level itu),
 *     bukan setiap siklus polling — supaya tidak spam.
 *  4. Cooldown per ruangan + level: alert baru ditahan selama cooldown_seconds
 *     kalau level bolak-balik cepat (mis. CROWDED -> HIGH -> CROWDED dalam 1 menit).
 *
 * Event CrowdedAlert hanya dibroadcast untuk level CROWDED (kontrak dashboard,
 * lihat prd.md: AlertBanner muncul khusus level CROWDED).
 */
class AlertService
{
    public function evaluate(OccupancyPrediction $prediction): ?Alert
    {
        $triggerLevels = (array) config('ml.alert.trigger_levels', ['CROWDED']);

        if (! in_array($prediction->level, $triggerLevels, true)) {
            return null;
        }

        $context = [
            'ap_id' => $prediction->ap_id,
            'room_id' => $prediction->room_id,
            'ts' => $prediction->ts?->format('Y-m-d H:i:s'),
            'level' => $prediction->level,
            'estimated_count' => $prediction->estimated_count,
            'confidence' => $prediction->confidence,
        ];

        // Ambang keyakinan: prediksi ragu-ragu tidak boleh memicu alarm.
        if ((float) $prediction->confidence < (float) config('ml.alert.min_confidence', 0.0)) {
            IntegrationLog::alerts()->info('alert ditahan: confidence di bawah ambang', $context);

            return null;
        }

        // Hanya pada transisi masuk level pemicu.
        $previous = OccupancyPrediction::where('ap_id', $prediction->ap_id)
            ->where('room_id', $prediction->room_id)
            ->where('ts', '<', $prediction->ts)
            ->orderByDesc('ts')
            ->first();

        if ($previous && $previous->level === $prediction->level) {
            return null; // masih di level yang sama sejak prediksi terakhir — bukan transisi.
        }

        // Cooldown anti-spam per ruangan + level.
        $cooldown = max(0, (int) config('ml.alert.cooldown_seconds', 300));
        $recentAlert = Alert::where('room_id', $prediction->room_id)
            ->where('level', $prediction->level)
            ->where('triggered_at', '>=', now()->subSeconds($cooldown))
            ->orderByDesc('triggered_at')
            ->first();

        if ($recentAlert) {
            IntegrationLog::alerts()->info('alert ditahan: masih dalam cooldown', [
                ...$context,
                'last_alert_id' => $recentAlert->id,
                'last_triggered_at' => $recentAlert->triggered_at?->format('Y-m-d H:i:s'),
            ]);

            return null;
        }

        $alert = Alert::create([
            'triggered_at' => now(),
            'ap_id' => $prediction->ap_id,
            'room_id' => $prediction->room_id,
            'level' => $prediction->level,
            'estimated_count' => $prediction->estimated_count,
            'status' => 'ACTIVE',
        ]);

        IntegrationLog::alerts()->info('alert dibuat', [...$context, 'alert_id' => $alert->id]);

        if ($prediction->level === 'CROWDED') {
            broadcast(new CrowdedAlert($alert));
        }

        return $alert;
    }
}
