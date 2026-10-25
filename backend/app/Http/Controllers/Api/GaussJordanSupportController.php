<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SolveSystemRequest;
use App\Services\GaussJordan\GaussJordanService;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/** Endpoints de apoyo: ejemplos JSON y descarga de pasos PDF. */
final class GaussJordanSupportController extends Controller
{
    public function __construct(private readonly GaussJordanService $solver)
    {
    }

    public function examples(): JsonResponse
    {
        return response()->json([
            'examples' => [
                [
                    'id' => 'unique-3x2',
                    'title' => 'Sistema rectangular con solución única',
                    'description' => 'Tres ecuaciones compatibles determinan dos incógnitas.',
                    'rows' => 3,
                    'columns' => 2,
                    'matrix' => [['1', '1', '3'], ['1', '-1', '1'], ['2', '1', '5']],
                    'expected_classification' => 'unique',
                ],
                [
                    'id' => 'infinite-2x3',
                    'title' => 'Sistema rectangular con infinitas soluciones',
                    'description' => 'Dos ecuaciones y tres incógnitas dejan una variable libre.',
                    'rows' => 2,
                    'columns' => 3,
                    'matrix' => [['1', '1', '1', '6'], ['2', '3', '1', '11']],
                    'expected_classification' => 'infinite',
                ],
                [
                    'id' => 'inconsistent-3x2',
                    'title' => 'Sistema rectangular sin solución',
                    'description' => 'Las ecuaciones producen una contradicción.',
                    'rows' => 3,
                    'columns' => 2,
                    'matrix' => [['1', '1', '2'], ['2', '2', '5'], ['1', '-1', '0']],
                    'expected_classification' => 'inconsistent',
                ],
            ],
        ]);
    }

    public function stepsPdf(SolveSystemRequest $request): Response
    {
        $result = $this->solver->solveDimensions($request->rows(), $request->columns(), $request->matrix());

        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $pdf = new Dompdf($options);
        $pdf->loadHtml(view('pdf.gauss-jordan-steps', ['result' => $result])->render(), 'UTF-8');
        $pdf->setPaper('A4', 'landscape');
        $pdf->render();

        $filename = sprintf('gauss-jordan-%dx%d-pasos.pdf', $request->rows(), $request->columns());

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'private, max-age=0, must-revalidate',
        ]);
    }
}
