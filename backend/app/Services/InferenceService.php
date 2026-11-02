<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\CrowdedAlert;
use App\Events\OccupancyUpdated;
use App\Models\Alert;
use App\Models\ApRoom;
use App\Models\ModelVersion;
use App\Models\OccupancyPrediction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InferenceService
{
    public function processAp(string $apId): ?OccupancyPrediction
    {
        // 1. Ambil baris poll_log terbaru untuk AP ini
        $latestPoll = DB::table('poll_log')
            ->where('ap_id', $apId)
            ->orderBy('ts', 'desc')
            ->first();

        // Dokumen MVP: Hanya memanggil saat poll_ok = TRUE
        if (!$latestPoll || !(bool) $latestPoll->poll_ok) {
            return null;
        }

        // 2. Ambil room_id dari tabel ap_rooms
        $apRoom = ApRoom::where('ap_id', $apId)->first();
        $roomId = $apRoom ? $apRoom->room_id : 'UNKNOWN';

        // 3. Ambil model_version_id yang sedang aktif
        $activeModel = ModelVersion::where('is_active', true)->first();
        $modelVersionId = $activeModel ? $activeModel->id : 1;

        // 4. Hitung agregasi metrik trafik dari client_snapshot untuk timestamp ini
        $traffic = DB::table('client_snapshot')
            ->where('ap_id', $apId)
            ->where('ts', $latestPoll->ts)
            ->select([
                DB::raw('COALESCE(SUM(rx_bytes), 0) as total_rx_bytes'),
                DB::raw('COALESCE(SUM(tx_bytes), 0) as total_tx_bytes'),
                DB::raw('COALESCE(SUM(rx_packets), 0) as total_rx_packets'),
                DB::raw('COALESCE(SUM(tx_packets), 0) as total_tx_packets'),
                DB::raw('COALESCE(AVG(snr_db), 0) as avg_snr'),
                DB::raw('COUNT(DISTINCT mac_hash) as active_devices'),
            ])
            ->first();

        // Panggil Service Machine Learning WP-3
        $mlUrl = config('services.ml.url', 'http://127.0.0.1:8001/predict');

        try {
            // Kirim payload lengkap: identitas AP, n_clients, serta metrik trafik RX/TX
            $response = Http::timeout(3)->post($mlUrl, [
                'ap_id'            => $apId,
                'room_id'          => $roomId,
                'ts'               => (string) $latestPoll->ts,
                'n_clients'        => (int) $latestPoll->n_clients,
                'total_rx_bytes'   => (int) ($traffic->total_rx_bytes ?? 0),
                'total_tx_bytes'   => (int) ($traffic->total_tx_bytes ?? 0),
                'total_rx_packets' => (int) ($traffic->total_rx_packets ?? 0),
                'total_tx_packets' => (int) ($traffic->total_tx_packets ?? 0),
                'avg_snr'          => round((float) ($traffic->avg_snr ?? 0), 2),
            ]);

            if ($response->successful()) {
                $mlResult = $response->json();
            } else {
                throw new \Exception("Status dari ML Service: " . $response->status());
            }
        } catch (\Throwable $e) {
            Log::warning("Gagal memanggil model ML untuk AP {$apId}: " . $e->getMessage());

            // Mocking / Fallback jika service WP-3 belum aktif atau timeout
            $clientCount = (int) $latestPoll->n_clients;
            $level = $clientCount >= 20 ? 'CROWDED' : ($clientCount >= 10 ? 'HIGH' : ($clientCount >= 5 ? 'MEDIUM' : 'LOW'));
            $mlResult = [
                'estimated_count' => (int) round($clientCount * 1.1),
                'level'           => $level,
                'confidence'      => 0.88,
            ];
        }

        // 5. Cek status prediksi sebelumnya untuk ruangan ini (Cek Transisi CROWDED)
        $previousPrediction = OccupancyPrediction::where('room_id', $roomId)
            ->orderBy('ts', 'desc')
            ->first();

        $previousLevel = $previousPrediction ? $previousPrediction->level : null;
        $currentLevel = $mlResult['level'];

        // 6. Simpan hasil prediksi ke occupancy_predictions
        $prediction = OccupancyPrediction::create([
            'ts' => $latestPoll->ts ?? now(),
            'ap_id' => $apId,
            'room_id' => $roomId,
            'estimated_count' => $mlResult['estimated_count'],
            'level' => $currentLevel,
            'confidence' => $mlResult['confidence'],
            'model_version_id' => $modelVersionId,
        ]);

        // Broadcast event OccupancyUpdated untuk memperbarui dashboard
        broadcast(new OccupancyUpdated($prediction));

        // 7. Logika Alert: HANYA saat transisi masuk CROWDED (bukan tiap siklus jika sudah CROWDED)
        if ($currentLevel === 'CROWDED' && $previousLevel !== 'CROWDED') {
            $alert = Alert::create([
                'triggered_at' => now(),
                'ap_id' => $apId,
                'room_id' => $roomId,
                'level' => 'CROWDED',
                'estimated_count' => $mlResult['estimated_count'],
                'status' => 'ACTIVE',
            ]);

            // Broadcast event CrowdedAlert ke metrics.live
            broadcast(new CrowdedAlert($alert));
        }

        return $prediction;
    }
}