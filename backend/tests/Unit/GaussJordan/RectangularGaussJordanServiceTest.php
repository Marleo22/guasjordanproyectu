<?php

namespace Tests\Unit\GaussJordan;

use App\Services\GaussJordan\GaussJordanService;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class RectangularGaussJordanServiceTest extends TestCase
{
    private GaussJordanService $solver;

    protected function setUp(): void
    {
        $this->solver = new GaussJordanService;
    }

    public function test_rectangular_overdetermined_system_can_have_unique_solution(): void
    {
        $result = $this->solver->solveDimensions(3, 2, [
            ['1', '1', '3'],
            ['1', '-1', '1'],
            ['2', '1', '5'],
        ]);

        $this->assertSame('unique', $result['classification']);
        $this->assertSame(['a' => '2', 'b' => '1'], $result['solution']);
        $this->assertSame(3, $result['rows']);
        $this->assertSame(2, $result['columns']);
        $this->assertNull($result['size']);
        $this->assertCount(3, $result['verification']);
        $this->assertSame([true, true, true], array_column($result['verification'], 'ok'));
    }

    public function test_rectangular_underdetermined_system_returns_parameterization(): void
    {
        $result = $this->solver->solveDimensions(2, 3, [
            ['1', '1', '1', '6'],
            ['2', '3', '1', '11'],
        ]);

        $this->assertSame('infinite', $result['classification']);
        $this->assertSame(['c'], $result['free_variables']);
        $this->assertSame(['a' => '7 - 2t', 'b' => '-1 + t', 'c' => 't'], $result['parameters']);
        $this->assertCount(2, $result['rref']);
        $this->assertCount(4, $result['rref'][0]);
    }

    public function test_rectangular_overdetermined_system_can_be_inconsistent(): void
    {
        $result = $this->solver->solveDimensions(3, 2, [
            ['1', '1', '2'],
            ['2', '2', '5'],
            ['1', '-1', '0'],
        ]);

        $this->assertSame('inconsistent', $result['classification']);
        $this->assertNull($result['solution']);
        $this->assertNotNull($result['contradiction']);
        $this->assertSame('1', $result['contradiction']['right']);
    }

    public function test_rectangular_solver_rejects_wrong_row_or_column_count(): void
    {
        try {
            $this->solver->solveDimensions(2, 3, [['1', '2', '3'], ['4', '5', '6']]);
            $this->fail('Expected the solver to reject an augmented row with the wrong number of values.');
        } catch (InvalidArgumentException $exception) {
            $this->assertStringContainsString('4 valores', $exception->getMessage());
        }
    }

    public function test_all_allowed_rectangular_dimension_pairs_are_accepted_for_zero_matrices(): void
    {
        for ($rows = 2; $rows <= 5; $rows++) {
            for ($columns = 2; $columns <= 5; $columns++) {
                $matrix = array_fill(0, $rows, array_fill(0, $columns + 1, '0'));
                $result = $this->solver->solveDimensions($rows, $columns, $matrix);

                $this->assertSame($rows, $result['rows']);
                $this->assertSame($columns, $result['columns']);
                $this->assertSame('infinite', $result['classification']);
            }
        }
    }
}
