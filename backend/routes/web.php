<?php

use Illuminate\Support\Facades\Route;

/*
| La web (React) se compila con `npm run build` en backend/public/spa.
| Laravel devuelve su index.html para cualquier ruta que no sea de la API, así
| /, /datos, /procedimiento y /resultado funcionan también al recargar la página.
*/
Route::get('/{path?}', function () {
    $index = public_path('spa/index.html');

    if (! is_file($index)) {
        return response(
            '<!doctype html><meta charset="utf-8"><title>Gauss-Jordan</title>'
            .'<body style="font-family:system-ui;max-width:640px;margin:60px auto;padding:0 16px;line-height:1.5">'
            .'<h1>Falta compilar la web</h1>'
            .'<p>La API ya está funcionando en <code>/api</code>. Para servir la interfaz desde Laravel ejecuta, en la raíz del proyecto:</p>'
            .'<pre style="background:#eef1f6;padding:12px;border-radius:8px">npm run build</pre>'
            .'<p>O usa <code>npm run dev</code> para desarrollo y abre <a href="http://localhost:5173">http://localhost:5173</a>.</p></body>',
            503,
        );
    }

    // Tipo explícito: no depende de la extensión fileinfo para adivinar el MIME.
    return response(file_get_contents($index), 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-cache',
    ]);
})->where('path', '^(?!api(/|$)|spa/).*$')->name('spa');
