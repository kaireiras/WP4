<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * Input ditolak service ML WP-3 (HTTP 400).
 * Ini menandakan bug di sisi kita (payload salah), jadi TIDAK boleh di-fallback.
 */
class MlRequestException extends RuntimeException {}
