# Spesifikasi Integrasi Model ML WP-3 → Backend WP-4

**Status: REFERENSI.** Folder ini adalah acuan untuk rekan backend yang akan menulis
implementasinya sendiri di Laravel. Kode di folder ini TIDAK dimerge — dipakai sebagai
patokan perilaku dan bukti bahwa seluruh alur sudah teruji (15 tes, 42 asersi, semuanya lolos).

---

## 1. Kontrak service ML WP-3 (serve.py, Flask, port 5000)

Service model berjalan terpisah (Python/Flask). Backend hanya **memanggil**.

### `POST /predict` — payload dan respons

```json
{ "ap_id": "AP-CU205", "ts": "2026-10-04 16:30:38" }
```

| Kode | Arti | Yang harus dilakukan backend |
|---|---|---|
| 200 | Sukses: `{ap_id, ts, estimated_count, level, confidence, model_version}` | Simpan prediksi |
| 400 | Input salah (bug di sisi kita) | **Jangan fallback** — perbaiki payload |
| 404 | Polling belum ada di `poll_log` | Lewati diam-diam |
| 409 | Polling gagal (`poll_ok = 0`) | Lewati diam-diam |
| 503 | DB WP-3 tidak terjangkau | Boleh fallback |

### `GET /model` — metadata model aktif

`{version, name, features, metrics: {mae, rmse, accuracy, f1_score, precision_score, recall_score}, metrics_from, data, sklearn}`

Dipakai untuk mengisi tabel `model_versions` (halaman `/model` dashboard).

### `GET /health` — liveness

`{ok: true, model_version}` — dipakai untuk pemantauan.

### Aturan penting soal `ts`

`ts` di database adalah **WIB tanpa zona**. Kirim **apa adanya** (persis string dari
`poll_log`, format `YYYY-MM-DD HH:MM:SS`) ke WP-3. **Jangan konversi timezone** — serve.py
menganggap input naive berada di Asia/Jakarta. Konversi akan menggeser waktu dan merusak fitur model.

### Pita level (dokumen MVP)

LOW ≤ 10 · MEDIUM ≤ 25 · HIGH ≤ 40 · CROWDED > 40

---

## 2. Alur yang harus diimplementasikan di backend (setiap 15 detik, per AP)

1. Ambil polling terakhir `poll_ok = 1` dari `poll_log` untuk AP tersebut.
2. Validasi format `ts` (`YYYY-MM-DD HH:MM:SS`); bentuk lain ditolak.
3. **Deduplikasi:** satu pasangan `(ap_id, ts)` hanya diprediksi sekali. (Di dump
   `net_monitoring_db.sql` ada baris prediksi ganda — bug yang harus dihindari.)
4. Panggil `POST /predict` dengan `{ap_id, ts}`. Tambahkan retry (mis. 2x, jeda 500 ms)
   hanya untuk kesalahan jaringan.
5. Simpan ke `occupancy_predictions` (ts, ap_id, room_id, estimated_count, level,
   confidence, model_version_id), lalu broadcast `OccupancyUpdated` (channel `metrics.live`).
6. Sinkronkan `model_versions`: jika `model_version` dari respons belum ada, ambil
   `GET /model`, isi metriknya, tandai aktif. `GET /model` cukup dipanggil saat versi baru.
7. Evaluasi alert (aturan di bagian 4).

`room_id` diambil dari `ap_rooms`; AP yang tidak terdaftar memakai `UNKNOWN` (dan dilog).

## 3. Fallback saat service ML mati

- **Pemicu:** timeout/koneksi putus setelah retry, 503, atau respons 200 yang bentuknya tidak valid.
- **Perilaku:** hitung level dari `n_clients` memakai pita MVP, confidence 0.5,
  **tandai sumbernya** (mis. kolom/keterangan `source=fallback`) supaya bisa dibedakan dari prediksi model.
- **Wajib:** saat evaluasi WP-5 set `ML_FALLBACK=false` supaya data evaluasi murni dari model.
- 404/409/400 TIDAK boleh di-fallback.

## 4. Aturan alert

1. Hanya level pemicu yang membuat alert (default: CROWDED; bisa diubah lewat `ALERT_TRIGGER_LEVELS`).
2. Alert dibuat hanya saat **transisi masuk** level pemicu (prediksi sebelumnya bukan level itu) — bukan setiap siklus.
3. Cooldown 300 detik per ruangan + level (anti spam saat level naik-turun cepat).
4. Prediksi dengan confidence di bawah ambang (`ALERT_MIN_CONFIDENCE`, default 0.0) tidak memicu alert.
5. Event `CrowdedAlert` di-broadcast **hanya untuk level CROWDED** (kontrak dashboard, lihat `prd.md`).

Tabel `alerts`: status `ACTIVE`, lalu `ACKNOWLEDGED` oleh endpoint frontend.

## 5. Logging (3 file harian di `storage/logs/`)

- `ml-YYYY-MM-DD.log` — semua percakapan dengan service ML (attempt, status, latensi).
- `inference-YYYY-MM-DD.log` — tiap prediksi disimpan/dilewati + alasannya.
- `alerts-YYYY-MM-DD.log` — tiap alert dibuat/ditahan + alasannya.

Cukup lewat `Log::build()` (atau channel), tidak perlu mengubah `config/logging.php`.

## 6. Konfigurasi (env, dengan default)

| Variabel | Default | Keterangan |
|---|---|---|
| `ML_SERVICE_URL` | `http://127.0.0.1:5000/predict` | Port 5000 = default serve.py (bukan 8001) |
| `ML_MODEL_URL` | `http://127.0.0.1:5000/model` | |
| `ML_HEALTH_URL` | `http://127.0.0.1:5000/health` | |
| `ML_TIMEOUT` | `5` | detik |
| `ML_RETRIES` | `2` | |
| `ML_RETRY_DELAY_MS` | `500` | |
| `ML_FALLBACK` | `true` | **false saat evaluasi WP-5** |
| `ML_FALLBACK_CONFIDENCE` | `0.5` | |
| `ALERT_TRIGGER_LEVELS` | `CROWDED` | pisah koma, mis. `CROWDED,HIGH` |
| `ALERT_COOLDOWN_SECONDS` | `300` | |
| `ALERT_MIN_CONFIDENCE` | `0.0` | |

## 7. Isi folder referensi

- `backend/config/ml.php` — konfigurasi lengkap (file baru, tidak menyentuh `services.php`).
- `backend/app/Services/MlClient.php` — dokumentasi kontrak WP-3 paling lengkap (docblock).
- `backend/app/Services/InferenceService.php` — alur bagian 2.
- `backend/app/Services/AlertService.php` — aturan bagian 4.
- `backend/app/Services/ModelVersionService.php` — sinkronisasi `model_versions` (memakai `forceFill`, tidak mengubah model tim).
- `backend/app/Services/IntegrationLog.php` — logging bagian 5 tanpa mengubah `logging.php`.
- `backend/app/Exceptions/MlRequestException.php` + `MlUnavailableException.php` — bedakan bug kita vs. infra mati.
- `backend/app/Console/Commands/InferenceDaemon.php` — loop 15 detik (alternatif: scheduler).
- `backend/app/Console/Commands/SyncModelInfo.php` — sinkron metadata model (manual/periodik).
- `backend/tests/Feature/InferenceIntegrationTest.php` — **13 tes yang menjadi "spesifikasi yang bisa dijalankan"**: kontrak 200/400/404/409/503, dedup, sinkron versi model, fallback on/off, transisi alert, cooldown, skip polling gagal.
- `compose.ml.yml` — contoh service Docker untuk menjalankan daemon.

## 8. Peringatan penting untuk rekan backend

1. **Placeholder lama di `backend/app/Services/InferenceService.php` (repo) SALAH dan jangan dijadikan basis:**
   payload lama (`n_clients` + metrik trafik) tidak sesuai kontrak serve.py WP-3,
   confidence palsu 0.88, pita level salah (≥20 dianggap CROWDED), tanpa deduplikasi,
   dan tidak ada penjadwalan sama sekali (tidak akan pernah jalan tanpa scheduler).
2. Baris `'ml' => [ ... 8001 ...]` di `config/services.php` usang — konfigurasi acuannya di `config/ml.php` (folder ini).
3. Semua referensi ini sudah diverifikasi: Pint bersih, 15 tes / 42 asersi lolos.
