<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModelVersion extends Model
{
    protected $table = 'model_versions';
    public $timestamps = false;

    protected $fillable = [
        'version',
        'is_active',
        'deployed_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'deployed_at' => 'datetime',
    ];
}