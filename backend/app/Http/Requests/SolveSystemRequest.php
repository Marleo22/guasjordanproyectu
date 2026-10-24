<?php

namespace App\Http\Requests;

use App\Services\GaussJordan\GaussJordanService;
use App\Services\GaussJordan\RationalNumber;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * ⚠ RESPONSABLE: JACOB.
 *
 * Base mínima creada por Diego solo para que /solve funcione y cumpla el
 * formato de error 422 del contrato. Jacob debe completar aquí las reglas
 * finales, los mensajes por campo (p. ej. "Falta el coeficiente de b en la
 * ecuación 2") y la interpretación de enteros, decimales y fracciones.
 * No cambiar los nombres `size()` y `matrix()` sin avisar a Diego.
 */
class SolveSystemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $size = (int) $this->input('size');

        return [
            'size' => ['required', 'integer', 'between:'.GaussJordanService::MIN_SIZE.','.GaussJordanService::MAX_SIZE],
            'matrix' => ['required', 'array', 'size:'.$size],
            'matrix.*' => ['required', 'array', 'size:'.($size + 1)],
            'matrix.*.*' => [
                'required',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! is_scalar($value) || RationalNumber::tryFromString((string) $value) === null) {
                        $fail('El valor debe ser un entero, decimal o fracción válida (p. ej. 3, -0.5, 1/3).');
                    }
                },
            ],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'error' => 'invalid_matrix',
            'message' => $validator->errors()->first(),
            'fields' => $validator->errors()->toArray(),
        ], 422));
    }

    public function size(): int
    {
        return (int) $this->validated('size');
    }

    /** @return list<list<string>> */
    public function matrix(): array
    {
        return array_map(
            fn (array $row) => array_map(fn ($v) => (string) $v, array_values($row)),
            array_values($this->validated('matrix')),
        );
    }
}
