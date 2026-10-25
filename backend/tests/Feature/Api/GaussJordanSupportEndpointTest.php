<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class GaussJordanSupportEndpointTest extends TestCase
{
    public function test_examples_endpoint_returns_the_three_rectangular_classifications(): void
    {
        $response = $this->getJson('/api/gauss-jordan/examples');

        $response->assertOk()
            ->assertJsonStructure([
                'examples' => [
                    ['id', 'title', 'description', 'rows', 'columns', 'matrix', 'expected_classification'],
                ],
            ])
            ->assertJsonCount(3, 'examples')
            ->assertJsonPath('examples.0.expected_classification', 'unique')
            ->assertJsonPath('examples.1.expected_classification', 'infinite')
            ->assertJsonPath('examples.2.expected_classification', 'inconsistent');

        foreach ($response->json('examples') as $example) {
            $this->postJson('/api/gauss-jordan/solve', [
                'rows' => $example['rows'],
                'columns' => $example['columns'],
                'matrix' => $example['matrix'],
            ])
                ->assertOk()
                ->assertJsonPath('classification', $example['expected_classification']);
        }
    }

    public function test_steps_pdf_returns_a_downloadable_pdf_for_legacy_square_input(): void
    {
        $response = $this->post('/api/gauss-jordan/steps.pdf', [
            'size' => 2,
            'matrix' => [['2', '1', '5'], ['1', '-1', '1']],
        ]);

        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString('attachment; filename="gauss-jordan-2x2-pasos.pdf"', $response->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_steps_pdf_accepts_rectangular_input(): void
    {
        $response = $this->post('/api/gauss-jordan/steps.pdf', [
            'rows' => 2,
            'columns' => 3,
            'matrix' => [['1', '1', '1', '6'], ['2', '3', '1', '11']],
        ]);

        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString('attachment; filename="gauss-jordan-2x3-pasos.pdf"', $response->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_invalid_pdf_input_returns_the_validation_contract(): void
    {
        $this->postJson('/api/gauss-jordan/steps.pdf', [
            'rows' => 2,
            'columns' => 3,
            'matrix' => [['1', '1/0', '2', '6'], ['1', '1', '1', '3']],
        ])
            ->assertStatus(422)
            ->assertJsonPath('error', 'invalid_matrix');
    }
}
