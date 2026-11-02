<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\ApRoom;
use App\Models\OccupancyPrediction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * 1. Overview Denah: Status okupansi snapshot terbaru seluruh ruangan ber-AP
     */
    public function getOverview(): JsonResponse
    {
        // Gunakan Model OccupancyPrediction untuk mencari timestamp terbaru
        $latestTs = OccupancyPrediction::max('ts');

        $rooms = [];
        if ($latestTs) {
            $rooms = ApRoom::query()
                ->leftJoin('occupancy_predictions as op', function ($join) use ($latestTs) {
                    $join->on('ap_rooms.room_id', '=', 'op.room_id')
                         ->where('op.ts', '=', $latestTs);
                })
                ->select([
                    'ap_rooms.room_id',
                    'ap_rooms.ap_id',
                    DB::raw('COALESCE(op.level, "LOW") as level'),
                    DB::raw('COALESCE(op.estimated_count, 0) as estimated_count'),
                    DB::raw('COALESCE(op.confidence, 0.90) as confidence'),
                    DB::raw('COALESCE(op.ts, "'.$latestTs.'") as last_sync'),
                ])
                ->get();
        }

        // Gunakan Model Alert untuk mengambil alert yang aktif
        $activeAlerts = Alert::where('status', 'ACTIVE')
            ->orderBy('triggered_at', 'desc')
            ->get();

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
        // 1. Dapatkan ap_id dari Model ApRoom
        $apRoom = ApRoom::where('room_id', $roomId)->first();

        if (!$apRoom) {
            return response()->json([
                'success' => false,
                'message' => "Ruangan {$roomId} tidak ditemukan atau tidak memiliki AP terdaftar.",
            ], 404);
        }

        $apId = $apRoom->ap_id;

        // 2. Ambil prediksi okupansi terkini via Model OccupancyPrediction
        $latestPrediction = OccupancyPrediction::where('room_id', $roomId)
            ->orderBy('ts', 'desc')
            ->first();

        // 3. Ambil data polling klien aktif terkini dari poll_log
        $latestPoll = DB::table('poll_log')
            ->where('ap_id', $apId)
            ->orderBy('ts', 'desc')
            ->first();

        $activeTs = $latestPoll ? $latestPoll->ts : ($latestPrediction?->ts);

        // 4. Hitung agregasi trafik dari client_snapshot pada timestamp aktif
        $trafficAgg = null;
        if ($activeTs) {
            $trafficAgg = DB::table('client_snapshot')
                ->where('ap_id', $apId)
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
        $activeClients = (int) ($latestPoll->n_clients ?? $flowCount);

        // 6: Connection Rate
        $connectionRate = (int) round($flowCount / $intervalSec);

        return response()->json([
            'success' => true,
            'message' => "Detail live ruangan {$roomId} berhasil diambil.",
            'data' => [
                'room_id' => $roomId,
                'ap_id' => $apId,
                'last_sync' => $activeTs,
                'level' => $latestPrediction->level ?? 'LOW',
                'estimated_count' => $latestPrediction->estimated_count ?? $activeClients,
                'accuracy_percent' => isset($latestPrediction->confidence) 
                    ? (int) round((float) $latestPrediction->confidence * 100) 
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