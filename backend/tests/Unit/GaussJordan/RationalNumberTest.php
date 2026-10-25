<?php

namespace Tests\Unit\GaussJordan;

use App\Services\GaussJordan\RationalNumber;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class RationalNumberTest extends TestCase
{
    public static function parsingCases(): array
    {
        return [
            'entero' => ['6', '6'],
            'negativo' => ['-3', '-3'],
            'decimal' => ['0.5', '1/2'],
            'decimal sin cero' => ['.25', '1/4'],
            'decimal negativo' => ['-1.75', '-7/4'],
            'fracción' => ['1/3', '1/3'],
            'fracción se simplifica' => ['4/6', '2/3'],
            'denominador negativo' => ['3/-4', '-3/4'],
            'doble negativo' => ['-3/-4', '3/4'],
            'espacios' => [' 1 / 2 ', '1/2'],
            'cero' => ['-0', '0'],
            'fracción con decimal' => ['1.5/2', '3/4'],
        ];
    }

    #[DataProvider('parsingCases')]
    public function test_convierte_texto_a_fraccion_exacta(string $input, string $expected): void
    {
        $this->assertSame($expected, RationalNumber::fromString($input)->toString());
    }

    public static function invalidCases(): array
    {
        return [[''], ['abc'], ['1/0'], ['1/'], ['/2'], ['1/2/3'], ['.'], ['--1'], ['1e3']];
    }

    #[DataProvider('invalidCases')]
    public function test_rechaza_valores_invalidos(string $input): void
    {
        $this->expectException(InvalidArgumentException::class);
        RationalNumber::fromString($input);
    }

    public function test_aritmetica_exacta_sin_flotantes(): void
    {
        $third = RationalNumber::fromString('1/3');

        // 1/3 + 1/3 + 1/3 = 1 exactamente (con flotantes daría 0.9999…)
        $this->assertTrue($third->plus($third)->plus($third)->isOne());
        $this->assertSame('1/6', RationalNumber::fromString('1/2')->minus($third)->toString());
        $this->assertSame('2/9', $third->multipliedBy(RationalNumber::fromString('2/3'))->toString());
        $this->assertSame('-3/2', RationalNumber::fromString('1/2')->dividedBy(RationalNumber::fromString('-1/3'))->toString());
        $this->assertSame('3', $third->reciprocal()->toString());
    }

    public function test_numeros_grandes_no_desbordan(): void
    {
        $big = RationalNumber::fromString('9223372036854775807'); // PHP_INT_MAX
        $this->assertSame('85070591730234615847396907784232501249', $big->multipliedBy($big)->toString());
    }

    public function test_division_entre_cero_falla(): void
    {
        $this->expectException(InvalidArgumentException::class);
        RationalNumber::one()->dividedBy(RationalNumber::zero());
    }
}
