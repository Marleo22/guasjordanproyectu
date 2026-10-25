<?php

namespace App\Services\GaussJordan;

/**
 * Discriminador del sobre de respuesta (`classification`).
 *
 * - Unique:       rango(A) = rango([A|b]) = n
 * - Infinite:     rango(A) = rango([A|b]) < n  → hay variables libres
 * - Inconsistent: rango(A) < rango([A|b])      → aparece una fila 0 = k (k ≠ 0)
 *
 * Responsable: Diego.
 */
enum SystemClassification: string
{
    case Unique = 'unique';
    case Infinite = 'infinite';
    case Inconsistent = 'inconsistent';

    public function label(): string
    {
        return match ($this) {
            self::Unique => 'Solución única',
            self::Infinite => 'Infinitas soluciones',
            self::Inconsistent => 'Sin solución',
        };
    }
}
