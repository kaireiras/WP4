<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('room_id', 50);
            $table->float('avg_estimated_count')->default(0);
            $table->unsignedInteger('peak_estimated_count')->default(0);
            $table->unsignedInteger('crowded_samples_count')->default(0);
            $table->unsignedInteger('total_samples_count')->default(0);
            $table->timestamps();

            // Mencegah duplikasi data agregasi per ruangan per hari
            $table->unique(['date', 'room_id']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_daily_summaries');
    }
};