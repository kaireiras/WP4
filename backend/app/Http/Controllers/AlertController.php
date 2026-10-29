<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Mengambil daftar alert terkini.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status'); // misal: ACTIVE atau ACKNOWLEDGED

        $query = Alert::orderBy('triggered_at', 'desc');

        if ($status) {
            $query->where('status', strtoupper($status));
        }

        $alerts = $query->limit(50)->get();

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