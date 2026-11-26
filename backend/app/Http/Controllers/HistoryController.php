<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\ApRoomHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HistoryController extends Controller
{
    public function getChartData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ap_id' => 'nullable|string',
            'room_id' => 'nullable|string',
            'start' => 'nullable|date',
            'end' => 'nullable|date',
            'limit' => 'nullable|integer|max:1000',
        ]);

        $limit = $validated['limit'] ?? 100;
        $apId = $validated['ap_id'] ?? null;
        $roomId = $validated['room_id'] ?? null;

        // 1. Subquery trafik per AP per timestamp
        $trafficSub = DB::table('client_snapshot')
            ->select([
                'ap_id',
                'ts',
                DB::raw('COALESCE(SUM(rx_bytes), 0) / 1024 / 15 as rx_rate'),
                DB::raw('COALESCE(SUM(tx_bytes), 0) / 1024 / 15 as tx_rate'),
            ])
            ->groupBy('ap_id', 'ts');

        // 2. Base query gabungan
        $baseQuery = DB::table('occupancy_predictions as op')
            ->leftJoin('poll_log as pl', function ($join) {
                $join->on('op.ap_id', '=', 'pl.ap_id')
                    ->on('op.ts', '=', 'pl.ts');
            })
            ->leftJoinSub($trafficSub, 'tr', function ($join) {
                $join->on('op.ap_id', '=', 'tr.ap_id')
                    ->on('op.ts', '=', 'tr.ts');
            });

        // Filter rentang waktu jika ada
        if (!empty($validated['start'])) {
            $baseQuery->where('op.ts', '>=', $validated['start']);
        }
        if (!empty($validated['end'])) {
            $baseQuery->where('op.ts', '<=', $validated['end']);
        }

        // KASUS A: Filter Spesifik Ruangan atau AP Tertentu (gabungkan AP dengan ruangan sama pada timestamp yang sama)
        if ($roomId || $apId) {
            if ($roomId) {
                $baseQuery->where(function ($query) use ($roomId) {
                    $query->where('op.ap_id', 'like', '%-' . $roomId)
                        ->orWhere('op.room_id', $roomId);
                });
            }
            if ($apId) {
                $baseQuery->where('op.ap_id', $apId);
            }

            $records = $baseQuery->select([
                'op.ts',
                DB::raw('GROUP_CONCAT(DISTINCT op.ap_id) as ap_id'),
                DB::raw('MAX(op.room_id) as room_id'),
                DB::raw('SUM(op.estimated_count) as estimated_count'),
                DB::raw("CASE MAX(CASE UPPER(op.level) WHEN 'CROWDED' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 ELSE 1 END) WHEN 4 THEN 'CROWDED' WHEN 3 THEN 'HIGH' WHEN 2 THEN 'MEDIUM' ELSE 'LOW' END as level"),
                DB::raw('ROUND(AVG(op.confidence), 2) as confidence'),
                DB::raw('SUM(COALESCE(pl.n_clients, 0)) as n_clients'),
                DB::raw('ROUND(SUM(COALESCE(tr.rx_rate, 0)), 2) as rx_rate'),
                DB::raw('ROUND(SUM(COALESCE(tr.tx_rate, 0)), 2) as tx_rate'),
            ])
                ->groupBy('op.ts')
                ->orderBy('op.ts', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($row) use ($roomId) {
                    $apIds = $row->ap_id ? explode(',', (string) $row->ap_id) : [];
                    $firstApId = $apIds[0] ?? null;

                    $row->ap_id = implode(', ', $apIds);
                    $row->room_id = $roomId ?: ApRoomHelper::extractRoomName($firstApId, $row->room_id);

                    return $row;
                });
        }
        // KASUS B: Opsi "Semua Ruangan" (Akumulasi Total Seluruh Gedung)
        else {
            $records = $baseQuery->select([
                'op.ts',
                DB::raw("'ALL' as room_id"),
                DB::raw('SUM(op.estimated_count) as estimated_count'),
                DB::raw('SUM(COALESCE(pl.n_clients, 0)) as n_clients'),
                DB::raw('ROUND(SUM(COALESCE(tr.rx_rate, 0)), 2) as rx_rate'),
                DB::raw('ROUND(SUM(COALESCE(tr.tx_rate, 0)), 2) as tx_rate'),
            ])
                ->groupBy('op.ts')
                ->orderBy('op.ts', 'desc')
                ->limit($limit)
                ->get();
        }

        return response()->json([
            'success' => true,
            'message' => 'Data riwayat grafik berhasil diambil.',
            'data' => $records->reverse()->values(),
        ]);
    }
}
