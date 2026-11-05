<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Konfigurasi integrasi model ML WP-3 (serve.py, Flask)
|--------------------------------------------------------------------------
|
| File khusus untuk bagian MODEL INTEGRATION + ALERT + LOGGING (WP-4).
| Sengaja dibuat sebagai file baru supaya config/services.php milik tim
| backend tidak perlu diubah.
|
| PENTING: ts di poll_log adalah WIB TANPA zona. Kirim apa adanya ke
| WP-3, jangan pernah konversi timezone di sisi Laravel.
|
*/

return [

    'url' => env('ML_SERVICE_URL', 'http://127.0.0.1:5000/predict'),
    'model_url' => env('ML_MODEL_URL', 'http://127.0.0.1:5000/model'),
    'health_url' => env('ML_HEALTH_URL', 'http://127.0.0.1:5000/health'),

    'timeout' => (int) env('ML_TIMEOUT', 5),
    'retries' => (int) env('ML_RETRIES', 2),
    'retry_delay_ms' => (int) env('ML_RETRY_DELAY_MS', 500),

    // Saat service ML mati, prediksi memakai heuristik dari n_clients.
    // MATIKAN (ML_FALLBACK=false) saat evaluasi WP-5 supaya angka heuristik
    // tidak tercampur dengan hasil model asli.
    'fallback' => (bool) env('ML_FALLBACK', true),
    'fallback_confidence' => (float) env('ML_FALLBACK_CONFIDENCE', 0.5),

    'alert' => [
        // Level yang memicu alert, dipisah koma (default hanya CROWDED).
        'trigger_levels' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('ALERT_TRIGGER_LEVELS', 'CROWDED')),
        ))),

        // Ruangan + level yang sama tidak membuat alert baru selama jeda ini.
        'cooldown_seconds' => (int) env('ALERT_COOLDOWN_SECONDS', 300),

        // Prediksi dengan confidence di bawah ini tidak boleh memicu alert.
        'min_confidence' => (float) env('ALERT_MIN_CONFIDENCE', 0.0),
    ],
];
