<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MetricRecorded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $apId,
        public int $nClients,
        public bool $pollOk,
        public string $timestamp
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('metrics.live'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MetricRecorded';
    }
}