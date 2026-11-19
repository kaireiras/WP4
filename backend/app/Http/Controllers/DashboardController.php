<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\ApRegistry;
use App\Models\OccupancyPrediction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    /**
     * Endpoint Overview Dashboard (/api/v1/dashboard/overview)
     */
    public function getOverview(): JsonResponse
    {
        $latestTs = OccupancyPrediction::max('ts') ?? now()->toDateTimeString();

        $rooms = DB::table('ap_registry as ar')
            ->leftJoin('occupancy_predictions as op', function ($join) use ($latestTs) {
                $join->on(
                    DB::raw('ar.ap_id COLLATE utf8mb4_unicode_ci'),
                    '=',
                    DB::raw('op.ap_id COLLATE utf8mb4_unicode_ci')
                )->where('op.ts', '=', $latestTs);
            })
            ->select([
                DB::raw("SUBSTRING_INDEX(ar.ap_id, '-', -1) as room_id"),
                'ar.ap_id',
                DB::raw('COALESCE(op.level, "UNKNOWN") as level'),
                DB::raw('COALESCE(op.estimated_count, 0) as estimated_count'),
                DB::raw('COALESCE(op.ts, "' . $latestTs . '") as last_sync'),
            ])
            ->get()
            ->map(function ($row) {
                return [
                    'room_id'         => $row->room_id,
                    'ap_id'           => $row->ap_id,
                    'level'           => $row->level,
                    'estimated_count' => (int) $row->estimated_count,
                    'last_sync'       => $row->last_sync,
                ];
            });

        $activeAlerts = Alert::where('status', 'ACTIVE')
            ->orderByDesc('triggered_at')
            ->get();

        return response()->json([
            'success'       => true,
            'last_sync'     => $latestTs,
            'total_rooms'   => $rooms->count(),
            'total_clients' => $rooms->sum('estimated_count'),
            'active_alerts' => $activeAlerts,
            'rooms'         => $rooms,
        ]);
    }

    /**
     * Endpoint Detail Live per Ruangan (/api/v1/rooms/{roomId}/live)
     */
    public function getRoomLiveDetail(string $roomId): JsonResponse
    {
        $ap = ApRegistry::where('ap_id', 'like', "%-{$roomId}")
            ->orWhere('ap_id', $roomId)
            ->first();

        if (! $ap) {
            return response()->json([
                'success' => false,
                'message' => "Ruangan atau AP untuk '{$roomId}' tidak ditemukan di ap_registry.",
            ], 404);
        }

        $latestPrediction = OccupancyPrediction::where('ap_id', $ap->ap_id)
            ->orderByDesc('ts')
            ->first();

        $latestVapTs = DB::table('vap_snapshot')
            ->where('ap_id', $ap->ap_id)
            ->max('ts');

        $traffic = null;
        if ($latestVapTs) {
            $traffic = DB::table('vap_snapshot')
                ->where('ap_id', $ap->ap_id)
                ->where('ts', $latestVapTs)
                ->where('vap_up', 1)
                ->select([
                    DB::raw('COALESCE(SUM(n_clients), 0) as active_clients'),
                    DB::raw('COALESCE(SUM(rx_bytes), 0) as total_rx_bytes'),
                    DB::raw('COALESCE(SUM(tx_bytes), 0) as total_tx_bytes'),
                    DB::raw('COALESCE(SUM(rx_packets), 0) as total_rx_packets'),
                    DB::raw('COALESCE(SUM(tx_packets), 0) as total_tx_packets'),
                    DB::raw('COALESCE(SUM(tx_retries), 0) as total_tx_retries'),
                ])
                ->first();
        }

        $intervalSec = 15;
        $rxRateKBs = $traffic ? round(((float) $traffic->total_rx_bytes) / 1024 / $intervalSec, 2) : 0.0;
        $txRateKBs = $traffic ? round(((float) $traffic->total_tx_bytes) / 1024 / $intervalSec, 2) : 0.0;
        $pps = $traffic ? (int) round((((float) $traffic->total_rx_packets) + ((float) $traffic->total_tx_packets)) / $intervalSec) : 0;

        $extractedRoomId = str_contains($ap->ap_id, '-')
            ? Str::afterLast($ap->ap_id, '-')
            : $ap->ap_id;

        return response()->json([
            'success'         => true,
            'room_id'         => $extractedRoomId,
            'ap_id'           => $ap->ap_id,
            'ip_address'      => $ap->ip_address,
            'level'           => $latestPrediction->level ?? 'UNKNOWN',
            'estimated_count' => (int) ($latestPrediction->estimated_count ?? ($traffic->active_clients ?? 0)),
            'last_sync'       => $latestPrediction->ts ?? $latestVapTs,
            'metrics'         => [
                'active_clients'    => (int) ($traffic->active_clients ?? $latestPrediction->estimated_count ?? 0),
                'rx_rate_kbs'       => $rxRateKBs,
                'tx_rate_kbs'       => $txRateKBs,
                'rx_rate_formatted' => $rxRateKBs >= 1024 ? round($rxRateKBs / 1024, 2) . ' MB/s' : $rxRateKBs . ' KB/s',
                'tx_rate_formatted' => $txRateKBs >= 1024 ? round($txRateKBs / 1024, 2) . ' MB/s' : $txRateKBs . ' KB/s',
                'packets_per_sec'   => $pps,
                'tx_retries'        => (int) ($traffic->total_tx_retries ?? 0),
            ],
        ]);
    }
}