<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Events\CrowdedAlert;
use App\Events\OccupancyUpdated;
use App\Services\InferenceService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Tes integrasi InferenceService dengan service ML WP-3 (Http::fake) dan
 * tabel domain hasil import net_monitoring_db.sql (dibuat ulang di sqlite :memory:).
 *
 * Cakupan: kontrak /predict (200/400/404/409/503), deduplikasi polling,
 * sinkronisasi model_versions, fallback, alert (transisi + cooldown), broadcast.
 */
class InferenceIntegrationTest extends TestCase
{
    private const AP = 'AP-CU205';

    private const ROOM = 'CU205';

    private const TS = '2026-10-04 16:30:38';

    protected function setUp(): void
    {
        parent::setUp();

        $this->createDomainTables();
        $this->seedBasics();

        config([
            'ml.url' => 'http://ml.test/predict',
            'ml.model_url' => 'http://ml.test/model',
            'ml.health_url' => 'http://ml.test/health',
            'ml.retries' => 0,
            'ml.timeout' => 2,
            'ml.fallback' => true,
            'ml.fallback_confidence' => 0.5,
            'ml.alert.trigger_levels' => ['CROWDED'],
            'ml.alert.cooldown_seconds' => 300,
            'ml.alert.min_confidence' => 0.0,
        ]);

        Event::fake([OccupancyUpdated::class, CrowdedAlert::class]);
    }

    // ---------------------------------------------------------------- helpers

    private function createDomainTables(): void
    {
        Schema::dropIfExists('occupancy_predictions');
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('model_versions');
        Schema::dropIfExists('ap_rooms');
        Schema::dropIfExists('poll_log');

        Schema::create('poll_log', function ($t) {
            $t->dateTime('ts');
            $t->string('ap_id', 20);
            $t->integer('n_clients');
            $t->boolean('poll_ok');
        });

        Schema::create('ap_rooms', function ($t) {
            $t->string('ap_id', 20);
            $t->string('room_id', 20);
        });

        Schema::create('model_versions', function ($t) {
            $t->increments('id');
            $t->string('version', 50);
            $t->dateTime('deployed_at');
            $t->float('accuracy')->nullable();
            $t->float('f1_score')->nullable();
            $t->float('precision_score')->nullable();
            $t->float('recall_score')->nullable();
            $t->float('mae')->nullable();
            $t->float('rmse')->nullable();
            $t->boolean('is_active')->default(false);
        });

        Schema::create('occupancy_predictions', function ($t) {
            $t->increments('id');
            $t->dateTime('ts');
            $t->string('ap_id', 20);
            $t->string('room_id', 20)->nullable();
            $t->integer('estimated_count');
            $t->string('level', 10);
            $t->float('confidence');
            $t->unsignedInteger('model_version_id');
        });

        Schema::create('alerts', function ($t) {
            $t->increments('id');
            $t->dateTime('triggered_at');
            $t->string('ap_id', 20);
            $t->string('room_id', 20)->nullable();
            $t->string('level', 10);
            $t->integer('estimated_count');
            $t->string('status', 15)->default('ACTIVE');
            $t->dateTime('acknowledged_at')->nullable();
        });
    }

    private function seedBasics(): void
    {
        DB::table('ap_rooms')->insert(['ap_id' => self::AP, 'room_id' => self::ROOM]);

        DB::table('model_versions')->insert([
            'version' => 'wp3-lama',
            'deployed_at' => '2026-10-01 08:00:00',
            'is_active' => true,
        ]);

        DB::table('poll_log')->insert([
            'ts' => self::TS,
            'ap_id' => self::AP,
            'n_clients' => 12,
            'poll_ok' => 1,
        ]);
    }

    private function seedPreviousPrediction(string $level, string $ts = '2026-10-04 16:30:00'): void
    {
        DB::table('occupancy_predictions')->insert([
            'ts' => $ts,
            'ap_id' => self::AP,
            'room_id' => self::ROOM,
            'estimated_count' => 17,
            'level' => $level,
            'confidence' => 0.9,
            'model_version_id' => 1,
        ]);
    }

    private function fakePredictOk(string $level = 'MEDIUM', int $count = 14, float $confidence = 0.92, string $version = 'wp3-20261104-1200'): void
    {
        Http::fake([
            'http://ml.test/predict' => Http::response([
                'ap_id' => self::AP,
                'ts' => self::TS,
                'estimated_count' => $count,
                'level' => $level,
                'confidence' => $confidence,
                'model_version' => $version,
            ], 200),
            'http://ml.test/model' => Http::response([
                'version' => $version,
                'name' => 'model: HistGB semua fitur',
                'features' => ['n_dev'],
                'metrics' => [
                    'mae' => 0.97,
                    'rmse' => 1.31,
                    'accuracy' => 0.842,
                    'f1_score' => 0.81,
                    'precision_score' => 0.83,
                    'recall_score' => 0.79,
                ],
                'metrics_from' => 'holdout',
                'data' => 'pmld_22okt.xlsx',
                'sklearn' => '1.5.2',
            ], 200),
        ]);
    }

    private function service(): InferenceService
    {
        return $this->app->make(InferenceService::class);
    }

    // ---------------------------------------------------------------- kontrak /predict

    public function test_success_stores_prediction_syncs_model_version_and_broadcasts(): void
    {
        $this->fakePredictOk('MEDIUM', 14, 0.92);

        $prediction = $this->service()->processAp(self::AP);

        $this->assertNotNull($prediction);
        $this->assertSame(14, $prediction->estimated_count);
        $this->assertSame('MEDIUM', $prediction->level);
        $this->assertSame(self::ROOM, $prediction->room_id);

        // ts harus persis seperti di poll_log (WIB, tanpa zona).
        $this->assertSame(self::TS, $prediction->ts->format('Y-m-d H:i:s'));

        // Versi model baru aktif + metrik dari GET /model tersimpan.
        $active = DB::table('model_versions')->where('is_active', true)->first();
        $this->assertSame('wp3-20261104-1200', $active->version);
        $this->assertEqualsWithDelta(0.842, (float) $active->accuracy, 0.0001);
        $this->assertEqualsWithDelta(0.97, (float) $active->mae, 0.0001);
        $this->assertSame((int) $active->id, $prediction->model_version_id);

        Event::assertDispatched(OccupancyUpdated::class);
    }

    public function test_404_means_no_prediction_and_no_fallback(): void
    {
        Http::fake(['http://ml.test/predict' => Http::response(['error' => 'polling belum ada di poll_log'], 404)]);

        $this->assertNull($this->service()->processAp(self::AP));
        $this->assertSame(0, DB::table('occupancy_predictions')->count());
    }

    public function test_409_means_no_prediction_and_no_fallback(): void
    {
        Http::fake(['http://ml.test/predict' => Http::response(['error' => 'polling gagal (poll_ok = 0), tidak ada prediksi'], 409)]);

        $this->assertNull($this->service()->processAp(self::AP));
        $this->assertSame(0, DB::table('occupancy_predictions')->count());
    }

    public function test_400_is_rejected_without_fallback(): void
    {
        Http::fake(['http://ml.test/predict' => Http::response(['error' => 'butuh ap_id dan ts'], 400)]);

        $this->assertNull($this->service()->processAp(self::AP));
        $this->assertSame(0, DB::table('occupancy_predictions')->count());
    }

    public function test_503_with_fallback_enabled_stores_heuristic_prediction(): void
    {
        Http::fake(['http://ml.test/predict' => Http::response(['error' => 'database tidak terjangkau'], 503)]);

        $prediction = $this->service()->processAp(self::AP);

        // n_clients = 12 -> pita MEDIUM (<= 25), pakai confidence fallback 0.5.
        $this->assertNotNull($prediction);
        $this->assertSame(12, $prediction->estimated_count);
        $this->assertSame('MEDIUM', $prediction->level);
        $this->assertSame(0.5, $prediction->confidence);
    }

    public function test_503_with_fallback_disabled_skips_prediction(): void
    {
        config(['ml.fallback' => false]);
        Http::fake(['http://ml.test/predict' => Http::response(['error' => 'database tidak terjangkau'], 503)]);

        $this->assertNull($this->service()->processAp(self::AP));
        $this->assertSame(0, DB::table('occupancy_predictions')->count());
    }

    public function test_connection_error_with_fallback_enabled_uses_heuristic(): void
    {
        Http::fake(function () {
            throw new ConnectionException('connection refused');
        });

        $prediction = $this->service()->processAp(self::AP);

        $this->assertNotNull($prediction);
        $this->assertSame('MEDIUM', $prediction->level);
    }

    public function test_same_poll_is_predicted_only_once(): void
    {
        $this->fakePredictOk();

        $first = $this->service()->processAp(self::AP);
        $second = $this->service()->processAp(self::AP);

        $this->assertNotNull($first);
        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, DB::table('occupancy_predictions')->count());
    }

    public function test_failed_poll_is_skipped(): void
    {
        Http::fake();

        DB::table('poll_log')->insert([
            'ts' => '2026-10-04 16:31:00',
            'ap_id' => self::AP,
            'n_clients' => 3,
            'poll_ok' => 0,
        ]);

        // polling gagal adalah yang terbaru -> proses dilewati tanpa panggil ML.
        $this->assertNull($this->service()->processAp(self::AP));
        Http::assertNothingSent();
    }

    // ---------------------------------------------------------------- alert

    public function test_alert_created_on_transition_into_crowded(): void
    {
        $this->seedPreviousPrediction('HIGH');
        $this->fakePredictOk('CROWDED', 45, 0.9);

        $this->service()->processAp(self::AP);

        $this->assertSame(1, DB::table('alerts')->count());
        $alert = DB::table('alerts')->first();
        $this->assertSame('CROWDED', $alert->level);
        $this->assertSame('ACTIVE', $alert->status);

        Event::assertDispatched(CrowdedAlert::class);
    }

    public function test_no_alert_when_already_crowded(): void
    {
        $this->seedPreviousPrediction('CROWDED');
        $this->fakePredictOk('CROWDED', 45, 0.9);

        $this->service()->processAp(self::AP);

        $this->assertSame(0, DB::table('alerts')->count());
        Event::assertNotDispatched(CrowdedAlert::class);
    }

    public function test_cooldown_suppresses_rapid_repeat_alerts(): void
    {
        Carbon::setTestNow('2026-10-04 16:30:00');

        // 1) Transisi HIGH -> CROWDED memicu alert pertama.
        $this->seedPreviousPrediction('HIGH');
        $this->fakePredictOk('CROWDED', 45, 0.9);
        $this->service()->processAp(self::AP);
        $this->assertSame(1, DB::table('alerts')->count());

        // 2) Level turun lalu naik lagi ke CROWDED dalam cooldown -> ditahan.
        $this->seedPreviousPrediction('HIGH', '2026-10-04 16:31:00');
        DB::table('poll_log')->where('ap_id', self::AP)->update(['ts' => '2026-10-04 16:31:30']);
        $this->service()->processAp(self::AP);
        $this->assertSame(1, DB::table('alerts')->count(), 'alert dalam cooldown harus ditahan');

        // 3) Setelah cooldown lewat, transisi baru boleh memicu alert lagi.
        Carbon::setTestNow('2026-10-04 16:40:00');
        $this->seedPreviousPrediction('HIGH', '2026-10-04 16:38:00');
        DB::table('poll_log')->where('ap_id', self::AP)->update(['ts' => '2026-10-04 16:39:45']);
        $this->service()->processAp(self::AP);
        $this->assertSame(2, DB::table('alerts')->count(), 'alert baru boleh dibuat setelah cooldown');

        Carbon::setTestNow();
    }

    public function test_non_trigger_level_never_creates_alert(): void
    {
        $this->seedPreviousPrediction('LOW');
        $this->fakePredictOk('HIGH', 30, 0.9);

        $this->service()->processAp(self::AP);

        $this->assertSame(0, DB::table('alerts')->count());
        Event::assertNotDispatched(CrowdedAlert::class);
    }
}
