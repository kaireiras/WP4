<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\OccupancyClassifier;
use PHPUnit\Framework\TestCase;

class OccupancyClassifierTest extends TestCase
{
    private OccupancyClassifier $classifier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->classifier = new OccupancyClassifier();
    }

    public function test_classify_returns_expected_levels(): void
    {
        $this->assertSame(OccupancyClassifier::LEVEL_LOW, $this->classifier->classify(0));
        $this->assertSame(OccupancyClassifier::LEVEL_LOW, $this->classifier->classify(10));
        $this->assertSame(OccupancyClassifier::LEVEL_MEDIUM, $this->classifier->classify(11));
        $this->assertSame(OccupancyClassifier::LEVEL_MEDIUM, $this->classifier->classify(25));
        $this->assertSame(OccupancyClassifier::LEVEL_HIGH, $this->classifier->classify(26));
        $this->assertSame(OccupancyClassifier::LEVEL_HIGH, $this->classifier->classify(40));
        $this->assertSame(OccupancyClassifier::LEVEL_CROWDED, $this->classifier->classify(41));
        $this->assertSame(OccupancyClassifier::LEVEL_CROWDED, $this->classifier->classify(120));
    }

    public function test_evaluate_returns_unknown_when_poll_failed_or_null(): void
    {
        $failedPoll = $this->classifier->evaluate(50, false);
        $this->assertSame([
            'level' => OccupancyClassifier::LEVEL_UNKNOWN,
            'count' => 0,
        ], $failedPoll);

        $nullClients = $this->classifier->evaluate(null, true);
        $this->assertSame([
            'level' => OccupancyClassifier::LEVEL_UNKNOWN,
            'count' => 0,
        ], $nullClients);
    }

    public function test_evaluate_returns_classified_level_when_poll_ok(): void
    {
        $result = $this->classifier->evaluate(45, true);

        $this->assertSame([
            'level' => OccupancyClassifier::LEVEL_CROWDED,
            'count' => 45,
        ], $result);
    }

    public function test_evaluate_room_and_evaluate_by_rooms_aggregate_multiple_aps(): void
    {
        $this->assertSame('CU205', $this->classifier->extractRoomId('AP1-CU205'));
        $this->assertSame('CU205', $this->classifier->extractRoomId('AP2-CU205'));

        $grouped = $this->classifier->evaluateByRooms([
            ['ap_id' => 'AP1-CU205', 'n_clients' => 22, 'poll_ok' => true, 'ts' => '2026-11-26 15:00:00'],
            ['ap_id' => 'AP2-CU205', 'n_clients' => 23, 'poll_ok' => true, 'ts' => '2026-11-26 15:00:00'],
            ['ap_id' => 'AP1-CU206', 'n_clients' => 8, 'poll_ok' => true, 'ts' => '2026-11-26 15:00:00'],
        ]);

        // Masing-masing AP di CU205 (22 dan 23) adalah MEDIUM, tetapi gabungan ruangan = 45 -> CROWDED
        $this->assertSame(OccupancyClassifier::LEVEL_CROWDED, $grouped['CU205']['level']);
        $this->assertSame(45, $grouped['CU205']['count']);
        $this->assertSame(['AP1-CU205', 'AP2-CU205'], $grouped['CU205']['ap_ids']);
        $this->assertSame(OccupancyClassifier::LEVEL_LOW, $grouped['CU206']['level']);
        $this->assertSame(8, $grouped['CU206']['count']);
    }
}
