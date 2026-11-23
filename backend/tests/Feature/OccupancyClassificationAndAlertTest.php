<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\OccupancyPrediction;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OccupancyClassificationAndAlertTest extends TestCase
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

        Schema::create('ap_registry', function (Blueprint $table) {
            $table->string('ap_id', 32)->primary();
            $table->string('ip_address', 45);
            $table->string('snmp_community', 64);
        });

        Schema::create('poll_log', function (Blueprint $table) {
            $table->id();
            $table->dateTime('ts');
            $table->string('ap_id', 32);
            $table->integer('n_clients');
            $table->boolean('poll_ok');
        });

        Schema::create('occupancy_predictions', function (Blueprint $table) {
            $table->id();
            $table->dateTime('ts');
            $table->string('ap_id', 32);
            $table->string('room_id', 32);
            $table->unsignedInteger('estimated_count')->default(0);
            $table->string('level', 20);
            $table->decimal('confidence', 4, 3)->nullable();
            $table->unsignedBigInteger('model_version_id')->nullable();
        });

        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->dateTime('triggered_at');
            $table->dateTime('resolved_at')->nullable();
            $table->dateTime('acknowledged_at')->nullable();
            $table->string('ap_id', 32);
            $table->string('room_id', 32);
            $table->string('level', 20)->default('CROWDED');
            $table->unsignedInteger('estimated_count');
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
        });

        DB::table('ap_registry')->insert([
            'ap_id' => 'AP1-CU205',
            'ip_address' => '10.33.244.19',
            'snmp_community' => 'public',
        ]);
    }

    public function test_occupancy_run_creates_prediction_and_crowded_alert_then_resolves(): void
    {
        // 1. CROWDED (> 40) -> buat alert ACTIVE
        DB::table('poll_log')->insert([
            'ts' => '2026-11-21 15:00:00',
            'ap_id' => 'AP1-CU205',
            'n_clients' => 45,
            'poll_ok' => 1,
        ]);

        $this->artisan('occupancy:run', ['--ap' => 'AP1-CU205'])
            ->assertExitCode(0);

        $prediction = OccupancyPrediction::first();
        $this->assertNotNull($prediction);
        $this->assertSame('CROWDED', $prediction->level);
        $this->assertSame(45, $prediction->estimated_count);

        $alert = Alert::first();
        $this->assertNotNull($alert);
        $this->assertSame('ACTIVE', $alert->status);
        $this->assertSame('CU205', $alert->room_id);

        // 2. Client turun ke LOW (<= 10) -> alert ACTIVE otomatis RESOLVED
        DB::table('poll_log')->insert([
            'ts' => '2026-11-21 15:00:15',
            'ap_id' => 'AP1-CU205',
            'n_clients' => 5,
            'poll_ok' => 1,
        ]);

        $this->artisan('occupancy:run', ['--ap' => 'AP1-CU205'])
            ->assertExitCode(0);

        $alert->refresh();
        $this->assertSame('RESOLVED', $alert->status);
        $this->assertNotNull($alert->resolved_at);
    }

    public function test_occupancy_run_marks_unknown_when_poll_fails(): void
    {
        DB::table('poll_log')->insert([
            'ts' => '2026-11-21 15:01:00',
            'ap_id' => 'AP1-CU205',
            'n_clients' => 0,
            'poll_ok' => 0,
        ]);

        $this->artisan('occupancy:run', ['--ap' => 'AP1-CU205'])
            ->assertExitCode(0);

        $prediction = OccupancyPrediction::latest('id')->first();
        $this->assertNotNull($prediction);
        $this->assertSame('UNKNOWN', $prediction->level);
        $this->assertSame(0, $prediction->estimated_count);
    }

    public function test_alert_list_filtering_and_acknowledge_endpoint(): void
    {
        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
        ]);
        Sanctum::actingAs($user);

        $alert = Alert::create([
            'triggered_at' => '2026-11-21 15:00:00',
            'ap_id' => 'AP1-CU205',
            'room_id' => 'CU205',
            'level' => 'CROWDED',
            'estimated_count' => 48,
            'status' => 'ACTIVE',
        ]);

        $this->getJson('/api/v1/alerts?ap_id=AP1-CU205&status=ACTIVE')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->patchJson("/api/v1/alerts/{$alert->id}/ack")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'ACKNOWLEDGED');

        $alert->refresh();
        $this->assertSame('ACKNOWLEDGED', $alert->status);
        $this->assertNotNull($alert->acknowledged_at);
    }
}
