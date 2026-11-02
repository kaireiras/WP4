<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AlertController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('alerts')->group(function () {
        Route::get('/', [AlertController::class, 'index']);
        Route::patch('/{id}/acknowledge', [AlertController::class, 'acknowledge']);
    });

