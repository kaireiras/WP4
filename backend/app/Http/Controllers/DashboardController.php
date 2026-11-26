<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Models\ApRoom;
use App\Models\OccupancyPrediction;
use App\Support\ApRoomHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * 1. Overview Denah: Status okupansi snapshot terbaru seluruh ruangan ber-AP
     */
    public function getOverview(): JsonResponse
    {
        $latestTs = OccupancyPrediction::max('ts');

        $rooms = collect();
        if ($latestTs) {
            $apRoomsByRoom = ApRoom::all()->groupBy(
                fn (ApRoom $apRoom) => ApRoomHelper::extractRoomName($apRoom->ap_id, $apRoom->room_id)
            );

            $predictionsByRoom = OccupancyPrediction::where('ts', $latestTs)
                ->get()
                ->groupBy(
                    fn (OccupancyPrediction $pred) => ApRoomHelper::extractRoomName($pred->ap_id, $pred->room_id)
                );

            $allRoomNames = $apRoomsByRoom->keys()->merge($predictionsByRoom->keys())->unique();

            $rooms = $allRoomNames->map(function (string $roomName) use ($apRoomsByRoom, $predictionsByRoom, $latestTs) {
                $roomAps = $apRoomsByRoom->get($roomName, collect());
                $roomPreds = $predictionsByRoom->get($roomName, collect());

                $apIds = $roomAps->pluck('ap_id')
                    ->merge($roomPreds->pluck('ap_id'))
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();

                $hasPreds = $roomPreds->isNotEmpty();

                return [
                    'room_id' => $roomName,
                    'ap_id' => implode(', ', $apIds),
                    'ap_ids' => $apIds,
                    'level' => $hasPreds ? ApRoomHelper::maxLevel($roomPreds->pluck('level')) : 'LOW',
                    'estimated_count' => $hasPreds ? (int) $roomPreds->sum('estimated_count') : 0,
                    'confidence' => $hasPreds ? round((float) $roomPreds->avg('confidence'), 2) : 0.90,
                    'last_sync' => $latestTs,
                ];
            })->values();
        }

        $activeAlerts = ApRoomHelper::mergeAlerts(
            Alert::where('status', 'ACTIVE')
                ->orderBy('triggered_at', 'desc')
                ->get()
        );

        return response()->json([
            'success' => true,
            'message' => 'Data overview dashboard berhasil diambil.',
            'last_sync' => $latestTs,
            'data' => [
                'rooms' => $rooms,
                'active_alerts' => $activeAlerts,
            ],
        ]);
    }

    /**
     * 2. Detail Popup Modal Ruangan: Mengembalikan 6 metrik jaringan & okupansi
     */
    public function getRoomLiveDetail(string $roomId): JsonResponse
    {
        // 1. Dapatkan semua ap_id yang berada di ruangan ini (berdasarkan nama ruangan setelah '-' pada ap_id atau room_id)
        $matchingAps = ApRoom::all()->filter(
            fn (ApRoom $ap) => ApRoomHelper::extractRoomName($ap->ap_id, $ap->room_id) === $roomId || $ap->room_id === $roomId
        );

        if ($matchingAps->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Ruangan {$roomId} tidak ditemukan atau tidak memiliki AP terdaftar.",
            ], 404);
        }

        $apIds = $matchingAps->pluck('ap_id')->unique()->values()->all();

        // 2. Ambil prediksi okupansi terkini via Model OccupancyPrediction (gabungkan semua AP di ruangan pada ts terbaru)
        $latestPredTs = OccupancyPrediction::where(function ($query) use ($apIds, $roomId) {
            $query->whereIn('ap_id', $apIds)
                ->orWhere('room_id', $roomId);
        })->max('ts');

        $latestPredictions = collect();
        if ($latestPredTs) {
            $latestPredictions = OccupancyPrediction::where('ts', $latestPredTs)
                ->where(function ($query) use ($apIds, $roomId) {
                    $query->whereIn('ap_id', $apIds)
                        ->orWhere('room_id', $roomId);
                })
                ->get();
        }

        // 3. Ambil data polling klien aktif terkini dari poll_log (gabungkan semua AP di ruangan pada ts terbaru)
        $latestPollTs = DB::table('poll_log')
            ->whereIn('ap_id', $apIds)
            ->max('ts');

        $latestPollClients = null;
        if ($latestPollTs) {
            $latestPollClients = (int) DB::table('poll_log')
                ->whereIn('ap_id', $apIds)
                ->where('ts', $latestPollTs)
                ->sum('n_clients');
        }

        $activeTs = $latestPollTs ?: ($latestPredTs ? (string) $latestPredTs : null);

        // 4. Hitung agregasi trafik gabungan dari client_snapshot pada timestamp aktif untuk semua AP ruangan ini
        $trafficAgg = null;
        if ($activeTs) {
            $trafficAgg = DB::table('client_snapshot')
                ->whereIn('ap_id', $apIds)
                ->where('ts', $activeTs)
                ->select([
                    DB::raw('COALESCE(SUM(rx_bytes), 0) as total_rx_bytes'),
                    DB::raw('COALESCE(SUM(tx_bytes), 0) as total_tx_bytes'),
                    DB::raw('COALESCE(SUM(rx_packets), 0) as total_rx_packets'),
                    DB::raw('COALESCE(SUM(tx_packets), 0) as total_tx_packets'),
                    DB::raw('COUNT(DISTINCT mac_hash) as unique_clients'),
                ])
                ->first();
        }

        // Interval polling SNMP adalah 15 detik
        $intervalSec = 15;

        $rxBytes = (float) ($trafficAgg->total_rx_bytes ?? 0);
        $txBytes = (float) ($trafficAgg->total_tx_bytes ?? 0);
        $rxPackets = (float) ($trafficAgg->total_rx_packets ?? 0);
        $txPackets = (float) ($trafficAgg->total_tx_packets ?? 0);

        // Perhitungan 6 Metrik Kartu Popup:
        // 1 & 2: Rate Byte
        $rxRateKBs = round($rxBytes / 1024 / $intervalSec, 2);
        $txRateKBs = round($txBytes / 1024 / $intervalSec, 2);

        $rxRateFormatted = $rxRateKBs >= 1024
            ? round($rxRateKBs / 1024, 2) . ' MB/s'
            : $rxRateKBs . ' KB/s';

        $txRateFormatted = $txRateKBs >= 1024
            ? round($txRateKBs / 1024, 2) . ' MB/s'
            : $txRateKBs . ' KB/s';

        // 3: Packets per second (pps)
        $pps = (int) round(($rxPackets + $txPackets) / $intervalSec);

        // 4: Flow Count
        $flowCount = (int) ($trafficAgg->unique_clients ?? 0);

        // 5: Active Clients
        $activeClients = $latestPollClients ?? $flowCount;

        // 6: Connection Rate
        $connectionRate = (int) round($flowCount / $intervalSec);

        $hasPreds = $latestPredictions->isNotEmpty();

        return response()->json([
            'success' => true,
            'message' => "Detail live ruangan {$roomId} berhasil diambil.",
            'data' => [
                'room_id' => $roomId,
                'ap_id' => implode(', ', $apIds),
                'ap_ids' => $apIds,
                'last_sync' => $activeTs,
                'level' => $hasPreds ? ApRoomHelper::maxLevel($latestPredictions->pluck('level')) : 'LOW',
                'estimated_count' => $hasPreds ? (int) $latestPredictions->sum('estimated_count') : $activeClients,
                'accuracy_percent' => $hasPreds
                    ? (int) round((float) $latestPredictions->avg('confidence') * 100)
                    : 90,
                'metrics' => [
                    'rx_rate' => $rxRateFormatted,
                    'rx_rate_raw_kbs' => $rxRateKBs,
                    'tx_rate' => $txRateFormatted,
                    'tx_rate_raw_kbs' => $txRateKBs,
                    'packets_per_sec' => $pps,
                    'flow_count' => $flowCount,
                    'active_clients' => $activeClients,
                    'connection_rate' => $connectionRate,
                ],
            ],
        ]);
    }
}
