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
        Schema::create('occupancy_predictions', function (Blueprint $table) {
            $table->id();
            $table->dateTime('ts');
            $table->string('ap_id', 32);
            $table->string('room_id', 32);
            $table->unsignedInteger('estimated_count')->default(0);
            $table->enum('level', ['LOW', 'MEDIUM', 'HIGH', 'CROWDED'])->default('LOW');
            $table->decimal('confidence', 4, 3)->default(0.900);
            $table->unsignedBigInteger('model_version_id')->default(1);

            // Indexing untuk mempercepat query filtering dashboard, grafik, dan latest ts
            $table->index('ts');
            $table->index('room_id');
            $table->index('ap_id');
            $table->index(['room_id', 'ts']);

            // Opsional: Foreign key ke tabel model_versions jika tabel tersebut sudah ada
            // $table->foreign('model_version_id')->references('id')->on('model_versions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('occupancy_predictions');
    }
};