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
}
