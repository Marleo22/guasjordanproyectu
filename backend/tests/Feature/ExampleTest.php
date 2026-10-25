<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_the_web_routes_are_served_by_the_spa_entry(): void
    {
        foreach (['/', '/datos', '/procedimiento', '/resultado'] as $path) {
            $status = $this->get($path)->getStatusCode();
            $this->assertContains($status, [200, 503], "La ruta {$path} debe servir la web o el aviso de compilación.");
        }
    }

    public function test_unknown_api_routes_are_not_captured_by_the_spa(): void
    {
        $this->getJson('/api/no-existe')->assertNotFound();
    }
}
