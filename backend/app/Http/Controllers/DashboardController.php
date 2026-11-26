<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\ApRegistry;
use App\Models\OccupancyPrediction;
use App\Services\OccupancyClassifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    public function __construct(private readonly OccupancyClassifier $classifier)
    {
    }

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

        $rawAps = DB::table('ap_registry as ar')
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
                'ar.ap_id',
                DB::raw('COALESCE(op.level, "UNKNOWN") as level'),
                DB::raw('COALESCE(op.estimated_count, 0) as estimated_count'),
                DB::raw('COALESCE(op.ts, pl.poll_ts, "' . $latestTs . '") as last_sync'),
                'pl.poll_ok',
                'pl.poll_ts as last_poll_at',
            ])
            ->get();

        $rooms = $rawAps
            ->groupBy(fn ($row) => $this->classifier->extractRoomId((string) $row->ap_id))
            ->map(function ($roomGroup, $roomId) {
                $apIds = $roomGroup->pluck('ap_id')->unique()->values()->all();
                $totalEstimated = (int) $roomGroup->sum('estimated_count');

                $pollInputs = $roomGroup->map(fn ($row) => [
                    'poll_ok' => $row->poll_ok,
                    'n_clients' => (int) $row->estimated_count,
                ]);
                $roomEval = $this->classifier->evaluateRoom($pollInputs);

                $hasKnownPrediction = $roomGroup->contains(
                    fn ($row) => strtoupper((string) $row->level) !== OccupancyClassifier::LEVEL_UNKNOWN
                );

                $level = ($roomEval['poll_ok'] === true || ($roomEval['poll_ok'] === null && $hasKnownPrediction))
                    ? $this->classifier->classify($totalEstimated)
                    : OccupancyClassifier::LEVEL_UNKNOWN;

                return [
                    'room_id'           => (string) $roomId,
                    'ap_id'             => implode(', ', $apIds),
                    'level'             => $level,
                    'estimated_count'   => $totalEstimated,
                    'last_sync'         => $roomGroup->max('last_sync'),
                    'poll_ok'           => $roomEval['poll_ok'],
                    'connection_status' => $roomEval['poll_ok'] === null ? 'UNKNOWN' : ($roomEval['poll_ok'] ? 'ONLINE' : 'OFFLINE'),
                    'last_poll_at'      => $roomGroup->max('last_poll_at'),
                ];
            })
            ->values();

        $activeAlerts = Alert::where('status', 'ACTIVE')
            ->orderByDesc('triggered_at')
            ->get()
            ->groupBy(function ($alert) {
                $roomId = $this->extractRoomId((string) ($alert->room_id ?: $alert->ap_id));
                $timeBucket = substr((string) $alert->triggered_at, 0, 16);

                return "{$roomId}|{$timeBucket}";
            })
            ->map(function ($group) {
                $primary = $group->first();
                $uniqueByAp = $group->unique('ap_id');
                $roomId = $this->extractRoomId((string) ($primary->room_id ?: $primary->ap_id));

                return [
                    'id'              => $primary->id,
                    'triggered_at'    => $primary->triggered_at,
                    'resolved_at'     => $primary->resolved_at,
                    'acknowledged_at' => $primary->acknowledged_at,
                    'ap_id'           => implode(', ', $uniqueByAp->pluck('ap_id')->values()->all()),
                    'room_id'         => $roomId,
                    'level'           => $primary->level,
                    'estimated_count' => (int) $uniqueByAp->sum('estimated_count'),
                    'status'          => $primary->status,
                ];
            })
            ->values();

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
        $aps = ApRegistry::where('ap_id', 'like', "%-{$roomId}")
            ->orWhere('ap_id', $roomId)
            ->get()
            ->filter(function (ApRegistry $item) use ($roomId) {
                $extracted = $this->extractRoomId((string) $item->ap_id);

                return strcasecmp($extracted, $roomId) === 0 || strcasecmp((string) $item->ap_id, $roomId) === 0;
            })
            ->values();

        if ($aps->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Ruangan atau AP untuk '{$roomId}' tidak ditemukan di ap_registry.",
            ], 404);
        }

        $apIds = $aps->pluck('ap_id')->all();

        $latestPredictions = OccupancyPrediction::whereIn('ap_id', $apIds)
            ->orderByDesc('ts')
            ->get()
            ->unique('ap_id')
            ->values();

        $latestPolls = DB::table('poll_log')
            ->whereIn('ap_id', $apIds)
            ->orderByDesc('ts')
            ->get()
            ->unique('ap_id')
            ->values();

        $latestVapPerAp = DB::table('vap_snapshot')
            ->whereIn('ap_id', $apIds)
            ->where('vap_up', 1)
            ->select('ap_id', DB::raw('MAX(ts) as max_ts'))
            ->groupBy('ap_id');

        $traffic = DB::table('vap_snapshot as vs')
            ->joinSub($latestVapPerAp, 'lv', function ($join) {
                $join->on('vs.ap_id', '=', 'lv.ap_id')
                    ->on('vs.ts', '=', 'lv.max_ts');
            })
            ->where('vs.vap_up', 1)
            ->select([
                DB::raw('COALESCE(SUM(vs.n_clients), 0) as active_clients'),
                DB::raw('COALESCE(SUM(vs.rx_bytes), 0) as total_rx_bytes'),
                DB::raw('COALESCE(SUM(vs.tx_bytes), 0) as total_tx_bytes'),
                DB::raw('COALESCE(SUM(vs.rx_packets), 0) as total_rx_packets'),
                DB::raw('COALESCE(SUM(vs.tx_packets), 0) as total_tx_packets'),
                DB::raw('COALESCE(SUM(vs.tx_retries), 0) as total_tx_retries'),
                DB::raw('MAX(vs.ts) as latest_ts'),
            ])
            ->first();

        $intervalSec = 15;
        $rxRateKBs = $traffic ? round(((float) $traffic->total_rx_bytes) / 1024 / $intervalSec, 2) : 0.0;
        $txRateKBs = $traffic ? round(((float) $traffic->total_tx_bytes) / 1024 / $intervalSec, 2) : 0.0;
        $pps = $traffic ? (int) round((((float) $traffic->total_rx_packets) + ((float) $traffic->total_tx_packets)) / $intervalSec) : 0;

        $extractedRoomId = $this->extractRoomId((string) $aps->first()->ap_id);

        $pollValues = $latestPolls->pluck('poll_ok')->filter(fn ($v) => $v !== null);
        $pollOk = $pollValues->isEmpty()
            ? null
            : $pollValues->contains(fn ($v) => (bool) $v);

        $activeClients = (int) ($traffic->active_clients ?? 0);
        $estimatedCount = $latestPredictions->isNotEmpty()
            ? (int) $latestPredictions->sum('estimated_count')
            : $activeClients;

        $level = ($pollOk === false)
            ? OccupancyClassifier::LEVEL_UNKNOWN
            : (($latestPredictions->isNotEmpty() || $traffic?->latest_ts !== null)
                ? $this->classifier->classify($estimatedCount)
                : OccupancyClassifier::LEVEL_UNKNOWN);

        return response()->json([
            'success'           => true,
            'room_id'           => $extractedRoomId,
            'ap_id'             => implode(', ', $apIds),
            'ip_address'        => implode(', ', $aps->pluck('ip_address')->filter()->unique()->values()->all()),
            'level'             => $level,
            'estimated_count'   => $estimatedCount,
            'last_sync'         => $latestPredictions->max('ts') ?? $traffic?->latest_ts,
            'poll_ok'           => $pollOk,
            'connection_status' => $pollOk === null ? 'UNKNOWN' : ($pollOk ? 'ONLINE' : 'OFFLINE'),
            'last_poll_at'      => $latestPolls->max('ts'),
            'metrics'           => [
                'active_clients'    => $activeClients > 0 ? $activeClients : $estimatedCount,
                'rx_rate_kbs'       => $rxRateKBs,
                'tx_rate_kbs'       => $txRateKBs,
                'rx_rate_formatted' => $rxRateKBs >= 1024 ? round($rxRateKBs / 1024, 2) . ' MB/s' : $rxRateKBs . ' KB/s',
                'tx_rate_formatted' => $txRateKBs >= 1024 ? round($txRateKBs / 1024, 2) . ' MB/s' : $txRateKBs . ' KB/s',
                'packets_per_sec'   => $pps,
                'tx_retries'        => (int) ($traffic->total_tx_retries ?? 0),
            ],
        ]);
    }

    private function extractRoomId(string $apId): string
    {
        return str_contains($apId, '-')
            ? Str::afterLast($apId, '-')
            : $apId;
    }
}
