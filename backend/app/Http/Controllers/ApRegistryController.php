<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApRegistryRequest;
use App\Http\Requests\UpdateApRegistryRequest;
use App\Models\ApRegistry;
use Illuminate\Http\JsonResponse;

class ApRegistryController extends Controller
{
    /**
     * Menampilkan daftar semua AP.
     * Endpoint: GET /api/v1/admin/ap
     */
    public function index(): JsonResponse
    {
        $aps = ApRegistry::all();

        return response()->json([
            'success' => true,
            'message' => 'Daftar Access Point berhasil diambil.',
            'data' => $aps,
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
     * Menampilkan detail satu AP.
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

        return response()->json([
            'success' => true,
            'message' => 'Detail Access Point berhasil diambil.',
            'data' => $ap,
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
}