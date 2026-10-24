<?php

namespace Tests\Unit\GaussJordan;

use App\Services\GaussJordan\GaussJordanService;
use App\Services\GaussJordan\MatrixOperation;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * Casos de aceptación MAT-01 … MAT-06 del plan + casos extra.
 * Regla de regresión: ningún cambio del solver se integra si rompe estos tests.
 */
class GaussJordanServiceTest extends TestCase
{
    private GaussJordanService $solver;

    protected function setUp(): void
    {
        $this->solver = new GaussJordanService;
    }

    /** MAT-01 · 2a + b = 5, a − b = 1 */
    public function test_mat01_dos_por_dos_solucion_unica(): void
    {
        $r = $this->solver->solve(2, [['2', '1', '5'], ['1', '-1', '1']]);

        $this->assertSame('unique', $r['classification']);
        $this->assertSame(['a' => '2', 'b' => '1'], $r['solution']);
    }

    /** MAT-02 · ejemplo 3 × 3 de Figma */
    public function test_mat02_tres_por_tres_figma(): void
    {
        $r = $this->solver->solve(3, [['1', '1', '1', '6'], ['2', '3', '1', '11'], ['1', '2', '3', '14']]);

        $this->assertSame('unique', $r['classification']);
        $this->assertSame(['a' => '1', 'b' => '2', 'c' => '3'], $r['solution']);
        $this->assertSame([
            ['equation' => 1, 'left' => '6', 'right' => '6', 'ok' => true],
            ['equation' => 2, 'left' => '11', 'right' => '11', 'ok' => true],
            ['equation' => 3, 'left' => '14', 'right' => '14', 'ok' => true],
        ], $r['verification']);
        $this->assertSame([['1', '0', '0', '1'], ['0', '1', '0', '2'], ['0', '0', '1', '3']], $r['rref']);
        $this->assertSame([], $r['free_variables']);
        $this->assertNull($r['contradiction']);
    }

    /** MAT-03 · infinitas soluciones, c libre */
    public function test_mat03_infinitas_soluciones(): void
    {
        $r = $this->solver->solve(3, [['1', '1', '1', '2'], ['2', '2', '2', '4'], ['1', '-1', '1', '0']]);

        $this->assertSame('infinite', $r['classification']);
        $this->assertNull($r['solution']);
        $this->assertSame(['c'], $r['free_variables']);
        $this->assertSame(['a' => '1 - t', 'b' => '1', 'c' => 't'], $r['parameters']);
        $this->assertSame([['1', '0', '1', '1'], ['0', '1', '0', '1'], ['0', '0', '0', '0']], $r['rref']);
        $this->assertSame([], $r['verification']);
    }

    /** MAT-04 · sin solución, fila 0 = 1 */
    public function test_mat04_sistema_inconsistente(): void
    {
        $r = $this->solver->solve(3, [['1', '1', '0', '3'], ['2', '2', '0', '6'], ['1', '1', '0', '4']]);

        $this->assertSame('inconsistent', $r['classification']);
        $this->assertNull($r['solution']);
        $this->assertSame(
            ['row' => 2, 'left' => '0', 'right' => '1', 'equation' => '0a + 0b + 0c = 1'],
            $r['contradiction'],
        );
        $this->assertSame([['1', '1', '0', '3'], ['0', '0', '0', '1'], ['0', '0', '0', '0']], $r['rref']);
    }

    /** MAT-05 · pivote inicial cero → intercambio de filas */
    public function test_mat05_pivote_cero_intercambia_filas(): void
    {
        $r = $this->solver->solve(2, [['0', '1', '2'], ['1', '1', '3']]);

        $this->assertSame('swap', $r['steps'][0]['type']);
        $this->assertSame('F1 ↔ F2', $r['steps'][0]['notation']);
        $this->assertSame([1, 2], $r['steps'][0]['modified_rows']);
        $this->assertSame(['a' => '1', 'b' => '2'], $r['solution']);
    }

    /** MAT-06 · fracciones exactas, sin decimales */
    public function test_mat06_fracciones_exactas(): void
    {
        $r = $this->solver->solve(2, [['1/2', '1', '1'], ['1', '-1', '0']]);

        $this->assertSame('unique', $r['classification']);
        $this->assertSame(['a' => '2/3', 'b' => '2/3'], $r['solution']);
        $this->assertTrue(collect($r['verification'])->every(fn ($v) => $v['ok']));
    }

    public function test_cinco_por_cinco_con_solucion_fraccionaria(): void
    {
        $r = $this->solver->solve(5, [
            ['2', '1', '0', '0', '1', '3/2'],
            ['1', '3', '1', '0', '0', '0'],
            ['0', '1', '4', '1', '0', '7'],
            ['0', '0', '1', '5', '1', '5/2'],
            ['1', '0', '0', '1', '6', '4'],
        ]);

        $this->assertSame('unique', $r['classification']);
        $this->assertSame(['a' => '1', 'b' => '-1', 'c' => '2', 'd' => '0', 'e' => '1/2'], $r['solution']);
        $this->assertCount(5, $r['verification']);
    }

    public function test_dos_variables_libres(): void
    {
        // a + 2b − c = 4 repetida → b y c libres
        $r = $this->solver->solve(3, [['1', '2', '-1', '4'], ['2', '4', '-2', '8'], ['3', '6', '-3', '12']]);

        $this->assertSame('infinite', $r['classification']);
        $this->assertSame(['b', 'c'], $r['free_variables']);
        $this->assertSame(['a' => '4 - 2t + s', 'b' => 't', 'c' => 's'], $r['parameters']);
    }

    public function test_sistema_homogeneo_todo_cero(): void
    {
        $r = $this->solver->solve(2, [['0', '0', '0'], ['0', '0', '0']]);

        $this->assertSame('infinite', $r['classification']);
        $this->assertSame(['a' => 't', 'b' => 's'], $r['parameters']);
        $this->assertSame([], $r['steps']);
    }

    public function test_los_pasos_forman_una_cadena_continua(): void
    {
        $r = $this->solver->solve(3, [['0', '2', '1', '1'], ['3', '1', '-1', '2'], ['1', '1', '1', '6']]);

        $this->assertNotEmpty($r['steps']);
        $this->assertSame($r['initial_matrix'], $r['steps'][0]['before']);
        foreach ($r['steps'] as $i => $step) {
            $this->assertSame($i + 1, $step['index']);
            $this->assertContains($step['type'], [MatrixOperation::SWAP, MatrixOperation::SCALE, MatrixOperation::ELIMINATE]);
            if ($i > 0) {
                $this->assertSame($r['steps'][$i - 1]['after'], $step['before'], "El paso {$step['index']} no parte del anterior");
            }
        }
        $this->assertSame(end($r['steps'])['after'], $r['rref']);
    }

    public function test_registra_calculo_de_eliminacion(): void
    {
        $r = $this->solver->solve(3, [['1', '1', '1', '6'], ['2', '3', '1', '11'], ['1', '2', '3', '14']]);
        $first = $r['steps'][0];

        $this->assertSame('eliminate', $first['type']);
        $this->assertSame('F2 → F2 - 2F1', $first['notation']);
        $this->assertSame('2', $first['factor']);
        $this->assertSame(['row' => 1, 'column' => 1, 'value' => '1'], $first['pivot']);
        $this->assertSame('11 - 2·6 = -1', $first['calculation'][3]);
        $this->assertSame([2], $first['modified_rows']);
    }

    public function test_rechaza_tamano_fuera_de_rango(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->solver->solve(6, array_fill(0, 6, array_fill(0, 7, '1')));
    }

    public function test_rechaza_matriz_con_forma_incorrecta(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->solver->solve(2, [['1', '2'], ['3', '4']]);
    }
}
