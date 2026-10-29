<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HistoryController extends Controller
{
    /**
     * Mengambil deret waktu riwayat trafik dan perangkat aktif langsung dari client_snapshot
     */
    public function getGrafik(Request $request): JsonResponse
    {
        $roomId = $request->query('room_id');
        $intervalSec = 15; // Interval polling SNMP

        // Query dasar dari client_snapshot digabung dengan ap_rooms
        $query = DB::table('client_snapshot as cs')
            ->leftJoin('ap_rooms as ar', 'cs.ap_id', '=', 'ar.ap_id');

        // Jika ada filter room_id spesifik (bukan 'ALL' atau kosong)
        if (!empty($roomId) && strtoupper($roomId) !== 'ALL') {
            $query->where('ar.room_id', $roomId);
        }

        // Agregasi per timestamp (ts)
        $data = $query->select([
                'cs.ts',
                DB::raw('COUNT(DISTINCT cs.mac_hash) as active_clients'),
                DB::raw('COALESCE(SUM(cs.rx_bytes), 0) as total_rx_bytes'),
                DB::raw('COALESCE(SUM(cs.tx_bytes), 0) as total_tx_bytes'),
                DB::raw('COALESCE(SUM(cs.rx_packets), 0) as total_rx_packets'),
                DB::raw('COALESCE(SUM(cs.tx_packets), 0) as total_tx_packets'),
            ])
            ->groupBy('cs.ts')
            ->orderBy('cs.ts', 'desc')
            ->limit(100) // Ambil 100 snapshot terakhir untuk grafik time-series
            ->get();

        // Format kalkulasi rate ke KB/s dan MB/s
        $formattedData = $data->map(function ($row) use ($intervalSec) {
            $rxBytes = (float) $row->total_rx_bytes;
            $txBytes = (float) $row->total_tx_bytes;
            $rxPackets = (float) $row->total_rx_packets;
            $txPackets = (float) $row->total_tx_packets;

            $rxRateKBs = round($rxBytes / 1024 / $intervalSec, 2);
            $txRateKBs = round($txBytes / 1024 / $intervalSec, 2);
            $pps = (int) round(($rxPackets + $txPackets) / $intervalSec);

            return [
                'ts'               => $row->ts,
                'active_clients'   => (int) $row->active_clients,
                'rx_rate_kbs'      => $rxRateKBs,
                'tx_rate_kbs'      => $txRateKBs,
                'rx_rate_formatted'=> $rxRateKBs >= 1024 ? round($rxRateKBs / 1024, 2) . ' MB/s' : $rxRateKBs . ' KB/s',
                'tx_rate_formatted'=> $txRateKBs >= 1024 ? round($txRateKBs / 1024, 2) . ' MB/s' : $txRateKBs . ' KB/s',
                'packets_per_sec'  => $pps,
            ];
        })->reverse()->values(); // Urutkan kronologis (terlama ke terbaru) untuk chart

        return response()->json([
            'success'   => true,
            'message'   => 'Data grafik berhasil diambil langsung dari client_snapshot.',
            'filter'    => [
                'room_id' => $roomId ?? 'ALL',
            ],
            'total_pts' => $formattedData->count(),
            'data'      => $formattedData,
        ]);
    }
}