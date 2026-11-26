# Dashboard Spec — WNODS (WP-4)

**Stack:** TanStack Start (React 19, SSR) · Port 3000 · Proxied Nginx → 80/443  
**Backend:** Laravel 11 REST API (port 8000) + WebSocket via Laravel Reverb  
**Deadline:** 8 November 2026

---

## Routes

| Route     | Halaman    | Keterangan                              |
| --------- | ---------- | --------------------------------------- |
| `/`       | Dashboard  | Real-time occupancy + metrics overview  |
| `/grafik` | Charts     | Time-series traffic & occupancy history |
| `/alerts` | Alert Log  | Riwayat alert + status acknowledgement  |
| `/model`  | Model Info | Performa model ML yang sedang aktif     |

---

## Halaman: `/` — Dashboard

**Tujuan:** Satu halaman lihat status ruangan sekarang, tanpa reload.

### Komponen

#### `OccupancyCard`

- Label level: **LOW / MEDIUM / HIGH / CROWDED**
- Warna indikator: hijau → kuning → oranye → merah
- Estimated count (integer) + confidence (%)
- Update via WebSocket (`OccupancyUpdated` event)

#### `MetricsGrid`

6 tile, masing-masing: nilai terkini + mini sparkline

| Tile            | Sumber Field          |
| --------------- | --------------------- |
| RX Rate         | `rx_rate` (bytes/sec) |
| TX Rate         | `tx_rate` (bytes/sec) |
| Packets/sec     | `packets_per_sec`     |
| Flow Count      | `flow_count`          |
| Active Clients  | `active_clients`      |
| Connection Rate | `connection_rate`     |

Update via WebSocket (`MetricRecorded` event).

#### `AlertBanner`

- Muncul **hanya** ketika level = CROWDED
- Full-width banner, warna merah, di atas semua konten
- Dismissible per session (tidak hilang setelah reload)
- Trigger: WebSocket event `CrowdedAlert`

#### `SyncStatusBadge`

- Lokasi: header pojok kanan
- Teks: `Last sync: HH:MM:SS`
- Status: `OK` (hijau) / `ERROR` (merah)
- Source: `GET /api/system/health`, polling setiap 15 detik

### Data Flow

```
MikroTik ──SNMP──▶ WP-1 Collector ──▶ MySQL
                                         │
                                   Laravel Scheduler
                                         │
                                   Laravel Queue Job
                                    (ML Inference)
                                         │
                              Laravel Reverb (WebSocket)
                                         │
                              TanStack Start Dashboard
```

---

## Halaman: `/grafik` — Charts

**Tujuan:** Analisis tren trafik dan okupansi dalam rentang waktu tertentu.

### Komponen

#### `TrafficChart`

- Line chart dual-axis
  - Axis kiri: RX rate, TX rate, active clients
  - Axis kanan: occupancy level (0–3 → LOW–CROWDED)
- Date-range picker: Last 1h / 6h / 24h / Custom
- Data source: `GET /api/metrics/history?from=&to=`
- Render target: ≤ 2 detik untuk window 24 jam

#### `OccupancyTimeline`

- Bar chart okupansi per interval (level per time bucket)
- Data source: `GET /api/occupancy/history?from=&to=`

### Update Method

TanStack Query — poll setiap 30 detik + manual refetch via tombol refresh.

---

## Halaman: `/alerts` — Alert Log

**Tujuan:** Lihat riwayat kejadian CROWDED dan status penanganannya.

### Komponen

#### `AlertTable`

Kolom: `#` · `Waktu` · `Level` · `Est. Count` · `Status` · `Ack. At`

- Status badge: `ACTIVE` (merah) / `ACKNOWLEDGED` (abu)
- Tombol acknowledge per baris → `POST /api/alerts/{id}/acknowledge`
- Pagination, default 20 baris
- Data source: `GET /api/alerts`
- Update: TanStack Query polling setiap 10 detik

---

## Halaman: `/model` — Model Info

**Tujuan:** Verifikasi model ML yang aktif di production.

### Komponen

#### `ModelInfoPanel`

```
┌─────────────────────────────────────┐
│  Model: Random Forest  v2.1         │
│  Deployed: 25 Oct 2026              │
├──────────┬──────────┬───────────────┤
│ Accuracy │ F1-Score │ Precision     │
│  84.2%   │  0.81    │  0.83         │
├──────────┼──────────┼───────────────┤
│  Recall  │   MAE    │    RMSE       │
│   0.79   │  2.31    │   3.14        │
└──────────┴──────────┴───────────────┘
```

- Data source: `GET /api/model/info`
- Update: static, tombol manual refresh

---

## WebSocket Events (Laravel Reverb)

Channel: `metrics.live`

| Event              | Trigger                   | Komponen yang update |
| ------------------ | ------------------------- | -------------------- |
| `MetricRecorded`   | Tiap SNMP poll masuk DB   | `MetricsGrid`        |
| `OccupancyUpdated` | Tiap ML inference selesai | `OccupancyCard`      |
| `CrowdedAlert`     | Level = CROWDED           | `AlertBanner`        |

---

## API Endpoints (konsumsi frontend)

| Method | Endpoint                       | Dipakai di                        |
| ------ | ------------------------------ | --------------------------------- |
| `GET`  | `/api/metrics/latest`          | `/` fallback (jika WS disconnect) |
| `GET`  | `/api/metrics/history`         | `/grafik`                         |
| `GET`  | `/api/occupancy/current`       | `/` initial load                  |
| `GET`  | `/api/occupancy/history`       | `/grafik`                         |
| `GET`  | `/api/alerts`                  | `/alerts`                         |
| `POST` | `/api/alerts/{id}/acknowledge` | `/alerts`                         |
| `GET`  | `/api/model/info`              | `/model`                          |
| `GET`  | `/api/system/health`           | Header badge                      |

---

## Target Performa

| Metrik                              | Target               |
| ----------------------------------- | -------------------- |
| Dashboard update latency (via WS)   | ≤ 5 detik end-to-end |
| Initial page load (SSR)             | ≤ 2 detik            |
| API response time                   | ≤ 500 ms             |
| Alert banner tampil setelah CROWDED | ≤ 3 detik            |

---

## Timeline WP-4

| Minggu  | Target                                             |
| ------- | -------------------------------------------------- |
| W5      | Setup VPS, TanStack Start project, koneksi ke API  |
| W6–W7   | Scaffolding route + layout, WebSocket client setup |
| W9      | Dashboard `/` + `/grafik` MVP                      |
| W10     | Integrasi output model ML                          |
| W11     | `/alerts`, `/model`, AlertBanner, polish UI        |
| **W12** | **Deploy final, demo-ready — 8 Nov 2026**          |
