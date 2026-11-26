<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HistoryGrafikTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamps();
        });

        Schema::create('vap_snapshot', function (Blueprint $table) {
            $table->id();
            $table->dateTime('ts');
            $table->string('ap_id', 32);
            $table->unsignedInteger('vap_up')->default(1);
            $table->integer('n_clients')->default(0);
            $table->unsignedBigInteger('rx_bytes')->default(0);
            $table->unsignedBigInteger('tx_bytes')->default(0);
            $table->unsignedBigInteger('rx_packets')->default(0);
            $table->unsignedBigInteger('tx_packets')->default(0);
            $table->unsignedBigInteger('tx_retries')->default(0);
        });

        Sanctum::actingAs(User::factory()->create());

        // 4 snapshots in the same minute (15s apart) for AP1-CU205 on 2026-11-26 08:00:xx
        DB::table('vap_snapshot')->insert([
            [
                'ts' => '2026-11-26 08:00:00',
                'ap_id' => 'AP1-CU205',
                'vap_up' => 1,
                'n_clients' => 10,
                'rx_bytes' => 15360, // 1 KB/s over 15s
                'tx_bytes' => 30720, // 2 KB/s over 15s
                'rx_packets' => 15,
                'tx_packets' => 30,
                'tx_retries' => 0,
            ],
            [
                'ts' => '2026-11-26 08:00:15',
                'ap_id' => 'AP1-CU205',
                'vap_up' => 1,
                'n_clients' => 10,
                'rx_bytes' => 15360,
                'tx_bytes' => 30720,
                'rx_packets' => 15,
                'tx_packets' => 30,
                'tx_retries' => 0,
            ],
            [
                'ts' => '2026-11-26 08:00:30',
                'ap_id' => 'AP1-CU205',
                'vap_up' => 1,
                'n_clients' => 20,
                'rx_bytes' => 30720, // 2 KB/s over 15s
                'tx_bytes' => 61440, // 4 KB/s over 15s
                'rx_packets' => 30,
                'tx_packets' => 60,
                'tx_retries' => 2,
            ],
            [
                'ts' => '2026-11-26 08:00:45',
                'ap_id' => 'AP1-CU205',
                'vap_up' => 1,
                'n_clients' => 20,
                'rx_bytes' => 30720,
                'tx_bytes' => 61440,
                'rx_packets' => 30,
                'tx_packets' => 60,
                'tx_retries' => 2,
            ],
        ]);
    }

    public function test_grafik_under_1_hour_uses_15s_raw_points(): void
    {
        $response = $this->getJson('/api/v1/grafik?room_id=CU205&range=1h');

        $response->assertOk()
            ->assertJsonPath('filter.interval', '15s')
            ->assertJsonPath('total_pts', 4);
    }

    public function test_grafik_3h_range_uses_30s_buckets(): void
    {
        $response = $this->getJson('/api/v1/grafik?room_id=CU205&range=3h');

        $response->assertOk()
            ->assertJsonPath('filter.interval', '30s')
            ->assertJsonPath('total_pts', 2)
            ->assertJsonPath('data.0.ts', '2026-11-26 08:00:00')
            ->assertJsonPath('data.0.active_clients', 10)
            ->assertJsonPath('data.1.ts', '2026-11-26 08:00:30')
            ->assertJsonPath('data.1.active_clients', 20);
    }

    public function test_grafik_6h_and_today_use_1m_buckets_with_averaged_metrics(): void
    {
        $response = $this->getJson('/api/v1/grafik?room_id=CU205&range=6h');

        $response->assertOk()
            ->assertJsonPath('filter.interval', '1m')
            ->assertJsonPath('total_pts', 1)
            ->assertJsonPath('data.0.ts', '2026-11-26 08:00:00')
            ->assertJsonPath('data.0.active_clients', 15)
            ->assertJsonPath('data.0.rx_rate_kbs', 1.5);
    }

    public function test_grafik_this_month_uses_1d_buckets(): void
    {
        $response = $this->getJson('/api/v1/grafik?room_id=CU205&range=this_month');

        $response->assertOk()
            ->assertJsonPath('filter.interval', '1d')
            ->assertJsonPath('total_pts', 1)
            ->assertJsonPath('data.0.ts', '2026-11-26 00:00:00')
            ->assertJsonPath('data.0.active_clients', 15);
    }

    public function test_grafik_merges_multiple_aps_in_same_room_at_same_timestamp(): void
    {
        DB::table('vap_snapshot')->insert([
            'ts' => '2026-11-26 08:00:00',
            'ap_id' => 'AP2-CU205',
            'vap_up' => 1,
            'n_clients' => 12,
            'rx_bytes' => 15360, // 1 KB/s over 15s
            'tx_bytes' => 30720, // 2 KB/s over 15s
            'rx_packets' => 15,
            'tx_packets' => 30,
            'tx_retries' => 1,
        ]);

        $response = $this->getJson('/api/v1/grafik?room_id=CU205&range=1h');

        $response->assertOk()
            ->assertJsonPath('filter.interval', '15s')
            ->assertJsonPath('total_pts', 4)
            ->assertJsonPath('data.0.ts', '2026-11-26 08:00:00')
            ->assertJsonPath('data.0.room_id', 'CU205')
            ->assertJsonPath('data.0.active_clients', 22)
            ->assertJsonPath('data.0.rx_rate_kbs', 2)
            ->assertJsonPath('data.0.tx_rate_kbs', 4)
            ->assertJsonPath('data.0.tx_retries', 1);
    }
}
