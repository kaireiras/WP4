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

        $latestPredictions = DB::table('occupancy_predictions as op1')
            ->join(
                DB::raw('(SELECT ap_id, MAX(ts) as max_ts FROM occupancy_predictions GROUP BY ap_id) as op2'),
                function ($join) {
                    $join->on('op1.ap_id', '=', 'op2.ap_id')
                        ->on('op1.ts', '=', 'op2.max_ts');
                }
            )
            ->select('op1.ap_id', 'op1.level', 'op1.estimated_count', 'op1.ts');

        $latestPolls = DB::table('poll_log as pl1')
            ->join(
                DB::raw('(SELECT ap_id, MAX(ts) as max_ts FROM poll_log GROUP BY ap_id) as pl2'),
                function ($join) {
                    $join->on('pl1.ap_id', '=', 'pl2.ap_id')
                        ->on('pl1.ts', '=', 'pl2.max_ts');
                }
            )
            ->select('pl1.ap_id', 'pl1.poll_ok', 'pl1.ts as poll_ts');

        $rooms = DB::table('ap_registry as ar')
            ->leftJoinSub($latestPredictions, 'op', function ($join) {
                $join->on(
                    DB::raw('ar.ap_id COLLATE utf8mb4_unicode_ci'),
                    '=',
                    DB::raw('op.ap_id COLLATE utf8mb4_unicode_ci')
                );
            })
            ->leftJoinSub($latestPolls, 'pl', function ($join) {
                $join->on(
                    DB::raw('ar.ap_id COLLATE utf8mb4_unicode_ci'),
                    '=',
                    DB::raw('pl.ap_id COLLATE utf8mb4_unicode_ci')
                );
            })
            ->select([
                DB::raw("SUBSTRING_INDEX(ar.ap_id, '-', -1) as room_id"),
                'ar.ap_id',
                DB::raw('COALESCE(op.level, "UNKNOWN") as level'),
                DB::raw('COALESCE(op.estimated_count, 0) as estimated_count'),
                DB::raw('COALESCE(op.ts, pl.poll_ts, "' . $latestTs . '") as last_sync'),
                'pl.poll_ok',
                'pl.poll_ts as last_poll_at',
            ])
            ->get()
            ->map(function ($row) {
                $pollOk = $row->poll_ok !== null ? (bool) $row->poll_ok : null;

                return [
                    'room_id'           => $row->room_id,
                    'ap_id'             => $row->ap_id,
                    'level'             => $row->level,
                    'estimated_count'   => (int) $row->estimated_count,
                    'last_sync'         => $row->last_sync,
                    'poll_ok'           => $pollOk,
                    'connection_status' => $pollOk === null ? 'UNKNOWN' : ($pollOk ? 'ONLINE' : 'OFFLINE'),
                    'last_poll_at'      => $row->last_poll_at,
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

        $latestPoll = DB::table('poll_log')
            ->where('ap_id', $ap->ap_id)
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

        $pollOk = $latestPoll ? (bool) $latestPoll->poll_ok : null;

        return response()->json([
            'success'           => true,
            'room_id'           => $extractedRoomId,
            'ap_id'             => $ap->ap_id,
            'ip_address'        => $ap->ip_address,
            'level'             => $latestPrediction->level ?? 'UNKNOWN',
            'estimated_count'   => (int) ($latestPrediction->estimated_count ?? ($traffic->active_clients ?? 0)),
            'last_sync'         => $latestPrediction->ts ?? $latestVapTs,
            'poll_ok'           => $pollOk,
            'connection_status' => $pollOk === null ? 'UNKNOWN' : ($pollOk ? 'ONLINE' : 'OFFLINE'),
            'last_poll_at'      => $latestPoll->ts ?? null,
            'metrics'           => [
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
