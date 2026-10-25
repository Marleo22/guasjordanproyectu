<?php

namespace App\Services\GaussJordan;

use InvalidArgumentException;

/**
 * Resuelve sistemas lineales con 2–5 ecuaciones y 2–5 incógnitas mediante Gauss-Jordan
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

    public const MIN_ROWS = 2;

    public const MAX_ROWS = 5;

    public const MIN_COLUMNS = 2;

    public const MAX_COLUMNS = 5;

    /** Nombres de las incógnitas, en orden de columna. */
    public const VARIABLES = ['a', 'b', 'c', 'd', 'e'];

    /** Nombres de los parámetros para variables libres. */
    public const PARAMETERS = ['t', 's', 'r', 'q', 'p'];

    /** @var list<MatrixOperation> */
    private array $steps = [];

    /**
     * Compatibilidad con el contrato histórico para sistemas cuadrados.
     *
     * @param list<list<string|int|float|RationalNumber>> $input
     * @return array<string, mixed>
     */
    public function solve(int $size, array $input): array
    {
        return $this->solveDimensions($size, $size, $input);
    }

    /**
     * Resuelve sistemas de 2–5 ecuaciones y 2–5 incógnitas.
     * La matriz aumentada debe tener $rows filas y $columns + 1 columnas.
     *
     * @param list<list<string|int|float|RationalNumber>> $input
     * @return array<string, mixed>
     */
    public function solveDimensions(int $rows, int $columns, array $input): array
    {
        $this->steps = [];
        $initial = $this->toRationalMatrix($rows, $columns, $input);
        $matrix = $initial;
        /** @var array<int, int> $pivotColumns fila pivote => columna pivote (base 0) */
        $pivotColumns = [];
        $pivotRow = 0;

        for ($column = 0; $column < $columns && $pivotRow < $rows; $column++) {
            $found = $this->findPivotRow($matrix, $column, $pivotRow);
            if ($found === null) {
                continue;
            }
            if ($found !== $pivotRow) {
                $matrix = $this->swap($matrix, $pivotRow, $found, $column, sprintf(
                    'El pivote de la columna %d en la fila %d es 0; se intercambia con la fila %d, que tiene un valor distinto de cero.',
                    $column + 1, $pivotRow + 1, $found + 1,
                ));
            }

            $pivot = $matrix[$pivotRow][$column];
            if (! $pivot->isOne()) {
                $matrix = $this->scale($matrix, $pivotRow, $pivot->reciprocal(), $column);
            }
            for ($row = 0; $row < $rows; $row++) {
                if ($row === $pivotRow || $matrix[$row][$column]->isZero()) {
                    continue;
                }
                $matrix = $this->eliminate($matrix, $row, $pivotRow, $matrix[$row][$column], $column);
            }
            $pivotColumns[$pivotRow] = $column;
            $pivotRow++;
        }

        $rank = $pivotRow;
        $matrix = $this->moveContradictionsBeforeZeroRows($matrix, $rank, $rows, $columns);

        return $this->buildResult($rows, $columns, $initial, $matrix, $pivotColumns, $rank);
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

    /** Coloca las filas contradictorias antes de las filas 0 = 0. */
    private function moveContradictionsBeforeZeroRows(array $matrix, int $rank, int $rows, int $columns): array
    {
        $next = $rank;
        for ($row = $rank; $row < $rows; $row++) {
            if ($matrix[$row][$columns]->isZero()) {
                continue;
            }
            if ($row !== $next) {
                $matrix = $this->swap(
                    $matrix,
                    $next,
                    $row,
                    null,
                    sprintf('Se mueve la contradicción de la fila %d antes de las filas nulas.', $row + 1),
                );
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

    /** @return array<string, mixed> */
    private function buildResult(int $rows, int $columns, array $initial, array $rref, array $pivotColumns, int $rank): array
    {
        $variables = array_slice(self::VARIABLES, 0, $columns);
        $rowOfPivot = array_flip($pivotColumns);
        $result = [
            'size' => $rows === $columns ? $rows : null,
            'rows' => $rows,
            'columns' => $columns,
            'variables' => $variables,
            'classification' => null,
            'solution' => null,
            'free_variables' => [],
            'parameters' => (object) [],
            'contradiction' => null,
            'verification' => [],
            'initial_matrix' => MatrixOperation::matrixToStrings($initial),
            'steps' => array_map(fn (MatrixOperation $step): array => $step->toArray(), $this->steps),
            'rref' => MatrixOperation::matrixToStrings($rref),
        ];

        if ($rank < $rows && ! $rref[$rank][$columns]->isZero()) {
            $result['classification'] = SystemClassification::Inconsistent->value;
            $result['contradiction'] = [
                'row' => $rank + 1,
                'left' => '0',
                'right' => $rref[$rank][$columns]->toString(),
                'equation' => implode(' + ', array_map(static fn (string $variable): string => '0'.$variable, $variables)).' = '.$rref[$rank][$columns],
            ];

            return $result;
        }

        if ($rank === $columns) {
            $solution = [];
            foreach ($variables as $column => $name) {
                $pivotRow = $rowOfPivot[$column];
                $solution[$name] = $rref[$pivotRow][$columns];
            }
            $result['classification'] = SystemClassification::Unique->value;
            $result['solution'] = array_map(static fn (RationalNumber $value): string => $value->toString(), $solution);
            $result['verification'] = $this->verify($initial, array_values($solution), $columns);

            return $result;
        }

        $pivotColumnIndexes = array_values($pivotColumns);
        $freeColumns = array_values(array_diff(range(0, $columns - 1), $pivotColumnIndexes));
        $parameterForColumn = [];
        foreach ($freeColumns as $index => $column) {
            $parameterForColumn[$column] = self::PARAMETERS[$index];
        }

        $parameters = [];
        foreach ($variables as $column => $name) {
            if (isset($parameterForColumn[$column])) {
                $parameters[$name] = $parameterForColumn[$column];
                continue;
            }
            $pivotRow = $rowOfPivot[$column];
            $terms = [];
            foreach ($freeColumns as $freeColumn) {
                $terms[$parameterForColumn[$freeColumn]] = $rref[$pivotRow][$freeColumn]->negated();
            }
            $parameters[$name] = $this->linearExpression($rref[$pivotRow][$columns], $terms);
        }

        $result['classification'] = SystemClassification::Infinite->value;
        $result['free_variables'] = array_map(static fn (int $column): string => $variables[$column], $freeColumns);
        $result['parameters'] = $parameters;

        return $result;
    }

    /** @return list<array{equation:int,left:string,right:string,ok:bool}> */
    private function verify(array $initial, array $solution, int $columns): array
    {
        $checks = [];
        foreach ($initial as $rowIndex => $row) {
            $left = RationalNumber::zero();
            for ($column = 0; $column < $columns; $column++) {
                $left = $left->plus($row[$column]->multipliedBy($solution[$column]));
            }
            $checks[] = [
                'equation' => $rowIndex + 1,
                'left' => $left->toString(),
                'right' => $row[$columns]->toString(),
                'ok' => $left->equals($row[$columns]),
            ];
        }

        return $checks;
    }

    // ── Entrada y formato ───────────────────────────────────────────────

    /** @return list<list<RationalNumber>> */
    private function toRationalMatrix(int $rows, int $columns, array $input): array
    {
        if ($rows < self::MIN_ROWS || $rows > self::MAX_ROWS) {
            throw new InvalidArgumentException(sprintf('El número de ecuaciones debe estar entre %d y %d.', self::MIN_ROWS, self::MAX_ROWS));
        }
        if ($columns < self::MIN_COLUMNS || $columns > self::MAX_COLUMNS) {
            throw new InvalidArgumentException(sprintf('El número de incógnitas debe estar entre %d y %d.', self::MIN_COLUMNS, self::MAX_COLUMNS));
        }
        $input = array_values($input);
        if (count($input) !== $rows) {
            throw new InvalidArgumentException("La matriz debe tener {$rows} filas.");
        }

        $matrix = [];
        foreach ($input as $index => $row) {
            if (! is_array($row) || count($row) !== $columns + 1) {
                throw new InvalidArgumentException(sprintf('La ecuación %d debe tener %d valores (coeficientes y término independiente).', $index + 1, $columns + 1));
            }
            $matrix[] = array_map(
                static fn ($value): RationalNumber => $value instanceof RationalNumber
                    ? $value
                    : RationalNumber::of(is_int($value) ? $value : (string) $value),
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
