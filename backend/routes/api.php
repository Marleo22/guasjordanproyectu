<?php

use App\Http\Controllers\Api\GaussJordanController;
use App\Http\Controllers\Api\GaussJordanSupportController;
use Illuminate\Support\Facades\Route;

// Responsable: Diego
Route::get('/health', [GaussJordanController::class, 'health'])->name('api.health');
Route::post('/gauss-jordan/solve', [GaussJordanController::class, 'solve'])->name('api.gauss-jordan.solve');

// Responsable: Jacob
Route::post('/gauss-jordan/steps.pdf', [GaussJordanSupportController::class, 'stepsPdf'])
    ->name('api.gauss-jordan.steps-pdf');
Route::get('/gauss-jordan/examples', [GaussJordanSupportController::class, 'examples'])
    ->name('api.gauss-jordan.examples');
