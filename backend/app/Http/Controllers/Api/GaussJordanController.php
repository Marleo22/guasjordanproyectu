<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SolveSystemRequest;
use App\Http\Resources\SolveSystemResource;
use App\Services\GaussJordan\GaussJordanService;
use Illuminate\Http\JsonResponse;

/**
 * Controlador delgado: no contiene matemáticas.
 * Valida (Form Request) → resuelve (servicio) → serializa (Resource).
 *
 * Responsable: Diego (/solve y /health).
 */
class GaussJordanController extends Controller
{
    public function __construct(private readonly GaussJordanService $solver) {}

    /** POST /api/gauss-jordan/solve */
    public function solve(SolveSystemRequest $request): SolveSystemResource
    {
        return new SolveSystemResource(
            $this->solver->solve($request->size(), $request->matrix()),
        );
    }

    /** GET /api/health */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'gauss-jordan-api',
            'version' => '1.0.0',
            'sizes' => ['min' => GaussJordanService::MIN_SIZE, 'max' => GaussJordanService::MAX_SIZE],
            'time' => now()->toIso8601String(),
        ]);
    }
}
