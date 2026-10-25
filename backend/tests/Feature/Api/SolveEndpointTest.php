<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class SolveEndpointTest extends TestCase
{
    private const ENVELOPE = [
        'size', 'rows', 'columns', 'variables', 'classification', 'solution', 'free_variables', 'parameters',
        'contradiction', 'verification', 'initial_matrix', 'steps', 'rref',
    ];

    public function test_health_responde_ok(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('sizes.min', 2)
            ->assertJsonPath('sizes.max', 5);
    }

    public function test_solve_devuelve_el_sobre_completo_sin_envoltura(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'size' => 3,
            'matrix' => [['1', '1', '1', '6'], ['2', '3', '1', '11'], ['1', '2', '3', '14']],
        ])
            ->assertOk()
            ->assertJsonStructure(self::ENVELOPE)
            ->assertJsonMissingPath('data')
            ->assertJsonPath('classification', 'unique')
            ->assertJsonPath('solution', ['a' => '1', 'b' => '2', 'c' => '3'])
            ->assertJsonStructure(['steps' => [['index', 'type', 'notation', 'description', 'target_row',
                'source_row', 'factor', 'pivot', 'modified_rows', 'calculation', 'before', 'after']]]);
    }

    public function test_parameters_es_objeto_vacio_y_no_lista(): void
    {
        $response = $this->postJson('/api/gauss-jordan/solve', [
            'size' => 2, 'matrix' => [['2', '1', '5'], ['1', '-1', '1']],
        ]);

        $this->assertStringContainsString('"parameters":{}', $response->getContent());
    }

    public function test_solve_infinitas(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'size' => 3, 'matrix' => [['1', '1', '1', '2'], ['2', '2', '2', '4'], ['1', '-1', '1', '0']],
        ])
            ->assertOk()
            ->assertJsonStructure(self::ENVELOPE)
            ->assertJsonPath('classification', 'infinite')
            ->assertJsonPath('free_variables', ['c'])
            ->assertJsonPath('parameters', ['a' => '1 - t', 'b' => '1', 'c' => 't']);
    }

    public function test_solve_inconsistente(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'size' => 3, 'matrix' => [['1', '1', '0', '3'], ['2', '2', '0', '6'], ['1', '1', '0', '4']],
        ])
            ->assertOk()
            ->assertJsonStructure(self::ENVELOPE)
            ->assertJsonPath('classification', 'inconsistent')
            ->assertJsonPath('contradiction.row', 2);
    }

    public function test_acepta_numeros_y_decimales_en_json(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'size' => 2, 'matrix' => [[0.5, 1, 1], [1, -1, 0]],
        ])
            ->assertOk()
            ->assertJsonPath('solution', ['a' => '2/3', 'b' => '2/3']);
    }

    public function test_entrada_invalida_devuelve_422_con_formato_del_contrato(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'size' => 2, 'matrix' => [['1', '1/0', '2'], ['1', 'abc', '']],
        ])
            ->assertStatus(422)
            ->assertJsonPath('error', 'invalid_matrix')
            ->assertJsonStructure(['error', 'message', 'fields' => ['matrix.0.1', 'matrix.1.1', 'matrix.1.2']]);
    }

    public function test_tamano_inconsistente_devuelve_422(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'size' => 3, 'matrix' => [['1', '1', '2'], ['1', '-1', '0']],
        ])->assertStatus(422)->assertJsonPath('error', 'invalid_matrix');
    }
    public function test_solve_acepta_sistema_rectangular_con_solucion_unica(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'rows' => 3,
            'columns' => 2,
            'matrix' => [['1', '1', '3'], ['1', '-1', '1'], ['2', '1', '5']],
        ])
            ->assertOk()
            ->assertJsonPath('rows', 3)
            ->assertJsonPath('columns', 2)
            ->assertJsonPath('size', null)
            ->assertJsonPath('classification', 'unique')
            ->assertJsonPath('solution', ['a' => '2', 'b' => '1']);
    }

    public function test_solve_acepta_sistema_rectangular_con_variables_libres(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'rows' => 2,
            'columns' => 3,
            'matrix' => [['1', '1', '1', '6'], ['2', '3', '1', '11']],
        ])
            ->assertOk()
            ->assertJsonPath('classification', 'infinite')
            ->assertJsonPath('free_variables', ['c'])
            ->assertJsonPath('parameters', ['a' => '7 - 2t', 'b' => '-1 + t', 'c' => 't']);
    }

    public function test_solve_rechaza_contrato_legacy_con_dimensiones_conflictivas(): void
    {
        $this->postJson('/api/gauss-jordan/solve', [
            'size' => 2,
            'rows' => 2,
            'columns' => 3,
            'matrix' => [['1', '1', '1', '6'], ['2', '3', '1', '11']],
        ])
            ->assertStatus(422)
            ->assertJsonPath('error', 'invalid_matrix')
            ->assertJsonStructure(['fields' => ['size']]);
    }

}
