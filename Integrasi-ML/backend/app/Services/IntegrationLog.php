<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Psr\Log\LoggerInterface;

/**
 * Channel log untuk bagian integrasi ML (model integration / alert / logging).
 *
 * Dibuat on-the-fly dengan Log::build() supaya config/logging.php milik tim
 * backend tidak perlu diubah. Setiap channel menulis ke
 * storage/logs/<nama>-YYYY-MM-DD.log (rotasi harian, disimpan 30 hari).
 */
final class IntegrationLog
{
    /** @var array<string, LoggerInterface> */
    private static array $instances = [];

    public static function ml(): LoggerInterface
    {
        return self::make('ml');
    }

    public static function inference(): LoggerInterface
    {
        return self::make('inference');
    }

    public static function alerts(): LoggerInterface
    {
        return self::make('alerts');
    }

    private static function make(string $name): LoggerInterface
    {
        return self::$instances[$name] ??= Log::build([
            'driver' => 'daily',
            'path' => storage_path("logs/{$name}.log"),
            'level' => 'debug',
            'days' => 30,
            'replace_placeholders' => true,
        ]);
    }
}
