<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Events\CrowdedAlert;
use App\Events\OccupancyUpdated;
use App\Models\Alert;
use App\Models\ApRegistry;
use App\Models\ApRoom;
use App\Models\OccupancyPrediction;
use App\Services\OccupancyClassifier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Modul 2 MVP — Crowd Detection & Alert (TANPA Machine Learning).
 *
 * Untuk setiap AP terdaftar:
 *   1. Ambil polling terakhir dari poll_log (termasuk polling yang GAGAL).
 *   2. Klasifikasikan n_clients menjadi LOW/MEDIUM/HIGH/CROWDED (if-else).
 *      poll_ok = FALSE -> level UNKNOWN (bukan LOW), sesuai dokumen MVP.
 *   3. Simpan hasil ke occupancy_predictions.
 *   4. Buat alert bila level CROWDED (> 40 client) dan belum ada alert ACTIVE
 *      untuk AP tersebut.
 *   5. Broadcast event OccupancyUpdated / CrowdedAlert ke kanal metrics.live.
 *
 * Dijadwalkan setiap 15 detik (seirama polling SNMP) lewat routes/console.php.
 */
class RunOccupancyClassification extends Command
{
    protected $signature = 'occupancy:run
                             {--ap= : Proses satu AP saja (opsional, untuk pengujian)}';

    protected $description = 'Klasifikasi okupansi seluruh AP berdasarkan n_clients (MVP tanpa ML)';

    public function __construct(private readonly OccupancyClassifier $classifier)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $aps = ApRegistry::query()
            ->when($this->option('ap'), fn ($query, $apId) => $query->where('ap_id', $apId))
            ->get();

        if ($aps->isEmpty()) {
            $this->warn('Tidak ada AP terdaftar di ap_registry.');
            return Command::SUCCESS;
        }

        $processed = 0;
        $failed = 0;

        foreach ($aps as $ap) {
            try {
                $this->processAp((string) $ap->ap_id);
                $processed++;
            } catch (\Throwable $e) {
                $failed++;
                Log::error("Occupancy gagal diproses untuk AP {$ap->ap_id}: " . $e->getMessage());
                $this->error("AP {$ap->ap_id} gagal diproses: {$e->getMessage()}");
            }
        }

        $this->info("Putaran selesai: {$processed} AP diproses, {$failed} gagal.");
        return Command::SUCCESS;
    }

    private function processAp(string $apId): void
    {
        // 1. Polling terakhir AP ini (termasuk polling gagal: poll_ok = 0).
        $latestPoll = DB::table('poll_log')
            ->where('ap_id', $apId)
            ->orderByDesc('ts')
            ->first();

        if (! $latestPoll) {
            $this->line("AP {$apId} - Belum ada data polling, dilewati.");
            return;
        }

        $pollOk = (bool) $latestPoll->poll_ok;

        // 2. Klasifikasi kepadatan (if-else, tanpa ML).
        $result = $this->classifier->evaluate(
            $latestPoll->n_clients !== null ? (int) $latestPoll->n_clients : null,
            $pollOk
        );

        $apRoom = ApRoom::where('ap_id', $apId)->first();
        $roomId = $apRoom?->room_id;

        // Jika polling dengan ts ini sudah diproses sebelumnya, lewati
        // (jadwal 15 detik bisa berjalan lebih cepat daripada datangnya polling baru).
        $alreadyProcessed = OccupancyPrediction::where('ap_id', $apId)
            ->where('ts', $latestPoll->ts)
            ->exists();

        if ($alreadyProcessed) {
            $this->line("AP {$apId} - Polling ts {$latestPoll->ts} sudah diproses, dilewati.");
            return;
        }

        // 3. Simpan hasil klasifikasi ke occupancy_predictions.
        //    Tanpa ML: confidence diisi 1.000 (tidak bermakna lagi) dan
        //    model_version_id NULL (FK dilepas oleh migrasi adaptasi MVP).
        $occupancy = OccupancyPrediction::create([
            'ts' => $latestPoll->ts,
            'ap_id' => $apId,
            'room_id' => $roomId,
            'estimated_count' => $result['count'],
            'level' => $result['level'],
            'confidence' => 1.000,
            'model_version_id' => null,
        ]);

        // 4. Alert bila CROWDED (> 40 client) dan belum ada alert ACTIVE untuk AP ini.
        if ($result['level'] === OccupancyClassifier::LEVEL_CROWDED) {
            $existingActive = Alert::where('ap_id', $apId)
                ->where('level', OccupancyClassifier::LEVEL_CROWDED)
                ->where('status', 'ACTIVE')
                ->exists();

            if (! $existingActive) {
                $alert = Alert::create([
                    'triggered_at' => now(),
                    'ap_id' => $apId,
                    'room_id' => $roomId,
                    'level' => OccupancyClassifier::LEVEL_CROWDED,
                    'estimated_count' => $result['count'],
                    'status' => 'ACTIVE',
                ]);

                broadcast(new CrowdedAlert($alert));

                Log::info("Alert CROWDED dibuat untuk AP {$apId} (ruangan {$roomId}): {$result['count']} client.");
                $this->warn("AP {$apId} - CROWDED: {$result['count']} client. Alert dibuat.");
            }
        }

        // 5. Broadcast update okupansi ke dashboard (kanal metrics.live).
        broadcast(new OccupancyUpdated($occupancy));

        $this->line("AP {$apId} - {$result['level']}: {$result['count']} client (poll_ok=" . ($pollOk ? 'TRUE' : 'FALSE') . ').');
    }
}
