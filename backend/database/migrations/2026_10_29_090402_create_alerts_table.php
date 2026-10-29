<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->dateTime('triggered_at');
            $table->dateTime('resolved_at')->nullable();
            $table->string('ap_id', 32);
            $table->string('room_id', 32);
            $table->enum('level', ['WARNING', 'CROWDED'])->default('CROWDED');
            $table->unsignedInteger('estimated_count');
            $table->enum('status', ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'])->default('ACTIVE');
            $table->timestamps();

            // Indexing untuk query cepat alert aktif
            $table->index('status');
            $table->index(['room_id', 'status']);
            $table->index('triggered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};