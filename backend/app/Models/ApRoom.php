<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApRoom extends Model
{
    protected $table = 'ap_rooms';
    protected $primaryKey = 'ap_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = ['ap_id', 'room_id'];
}