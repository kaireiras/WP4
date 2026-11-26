<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Alert;
use App\Support\ApRoomHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Mengambil daftar alert terkini (digabungkan untuk AP dalam ruangan yang sama pada waktu yang sama).
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status'); // misal: ACTIVE atau ACKNOWLEDGED

        $query = Alert::orderBy('triggered_at', 'desc');

        if ($status) {
            $query->where('status', strtoupper($status));
        }

        $alerts = ApRoomHelper::mergeAlerts($query->get())
            ->take(50)
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Daftar alert berhasil diambil.',
            'data' => $alerts,
        ]);
    }

    /**
     * Konfirmasi / Acknowledge alert yang aktif (termasuk AP lain di ruangan dan waktu yang sama).
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

        $roomName = ApRoomHelper::extractRoomName($alert->ap_id, $alert->room_id);
        $acknowledgedAt = now();

        $matchingIds = Alert::where('triggered_at', $alert->triggered_at)
            ->get()
            ->filter(fn (Alert $item) => ApRoomHelper::extractRoomName($item->ap_id, $item->room_id) === $roomName)
            ->pluck('id')
            ->all();

        Alert::whereIn('id', $matchingIds)->update([
            'status' => 'ACKNOWLEDGED',
            'acknowledged_at' => $acknowledgedAt,
        ]);

        $alert->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Alert berhasil di-acknowledge.',
            'data' => $alert,
        ]);
    }
}
