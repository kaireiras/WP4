<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ApRegistry;
use App\Services\InferenceService;
use Illuminate\Console\Command;

class RunOccupancyInference extends Command
{
    protected $signature = 'inference:run';
    protected $description = 'Jalankan inferensi ML untuk seluruh AP yang aktif';

    public function handle(InferenceService $inferenceService): int
    {
        $aps = ApRegistry::all();

        foreach ($aps as $ap) {
            $prediction = $inferenceService->processAp($ap->ap_id);

            if ($prediction) {
                $this->info("AP {$ap->ap_id} - Okupansi: {$prediction->estimated_count} ({$prediction->level})");
            } else {
                $this->line("AP {$ap->ap_id} - Dilewati (Poll belum siap / gagal).");
            }
        }

        return Command::SUCCESS;
    }
}