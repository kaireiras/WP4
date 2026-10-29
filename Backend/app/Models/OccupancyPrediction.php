<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OccupancyPrediction extends Model
{
    // Nama tabel di database MySQL
    protected $table = 'occupancy_predictions';

    // Matikan timestamps bawaan Laravel karena tabel ini memakai kolom ts
    public $timestamps = false;

    // Kolom yang boleh diisi secara massal (Mass Assignment)
    protected $fillable = [
        'ts',
        'ap_id',
        'room_id',
        'estimated_count',
        'level',
        'confidence',
        'model_version_id',
    ];

    // Konversi tipe data otomatis saat data diakses
    protected $casts = [
        'ts' => 'datetime',
        'estimated_count' => 'integer',
        'confidence' => 'float',
    ];

    /**
     * Relasi ke model versi ML yang digunakan saat prediksi dibuat.
     */
    public function modelVersion(): BelongsTo
    {
        return $this->belongsTo(ModelVersion::class, 'model_version_id');
    }
}