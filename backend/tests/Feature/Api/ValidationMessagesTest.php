<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

/** Regresión: mensajes de validación en sistemas rectangulares (antes devolvían 500). */
class ValidationMessagesTest extends TestCase
{
    public function test_rectangular_request_with_missing_value_returns_422_with_specific_message(): void
    {
        $response = $this->postJson('/api/gauss-jordan/solve', [
            'rows' => 3,
            'columns' => 2,
            'matrix' => [['', '1', '3'], ['1', '-1', '1'], ['2', '1', '5']],
        ]);

        $response->assertStatus(422)->assertJsonPath('error', 'invalid_matrix');
        $this->assertSame('Falta el coeficiente de a en la ecuación 1.', $response->json('fields')['matrix.0.0'][0]);
    }

    public function test_missing_independent_term_names_the_right_column(): void
    {
        $response = $this->postJson('/api/gauss-jordan/solve', [
            'rows' => 2,
            'columns' => 3,
            'matrix' => [['1', '1', '1', ''], ['2', '3', '1', '11']],
        ]);

        $response->assertStatus(422);
        $this->assertSame('Falta el término independiente en la ecuación 1.', $response->json('fields')['matrix.0.3'][0]);
    }

    public function test_invalid_number_message_is_readable(): void
    {
        $response = $this->postJson('/api/gauss-jordan/solve', [
            'rows' => 2,
            'columns' => 2,
            'matrix' => [['1', 'x', '3'], ['1', '1/0', '1']],
        ]);

        $response->assertStatus(422);
        $this->assertSame(
            'El coeficiente de b en la ecuación 1 debe ser un entero, decimal o fracción válida (por ejemplo: 3, -0.5, 1/3).',
            $response->json('fields')['matrix.0.1'][0],
        );
    }
}
