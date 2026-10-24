<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Errores inesperados en la API: 500 con mensaje genérico + id de registro.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')
                || $e instanceof ValidationException
                || $e instanceof HttpExceptionInterface
                || $e instanceof HttpResponseException) {
                return null; // Laravel lo maneja normalmente (422, 404, 405…)
            }

            $logId = (string) Str::uuid();
            Log::error("[{$logId}] ".$e->getMessage(), ['exception' => $e]);

            return response()->json([
                'error' => 'server_error',
                'message' => 'Ocurrió un error inesperado. Intenta de nuevo.',
                'log_id' => $logId,
            ], 500);
        });
    })->create();
