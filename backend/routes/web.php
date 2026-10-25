<?php

use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;
use Illuminate\View\Middleware\ShareErrorsFromSession;

/*
| La web (React) se compila con `npm run build` en backend/public/spa.
| Laravel devuelve su index.html para cualquier ruta que no sea de la API, así
| /, /datos, /procedimiento y /resultado funcionan también al recargar la página.
|
| La página no usa sesión ni cookies, así que se quitan esos middleware: de lo
| contrario, en una PC sin backend/.env (sin APP_KEY) Laravel responde 500.
*/
Route::get('/{path?}', function () {
    $index = public_path('spa/index.html');

    if (! is_file($index)) {
        return response(
            '<!doctype html><meta charset="utf-8"><title>Gauss-Jordan</title>'
            .'<body style="font-family:system-ui;max-width:640px;margin:60px auto;padding:0 16px;line-height:1.5">'
            .'<h1>Falta compilar la web</h1>'
            .'<p>La API ya está funcionando en <code>/api</code>. Para preparar todo, en la raíz del proyecto ejecuta:</p>'
            .'<pre style="background:#eef1f6;padding:12px;border-radius:8px">npm run setup</pre>'
            .'<p>y luego <code>npm start</code>. En Windows también puedes hacer doble clic en <b>INICIAR.bat</b>.</p></body>',
            503,
        );
    }

    // Tipo explícito: no depende de la extensión fileinfo para adivinar el MIME.
    return response(file_get_contents($index), 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-cache',
    ]);
})
    ->where('path', '^(?!api(/|$)|spa/).*$')
    ->withoutMiddleware([
        EncryptCookies::class,
        AddQueuedCookiesToResponse::class,
        StartSession::class,
        ShareErrorsFromSession::class,
        PreventRequestForgery::class,
    ])
    ->name('spa');
