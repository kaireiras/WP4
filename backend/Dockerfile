# ==============================================================================
# TAHAP 1: BUILDER (Tahap Membangun)
# Lingkungan build: Composer dan seluruh dependensi aplikasi dipersiapkan di sini.
# ==============================================================================
FROM dunglas/frankenphp:1-php8.4-alpine AS builder

# Salin biner Composer dari image resmi composer:2 (version pinning)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Salin berkas manifes dependensi untuk mengoptimalkan layer cache
COPY composer.json composer.lock ./

# Unduh dan pasang dependensi produksi
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-plugins \
    --no-scripts \
    --prefer-dist \
    --no-autoloader

# Salin seluruh source code aplikasi ke builder
COPY . /app

# Hapus cache lokal (jika ada) dan generate autoloader teroptimasi untuk produksi
RUN rm -f bootstrap/cache/*.php \
    && composer dump-autoload --optimize --no-dev --no-scripts


# ==============================================================================
# TAHAP 2: RUNNER (Tahap Menjalankan / Melayani Aplikasi)
# Image runtime ramping berbasis Alpine, hanya memuat dependensi yang dibutuhkan
# saat melayani request web, WebSocket Reverb, dan Queue Worker.
# ==============================================================================
FROM dunglas/frankenphp:1-php8.4-alpine AS runner

# Pasang curl CLI serta ekstensi PHP esensial yang diperlukan Laravel dan Reverb
RUN apk add --no-cache curl \
    && install-php-extensions \
        pdo_mysql \
        redis \
        pcntl \
        posix \
        sockets \
        gd \
        intl \
        zip \
        bcmath \
        opcache \
        curl \
        mbstring

WORKDIR /app

# Salin seluruh source code dan vendor yang telah siap dari tahap builder
COPY --from=builder /app /app

# Salin entrypoint script ke direktori bin sistem
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Konfigurasi direktori runtime Caddy dan perizinan hak akses direktori Laravel
RUN mkdir -p /data/caddy /config/caddy \
             /app/storage/framework/cache/data \
             /app/storage/framework/sessions \
             /app/storage/framework/views \
             /app/storage/logs \
             /app/bootstrap/cache \
    && rm -f /app/bootstrap/cache/*.php \
    && chown -R www-data:www-data /data/caddy /config/caddy /app/storage /app/bootstrap/cache \
    && chmod -R 775 /app/storage /app/bootstrap/cache

# Menjalankan container dengan non-root user (Principle of Least Privilege)
USER www-data

# Konfigurasi HEALTHCHECK default untuk memantau status kesehatan server FrankenPHP
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1/up || exit 1

# Port yang diekspos oleh FrankenPHP (80) dan Reverb (8080)
EXPOSE 80 8080

ENTRYPOINT ["docker-entrypoint.sh"]

# Perintah default menjalankan server web FrankenPHP
CMD ["frankenphp", "php-server", "--root", "public/"]
