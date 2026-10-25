<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

/**
 * Feedback de QA: "al elegir 3x2 o 5x3 parece que calcula una matriz cuadrada".
 * Estas pruebas fijan que la API respeta filas ≠ columnas de punta a punta.
 */
class RectangularDimensionsTest extends TestCase
{
    public function test_five_equations_three_unknowns_keeps_its_shape(): void
    {
        $response = $this->postJson('/api/gauss-jordan/solve', [
            'rows' => 5,
            'columns' => 3,
            'matrix' => [
                ['1', '1', '1', '6'],
                ['1', '-1', '0', '-1'],
                ['0', '1', '-1', '-1'],
                ['2', '0', '1', '5'],
                ['1', '2', '3', '14'],
            ],
        ])->assertOk();

        $response->assertJsonPath('rows', 5)
            ->assertJsonPath('columns', 3)
            ->assertJsonPath('size', null)
            ->assertJsonPath('variables', ['a', 'b', 'c'])
            ->assertJsonPath('classification', 'unique')
            ->assertJsonPath('solution', ['a' => '1', 'b' => '2', 'c' => '3'])
            ->assertJsonPath('rank', 3)
            ->assertJsonPath('augmented_rank', 3);

        $rref = $response->json('rref');
        $this->assertCount(5, $rref, 'La forma reducida conserva las 5 ecuaciones.');
        foreach ($rref as $row) {
            $this->assertCount(4, $row, 'Cada fila tiene 3 coeficientes + término independiente.');
        }
        $this->assertSame(['0', '0', '0', '0'], $rref[3]);
        $this->assertSame(['0', '0', '0', '0'], $rref[4]);
        $this->assertCount(5, $response->json('verification'), 'Se comprueban las 5 ecuaciones originales.');
    }

    public function test_three_equations_two_unknowns_inconsistent_reports_ranks(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'rows' => 3,
            'columns' => 2,
            'matrix' => [['1', '1', '2'], ['2', '2', '5'], ['1', '-1', '0']],
        ])
            ->assertOk()
            ->assertJsonPath('classification', 'inconsistent')
            ->assertJsonPath('rank', 2)
            ->assertJsonPath('augmented_rank', 3)
            ->assertJsonCount(3, 'rref')
            ->assertJsonCount(3, 'rref.0');
    }

    public function test_two_equations_three_unknowns_has_one_free_variable(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'rows' => 2,
            'columns' => 3,
            'matrix' => [['1', '1', '1', '6'], ['2', '3', '1', '11']],
        ])
            ->assertOk()
            ->assertJsonPath('classification', 'infinite')
            ->assertJsonPath('rank', 2)
            ->assertJsonPath('augmented_rank', 2)
            ->assertJsonPath('free_variables', ['c'])
            ->assertJsonCount(2, 'rref')
            ->assertJsonCount(4, 'rref.0');
    }
}
