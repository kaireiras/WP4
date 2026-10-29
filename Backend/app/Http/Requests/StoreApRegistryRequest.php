<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApRegistryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ap_id' => 'required|string|max:20|unique:ap_registry,ap_id',
            'ip_address' => 'required|ip',
            'snmp_community' => 'required|string|max:50',
        ];
    }
}