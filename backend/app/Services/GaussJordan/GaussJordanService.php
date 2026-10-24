<?php

namespace App\Services\GaussJordan;

use InvalidArgumentException;

/**
 * Resuelve sistemas lineales n × n (2 ≤ n ≤ 5) con eliminación de Gauss-Jordan
 * usando aritmética racional exacta, y registra cada operación elemental.
 *
 * Es la ÚNICA fuente de verdad del cálculo: /solve y /steps.pdf usan este
 * servicio; el frontend solo presenta lo que devuelve.
 *
 * Estrategia (en cada columna de coeficientes, de izquierda a derecha):
 *   1. Buscar el primer valor distinto de cero desde la fila del pivote hacia abajo.
 *      Si no hay ninguno, la columna no tiene pivote (variable libre) y se sigue.
 *   2. Si ese valor no está en la fila del pivote, intercambiar filas.
 *   3. Si el pivote no es 1, multiplicar su fila por el recíproco.
 *   4. Hacer 0 todos los demás valores de la columna (arriba y abajo).
 * Al final, las filas sin pivote se ordenan: primero las contradicciones
 * (0 = k, k ≠ 0) y al último las filas nulas (0 = 0).
 *
 * Responsable: Diego.
 */
final class GaussJordanService
{
    public const MIN_SIZE = 2;

    public const MAX_SIZE = 5;

    /** Nombres de las incógnitas, en orden de columna. */
    public const VARIABLES = ['a', 'b', 'c', 'd', 'e'];

    /** Nombres de los parámetros para variables libres. */
    public const PARAMETERS = ['t', 's', 'r', 'q', 'p'];

    /** @var list<MatrixOperation> */
    private array $steps = [];

    /**
     * @param  list<list<string|int|RationalNumber>>  $input  matriz aumentada [A | b]
     * @return array<string, mixed> sobre de respuesta del contrato
     *
     * @throws InvalidArgumentException si el tamaño o algún valor no es válido.
     */
    public function solve(int $size, array $input): array
    {
        $this->steps = [];

        $initial = $this->toRationalMatrix($size, $input);
        $matrix = $initial;

        /** @var array<int, int> $pivotColumns fila (base 0) => columna (base 0) */
        $pivotColumns = [];
        $pivotRow = 0;

        for ($col = 0; $col < $size && $pivotRow < $size; $col++) {
            $found = $this->findPivotRow($matrix, $col, $pivotRow);

            if ($found === null) {
                continue; // columna sin pivote → variable libre
            }

            if ($found !== $pivotRow) {
                $matrix = $this->swap($matrix, $pivotRow, $found, $col, sprintf(
                    'El pivote de la columna %d en la fila %d es 0; se intercambia la fila %d con la fila %d, que tiene un valor distinto de cero en esa columna.',
                    $col + 1, $pivotRow + 1, $pivotRow + 1, $found + 1,
                ));
            }

            $pivot = $matrix[$pivotRow][$col];
            if (! $pivot->isOne()) {
                $matrix = $this->scale($matrix, $pivotRow, $pivot->reciprocal(), $col);
            }

            for ($row = 0; $row < $size; $row++) {
                if ($row === $pivotRow || $matrix[$row][$col]->isZero()) {
                    continue;
                }
                $matrix = $this->eliminate($matrix, $row, $pivotRow, $matrix[$row][$col], $col);
            }

            $pivotColumns[$pivotRow] = $col;
            $pivotRow++;
        }

        $rank = $pivotRow;
        $matrix = $this->moveZeroRowsDown($matrix, $rank, $size);

        return $this->buildResult($size, $initial, $matrix, $pivotColumns, $rank);
    }

    // ── Operaciones elementales ─────────────────────────────────────────

    private function swap(array $matrix, int $rowA, int $rowB, ?int $col, string $description): array
    {
        $before = $matrix;
        [$matrix[$rowA], $matrix[$rowB]] = [$matrix[$rowB], $matrix[$rowA]];

        $this->record(
            type: MatrixOperation::SWAP,
            notation: sprintf('F%d ↔ F%d', $rowA + 1, $rowB + 1),
            description: $description,
            targetRow: $rowA + 1,
            sourceRow: $rowB + 1,
            factor: null,
            pivot: $col === null ? null : ['row' => $rowA + 1, 'column' => $col + 1, 'value' => $matrix[$rowA][$col]],
            modifiedRows: [$rowA + 1, $rowB + 1],
            calculation: [
                sprintf('F%d: %s  →  ahora es F%d', $rowB + 1, $this->rowText($before[$rowB]), $rowA + 1),
                sprintf('F%d: %s  →  ahora es F%d', $rowA + 1, $this->rowText($before[$rowA]), $rowB + 1),
            ],
            before: $before,
            after: $matrix,
        );

        return $matrix;
    }

    private function scale(array $matrix, int $row, RationalNumber $factor, int $col): array
    {
        $before = $matrix;
        $calculation = [];

        foreach ($matrix[$row] as $j => $value) {
            $matrix[$row][$j] = $value->multipliedBy($factor);
            $calculation[] = sprintf('%s·%s = %s', $this->paren($factor), $this->paren($value), $matrix[$row][$j]);
        }

        $this->record(
            type: MatrixOperation::SCALE,
            notation: sprintf('F%d → %sF%d', $row + 1, $this->coefficient($factor), $row + 1),
            description: sprintf(
                'Se multiplica la fila %d por %s para que el pivote de la columna %d sea 1.',
                $row + 1, $factor, $col + 1,
            ),
            targetRow: $row + 1,
            sourceRow: null,
            factor: $factor,
            pivot: ['row' => $row + 1, 'column' => $col + 1, 'value' => $before[$row][$col]],
            modifiedRows: [$row + 1],
            calculation: $calculation,
            before: $before,
            after: $matrix,
        );

        return $matrix;
    }

    /** Fila objetivo → fila objetivo − factor · fila pivote. */
    private function eliminate(array $matrix, int $target, int $source, RationalNumber $factor, int $col): array
    {
        $before = $matrix;
        $calculation = [];
        $sign = $factor->isNegative() ? '+' : '-';
        $magnitude = $factor->abs();

        foreach ($matrix[$target] as $j => $value) {
            $matrix[$target][$j] = $value->minus($factor->multipliedBy($matrix[$source][$j]));
            $calculation[] = sprintf(
                '%s %s %s·%s = %s',
                $value, $sign, $this->paren($magnitude), $this->paren($matrix[$source][$j]), $matrix[$target][$j],
            );
        }

        $this->record(
            type: MatrixOperation::ELIMINATE,
            notation: sprintf('F%d → F%d %s %sF%d', $target + 1, $target + 1, $sign, $this->coefficient($magnitude), $source + 1),
            description: sprintf(
                'Se %s %s %s la fila %d %s la fila %d para hacer 0 la columna %d.',
                $factor->isNegative() ? 'suma' : 'resta',
                $magnitude,
                $magnitude->isOne() ? 'vez' : 'veces',
                $source + 1,
                $factor->isNegative() ? 'a' : 'de',
                $target + 1,
                $col + 1,
            ),
            targetRow: $target + 1,
            sourceRow: $source + 1,
            factor: $factor,
            pivot: ['row' => $source + 1, 'column' => $col + 1, 'value' => $matrix[$source][$col]],
            modifiedRows: [$target + 1],
            calculation: $calculation,
            before: $before,
            after: $matrix,
        );

        return $matrix;
    }

    /**
     * Las filas desde $rank tienen todos sus coeficientes en 0.
     * Se suben las contradicciones (0 = k) y las filas 0 = 0 quedan al final.
     */
    private function moveZeroRowsDown(array $matrix, int $rank, int $size): array
    {
        $next = $rank;

        for ($row = $rank; $row < $size; $row++) {
            if ($matrix[$row][$size]->isZero()) {
                continue;
            }
            if ($row !== $next) {
                $matrix = $this->swap($matrix, $next, $row, null, sprintf(
                    'Se intercambia la fila %d con la fila %d para dejar las filas nulas (0 = 0) al final.',
                    $next + 1, $row + 1,
                ));
            }
            $next++;
        }

        return $matrix;
    }

    private function findPivotRow(array $matrix, int $col, int $fromRow): ?int
    {
        for ($row = $fromRow; $row < count($matrix); $row++) {
            if (! $matrix[$row][$col]->isZero()) {
                return $row;
            }
        }

        return null;
    }

    private function record(
        string $type, string $notation, string $description, int $targetRow, ?int $sourceRow,
        ?RationalNumber $factor, ?array $pivot, array $modifiedRows, array $calculation, array $before, array $after,
    ): void {
        $this->steps[] = new MatrixOperation(
            index: count($this->steps) + 1,
            type: $type,
            notation: $notation,
            description: $description,
            targetRow: $targetRow,
            sourceRow: $sourceRow,
            factor: $factor,
            pivot: $pivot,
            modifiedRows: $modifiedRows,
            calculation: $calculation,
            before: $before,
            after: $after,
        );
    }

    // ── Clasificación y respuesta ───────────────────────────────────────

    private function buildResult(int $size, array $initial, array $rref, array $pivotColumns, int $rank): array
    {
        $variables = array_slice(self::VARIABLES, 0, $size);

        $result = [
            'size' => $size,
            'variables' => $variables,
            'classification' => null,
            'solution' => null,
            'free_variables' => [],
            'parameters' => (object) [],
            'contradiction' => null,
            'verification' => [],
            'initial_matrix' => MatrixOperation::matrixToStrings($initial),
            'steps' => array_map(fn (MatrixOperation $s) => $s->toArray(), $this->steps),
            'rref' => MatrixOperation::matrixToStrings($rref),
        ];

        // ¿Hay una fila 0 = k con k ≠ 0? (tras el reordenamiento, es la fila $rank)
        if ($rank < $size && ! $rref[$rank][$size]->isZero()) {
            $result['classification'] = SystemClassification::Inconsistent->value;
            $result['contradiction'] = [
                'row' => $rank + 1,
                'left' => '0',
                'right' => $rref[$rank][$size]->toString(),
                'equation' => implode(' + ', array_map(fn ($v) => '0'.$v, $variables)).' = '.$rref[$rank][$size],
            ];

            return $result;
        }

        if ($rank === $size) {
            $solution = [];
            foreach ($variables as $i => $name) {
                $solution[$name] = $rref[$i][$size];
            }

            $result['classification'] = SystemClassification::Unique->value;
            $result['solution'] = array_map(fn (RationalNumber $v) => $v->toString(), $solution);
            $result['verification'] = $this->verify($initial, array_values($solution), $size);

            return $result;
        }

        // Infinitas soluciones: columnas sin pivote = variables libres.
        $freeColumns = array_values(array_diff(range(0, $size - 1), $pivotColumns));
        $paramFor = [];
        foreach ($freeColumns as $k => $col) {
            $paramFor[$col] = self::PARAMETERS[$k];
        }

        $parameters = [];
        $rowOfPivot = array_flip($pivotColumns);
        foreach ($variables as $col => $name) {
            if (isset($paramFor[$col])) {
                $parameters[$name] = $paramFor[$col];

                continue;
            }
            $row = $rowOfPivot[$col];
            $terms = [];
            foreach ($freeColumns as $free) {
                $terms[$paramFor[$free]] = $rref[$row][$free]->negated();
            }
            $parameters[$name] = $this->linearExpression($rref[$row][$size], $terms);
        }

        $result['classification'] = SystemClassification::Infinite->value;
        $result['free_variables'] = array_map(fn ($c) => $variables[$c], $freeColumns);
        $result['parameters'] = $parameters;

        return $result;
    }

    /** Sustituye la solución en las ecuaciones originales. */
    private function verify(array $initial, array $solution, int $size): array
    {
        $checks = [];

        foreach ($initial as $i => $row) {
            $left = RationalNumber::zero();
            for ($j = 0; $j < $size; $j++) {
                $left = $left->plus($row[$j]->multipliedBy($solution[$j]));
            }

            $checks[] = [
                'equation' => $i + 1,
                'left' => $left->toString(),
                'right' => $row[$size]->toString(),
                'ok' => $left->equals($row[$size]),
            ];
        }

        return $checks;
    }

    // ── Entrada y formato ───────────────────────────────────────────────

    /** @return list<list<RationalNumber>> */
    private function toRationalMatrix(int $size, array $input): array
    {
        if ($size < self::MIN_SIZE || $size > self::MAX_SIZE) {
            throw new InvalidArgumentException(sprintf('El tamaño debe estar entre %d y %d.', self::MIN_SIZE, self::MAX_SIZE));
        }

        $input = array_values($input);
        if (count($input) !== $size) {
            throw new InvalidArgumentException("La matriz debe tener {$size} filas.");
        }

        $matrix = [];
        foreach ($input as $i => $row) {
            if (! is_array($row) || count($row) !== $size + 1) {
                throw new InvalidArgumentException(sprintf('La fila %d debe tener %d valores.', $i + 1, $size + 1));
            }
            $matrix[] = array_map(
                fn ($v) => $v instanceof RationalNumber ? $v : RationalNumber::of(is_int($v) ? $v : (string) $v),
                array_values($row),
            );
        }

        return $matrix;
    }

    /** "1 - t", "-2/3 + (1/2)t - s", "t"… */
    private function linearExpression(RationalNumber $constant, array $terms): string
    {
        $out = $constant->isZero() ? '' : $constant->toString();

        foreach ($terms as $param => $coef) {
            /** @var RationalNumber $coef */
            if ($coef->isZero()) {
                continue;
            }
            $body = $this->coefficient($coef->abs()).$param;
            $out .= $out === ''
                ? ($coef->isNegative() ? '-' : '').$body
                : ($coef->isNegative() ? ' - ' : ' + ').$body;
        }

        return $out === '' ? '0' : $out;
    }

    /** Coeficiente delante de una fila o parámetro: "", "-", "3", "(1/2)". */
    private function coefficient(RationalNumber $value): string
    {
        if ($value->isOne()) {
            return '';
        }
        if ($value->negated()->isOne()) {
            return '-';
        }

        return $value->isInteger() ? $value->toString() : '('.$value.')';
    }

    /** Agrega paréntesis a negativos y fracciones dentro de un producto. */
    private function paren(RationalNumber $value): string
    {
        return $value->isNegative() || ! $value->isInteger() ? '('.$value.')' : $value->toString();
    }

    private function rowText(array $row): string
    {
        $values = array_map(fn (RationalNumber $v) => $v->toString(), $row);
        $rhs = array_pop($values);

        return '['.implode(', ', $values).' | '.$rhs.']';
    }
}
