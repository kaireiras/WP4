<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Events\CrowdedAlert;
use App\Events\OccupancyUpdated;
use App\Models\Alert;
use App\Models\ApRegistry;
use App\Models\OccupancyPrediction;
use App\Services\OccupancyClassifier;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Modul 2 MVP — Crowd Detection & Alert (TANPA Machine Learning).
 *
 * Mengelompokkan seluruh AP terdaftar berdasarkan ruangan (suffix setelah "-"),
 * menjumlahkan n_clients per ruangan, lalu mengklasifikasikan status ruangan
 * menjadi LOW / MEDIUM / HIGH / CROWDED / UNKNOWN.
 *
 * Dijadwalkan setiap 15 detik (seirama polling SNMP) lewat routes/console.php.
 */
class RunOccupancyClassification extends Command
{
    protected $signature = 'occupancy:run
                             {--ap= : Proses ruangan dari AP tertentu (opsional, untuk pengujian)}';

    protected $description = 'Klasifikasi okupansi per ruangan berdasarkan total n_clients seluruh AP di ruangan tersebut';

    public function __construct(private readonly OccupancyClassifier $classifier)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $aps = ApRegistry::all();

        if ($aps->isEmpty()) {
            $this->warn('Tidak ada AP terdaftar di ap_registry.');
            return Command::SUCCESS;
        }

        $targetRoom = null;
        if ($this->option('ap')) {
            $targetRoom = $this->classifier->extractRoomId((string) $this->option('ap'));
        }

        $groupedByRoom = $aps->groupBy(
            fn (ApRegistry $ap) => $this->classifier->extractRoomId((string) $ap->ap_id)
        );

        if ($targetRoom !== null) {
            $groupedByRoom = $groupedByRoom->filter(
                fn (Collection $roomAps, string $roomId) => strcasecmp($roomId, $targetRoom) === 0
            );
        }

        if ($groupedByRoom->isEmpty()) {
            $this->warn('Tidak ada AP/ruangan yang cocok untuk diproses.');
            return Command::SUCCESS;
        }

        $processed = 0;
        $failed = 0;

        foreach ($groupedByRoom as $roomId => $roomAps) {
            try {
                $this->processRoom((string) $roomId, $roomAps);
                $processed++;
            } catch (\Throwable $e) {
                $failed++;
                Log::error("Occupancy gagal diproses untuk ruangan {$roomId}: " . $e->getMessage());
                $this->error("Ruangan {$roomId} gagal diproses: {$e->getMessage()}");
            }
        }

        $this->info("Putaran selesai: {$processed} ruangan diproses, {$failed} gagal.");
        return Command::SUCCESS;
    }

    /**
     * @param  Collection<int, ApRegistry>  $roomAps
     */
    private function processRoom(string $roomId, Collection $roomAps): void
    {
        $latestPolls = [];

        foreach ($roomAps as $ap) {
            $latestPoll = DB::table('poll_log')
                ->where('ap_id', $ap->ap_id)
                ->orderByDesc('ts')
                ->first();

            $latestVapTs = DB::table('vap_snapshot')
                ->where('ap_id', $ap->ap_id)
                ->where('vap_up', 1)
                ->max('ts');

            if ($latestVapTs) {
                $vapClients = (int) DB::table('vap_snapshot')
                    ->where('ap_id', $ap->ap_id)
                    ->where('ts', $latestVapTs)
                    ->where('vap_up', 1)
                    ->sum('n_clients');

                if (! $latestPoll || (string) $latestVapTs > (string) $latestPoll->ts) {
                    $latestPoll = (object) [
                        'ap_id' => $ap->ap_id,
                        'ts' => $latestVapTs,
                        'n_clients' => $vapClients,
                        'poll_ok' => 1,
                    ];
                } elseif ((bool) $latestPoll->poll_ok && $vapClients > (int) $latestPoll->n_clients) {
                    $latestPoll->n_clients = $vapClients;
                }
            }

            if ($latestPoll) {
                $latestPolls[] = $latestPoll;
            }
        }

        if (empty($latestPolls)) {
            $this->line("Ruangan {$roomId} - Belum ada data polling, dilewati.");
            return;
        }

        // Hitung klasifikasi status berdasarkan total client seluruh AP di ruangan ini
        $roomEval = $this->classifier->evaluateRoom($latestPolls);
        $lastOccupancy = null;
        $hasNewPrediction = false;

        foreach ($latestPolls as $poll) {
            $apId = (string) $poll->ap_id;
            $apCount = ((bool) $poll->poll_ok && $poll->n_clients !== null)
                ? max(0, (int) $poll->n_clients)
                : 0;

            $existing = OccupancyPrediction::where('ap_id', $apId)
                ->where('ts', $poll->ts)
                ->first();

            if ($existing) {
                if ($existing->level !== $roomEval['level']) {
                    $existing->update(['level' => $roomEval['level']]);
                    $hasNewPrediction = true;
                }
                $lastOccupancy = $existing;
                continue;
            }

            $lastOccupancy = OccupancyPrediction::create([
                'ts' => $poll->ts,
                'ap_id' => $apId,
                'room_id' => $roomId,
                'estimated_count' => $apCount,
                'level' => $roomEval['level'],
                'confidence' => 1.000,
                'model_version_id' => null,
            ]);
            $hasNewPrediction = true;
        }

        if (! $hasNewPrediction) {
            $this->line("Ruangan {$roomId} - Polling terbaru sudah diproses, dilewati.");
            return;
        }

        $apIdsLabel = implode(', ', array_map(fn ($p) => (string) $p->ap_id, $latestPolls));

        // Kelola alert berdasarkan status ruangan gabungan
        if ($roomEval['level'] === OccupancyClassifier::LEVEL_CROWDED) {
            $existingActive = Alert::where('status', 'ACTIVE')
                ->where('level', OccupancyClassifier::LEVEL_CROWDED)
                ->where(function ($q) use ($roomId) {
                    $q->where('room_id', $roomId)
                        ->orWhere('ap_id', $roomId)
                        ->orWhere('ap_id', 'like', '%-' . $roomId);
                })
                ->exists();

            if (! $existingActive) {
                $alert = Alert::create([
                    'triggered_at' => now(),
                    'ap_id' => (string) $latestPolls[0]->ap_id,
                    'room_id' => $roomId,
                    'level' => OccupancyClassifier::LEVEL_CROWDED,
                    'estimated_count' => $roomEval['count'],
                    'status' => 'ACTIVE',
                ]);

                $this->safeBroadcast(new CrowdedAlert($alert));

                Log::info("Alert CROWDED dibuat untuk ruangan {$roomId} ({$apIdsLabel}): {$roomEval['count']} client.");
                $this->warn("Ruangan {$roomId} - CROWDED: {$roomEval['count']} client. Alert dibuat.");
            }
        } elseif ($roomEval['level'] !== OccupancyClassifier::LEVEL_UNKNOWN) {
            Alert::where('status', 'ACTIVE')
                ->where('level', OccupancyClassifier::LEVEL_CROWDED)
                ->where(function ($q) use ($roomId) {
                    $q->where('room_id', $roomId)
                        ->orWhere('ap_id', $roomId)
                        ->orWhere('ap_id', 'like', '%-' . $roomId);
                })
                ->update([
                    'status' => 'RESOLVED',
                    'resolved_at' => now(),
                ]);
        }

        if ($lastOccupancy) {
            $this->safeBroadcast(new OccupancyUpdated($lastOccupancy));
        }

        $this->line("Ruangan {$roomId} ({$apIdsLabel}) - {$roomEval['level']}: {$roomEval['count']} client.");
    }

    /**
     * Broadcast event ke Reverb tanpa menggagalkan penyimpanan klasifikasi/alert jika Reverb sedang mati.
     */
    private function safeBroadcast(object $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $e) {
            Log::warning('Broadcast Reverb dilewati (server tidak terjangkau): ' . $e->getMessage());
        }
    }
}
