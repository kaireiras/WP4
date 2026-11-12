<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// MVP Modul 2 (Crowd Detection): klasifikasi okupansi dijalankan
// setiap 15 detik, seirama interval polling SNMP collector.
Schedule::command('occupancy:run')->everyFifteenSeconds()->withoutOverlapping();

