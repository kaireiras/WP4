<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApRegistry extends Model
{
    protected $table = 'ap_registry';
    protected $primaryKey = 'ap_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // Menggunakan default created_at bawaan SQL

    protected $fillable = [
        'ap_id',
        'ip_address',
        'snmp_community',
    ];
}