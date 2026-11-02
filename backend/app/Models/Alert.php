<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    protected $table = 'alerts';

    public $timestamps = false;

    protected $fillable = [
        'triggered_at',
        'ap_id',
        'room_id',
        'level',
        'estimated_count',
        'status',
        'acknowledged_at'
    ];

    protected $casts = [
        'triggered_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'estimated_count' => 'integer'
    ];

    
}
