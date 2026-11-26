<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RoomGroupingMergeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('alerts');
        Schema::dropIfExists('client_snapshot');
        Schema::dropIfExists('poll_log');
        Schema::dropIfExists('occupancy_predictions');
        Schema::dropIfExists('ap_rooms');

        Schema::create('ap_rooms', function (Blueprint $table) {
            $table->string('ap_id')->primary();
            $table->string('room_id');
        });

        Schema::create('occupancy_predictions', function (Blueprint $table) {
            $table->id();
            $table->dateTime('ts');
            $table->string('ap_id');
            $table->string('room_id');
            $table->integer('estimated_count');
            $table->string('level');
            $table->float('confidence');
            $table->integer('model_version_id')->default(1);
        });

        Schema::create('poll_log', function (Blueprint $table) {
            $table->id();
            $table->dateTime('ts');
            $table->string('ap_id');
            $table->integer('n_clients');
            $table->boolean('poll_ok')->default(true);
        });

        Schema::create('client_snapshot', function (Blueprint $table) {
            $table->id();
            $table->dateTime('ts');
            $table->string('ap_id');
            $table->string('mac_hash');
            $table->bigInteger('rx_bytes');
            $table->bigInteger('tx_bytes');
            $table->bigInteger('rx_packets');
            $table->bigInteger('tx_packets');
            $table->float('snr_db')->default(30.0);
        });

        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->dateTime('triggered_at');
            $table->string('ap_id');
            $table->string('room_id');
            $table->string('level');
            $table->integer('estimated_count');
            $table->string('status');
            $table->dateTime('acknowledged_at')->nullable();
        });
    }

    public function test_dashboard_overview_groups_aps_by_room_name_after_dash_and_merges_data(): void
    {
        $ts = '2026-11-26 14:00:00';

        DB::table('ap_rooms')->insert([
            ['ap_id' => 'AP1-CU205', 'room_id' => 'AP1-CU205'],
            ['ap_id' => 'AP2-CU205', 'room_id' => 'AP2-CU205'],
            ['ap_id' => 'AP1-CU206', 'room_id' => 'CU206'],
        ]);

        DB::table('occupancy_predictions')->insert([
            ['ts' => $ts, 'ap_id' => 'AP1-CU205', 'room_id' => 'AP1-CU205', 'estimated_count' => 12, 'level' => 'HIGH', 'confidence' => 0.80],
            ['ts' => $ts, 'ap_id' => 'AP2-CU205', 'room_id' => 'AP2-CU205', 'estimated_count' => 18, 'level' => 'CROWDED', 'confidence' => 0.90],
            ['ts' => $ts, 'ap_id' => 'AP1-CU206', 'room_id' => 'CU206', 'estimated_count' => 4, 'level' => 'LOW', 'confidence' => 0.95],
        ]);

        DB::table('alerts')->insert([
            ['triggered_at' => $ts, 'ap_id' => 'AP1-CU205', 'room_id' => 'AP1-CU205', 'level' => 'HIGH', 'estimated_count' => 12, 'status' => 'ACTIVE'],
            ['triggered_at' => $ts, 'ap_id' => 'AP2-CU205', 'room_id' => 'AP2-CU205', 'level' => 'CROWDED', 'estimated_count' => 18, 'status' => 'ACTIVE'],
        ]);

        $response = $this->getJson('/api/v1/dashboard/overview');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.rooms')
            ->assertJsonCount(1, 'data.active_alerts');

        $rooms = collect($response->json('data.rooms'))->keyBy('room_id');
        $cu205 = $rooms->get('CU205');

        $this->assertNotNull($cu205);
        $this->assertSame('AP1-CU205, AP2-CU205', $cu205['ap_id']);
        $this->assertSame(['AP1-CU205', 'AP2-CU205'], $cu205['ap_ids']);
        $this->assertSame(30, $cu205['estimated_count']);
        $this->assertSame('CROWDED', $cu205['level']);
        $this->assertEquals(0.85, $cu205['confidence']);

        $alert = $response->json('data.active_alerts.0');
        $this->assertSame('CU205', $alert['room_id']);
        $this->assertSame('AP1-CU205, AP2-CU205', $alert['ap_id']);
        $this->assertSame(30, $alert['estimated_count']);
        $this->assertSame('CROWDED', $alert['level']);
    }

    public function test_room_live_detail_merges_traffic_and_clients_for_same_room_aps(): void
    {
        $ts = '2026-11-26 14:00:00';

        DB::table('ap_rooms')->insert([
            ['ap_id' => 'AP1-CU205', 'room_id' => 'CU205'],
            ['ap_id' => 'AP2-CU205', 'room_id' => 'CU205'],
        ]);

        DB::table('occupancy_predictions')->insert([
            ['ts' => $ts, 'ap_id' => 'AP1-CU205', 'room_id' => 'CU205', 'estimated_count' => 10, 'level' => 'HIGH', 'confidence' => 0.80],
            ['ts' => $ts, 'ap_id' => 'AP2-CU205', 'room_id' => 'CU205', 'estimated_count' => 15, 'level' => 'CROWDED', 'confidence' => 0.90],
        ]);

        DB::table('poll_log')->insert([
            ['ts' => $ts, 'ap_id' => 'AP1-CU205', 'n_clients' => 9],
            ['ts' => $ts, 'ap_id' => 'AP2-CU205', 'n_clients' => 14],
        ]);

        // 15360 bytes / 1024 / 15 = 1.0 KB/s per AP -> combined 2.0 KB/s
        DB::table('client_snapshot')->insert([
            ['ts' => $ts, 'ap_id' => 'AP1-CU205', 'mac_hash' => 'mac1', 'rx_bytes' => 15360, 'tx_bytes' => 30720, 'rx_packets' => 150, 'tx_packets' => 150],
            ['ts' => $ts, 'ap_id' => 'AP2-CU205', 'mac_hash' => 'mac2', 'rx_bytes' => 15360, 'tx_bytes' => 15360, 'rx_packets' => 75, 'tx_packets' => 75],
        ]);

        $response = $this->getJson('/api/v1/rooms/CU205/live');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.room_id', 'CU205')
            ->assertJsonPath('data.ap_id', 'AP1-CU205, AP2-CU205')
            ->assertJsonPath('data.level', 'CROWDED')
            ->assertJsonPath('data.estimated_count', 25)
            ->assertJsonPath('data.accuracy_percent', 85)
            ->assertJsonPath('data.metrics.rx_rate_raw_kbs', 2)
            ->assertJsonPath('data.metrics.tx_rate_raw_kbs', 3)
            ->assertJsonPath('data.metrics.packets_per_sec', 30)
            ->assertJsonPath('data.metrics.flow_count', 2)
            ->assertJsonPath('data.metrics.active_clients', 23);
    }

    public function test_history_chart_merges_same_room_aps_at_same_timestamp(): void
    {
        $ts1 = '2026-11-26 14:00:00';
        $ts2 = '2026-11-26 14:00:15';

        DB::table('occupancy_predictions')->insert([
            ['ts' => $ts1, 'ap_id' => 'AP1-CU205', 'room_id' => 'AP1-CU205', 'estimated_count' => 5, 'level' => 'MEDIUM', 'confidence' => 0.80],
            ['ts' => $ts1, 'ap_id' => 'AP2-CU205', 'room_id' => 'AP2-CU205', 'estimated_count' => 7, 'level' => 'HIGH', 'confidence' => 0.90],
            ['ts' => $ts2, 'ap_id' => 'AP1-CU205', 'room_id' => 'AP1-CU205', 'estimated_count' => 8, 'level' => 'HIGH', 'confidence' => 0.85],
            ['ts' => $ts1, 'ap_id' => 'AP1-CU206', 'room_id' => 'CU206', 'estimated_count' => 3, 'level' => 'LOW', 'confidence' => 0.95],
        ]);

        DB::table('poll_log')->insert([
            ['ts' => $ts1, 'ap_id' => 'AP1-CU205', 'n_clients' => 4],
            ['ts' => $ts1, 'ap_id' => 'AP2-CU205', 'n_clients' => 6],
            ['ts' => $ts2, 'ap_id' => 'AP1-CU205', 'n_clients' => 7],
        ]);

        DB::table('client_snapshot')->insert([
            ['ts' => $ts1, 'ap_id' => 'AP1-CU205', 'mac_hash' => 'm1', 'rx_bytes' => 15360, 'tx_bytes' => 30720, 'rx_packets' => 10, 'tx_packets' => 10],
            ['ts' => $ts1, 'ap_id' => 'AP2-CU205', 'mac_hash' => 'm2', 'rx_bytes' => 30720, 'tx_bytes' => 15360, 'rx_packets' => 10, 'tx_packets' => 10],
            ['ts' => $ts2, 'ap_id' => 'AP1-CU205', 'mac_hash' => 'm1', 'rx_bytes' => 15360, 'tx_bytes' => 15360, 'rx_packets' => 10, 'tx_packets' => 10],
        ]);

        $response = $this->getJson('/api/v1/grafik?room_id=CU205');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data');

        $firstPoint = $response->json('data.0');
        $this->assertSame($ts1, $firstPoint['ts']);
        $this->assertSame('CU205', $firstPoint['room_id']);
        $this->assertEquals(12, $firstPoint['estimated_count']);
        $this->assertEquals(10, $firstPoint['n_clients']);
        $this->assertEquals(3.0, $firstPoint['rx_rate']);
        $this->assertEquals(3.0, $firstPoint['tx_rate']);
        $this->assertSame('HIGH', $firstPoint['level']);
    }

    public function test_alerts_index_merges_same_room_and_acknowledge_updates_group(): void
    {
        $ts1 = '2026-11-26 14:00:00';
        $ts2 = '2026-11-26 14:05:00';

        $id1 = DB::table('alerts')->insertGetId([
            'triggered_at' => $ts1,
            'ap_id' => 'AP1-CU205',
            'room_id' => 'AP1-CU205',
            'level' => 'HIGH',
            'estimated_count' => 12,
            'status' => 'ACTIVE',
        ]);
        $id2 = DB::table('alerts')->insertGetId([
            'triggered_at' => $ts1,
            'ap_id' => 'AP2-CU205',
            'room_id' => 'AP2-CU205',
            'level' => 'CROWDED',
            'estimated_count' => 20,
            'status' => 'ACTIVE',
        ]);
        DB::table('alerts')->insert([
            'triggered_at' => $ts2,
            'ap_id' => 'AP1-CU205',
            'room_id' => 'AP1-CU205',
            'level' => 'CROWDED',
            'estimated_count' => 22,
            'status' => 'ACTIVE',
        ]);

        $indexResponse = $this->getJson('/api/v1/alerts?status=ACTIVE');
        $indexResponse->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.room_id', 'CU205')
            ->assertJsonPath('data.1.room_id', 'CU205')
            ->assertJsonPath('data.1.estimated_count', 32);

        $ackResponse = $this->patchJson("/api/v1/alerts/{$id1}/ack");
        $ackResponse->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('alerts', ['id' => $id1, 'status' => 'ACKNOWLEDGED']);
        $this->assertDatabaseHas('alerts', ['id' => $id2, 'status' => 'ACKNOWLEDGED']);
    }
}
