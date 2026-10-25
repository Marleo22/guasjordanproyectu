<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Sobre de respuesta de /solve. Todos los campos existen siempre;
 * `classification` decide qué valores son válidos (ver docs/API-SOLVE.md).
 *
 * Responsable: Diego (contrato de salida).
 */
class SolveSystemResource extends JsonResource
{
    /** Sin envoltura "data": el contrato es el objeto plano. */
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $r = $this->resource;

        return [
            'size' => $r['size'],
            'rows' => $r['rows'],
            'columns' => $r['columns'],
            'variables' => $r['variables'],
            'rank' => $r['rank'],
            'augmented_rank' => $r['augmented_rank'],
            'classification' => $r['classification'],
            'solution' => $r['solution'],
            'free_variables' => $r['free_variables'],
            'parameters' => (object) $r['parameters'],
            'contradiction' => $r['contradiction'],
            'verification' => $r['verification'],
            'initial_matrix' => $r['initial_matrix'],
            'steps' => $r['steps'],
            'rref' => $r['rref'],
        ];
    }
}
