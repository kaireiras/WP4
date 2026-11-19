<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HistoryController extends Controller
{
    /**
     * Mengambil deret waktu riwayat trafik dan perangkat aktif dari vap_snapshot
     * Mendukung filter room_id, ap_id, tanggal (start_date/end_date, from/to, date), dan preset waktu (range).
     */
    public function getGrafik(Request $request): JsonResponse
    {
        $roomId = $request->query('room_id');
        $apId = $request->query('ap_id');

        // Tangkap berbagai variasi nama parameter tanggal/waktu dari frontend
        $date = $request->query('date');
        $startDate = $request->query('start_date') ?? $request->query('from') ?? $request->query('start_time');
        $endDate = $request->query('end_date') ?? $request->query('to') ?? $request->query('end_time');
        $range = $request->query('range') ?? $request->query('timeframe'); // contoh: 1h, 6h, 24h, 7d
        $limit = (int) ($request->query('limit') ?? 0);

        $intervalSec = 15; // Interval polling

        $query = DB::table('vap_snapshot as vs')
            ->where('vs.vap_up', 1);

        $isFiltered = false;
        $hasTimeFilter = false;

        // 1. Filter berdasarkan room_id (ekstrak dari suffix ap_id, misal AP1-CU205 -> CU205)
        if (! empty($roomId) && strtoupper($roomId) !== 'ALL') {
            $query->whereRaw("SUBSTRING_INDEX(vs.ap_id, '-', -1) = ?", [$roomId]);
            $isFiltered = true;
        }

        // 2. Filter jika memilih ap_id tertentu
        if (! empty($apId) && strtoupper($apId) !== 'ALL') {
            $query->where('vs.ap_id', $apId);
            $isFiltered = true;
        }

        // 3. Filter satu tanggal spesifik (?date=2026-11-14)
        if (! empty($date)) {
            $query->whereDate('vs.ts', $date);
            $hasTimeFilter = true;
        }

        // 4. Filter rentang waktu mulai (?start_date=2026-11-14 atau 2026-11-14 08:00:00)
        if (! empty($startDate)) {
            $parsedStart = strlen(trim($startDate)) <= 10
                ? Carbon::parse($startDate)->startOfDay()->toDateTimeString()
                : Carbon::parse($startDate)->toDateTimeString();

            $query->where('vs.ts', '>=', $parsedStart);
            $hasTimeFilter = true;
        }

        // 5. Filter rentang waktu akhir (?end_date=2026-11-14 atau 2026-11-14 17:00:00)
        if (! empty($endDate)) {
            $parsedEnd = strlen(trim($endDate)) <= 10
                ? Carbon::parse($endDate)->endOfDay()->toDateTimeString()
                : Carbon::parse($endDate)->toDateTimeString();

            $query->where('vs.ts', '<=', $parsedEnd);
            $hasTimeFilter = true;
        }

        // 6. Filter preset durasi relatif (?range=1h, 6h, 24h, 7d)
        if (! empty($range) && ! $hasTimeFilter) {
            $anchorTs = DB::table('vap_snapshot')->max('ts');
            $baseTime = $anchorTs ? Carbon::parse($anchorTs) : now();

            $startTime = match (strtolower(trim($range))) {
                '15m'        => $baseTime->copy()->subMinutes(15),
                '30m'        => $baseTime->copy()->subMinutes(30),
                '1h'         => $baseTime->copy()->subHour(),
                '3h'         => $baseTime->copy()->subHours(3),
                '6h'         => $baseTime->copy()->subHours(6),
                '12h'        => $baseTime->copy()->subHours(12),
                '24h', '1d'  => $baseTime->copy()->subDay(),
                '7d', '1w'   => $baseTime->copy()->subDays(7),
                '30d', '1m'  => $baseTime->copy()->subDays(30),
                default      => null,
            };

            if ($startTime) {
                $query->where('vs.ts', '>=', $startTime->toDateTimeString());
                $hasTimeFilter = true;
            }
        }

        // Jika memfilter tanggal/waktu, izinkan sampai 1000 titik agar tidak terpotong; default tetap 100
        $effectiveLimit = $limit > 0 ? min($limit, 5000) : ($hasTimeFilter ? 1000 : 100);

        if ($isFiltered) {
            // Mode per Ruangan / AP Tertentu
            $data = $query->select([
                    'vs.ts',
                    'vs.ap_id',
                    DB::raw("SUBSTRING_INDEX(vs.ap_id, '-', -1) as room_id"),
                    DB::raw('COALESCE(SUM(vs.n_clients), 0) as active_clients'),
                    DB::raw('COALESCE(SUM(vs.rx_bytes), 0) as total_rx_bytes'),
                    DB::raw('COALESCE(SUM(vs.tx_bytes), 0) as total_tx_bytes'),
                    DB::raw('COALESCE(SUM(vs.rx_packets), 0) as total_rx_packets'),
                    DB::raw('COALESCE(SUM(vs.tx_packets), 0) as total_tx_packets'),
                    DB::raw('COALESCE(SUM(vs.tx_retries), 0) as total_tx_retries'),
                ])
                ->groupBy('vs.ts', 'vs.ap_id')
                ->orderBy('vs.ts', 'desc')
                ->limit($effectiveLimit)
                ->get();
        } else {
            // Mode Agregasi Total Seluruh Gedung ("ALL")
            $data = $query->select([
                    'vs.ts',
                    DB::raw('"ALL" as ap_id'),
                    DB::raw('"ALL" as room_id'),
                    DB::raw('COALESCE(SUM(vs.n_clients), 0) as active_clients'),
                    DB::raw('COALESCE(SUM(vs.rx_bytes), 0) as total_rx_bytes'),
                    DB::raw('COALESCE(SUM(vs.tx_bytes), 0) as total_tx_bytes'),
                    DB::raw('COALESCE(SUM(vs.rx_packets), 0) as total_rx_packets'),
                    DB::raw('COALESCE(SUM(vs.tx_packets), 0) as total_tx_packets'),
                    DB::raw('COALESCE(SUM(vs.tx_retries), 0) as total_tx_retries'),
                ])
                ->groupBy('vs.ts')
                ->orderBy('vs.ts', 'desc')
                ->limit($effectiveLimit)
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
                'tx_retries'        => (int) $row->total_tx_retries,
            ];
        })->reverse()->values();

        return response()->json([
            'success'   => true,
            'message'   => 'Data grafik berhasil diambil langsung dari vap_snapshot.',
            'filter'    => [
                'room_id'    => $roomId ?? 'ALL',
                'ap_id'      => $apId ?? 'ALL',
                'date'       => $date,
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'range'      => $range,
            ],
            'total_pts' => $formattedData->count(),
            'data'      => $formattedData,
        ]);
    }
}