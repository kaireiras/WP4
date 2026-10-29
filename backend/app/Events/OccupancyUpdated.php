<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\OccupancyPrediction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OccupancyUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public OccupancyPrediction $prediction
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('metrics.live'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'OccupancyUpdated';
    }
}