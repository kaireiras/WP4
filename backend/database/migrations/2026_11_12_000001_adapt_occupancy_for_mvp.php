<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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

        // Cek apakah foreign key bernama '1' atau 'occupancy_predictions_model_version_id_foreign' benar-benar ada
        $foreignKeys = DB::select(
            "SELECT CONSTRAINT_NAME 
             FROM information_schema.TABLE_CONSTRAINTS 
             WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'occupancy_predictions' 
               AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
        );

        $fkNames = array_column($foreignKeys, 'CONSTRAINT_NAME');

        Schema::table('occupancy_predictions', function ($table) use ($fkNames) {
            if (in_array('1', $fkNames, true)) {
                $table->dropForeign('1');
            } elseif (in_array('occupancy_predictions_model_version_id_foreign', $fkNames, true)) {
                $table->dropForeign('occupancy_predictions_model_version_id_foreign');
            }
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
    }
};