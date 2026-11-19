<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adaptasi tabel occupancy_predictions untuk MVP TANPA Machine Learning.
 *
 * Perubahan:
 *   1. level: enum ditambah 'ERROR' dan 'UNKNOWN' —
 *      untuk polling gagal (poll_ok = FALSE) sesuai dokumen MVP.
 *   2. confidence: dibuat NULL (warisan ML, tidak dipakai lagi).
 *   3. model_version_id: FK `1` dilepas + kolom dibuat NULL
 *      (tanpa ML tidak ada versi model).
 *
 * Tabel occupancy_predictions dibuat lewat dump net_monitoring_db.sql,
 * bukan lewat migrasi, sehingga migrasi ini hanya berjalan bila tabel ada.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('occupancy_predictions')) {
            return;
        }

        DB::statement(
            "ALTER TABLE `occupancy_predictions`
             MODIFY `level` ENUM('LOW','MEDIUM','HIGH','CROWDED','ERROR','UNKNOWN') NOT NULL"
        );

        DB::statement(
            'ALTER TABLE `occupancy_predictions` MODIFY `confidence` DECIMAL(4,3) NULL'
        );

        Schema::table('occupancy_predictions', function ($table) {
            $table->dropForeign('1');
        });

        DB::statement(
            'ALTER TABLE `occupancy_predictions` MODIFY `model_version_id` INT NULL'
        );
    }

    public function down(): void
    {
        if (! Schema::hasTable('occupancy_predictions')) {
            return;
        }

        DB::statement(
            "ALTER TABLE `occupancy_predictions`
             MODIFY `level` ENUM('LOW','MEDIUM','HIGH','CROWDED') NOT NULL"
        );

        DB::statement(
            'ALTER TABLE `occupancy_predictions` MODIFY `confidence` DECIMAL(4,3) NOT NULL'
        );

        DB::statement(
            'ALTER TABLE `occupancy_predictions` MODIFY `model_version_id` INT NOT NULL'
        );

        Schema::table('occupancy_predictions', function ($table) {
            $table->foreign('model_version_id', '1')->references('id')->on('model_versions');
        });
    }
};
