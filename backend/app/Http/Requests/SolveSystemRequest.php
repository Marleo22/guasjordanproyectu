<?php

namespace App\Http\Requests;

use App\Services\GaussJordan\GaussJordanService;
use App\Services\GaussJordan\RationalNumber;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use LogicException;

/** Validates both the legacy square contract (`size`) and the rectangular contract. */
class SolveSystemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'size' => ['sometimes', 'required', 'integer', 'between:'.GaussJordanService::MIN_SIZE.','.GaussJordanService::MAX_SIZE],
            'rows' => ['sometimes', 'required', 'integer', 'between:'.GaussJordanService::MIN_ROWS.','.GaussJordanService::MAX_ROWS],
            'columns' => ['sometimes', 'required', 'integer', 'between:'.GaussJordanService::MIN_COLUMNS.','.GaussJordanService::MAX_COLUMNS],
            'matrix' => [
                'bail', 'required', 'array',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_array($value) && ! array_is_list($value)) {
                        $fail('La matriz aumentada debe ser una lista ordenada de ecuaciones.');
                    }
                },
            ],
            'matrix.*' => [
                'bail', 'required', 'array',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_array($value) && ! array_is_list($value)) {
                        $fail('Cada ecuación debe contener una lista ordenada de valores.');
                    }
                },
            ],
            'matrix.*.*' => [
                'bail', 'required',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ((! is_string($value) && ! is_int($value) && ! is_float($value))
                        || (is_float($value) && ! is_finite($value))
                        || RationalNumber::tryFromString((string) $value) === null) {
                        $fail($this->numericValueError($attribute));
                    }
                },
            ],
        ];
    }

    /** @return list<\Closure> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $data = $this->all();
            $hasSize = array_key_exists('size', $data);
            $hasRows = array_key_exists('rows', $data);
            $hasColumns = array_key_exists('columns', $data);

            if (! $hasSize && ! $hasRows && ! $hasColumns) {
                $validator->errors()->add('size', 'Debes indicar size o proporcionar rows y columns.');
                return;
            }

            if ($hasRows xor $hasColumns) {
                $missing = $hasRows ? 'columns' : 'rows';
                $validator->errors()->add($missing, "Debes proporcionar {$missing} cuando usas dimensiones rectangulares.");
                return;
            }

            $size = $hasSize ? filter_var($data['size'], FILTER_VALIDATE_INT) : null;
            $rows = $hasRows ? filter_var($data['rows'], FILTER_VALIDATE_INT) : $size;
            $columns = $hasColumns ? filter_var($data['columns'], FILTER_VALIDATE_INT) : $size;

            if (($hasSize && ($size === false || $size < GaussJordanService::MIN_SIZE || $size > GaussJordanService::MAX_SIZE))
                || $rows === false || $columns === false
                || $rows < GaussJordanService::MIN_ROWS || $rows > GaussJordanService::MAX_ROWS
                || $columns < GaussJordanService::MIN_COLUMNS || $columns > GaussJordanService::MAX_COLUMNS) {
                return;
            }

            if ($hasSize && $hasRows && ($size !== $rows || $size !== $columns)) {
                $validator->errors()->add('size', 'Si envías size junto con rows y columns, los tres valores deben coincidir.');
                return;
            }

            $matrix = $data['matrix'] ?? null;
            if (! is_array($matrix)) {
                return;
            }

            if (count($matrix) !== $rows) {
                $validator->errors()->add('matrix', "La matriz debe tener exactamente {$rows} ecuaciones.");
            }

            for ($row = 0; $row < $rows; $row++) {
                if (! array_key_exists($row, $matrix) || ! is_array($matrix[$row])) {
                    $validator->errors()->add("matrix.{$row}", $this->missingEquationMessage($row));
                    continue;
                }

                if (count($matrix[$row]) !== $columns + 1) {
                    $validator->errors()->add(
                        "matrix.{$row}",
                        sprintf('La ecuación %d debe contener %d coeficientes y un término independiente (%d valores en total).', $row + 1, $columns, $columns + 1),
                    );
                }

                for ($column = 0; $column <= $columns; $column++) {
                    if (! array_key_exists($column, $matrix[$row])) {
                        $validator->errors()->add("matrix.{$row}.{$column}", $this->missingValueMessage($row, $column, $columns));
                    }
                }
            }
        }];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $messages = [
            'size.integer' => 'El tamaño del sistema debe ser un número entero.',
            'size.between' => 'El tamaño del sistema debe estar entre 2 y 5.',
            'rows.integer' => 'El número de ecuaciones debe ser un entero.',
            'rows.between' => 'El número de ecuaciones debe estar entre 2 y 5.',
            'columns.integer' => 'El número de incógnitas debe ser un entero.',
            'columns.between' => 'El número de incógnitas debe estar entre 2 y 5.',
            'matrix.required' => 'Debes enviar la matriz aumentada.',
            'matrix.array' => 'La matriz aumentada debe ser una lista de ecuaciones.',
            'matrix.*.required' => 'Falta una ecuación en la matriz aumentada.',
            'matrix.*.array' => 'Cada ecuación debe ser una lista de valores.',
            'matrix.*.*.required' => 'Falta un valor en la matriz aumentada.',
        ];

        for ($row = 0; $row < GaussJordanService::MAX_ROWS; $row++) {
            for ($column = 0; $column <= GaussJordanService::MAX_COLUMNS; $column++) {
                $messages["matrix.{$row}.{$column}.required"] = $this->missingValueMessage($row, $column, $this->resolvedColumns() ?? GaussJordanService::MAX_COLUMNS);
            }
        }

        return $messages;
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'error' => 'invalid_matrix',
            'message' => $validator->errors()->first(),
            'fields' => $validator->errors()->toArray(),
        ], 422));
    }

    public function rows(): int
    {
        $validated = $this->validated();
        return (int) ($validated['rows'] ?? $validated['size']);
    }

    public function columns(): int
    {
        $validated = $this->validated();
        return (int) ($validated['columns'] ?? $validated['size']);
    }

    /** Backward-compatible accessor for square requests. */
    public function size(): int
    {
        if ($this->rows() !== $this->columns()) {
            throw new LogicException('size() solo está disponible para sistemas cuadrados; usa rows() y columns().');
        }

        return $this->rows();
    }

    /** @return list<list<string>> */
    public function matrix(): array
    {
        return array_map(
            static fn (array $row): array => array_map(
                static fn (string|int|float $value): string => (string) $value,
                array_values($row),
            ),
            array_values($this->validated('matrix')),
        );
    }

    private function resolvedColumns(): ?int
    {
        $columns = filter_var($this->input('columns', $this->input('size')), FILTER_VALIDATE_INT);
        return $columns === false ? null : (int) $columns;
    }

    private function numericValueError(string $attribute): string
    {
        if (preg_match('/^matrix\.(\d+)\.(\d+)$/', $attribute, $matches) !== 1) {
            return 'El valor debe ser un entero, decimal o fracción válida (por ejemplo: 3, -0.5, 1/3).';
        }

        return sprintf(
            'El valor de %s en la ecuación %d debe ser un entero, decimal o fracción válida.',
            $this->columnLabel((int) $matches[2], $this->resolvedColumns() ?? GaussJordanService::MAX_COLUMNS),
            (int) $matches[1] + 1,
        );
    }

    private function missingEquationMessage(int $row): string
    {
        return sprintf('Falta la ecuación %d del sistema.', $row + 1);
    }

    private function missingValueMessage(int $row, int $column, int $columns): string
    {
        return sprintf('Falta %s en la ecuación %d.', $this->columnLabel($column, $columns), $row + 1);
    }

    private function columnLabel(int $column, int $columns): string
    {
        if ($column === $columns) {
            return 'el término independiente';
        }

        return 'el coeficiente de '.GaussJordanService::VARIABLES[$column];
    }
}
