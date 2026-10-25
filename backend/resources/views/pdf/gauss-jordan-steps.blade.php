<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Procedimiento Gauss-Jordan</title>
    <style>
        @page { margin: 24px 28px; }
        body { font-family: "DejaVu Sans", sans-serif; font-size: 9px; color: #182033; }
        h1 { font-size: 20px; margin: 0 0 6px; }
        h2 { font-size: 13px; margin: 16px 0 6px; }
        h3 { font-size: 10px; margin: 10px 0 5px; }
        p { margin: 4px 0; }
        .muted { color: #526079; }
        .summary { border: 1px solid #d5dbea; padding: 10px; margin: 10px 0; }
        table.matrix { border-collapse: collapse; margin: 5px 0 10px; width: auto; }
        table.matrix td, table.matrix th { border: 1px solid #b9c4d5; padding: 4px 7px; text-align: center; }
        table.matrix th { background: #edf1f7; }
        .step { border-top: 1px solid #ccd4e0; padding-top: 7px; margin-top: 10px; }
        .calculation { margin: 3px 0 6px; }
        .page-break { page-break-before: always; }
        .keep-together { page-break-inside: avoid; }
    </style>
</head>
<body>
    <h1>Gauss-Jordan paso a paso</h1>
    <p class="muted">Sistema de {{ $result['rows'] }} ecuaciones × {{ $result['columns'] }} incógnitas · Procedimiento exacto con fracciones</p>

    <div class="summary">
        <strong>Clasificación:</strong>
        @switch($result['classification'])
            @case('unique') Solución única @break
            @case('infinite') Infinitas soluciones @break
            @case('inconsistent') Sistema sin solución @break
        @endswitch
        <p><strong>Variables:</strong> {{ implode(', ', $result['variables']) }}</p>
    </div>

    <h2>Matriz aumentada inicial</h2>
    @include('pdf.partials.matrix', ['matrix' => $result['initial_matrix']])

    @if ($result['steps'] !== [])
        <h2>Operaciones elementales</h2>
        @foreach ($result['steps'] as $step)
            <div class="step keep-together">
                <h3>Paso {{ $step['index'] }}: {{ $step['notation'] }}</h3>
                <p>{{ $step['description'] }}</p>
                @if ($step['calculation'] !== [])
                    <p><strong>Cálculo:</strong></p>
                    @foreach ($step['calculation'] as $calculation)
                        <p class="calculation">{{ $calculation }}</p>
                    @endforeach
                @endif
                <p><strong>Antes:</strong></p>
                @include('pdf.partials.matrix', ['matrix' => $step['before']])
                <p><strong>Después:</strong></p>
                @include('pdf.partials.matrix', ['matrix' => $step['after']])
            </div>
        @endforeach
    @else
        <p>La matriz ya se encuentra en forma escalonada reducida; no fueron necesarias operaciones.</p>
    @endif

    <h2>Forma escalonada reducida (RREF)</h2>
    @include('pdf.partials.matrix', ['matrix' => $result['rref']])

    @if ($result['classification'] === 'unique')
        <h2>Solución</h2>
        <table class="matrix">
            <thead><tr><th>Variable</th><th>Valor exacto</th></tr></thead>
            <tbody>
                @foreach ($result['solution'] as $variable => $value)
                    <tr><td>{{ $variable }}</td><td>{{ $value }}</td></tr>
                @endforeach
            </tbody>
        </table>
        <h2>Comprobación en las ecuaciones originales</h2>
        <table class="matrix">
            <thead><tr><th>Ecuación</th><th>Lado izquierdo</th><th>Lado derecho</th><th>Correcta</th></tr></thead>
            <tbody>
                @foreach ($result['verification'] as $check)
                    <tr>
                        <td>{{ $check['equation'] }}</td><td>{{ $check['left'] }}</td><td>{{ $check['right'] }}</td>
                        <td>{{ $check['ok'] ? 'Sí' : 'No' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @elseif ($result['classification'] === 'infinite')
        <h2>Variables libres y parametrización</h2>
        <p><strong>Variables libres:</strong> {{ implode(', ', $result['free_variables']) }}</p>
        <table class="matrix">
            <thead><tr><th>Variable</th><th>Expresión</th></tr></thead>
            <tbody>
                @foreach ($result['parameters'] as $variable => $expression)
                    <tr><td>{{ $variable }}</td><td>{{ $expression }}</td></tr>
                @endforeach
            </tbody>
        </table>
    @elseif ($result['classification'] === 'inconsistent')
        <h2>Contradicción</h2>
        <p>La fila {{ $result['contradiction']['row'] }} representa una contradicción: {{ $result['contradiction']['left'] }} = {{ $result['contradiction']['right'] }}.</p>
        <p>{{ $result['contradiction']['equation'] }}</p>
    @endif
</body>
</html>
