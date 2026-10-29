<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HistoryController extends Controller
{
    /**
     * Mengambil deret waktu riwayat trafik dan perangkat aktif dari client_snapshot
     */
    public function getGrafik(Request $request): JsonResponse
    {
        $roomId = $request->query('room_id');
        $apId = $request->query('ap_id');
        $intervalSec = 15; // Interval polling

        $query = DB::table('client_snapshot as cs')
            ->leftJoin('ap_rooms as ar', 'cs.ap_id', '=', 'ar.ap_id');

        $isFiltered = false;

        // Filter jika memilih room_id tertentu
        if (!empty($roomId) && strtoupper($roomId) !== 'ALL') {
            $query->where('ar.room_id', $roomId);
            $isFiltered = true;
        }

        // Filter jika memilih ap_id tertentu
        if (!empty($apId)) {
            $query->where('cs.ap_id', $apId);
            $isFiltered = true;
        }

        if ($isFiltered) {
            // Mode per Ruangan / AP Tertentu
            $data = $query->select([
                    'cs.ts',
                    'cs.ap_id',
                    DB::raw('COALESCE(ar.room_id, "UNKNOWN") as room_id'),
                    DB::raw('COUNT(DISTINCT cs.mac_hash) as active_clients'),
                    DB::raw('COALESCE(SUM(cs.rx_bytes), 0) as total_rx_bytes'),
                    DB::raw('COALESCE(SUM(cs.tx_bytes), 0) as total_tx_bytes'),
                    DB::raw('COALESCE(SUM(cs.rx_packets), 0) as total_rx_packets'),
                    DB::raw('COALESCE(SUM(cs.tx_packets), 0) as total_tx_packets'),
                ])
                ->groupBy('cs.ts', 'cs.ap_id', 'ar.room_id')
                ->orderBy('cs.ts', 'desc')
                ->limit(100)
                ->get();
        } else {
            // Mode Agregasi Total Seluruh Gedung ("ALL")
            $data = $query->select([
                    'cs.ts',
                    DB::raw('"ALL" as ap_id'),
                    DB::raw('"ALL" as room_id'),
                    DB::raw('COUNT(DISTINCT cs.mac_hash) as active_clients'),
                    DB::raw('COALESCE(SUM(cs.rx_bytes), 0) as total_rx_bytes'),
                    DB::raw('COALESCE(SUM(cs.tx_bytes), 0) as total_tx_bytes'),
                    DB::raw('COALESCE(SUM(cs.rx_packets), 0) as total_rx_packets'),
                    DB::raw('COALESCE(SUM(cs.tx_packets), 0) as total_tx_packets'),
                ])
                ->groupBy('cs.ts')
                ->orderBy('cs.ts', 'desc')
                ->limit(100)
                ->get();
        }

        $formattedData = $data->map(function ($row) use ($intervalSec) {
            $rxBytes = (float) $row->total_rx_bytes;
            $txBytes = (float) $row->total_tx_bytes;
            $rxPackets = (float) $row->total_rx_packets;
            $txPackets = (float) $row->total_tx_packets;

            $rxRateKBs = round($rxBytes / 1024 / $intervalSec, 2);
            $txRateKBs = round($txBytes / 1024 / $intervalSec, 2);
            $pps = (int) round(($rxPackets + $txPackets) / $intervalSec);

            return [
                'ts'                => $row->ts,
                'ap_id'             => $row->ap_id,
                'room_id'           => $row->room_id,
                'active_clients'    => (int) $row->active_clients,
                'rx_rate_kbs'       => $rxRateKBs,
                'tx_rate_kbs'       => $txRateKBs,
                'rx_rate_formatted' => $rxRateKBs >= 1024 ? round($rxRateKBs / 1024, 2) . ' MB/s' : $rxRateKBs . ' KB/s',
                'tx_rate_formatted' => $txRateKBs >= 1024 ? round($txRateKBs / 1024, 2) . ' MB/s' : $txRateKBs . ' KB/s',
                'packets_per_sec'   => $pps,
            ];
        })->reverse()->values();

        return response()->json([
            'success'   => true,
            'message'   => 'Data grafik berhasil diambil langsung dari client_snapshot.',
            'filter'    => [
                'room_id' => $roomId ?? 'ALL',
                'ap_id'   => $apId ?? 'ALL',
            ],
            'total_pts' => $formattedData->count(),
            'data'      => $formattedData,
        ]);
    }
}