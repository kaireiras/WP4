<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApRegistryRequest;
use App\Http\Requests\UpdateApRegistryRequest;
use App\Models\ApRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ApRegistryController extends Controller
{
    /**
     * Menampilkan daftar semua AP beserta status koneksi terakhir.
     * Endpoint: GET /api/v1/admin/ap
     */
    public function index(): JsonResponse
    {
        $aps = ApRegistry::all();
        $latestPolls = $this->getLatestPollMap($aps->pluck('ap_id')->all());

        $data = $aps->map(function (ApRegistry $ap) use ($latestPolls) {
            $poll = $latestPolls[$ap->ap_id] ?? null;

            return [
                'ap_id' => $ap->ap_id,
                'ip_address' => $ap->ip_address,
                'snmp_community' => $ap->snmp_community,
                'connection_status' => $this->resolveConnectionStatus($poll),
                'poll_ok' => $poll ? (bool) $poll->poll_ok : null,
                'last_poll_at' => $poll?->ts,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Daftar Access Point berhasil diambil.',
            'data' => $data,
        ]);
    }

    /**
     * Menambahkan AP baru.
     * Endpoint: POST /api/v1/admin/ap
     */
    public function store(StoreApRegistryRequest $request): JsonResponse
    {
        $ap = ApRegistry::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Access Point berhasil ditambahkan.',
            'data' => $ap,
        ], 201);
    }

    /**
     * Menampilkan detail satu AP beserta status koneksi terakhir.
     * Endpoint: GET /api/v1/admin/ap/{ap_id}
     */
    public function show(string $apId): JsonResponse
    {
        $ap = ApRegistry::find($apId);

        if (!$ap) {
            return response()->json([
                'success' => false,
                'message' => 'Access Point tidak ditemukan.',
            ], 404);
        }

        $poll = $this->getLatestPollMap([$ap->ap_id])[$ap->ap_id] ?? null;

        return response()->json([
            'success' => true,
            'message' => 'Detail Access Point berhasil diambil.',
            'data' => [
                'ap_id' => $ap->ap_id,
                'ip_address' => $ap->ip_address,
                'snmp_community' => $ap->snmp_community,
                'connection_status' => $this->resolveConnectionStatus($poll),
                'poll_ok' => $poll ? (bool) $poll->poll_ok : null,
                'last_poll_at' => $poll?->ts,
            ],
        ]);
    }

    /**
     * Memeriksa status konektivitas Access Point (berdasarkan poll_log terakhir dan probe SNMP).
     * Endpoint: GET /api/v1/admin/ap/{ap_id}/status
     */
    public function checkStatus(string $apId): JsonResponse
    {
        $ap = ApRegistry::find($apId);

        if (!$ap) {
            return response()->json([
                'success' => false,
                'message' => 'Access Point tidak ditemukan.',
            ], 404);
        }

        $poll = $this->getLatestPollMap([$ap->ap_id])[$ap->ap_id] ?? null;
        $snmpReachable = $this->probeSnmpPort($ap->ip_address, $ap->snmp_community);
        $connectionStatus = $snmpReachable === true
            ? 'ONLINE'
            : $this->resolveConnectionStatus($poll);

        return response()->json([
            'success' => true,
            'message' => 'Status konektivitas Access Point berhasil diperiksa.',
            'data' => [
                'ap_id' => $ap->ap_id,
                'ip_address' => $ap->ip_address,
                'connection_status' => $connectionStatus,
                'poll_ok' => $poll ? (bool) $poll->poll_ok : null,
                'last_poll_at' => $poll?->ts,
                'n_clients' => $poll ? (int) $poll->n_clients : null,
                'snmp_probe_ok' => $snmpReachable,
            ],
        ]);
    }

    /**
     * Memperbarui data AP.
     * Endpoint: PUT/PATCH /api/v1/admin/ap/{ap_id}
     */
    public function update(UpdateApRegistryRequest $request, string $apId): JsonResponse
    {
        $ap = ApRegistry::find($apId);

        if (!$ap) {
            return response()->json([
                'success' => false,
                'message' => 'Access Point tidak ditemukan.',
            ], 404);
        }

        $ap->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Data Access Point berhasil diperbarui.',
            'data' => $ap,
        ]);
    }

    /**
     * Menghapus AP dari daftar monitoring.
     * Endpoint: DELETE /api/v1/admin/ap/{ap_id}
     */
    public function destroy(string $apId): JsonResponse
    {
        $ap = ApRegistry::find($apId);

        if (!$ap) {
            return response()->json([
                'success' => false,
                'message' => 'Access Point tidak ditemukan.',
            ], 404);
        }

        $ap->delete();

        return response()->json([
            'success' => true,
            'message' => 'Access Point berhasil dihapus dari pemantauan.',
        ]);
    }

    /**
     * Ambil polling terakhir untuk daftar ap_id dari poll_log.
     *
     * @param array<int, string> $apIds
     * @return array<string, object>
     */
    private function getLatestPollMap(array $apIds): array
    {
        if (empty($apIds) || ! Schema::hasTable('poll_log')) {
            return [];
        }

        $rows = DB::table('poll_log as pl1')
            ->join(
                DB::raw('(SELECT ap_id, MAX(ts) as max_ts FROM poll_log GROUP BY ap_id) as pl2'),
                function ($join) {
                    $join->on('pl1.ap_id', '=', 'pl2.ap_id')
                        ->on('pl1.ts', '=', 'pl2.max_ts');
                }
            )
            ->whereIn('pl1.ap_id', $apIds)
            ->select('pl1.ap_id', 'pl1.ts', 'pl1.n_clients', 'pl1.poll_ok')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[$row->ap_id] = $row;
        }

        return $map;
    }

    private function resolveConnectionStatus(?object $poll): string
    {
        if (! $poll) {
            return 'UNKNOWN';
        }

        return ((bool) $poll->poll_ok) ? 'ONLINE' : 'OFFLINE';
    }

    /**
     * Uji konektivitas ringan ke port SNMP (UDP 161) bila ekstensi SNMP tersedia.
     */
    private function probeSnmpPort(string $ipAddress, string $community): ?bool
    {
        if (function_exists('snmp2_get')) {
            $result = @snmp2_get($ipAddress, $community, '1.3.6.1.2.1.1.3.0', 1000000, 1);
            return $result !== false;
        }

        return null;
    }
}