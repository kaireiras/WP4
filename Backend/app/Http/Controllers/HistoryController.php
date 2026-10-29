<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
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

        // KASUS A: Filter Spesifik Ruangan atau AP Tertentu
        if ($roomId || $apId) {
            if ($roomId) {
                $baseQuery->where('op.room_id', $roomId);
            }
            if ($apId) {
                $baseQuery->where('op.ap_id', $apId);
            }

            $records = $baseQuery->select([
                'op.ts',
                'op.ap_id',
                'op.room_id',
                'op.estimated_count',
                'op.level',
                'op.confidence',
                'pl.n_clients',
                DB::raw('ROUND(COALESCE(tr.rx_rate, 0), 2) as rx_rate'),
                DB::raw('ROUND(COALESCE(tr.tx_rate, 0), 2) as tx_rate'),
            ])
            ->orderBy('op.ts', 'desc')
            ->limit($limit)
            ->get();
        } 
        // KASUS B: Opsi "Semua Ruangan" (Akumulasi Total Seluruh Gedung)
        else {
            $records = $baseQuery->select([
                'op.ts',
                DB::raw("'ALL' as room_id"),
                DB::raw('SUM(op.estimated_count) as estimated_count'),
                DB::raw('SUM(pl.n_clients) as n_clients'),
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