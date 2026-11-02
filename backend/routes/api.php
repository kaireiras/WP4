<?php
use App\Http\Controllers\ApRegistryController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AlertController;

Route::prefix('v1')->group(function () {
    Route::prefix('admin/ap')->group(function () {
        Route::get('/', [ApRegistryController::class, 'index']);
        Route::post('/', [ApRegistryController::class, 'store']);
        Route::get('/{ap_id}', [ApRegistryController::class, 'show']);
        Route::match(['put', 'patch'], '/{ap_id}', [ApRegistryController::class, 'update']);
        Route::delete('/{ap_id}', [ApRegistryController::class, 'destroy']);


    });

    Route::get('/dashboard/overview', [DashboardController::class, 'getOverview']);
    Route::get('/rooms/{roomId}/live', [DashboardController::class, 'getRoomLiveDetail']);

    Route::get('/grafik', [HistoryController::class, 'getGrafik']);
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::patch('/alerts/{id}/ack', [AlertController::class, 'acknowledge']);
});