<?php

namespace App\Services\GaussJordan;

/**
 * Registro de una operación elemental entre filas.
 *
 * Cada paso del procedimiento se guarda con la matriz Antes, la matriz
 * Después, la fila modificada y el cálculo término a término, para que el
 * frontend solo tenga que mostrarlo (nunca recalcula).
 *
 * Las filas y columnas se numeran desde 1 en la salida JSON.
 *
 * Responsable: Diego.
 */
final class MatrixOperation
{
    public const SWAP = 'swap';          // Fi ↔ Fj

    public const SCALE = 'scale';        // Fi → k·Fi

    public const ELIMINATE = 'eliminate'; // Fi → Fi − k·Fj

    /**
     * @param  list<int>  $modifiedRows  filas que cambiaron (base 1)
     * @param  list<string>  $calculation  cálculo legible por columna
     * @param  list<list<RationalNumber>>  $before
     * @param  list<list<RationalNumber>>  $after
     * @param  array{row:int,column:int,value:RationalNumber}|null  $pivot
     */
    public function __construct(
        public readonly int $index,
        public readonly string $type,
        public readonly string $notation,
        public readonly string $description,
        public readonly int $targetRow,
        public readonly ?int $sourceRow,
        public readonly ?RationalNumber $factor,
        public readonly ?array $pivot,
        public readonly array $modifiedRows,
        public readonly array $calculation,
        public readonly array $before,
        public readonly array $after,
    ) {}

    public function toArray(): array
    {
        return [
            'index' => $this->index,
            'type' => $this->type,
            'notation' => $this->notation,
            'description' => $this->description,
            'target_row' => $this->targetRow,
            'source_row' => $this->sourceRow,
            'factor' => $this->factor?->toString(),
            'pivot' => $this->pivot === null ? null : [
                'row' => $this->pivot['row'],
                'column' => $this->pivot['column'],
                'value' => $this->pivot['value']->toString(),
            ],
            'modified_rows' => $this->modifiedRows,
            'calculation' => $this->calculation,
            'before' => self::matrixToStrings($this->before),
            'after' => self::matrixToStrings($this->after),
        ];
    }

    /**
     * @param  list<list<RationalNumber>>  $matrix
     * @return list<list<string>>
     */
    public static function matrixToStrings(array $matrix): array
    {
        return array_map(
            fn (array $row) => array_map(fn (RationalNumber $v) => $v->toString(), $row),
            $matrix,
        );
    }
}
