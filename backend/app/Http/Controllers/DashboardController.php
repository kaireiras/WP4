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
        $latestTs = OccupancyPrediction::max('ts')
            ?? DB::table('vap_snapshot')->max('ts')
            ?? DB::table('poll_log')->max('ts')
            ?? now()->toDateTimeString();

        $latestPredictions = DB::table('occupancy_predictions as op1')
            ->join(
                DB::raw('(SELECT ap_id, MAX(ts) as max_ts FROM occupancy_predictions GROUP BY ap_id) as op2'),
                function ($join) {
                    $join->on('op1.ap_id', '=', 'op2.ap_id')
                        ->on('op1.ts', '=', 'op2.max_ts');
                }
            )
            ->select('op1.ap_id', 'op1.level as op_level', 'op1.estimated_count as op_clients', 'op1.ts as op_ts');

        $latestPolls = DB::table('poll_log as pl1')
            ->join(
                DB::raw('(SELECT ap_id, MAX(ts) as max_ts FROM poll_log GROUP BY ap_id) as pl2'),
                function ($join) {
                    $join->on('pl1.ap_id', '=', 'pl2.ap_id')
                        ->on('pl1.ts', '=', 'pl2.max_ts');
                }
            )
            ->select('pl1.ap_id', 'pl1.poll_ok', 'pl1.n_clients as poll_clients', 'pl1.ts as poll_ts');

        $latestVaps = DB::table('vap_snapshot as vs1')
            ->join(
                DB::raw('(SELECT ap_id, MAX(ts) as max_ts FROM vap_snapshot WHERE vap_up = 1 GROUP BY ap_id) as vs2'),
                function ($join) {
                    $join->on('vs1.ap_id', '=', 'vs2.ap_id')
                        ->on('vs1.ts', '=', 'vs2.max_ts');
                }
            )
            ->where('vs1.vap_up', 1)
            ->groupBy('vs1.ap_id', 'vs1.ts')
            ->select([
                'vs1.ap_id',
                'vs1.ts as vap_ts',
                DB::raw('COALESCE(SUM(vs1.n_clients), 0) as vap_clients'),
            ]);

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
            ->leftJoinSub($latestVaps, 'vs', function ($join) {
                $join->on(
                    DB::raw('ar.ap_id COLLATE utf8mb4_unicode_ci'),
                    '=',
                    DB::raw('vs.ap_id COLLATE utf8mb4_unicode_ci')
                );
            })
            ->select([
                'ar.ap_id',
                'op.op_level',
                'op.op_clients',
                'op.op_ts',
                'pl.poll_ok',
                'pl.poll_clients',
                'pl.poll_ts',
                'vs.vap_clients',
                'vs.vap_ts',
            ])
            ->get();

        $rooms = $rawAps
            ->groupBy(fn ($row) => $this->classifier->extractRoomId((string) $row->ap_id))
            ->map(function ($roomGroup, $roomId) use ($latestTs) {
                $resolvedAps = $roomGroup->map(fn ($row) => $this->resolveApLiveSnapshot($row));
                $apIds = $resolvedAps->pluck('ap_id')->unique()->values()->all();
                $roomEval = $this->classifier->evaluateRoom($resolvedAps);

                return [
                    'room_id'           => (string) $roomId,
                    'ap_id'             => implode(', ', $apIds),
                    'level'             => $roomEval['level'],
                    'estimated_count'   => $roomEval['count'],
                    'last_sync'         => $resolvedAps->max('last_sync') ?? $latestTs,
                    'poll_ok'           => $roomEval['poll_ok'],
                    'connection_status' => $roomEval['poll_ok'] === null ? 'UNKNOWN' : ($roomEval['poll_ok'] ? 'ONLINE' : 'OFFLINE'),
                    'last_poll_at'      => $resolvedAps->max('last_poll_at'),
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
            ->keyBy('ap_id');

        $latestPolls = DB::table('poll_log')
            ->whereIn('ap_id', $apIds)
            ->orderByDesc('ts')
            ->get()
            ->unique('ap_id')
            ->keyBy('ap_id');

        $latestVapPerAp = DB::table('vap_snapshot')
            ->whereIn('ap_id', $apIds)
            ->where('vap_up', 1)
            ->select('ap_id', DB::raw('MAX(ts) as max_ts'))
            ->groupBy('ap_id');

        $latestVaps = DB::table('vap_snapshot as vs')
            ->joinSub($latestVapPerAp, 'lv', function ($join) {
                $join->on('vs.ap_id', '=', 'lv.ap_id')
                    ->on('vs.ts', '=', 'lv.max_ts');
            })
            ->where('vs.vap_up', 1)
            ->groupBy('vs.ap_id', 'vs.ts')
            ->select([
                'vs.ap_id',
                'vs.ts as vap_ts',
                DB::raw('COALESCE(SUM(vs.n_clients), 0) as vap_clients'),
            ])
            ->get()
            ->keyBy('ap_id');

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

        $resolvedAps = $aps->map(function (ApRegistry $ap) use ($latestPredictions, $latestPolls, $latestVaps) {
            $op = $latestPredictions->get($ap->ap_id);
            $pl = $latestPolls->get($ap->ap_id);
            $vs = $latestVaps->get($ap->ap_id);

            return $this->resolveApLiveSnapshot((object) [
                'ap_id' => $ap->ap_id,
                'op_level' => $op?->level,
                'op_clients' => $op?->estimated_count,
                'op_ts' => $op?->ts,
                'poll_ok' => $pl?->poll_ok,
                'poll_clients' => $pl?->n_clients,
                'poll_ts' => $pl?->ts,
                'vap_clients' => $vs?->vap_clients,
                'vap_ts' => $vs?->vap_ts,
            ]);
        });

        $roomEval = $this->classifier->evaluateRoom($resolvedAps);

        $intervalSec = 15;
        $rxRateKBs = $traffic ? round(((float) $traffic->total_rx_bytes) / 1024 / $intervalSec, 2) : 0.0;
        $txRateKBs = $traffic ? round(((float) $traffic->total_tx_bytes) / 1024 / $intervalSec, 2) : 0.0;
        $pps = $traffic ? (int) round((((float) $traffic->total_rx_packets) + ((float) $traffic->total_tx_packets)) / $intervalSec) : 0;

        $extractedRoomId = $this->extractRoomId((string) $aps->first()->ap_id);

        return response()->json([
            'success'           => true,
            'room_id'           => $extractedRoomId,
            'ap_id'             => implode(', ', $apIds),
            'ip_address'        => implode(', ', $aps->pluck('ip_address')->filter()->unique()->values()->all()),
            'level'             => $roomEval['level'],
            'estimated_count'   => $roomEval['count'],
            'last_sync'         => $resolvedAps->max('last_sync') ?? $traffic?->latest_ts,
            'poll_ok'           => $roomEval['poll_ok'],
            'connection_status' => $roomEval['poll_ok'] === null ? 'UNKNOWN' : ($roomEval['poll_ok'] ? 'ONLINE' : 'OFFLINE'),
            'last_poll_at'      => $resolvedAps->max('last_poll_at'),
            'metrics'           => [
                'active_clients'    => $roomEval['count'],
                'rx_rate_kbs'       => $rxRateKBs,
                'tx_rate_kbs'       => $txRateKBs,
                'rx_rate_formatted' => $rxRateKBs >= 1024 ? round($rxRateKBs / 1024, 2) . ' MB/s' : $rxRateKBs . ' KB/s',
                'tx_rate_formatted' => $txRateKBs >= 1024 ? round($txRateKBs / 1024, 2) . ' MB/s' : $txRateKBs . ' KB/s',
                'packets_per_sec'   => $pps,
                'tx_retries'        => (int) ($traffic->total_tx_retries ?? 0),
            ],
        ]);
    }

    /**
     * Resolves an AP's freshest client count and poll status across vap_snapshot, poll_log, and occupancy_predictions.
     *
     * @return array{ap_id: string, n_clients: ?int, poll_ok: ?bool, last_sync: ?string, last_poll_at: ?string}
     */
    private function resolveApLiveSnapshot(object $row): array
    {
        $vapTs = isset($row->vap_ts) && $row->vap_ts !== null ? (string) $row->vap_ts : null;
        $pollTs = isset($row->poll_ts) && $row->poll_ts !== null ? (string) $row->poll_ts : null;
        $opTs = isset($row->op_ts) && $row->op_ts !== null ? (string) $row->op_ts : null;

        $timestamps = array_filter([$vapTs, $pollTs, $opTs], fn ($v) => $v !== null);
        $lastSync = ! empty($timestamps) ? max($timestamps) : null;

        if ($pollTs !== null && ($vapTs === null || $pollTs >= $vapTs)) {
            $pollOk = $row->poll_ok !== null ? (bool) $row->poll_ok : null;
        } elseif ($vapTs !== null) {
            $pollOk = true;
        } elseif ($opTs !== null) {
            $pollOk = strtoupper((string) ($row->op_level ?? 'UNKNOWN')) !== OccupancyClassifier::LEVEL_UNKNOWN;
        } else {
            $pollOk = null;
        }

        if ($pollOk === false) {
            $nClients = 0;
        } elseif ($vapTs !== null && ($opTs === null || $vapTs >= $opTs)) {
            $vapClients = (int) ($row->vap_clients ?? 0);
            $nClients = ($pollTs !== null && $pollTs >= $vapTs && $row->poll_clients !== null)
                ? max($vapClients, (int) $row->poll_clients)
                : $vapClients;
        } elseif ($pollTs !== null && ($opTs === null || $pollTs >= $opTs)) {
            $nClients = $row->poll_clients !== null ? (int) $row->poll_clients : null;
        } elseif ($opTs !== null) {
            $nClients = $row->op_clients !== null ? (int) $row->op_clients : null;
        } else {
            $nClients = null;
        }

        return [
            'ap_id' => (string) $row->ap_id,
            'n_clients' => $nClients,
            'poll_ok' => $pollOk,
            'last_sync' => $lastSync,
            'last_poll_at' => $pollTs ?? $vapTs,
        ];
    }

    private function extractRoomId(string $apId): string
    {
        return $this->classifier->extractRoomId($apId);
    }
}
