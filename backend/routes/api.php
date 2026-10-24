<?php

use App\Http\Controllers\Api\GaussJordanController;
use Illuminate\Support\Facades\Route;

// Responsable: Diego
Route::get('/health', [GaussJordanController::class, 'health'])->name('api.health');
Route::post('/gauss-jordan/solve', [GaussJordanController::class, 'solve'])->name('api.gauss-jordan.solve');

// Responsable: Jacob (pendiente)
// Route::post('/gauss-jordan/steps.pdf', ...)  → debe reutilizar GaussJordanService
// Route::get('/gauss-jordan/examples', ...)
