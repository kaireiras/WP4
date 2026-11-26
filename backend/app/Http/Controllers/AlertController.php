<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Alert;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AlertController extends Controller
{
    /**
     * Mengambil daftar alert terkini dengan filter status, AP, ruangan, dan rentang waktu.
     * Alert dari beberapa AP di ruangan yang sama pada waktu yang sama digabungkan.
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
            $query->where(function ($q) use ($roomId) {
                $q->where('room_id', $roomId)
                    ->orWhere('ap_id', $roomId)
                    ->orWhere('ap_id', 'like', '%-' . $roomId);
            });
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

        $alerts = $query->limit($limit * 3)->get()
            ->groupBy(function ($alert) {
                $extractedRoom = $this->extractRoomId((string) ($alert->room_id ?: $alert->ap_id));
                $timeBucket = substr((string) $alert->triggered_at, 0, 16);

                return "{$extractedRoom}|{$alert->status}|{$timeBucket}";
            })
            ->map(function ($group) {
                $primary = $group->first();
                $uniqueByAp = $group->unique('ap_id');
                $extractedRoom = $this->extractRoomId((string) ($primary->room_id ?: $primary->ap_id));

                return [
                    'id'              => $primary->id,
                    'triggered_at'    => $primary->triggered_at,
                    'resolved_at'     => $group->max('resolved_at'),
                    'acknowledged_at' => $group->max('acknowledged_at'),
                    'ap_id'           => implode(', ', $uniqueByAp->pluck('ap_id')->values()->all()),
                    'room_id'         => $extractedRoom,
                    'level'           => $primary->level,
                    'estimated_count' => (int) $uniqueByAp->sum('estimated_count'),
                    'status'          => $primary->status,
                ];
            })
            ->take($limit)
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Daftar alert berhasil diambil.',
            'data' => $alerts,
        ]);
    }

    /**
     * Konfirmasi / Acknowledge alert yang aktif (termasuk seluruh AP di ruangan yang sama).
     */
    public function acknowledge(int $id): JsonResponse
    {
        $alert = Alert::find($id);

        if (! $alert) {
            return response()->json([
                'success' => false,
                'message' => 'Data alert tidak ditemukan.',
            ], 404);
        }

        $now = now();
        $roomId = $this->extractRoomId((string) ($alert->room_id ?: $alert->ap_id));

        $alert->update([
            'status' => 'ACKNOWLEDGED',
            'acknowledged_at' => $now,
        ]);

        Alert::where('status', 'ACTIVE')
            ->where(function ($q) use ($roomId) {
                $q->where('room_id', $roomId)
                    ->orWhere('ap_id', $roomId)
                    ->orWhere('ap_id', 'like', '%-' . $roomId);
            })
            ->update([
                'status' => 'ACKNOWLEDGED',
                'acknowledged_at' => $now,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Alert berhasil di-acknowledge.',
            'data' => $alert->fresh(),
        ]);
    }

    private function extractRoomId(string $apId): string
    {
        return str_contains($apId, '-')
            ? Str::afterLast($apId, '-')
            : $apId;
    }
}
