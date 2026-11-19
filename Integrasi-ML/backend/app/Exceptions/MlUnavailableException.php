<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * Service ML WP-3 tidak bisa dipakai: 503 / timeout / koneksi gagal setelah retry,
 * atau respons 200 yang bentuknya tidak valid. Error infrastruktur — boleh di-fallback.
 */
class MlUnavailableException extends RuntimeException {}
