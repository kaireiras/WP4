<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('alerts') || Schema::hasColumn('alerts', 'acknowledged_at')) {
            return;
        }

        Schema::table('alerts', function (Blueprint $table) {
            $table->dateTime('acknowledged_at')->nullable()->after('resolved_at');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('alerts') || ! Schema::hasColumn('alerts', 'acknowledged_at')) {
            return;
        }

        Schema::table('alerts', function (Blueprint $table) {
            $table->dropColumn('acknowledged_at');
        });
    }
};
