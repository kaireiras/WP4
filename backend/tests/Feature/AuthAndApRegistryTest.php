<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthAndApRegistryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
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
    }

    public function test_user_can_register_login_and_fetch_profile(): void
    {
        $registerResponse = $this->postJson('/api/register', [
            'name' => 'Admin Baru',
            'email' => 'admin.baru@example.com',
            'password' => 'password123',
        ]);

        $registerResponse->assertStatus(201)
            ->assertJsonStructure(['access_token', 'token_type', 'user']);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'admin.baru@example.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonStructure(['access_token', 'token_type', 'user']);

        $token = $loginResponse->json('access_token');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user')
            ->assertStatus(200)
            ->assertJsonFragment(['email' => 'admin.baru@example.com']);
    }

    public function test_unauthenticated_user_cannot_access_admin_ap_routes(): void
    {
        $this->getJson('/api/v1/admin/ap')->assertStatus(401);
        $this->postJson('/api/v1/admin/ap', [])->assertStatus(401);
    }

    public function test_authenticated_user_can_crud_ap_and_check_status(): void
    {
        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
        ]);

        Sanctum::actingAs($user);

        // Create AP
        $this->postJson('/api/v1/admin/ap', [
            'ap_id' => 'AP1-CU205',
            'ip_address' => '10.33.244.19',
            'snmp_community' => 'public',
        ])->assertStatus(201)
            ->assertJsonPath('data.ap_id', 'AP1-CU205');

        // Insert poll_log untuk verifikasi status konektivitas
        DB::table('poll_log')->insert([
            'ts' => '2026-11-21 15:00:00',
            'ap_id' => 'AP1-CU205',
            'n_clients' => 12,
            'poll_ok' => 1,
        ]);

        // List & Check Status
        $this->getJson('/api/v1/admin/ap')
            ->assertStatus(200)
            ->assertJsonPath('data.0.connection_status', 'ONLINE');

        $this->getJson('/api/v1/admin/ap/AP1-CU205/status')
            ->assertStatus(200)
            ->assertJsonPath('data.connection_status', 'ONLINE')
            ->assertJsonPath('data.n_clients', 12);

        // Update AP
        $this->putJson('/api/v1/admin/ap/AP1-CU205', [
            'ip_address' => '10.33.244.20',
        ])->assertStatus(200)
            ->assertJsonPath('data.ip_address', '10.33.244.20');

        // Delete AP
        $this->deleteJson('/api/v1/admin/ap/AP1-CU205')
            ->assertStatus(200);

        $this->getJson('/api/v1/admin/ap/AP1-CU205')->assertStatus(404);
    }
}
