<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Channel untuk monitoring trafik dan okupansi (Public/Terbuka)
Broadcast::channel('metrics.live', function () {
    return true;
});
