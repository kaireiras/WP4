<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HistoryController extends Controller
{
    /**
     * Mengambil deret waktu riwayat trafik dan perangkat aktif dari vap_snapshot
     * Mendukung filter room_id, ap_id, tanggal (start_date/end_date, from/to, date), preset waktu (range),
     * dan penggabungan (bucketing) otomatis berdasarkan rentang waktu.
     */
    public function getGrafik(Request $request): JsonResponse
    {
        $roomId = $request->query('room_id');
        $apId = $request->query('ap_id');

        // Tangkap berbagai variasi nama parameter tanggal/waktu dari frontend
        $date = $request->query('date');
        $startDate = $request->query('start_date') ?? $request->query('from') ?? $request->query('start_time');
        $endDate = $request->query('end_date') ?? $request->query('to') ?? $request->query('end_time');
        $range = $request->query('range') ?? $request->query('timeframe');
        $requestedInterval = $request->query('interval') ?? $request->query('bucket');
        $limit = (int) ($request->query('limit') ?? 0);

        $intervalSec = 15; // Interval polling dasar
        $driver = DB::connection()->getDriverName();

        $query = DB::table('vap_snapshot as vs')
            ->where('vs.vap_up', 1);

        $isFiltered = false;
        $hasTimeFilter = false;
        $parsedStart = null;
        $parsedEnd = null;

        // 1. Filter berdasarkan room_id (ekstrak dari suffix ap_id, misal AP1-CU205 -> CU205)
        if (! empty($roomId) && strtoupper($roomId) !== 'ALL') {
            if ($driver === 'sqlite') {
                $query->where(function ($q) use ($roomId) {
                    $q->where('vs.ap_id', $roomId)
                        ->orWhere('vs.ap_id', 'like', '%-' . $roomId);
                });
            } else {
                $query->whereRaw("SUBSTRING_INDEX(vs.ap_id, '-', -1) = ?", [$roomId]);
            }
            $isFiltered = true;
        }

        // 2. Filter jika memilih ap_id tertentu
        if (! empty($apId) && strtoupper($apId) !== 'ALL') {
            $query->where('vs.ap_id', $apId);
            $isFiltered = true;
        }

        // 3. Filter satu tanggal spesifik (?date=2026-11-14)
        if (! empty($date)) {
            $parsedStart = Carbon::parse($date)->startOfDay()->toDateTimeString();
            $parsedEnd = Carbon::parse($date)->endOfDay()->toDateTimeString();
            $hasTimeFilter = true;
        }

        // 4. Filter rentang waktu mulai (?start_date=2026-11-14 atau 2026-11-14 08:00:00)
        if (! empty($startDate)) {
            $parsedStart = strlen(trim($startDate)) <= 10
                ? Carbon::parse($startDate)->startOfDay()->toDateTimeString()
                : Carbon::parse($startDate)->toDateTimeString();
            $hasTimeFilter = true;
        }

        // 5. Filter rentang waktu akhir (?end_date=2026-11-14 atau 2026-11-14 17:00:00)
        if (! empty($endDate)) {
            $parsedEnd = strlen(trim($endDate)) <= 10
                ? Carbon::parse($endDate)->endOfDay()->toDateTimeString()
                : Carbon::parse($endDate)->toDateTimeString();
            $hasTimeFilter = true;
        }

        // 6. Filter preset durasi relatif (?range=1h, 3h, 6h, today, this_month, dll.)
        if (! empty($range) && ! $hasTimeFilter) {
            $anchorTs = DB::table('vap_snapshot')->max('ts');
            $baseTime = $anchorTs ? Carbon::parse($anchorTs) : now();

            $presetBounds = $this->resolvePresetBounds($range, $baseTime);
            if ($presetBounds !== null) {
                $parsedStart = $presetBounds['start'];
                $parsedEnd = $presetBounds['end'];
                $hasTimeFilter = true;
            }
        }

        if ($parsedStart !== null) {
            $query->where('vs.ts', '>=', $parsedStart);
        }
        if ($parsedEnd !== null) {
            $query->where('vs.ts', '<=', $parsedEnd);
        }

        $bucketInterval = $this->resolveBucketInterval(
            $range,
            $parsedStart,
            $parsedEnd,
            $requestedInterval,
            $hasTimeFilter
        );

        // Jika memfilter tanggal/waktu, izinkan sampai 1500 titik agar 1 hari penuh (1440 menit) tidak terpotong
        $effectiveLimit = $limit > 0 ? min($limit, 5000) : ($hasTimeFilter ? 1500 : 100);

        $bucketExpr = $this->buildBucketExpression($bucketInterval, $driver);
        $roomExpr = $driver === 'sqlite'
            ? "REPLACE(vs.ap_id, RTRIM(vs.ap_id, REPLACE(vs.ap_id, '-', '')), '')"
            : "SUBSTRING_INDEX(vs.ap_id, '-', -1)";

        // Tahap 1: Normalisasi per (bucket_ts, ap_id) dengan membagi jumlah snapshot polling unik
        $perApQuery = $query->select([
            DB::raw("{$bucketExpr} as bucket_ts"),
            'vs.ap_id',
            DB::raw("{$roomExpr} as room_id"),
            DB::raw('COALESCE(SUM(vs.n_clients), 0) * 1.0 / COUNT(DISTINCT vs.ts) as ap_active_clients'),
            DB::raw('COALESCE(SUM(vs.rx_bytes), 0) * 1.0 / COUNT(DISTINCT vs.ts) as ap_rx_bytes'),
            DB::raw('COALESCE(SUM(vs.tx_bytes), 0) * 1.0 / COUNT(DISTINCT vs.ts) as ap_tx_bytes'),
            DB::raw('COALESCE(SUM(vs.rx_packets), 0) * 1.0 / COUNT(DISTINCT vs.ts) as ap_rx_packets'),
            DB::raw('COALESCE(SUM(vs.tx_packets), 0) * 1.0 / COUNT(DISTINCT vs.ts) as ap_tx_packets'),
            DB::raw('COALESCE(SUM(vs.tx_retries), 0) * 1.0 / COUNT(DISTINCT vs.ts) as ap_tx_retries'),
        ])->groupBy(DB::raw($bucketExpr), 'vs.ap_id');

        // Tahap 2: Agregasi akhir sesuai mode ruangan (gabungkan semua AP dengan room_id sama) atau seluruh gedung ("ALL")
        $apListExpr = $driver === 'sqlite'
            ? "GROUP_CONCAT(DISTINCT agg.ap_id)"
            : "GROUP_CONCAT(DISTINCT agg.ap_id ORDER BY agg.ap_id SEPARATOR ', ')";

        if ($isFiltered) {
            $data = DB::query()
                ->fromSub($perApQuery, 'agg')
                ->select([
                    'agg.bucket_ts as ts',
                    DB::raw("{$apListExpr} as ap_id"),
                    'agg.room_id',
                    DB::raw('COALESCE(SUM(agg.ap_active_clients), 0) as active_clients'),
                    DB::raw('COALESCE(SUM(agg.ap_rx_bytes), 0) as total_rx_bytes'),
                    DB::raw('COALESCE(SUM(agg.ap_tx_bytes), 0) as total_tx_bytes'),
                    DB::raw('COALESCE(SUM(agg.ap_rx_packets), 0) as total_rx_packets'),
                    DB::raw('COALESCE(SUM(agg.ap_tx_packets), 0) as total_tx_packets'),
                    DB::raw('COALESCE(SUM(agg.ap_tx_retries), 0) as total_tx_retries'),
                ])
                ->groupBy('agg.bucket_ts', 'agg.room_id')
                ->orderBy('agg.bucket_ts', 'desc')
                ->limit($effectiveLimit)
                ->get();
        } else {
            $data = DB::query()
                ->fromSub($perApQuery, 'agg')
                ->select([
                    'agg.bucket_ts as ts',
                    DB::raw('"ALL" as ap_id'),
                    DB::raw('"ALL" as room_id'),
                    DB::raw('COALESCE(SUM(agg.ap_active_clients), 0) as active_clients'),
                    DB::raw('COALESCE(SUM(agg.ap_rx_bytes), 0) as total_rx_bytes'),
                    DB::raw('COALESCE(SUM(agg.ap_tx_bytes), 0) as total_tx_bytes'),
                    DB::raw('COALESCE(SUM(agg.ap_rx_packets), 0) as total_rx_packets'),
                    DB::raw('COALESCE(SUM(agg.ap_tx_packets), 0) as total_tx_packets'),
                    DB::raw('COALESCE(SUM(agg.ap_tx_retries), 0) as total_tx_retries'),
                ])
                ->groupBy('agg.bucket_ts')
                ->orderBy('agg.bucket_ts', 'desc')
                ->limit($effectiveLimit)
                ->get();
        }

        $formattedData = $data->map(function ($row) use ($intervalSec) {
            $rxBytes = (float) $row->total_rx_bytes;
            $txBytes = (float) $row->total_tx_bytes;
            $rxPackets = (float) $row->total_rx_packets;
            $txPackets = (float) $row->total_tx_packets;

            $rxRateKBs = round($rxBytes / 1024 / $intervalSec, 2);
            $txRateKBs = round($txBytes / 1024 / $intervalSec, 2);
            $pps = (int) round(($rxPackets + $txPackets) / $intervalSec);

            return [
                'ts'                => $row->ts,
                'ap_id'             => $row->ap_id,
                'room_id'           => $row->room_id,
                'active_clients'    => (int) round((float) $row->active_clients),
                'rx_rate_kbs'       => $rxRateKBs,
                'tx_rate_kbs'       => $txRateKBs,
                'rx_rate_formatted' => $rxRateKBs >= 1024 ? round($rxRateKBs / 1024, 2) . ' MB/s' : $rxRateKBs . ' KB/s',
                'tx_rate_formatted' => $txRateKBs >= 1024 ? round($txRateKBs / 1024, 2) . ' MB/s' : $txRateKBs . ' KB/s',
                'packets_per_sec'   => $pps,
                'tx_retries'        => (int) round((float) $row->total_tx_retries),
            ];
        })->reverse()->values();

        return response()->json([
            'success'   => true,
            'message'   => 'Data grafik berhasil diambil langsung dari vap_snapshot.',
            'filter'    => [
                'room_id'    => $roomId ?? 'ALL',
                'ap_id'      => $apId ?? 'ALL',
                'date'       => $date,
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'range'      => $range,
                'interval'   => $bucketInterval,
            ],
            'total_pts' => $formattedData->count(),
            'data'      => $formattedData,
        ]);
    }

    /**
     * Menghitung batas waktu awal dan akhir untuk preset rentang waktu relatif.
     *
     * @return array{start: string, end: string|null}|null
     */
    private function resolvePresetBounds(string $range, Carbon $baseTime): ?array
    {
        return match (strtolower(trim($range))) {
            '15m'        => ['start' => $baseTime->copy()->subMinutes(15)->toDateTimeString(), 'end' => null],
            '30m'        => ['start' => $baseTime->copy()->subMinutes(30)->toDateTimeString(), 'end' => null],
            '1h'         => ['start' => $baseTime->copy()->subHour()->toDateTimeString(), 'end' => null],
            '3h'         => ['start' => $baseTime->copy()->subHours(3)->toDateTimeString(), 'end' => null],
            '6h'         => ['start' => $baseTime->copy()->subHours(6)->toDateTimeString(), 'end' => null],
            '12h'        => ['start' => $baseTime->copy()->subHours(12)->toDateTimeString(), 'end' => null],
            '24h', '1d'  => ['start' => $baseTime->copy()->subDay()->toDateTimeString(), 'end' => null],
            '48h', '2d'  => ['start' => $baseTime->copy()->subDays(2)->toDateTimeString(), 'end' => null],
            '7d', '1w'   => ['start' => $baseTime->copy()->subDays(7)->toDateTimeString(), 'end' => null],
            '30d', '1m'  => ['start' => $baseTime->copy()->subDays(30)->toDateTimeString(), 'end' => null],
            'today'      => ['start' => $baseTime->copy()->startOfDay()->toDateTimeString(), 'end' => null],
            'yesterday'  => [
                'start' => $baseTime->copy()->subDay()->startOfDay()->toDateTimeString(),
                'end'   => $baseTime->copy()->subDay()->endOfDay()->toDateTimeString(),
            ],
            'this_week'  => ['start' => $baseTime->copy()->startOfWeek()->toDateTimeString(), 'end' => null],
            'prev_week'  => [
                'start' => $baseTime->copy()->subWeek()->startOfWeek()->toDateTimeString(),
                'end'   => $baseTime->copy()->subWeek()->endOfWeek()->toDateTimeString(),
            ],
            'this_month' => ['start' => $baseTime->copy()->startOfMonth()->toDateTimeString(), 'end' => null],
            'prev_month' => [
                'start' => $baseTime->copy()->subMonth()->startOfMonth()->toDateTimeString(),
                'end'   => $baseTime->copy()->subMonth()->endOfMonth()->toDateTimeString(),
            ],
            'this_year'  => ['start' => $baseTime->copy()->startOfYear()->toDateTimeString(), 'end' => null],
            'prev_year'  => [
                'start' => $baseTime->copy()->subYear()->startOfYear()->toDateTimeString(),
                'end'   => $baseTime->copy()->subYear()->endOfYear()->toDateTimeString(),
            ],
            default => null,
        };
    }

    /**
     * Menentukan interval agregasi (bucket) berdasarkan parameter eksplisit, preset range, atau durasi waktu.
     */
    private function resolveBucketInterval(
        ?string $range,
        ?string $parsedStart,
        ?string $parsedEnd,
        ?string $requestedInterval,
        bool $hasTimeFilter
    ): string {
        $allowed = ['15s', '30s', '1m', '5m', '15m', '30m', '1h', '1d'];
        if ($requestedInterval !== null) {
            $normalized = strtolower(trim($requestedInterval));
            if (in_array($normalized, $allowed, true)) {
                return $normalized;
            }
        }

        if (! $hasTimeFilter) {
            return '15s';
        }

        if ($range !== null && strtolower(trim($range)) !== 'custom') {
            $mapped = match (strtolower(trim($range))) {
                '15m', '30m', '1h' => '15s',
                '3h' => '30s',
                '6h', '12h', '24h', '1d', 'today', 'yesterday' => '1m',
                '48h', '2d' => '5m',
                '7d', '1w', 'this_week', 'prev_week' => '1h',
                '30d', '1m', 'this_month', 'prev_month', 'this_year', 'prev_year' => '1d',
                default => null,
            };

            if ($mapped !== null) {
                return $mapped;
            }
        }

        if ($parsedStart !== null && $parsedEnd !== null) {
            $diffSeconds = max(
                0,
                Carbon::parse($parsedEnd)->getTimestamp() - Carbon::parse($parsedStart)->getTimestamp()
            );

            return match (true) {
                $diffSeconds <= 3600   => '15s',
                $diffSeconds <= 10800  => '30s',
                $diffSeconds <= 86400  => '1m',
                $diffSeconds <= 172800 => '5m',
                $diffSeconds <= 604800 => '1h',
                default                => '1d',
            };
        }

        return '1m';
    }

    /**
     * Membangun ekspresi SQL untuk mengelompokkan timestamp ke dalam bucket waktu.
     */
    private function buildBucketExpression(string $interval, string $driver): string
    {
        if ($driver === 'sqlite') {
            return match ($interval) {
                '15s' => "strftime('%Y-%m-%d %H:%M:', vs.ts) || printf('%02d', (CAST(strftime('%S', vs.ts) AS INTEGER) / 15) * 15)",
                '30s' => "strftime('%Y-%m-%d %H:%M:', vs.ts) || CASE WHEN CAST(strftime('%S', vs.ts) AS INTEGER) < 30 THEN '00' ELSE '30' END",
                '1m'  => "strftime('%Y-%m-%d %H:%M:00', vs.ts)",
                '5m'  => "strftime('%Y-%m-%d %H:', vs.ts) || printf('%02d:00', (CAST(strftime('%M', vs.ts) AS INTEGER) / 5) * 5)",
                '15m' => "strftime('%Y-%m-%d %H:', vs.ts) || printf('%02d:00', (CAST(strftime('%M', vs.ts) AS INTEGER) / 15) * 15)",
                '30m' => "strftime('%Y-%m-%d %H:', vs.ts) || printf('%02d:00', (CAST(strftime('%M', vs.ts) AS INTEGER) / 30) * 30)",
                '1h'  => "strftime('%Y-%m-%d %H:00:00', vs.ts)",
                '1d'  => "strftime('%Y-%m-%d 00:00:00', vs.ts)",
                default => 'vs.ts',
            };
        }

        return match ($interval) {
            '15s' => "CONCAT(DATE_FORMAT(vs.ts, '%Y-%m-%d %H:%i:'), LPAD(FLOOR(SECOND(vs.ts) / 15) * 15, 2, '0'))",
            '30s' => "CONCAT(DATE_FORMAT(vs.ts, '%Y-%m-%d %H:%i:'), IF(SECOND(vs.ts) < 30, '00', '30'))",
            '1m'  => "DATE_FORMAT(vs.ts, '%Y-%m-%d %H:%i:00')",
            '5m'  => "CONCAT(DATE_FORMAT(vs.ts, '%Y-%m-%d %H:'), LPAD(FLOOR(MINUTE(vs.ts) / 5) * 5, 2, '0'), ':00')",
            '15m' => "CONCAT(DATE_FORMAT(vs.ts, '%Y-%m-%d %H:'), LPAD(FLOOR(MINUTE(vs.ts) / 15) * 15, 2, '0'), ':00')",
            '30m' => "CONCAT(DATE_FORMAT(vs.ts, '%Y-%m-%d %H:'), LPAD(FLOOR(MINUTE(vs.ts) / 30) * 30, 2, '0'), ':00')",
            '1h'  => "DATE_FORMAT(vs.ts, '%Y-%m-%d %H:00:00')",
            '1d'  => "DATE_FORMAT(vs.ts, '%Y-%m-%d 00:00:00')",
            default => 'vs.ts',
        };
    }
}
