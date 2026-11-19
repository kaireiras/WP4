#!/bin/sh
set -e

# Pastikan subdirektori storage dan bootstrap/cache tersedia
mkdir -p /app/storage/framework/cache/data \
         /app/storage/framework/sessions \
         /app/storage/framework/views \
         /app/storage/logs \
         /app/bootstrap/cache

# Jika tidak ada argumen, jalankan FrankenPHP web server secara default
if [ $# -eq 0 ]; then
    set -- frankenphp php-server --root public/
fi

# Jika argumen pertama adalah flag (dimulai dengan '-')
if [ "${1#-}" != "$1" ]; then
    set -- frankenphp php-server --root public/ "$@"
fi

# Mode Reverb: Jalankan Laravel Reverb WebSocket Server
if [ "$1" = 'reverb' ]; then
    shift
    echo "Starting Laravel Reverb WebSocket Server on port ${REVERB_SERVER_PORT:-8080}..."
    exec php artisan reverb:start --host="${REVERB_SERVER_HOST:-0.0.0.0}" --port="${REVERB_SERVER_PORT:-8080}" "$@"
fi

# Mode Queue: Jalankan Laravel Queue Worker
if [ "$1" = 'queue' ]; then
    shift
    echo "Starting Laravel Queue Worker..."
    exec php artisan queue:work --tries=3 --timeout=90 "$@"
fi

# Mode Scheduler: Jalankan Laravel Schedule Worker
if [ "$1" = 'scheduler' ]; then
    shift
    echo "Starting Laravel Schedule Worker..."
    exec php artisan schedule:work "$@"
fi

# Mode Artisan: Jalankan php artisan dengan argumen berikutnya
if [ "$1" = 'artisan' ]; then
    shift
    exec php artisan "$@"
fi

# Mode Default: Eksekusi command yang diberikan
exec "$@"
