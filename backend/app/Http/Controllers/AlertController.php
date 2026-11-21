<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Mengambil daftar alert terkini dengan filter status, AP, ruangan, dan rentang waktu.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $apId = $request->query('ap_id');
        $roomId = $request->query('room_id');
        $date = $request->query('date');
        $startDate = $request->query('start_date') ?? $request->query('from');
        $endDate = $request->query('end_date') ?? $request->query('to');
        $limit = min(max((int) ($request->query('limit') ?? 50), 1), 500);

        $query = Alert::orderBy('triggered_at', 'desc');

        if ($status) {
            $query->where('status', strtoupper($status));
        }

        if ($apId && strtoupper($apId) !== 'ALL') {
            $query->where('ap_id', $apId);
        }

        if ($roomId && strtoupper($roomId) !== 'ALL') {
            $query->where('room_id', $roomId);
        }

        if ($date) {
            $query->whereDate('triggered_at', $date);
        }

        if ($startDate) {
            $parsedStart = strlen(trim($startDate)) <= 10
                ? Carbon::parse($startDate)->startOfDay()->toDateTimeString()
                : Carbon::parse($startDate)->toDateTimeString();
            $query->where('triggered_at', '>=', $parsedStart);
        }

        if ($endDate) {
            $parsedEnd = strlen(trim($endDate)) <= 10
                ? Carbon::parse($endDate)->endOfDay()->toDateTimeString()
                : Carbon::parse($endDate)->toDateTimeString();
            $query->where('triggered_at', '<=', $parsedEnd);
        }

        $alerts = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar alert berhasil diambil.',
            'data' => $alerts,
        ]);
    }

    /**
     * Konfirmasi / Acknowledge alert yang aktif.
     */
    public function acknowledge(int $id): JsonResponse
    {
        $alert = Alert::find($id);

        if (!$alert) {
            return response()->json([
                'success' => false,
                'message' => 'Data alert tidak ditemukan.',
            ], 404);
        }

        $alert->update([
            'status' => 'ACKNOWLEDGED',
            'acknowledged_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alert berhasil di-acknowledge.',
            'data' => $alert,
        ]);
    }
}