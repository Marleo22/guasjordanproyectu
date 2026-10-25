<?php

namespace App\Services\GaussJordan;

use Brick\Math\BigInteger;
use InvalidArgumentException;
use JsonSerializable;
use Stringable;

/**
 * Número racional exacto (numerador / denominador) e inmutable.
 *
 * - Siempre está simplificado: mcd(numerador, denominador) = 1.
 * - El denominador siempre es positivo; el signo vive en el numerador.
 * - Usa enteros de precisión arbitraria, así que nunca hay desbordamiento
 *   ni redondeo durante el cálculo.
 *
 * Responsable: Diego (núcleo matemático).
 */
final class RationalNumber implements JsonSerializable, Stringable
{
    private function __construct(
        public readonly BigInteger $numerator,
        public readonly BigInteger $denominator,
    ) {}

    public static function zero(): self
    {
        return new self(BigInteger::zero(), BigInteger::one());
    }

    public static function one(): self
    {
        return new self(BigInteger::one(), BigInteger::one());
    }

    public static function of(int|string|self $value): self
    {
        if ($value instanceof self) {
            return $value;
        }

        return is_int($value)
            ? new self(BigInteger::of($value), BigInteger::one())
            : self::fromString($value);
    }

    public static function fraction(BigInteger|int|string $numerator, BigInteger|int|string $denominator): self
    {
        return self::normalized(BigInteger::of($numerator), BigInteger::of($denominator));
    }

    /**
     * Convierte texto a racional. Acepta enteros ("-3"), decimales ("0.25", ".5")
     * y fracciones ("1/3", "-2/5", "1.5/2"). Ignora espacios.
     *
     * @throws InvalidArgumentException si el texto no es un número válido o el denominador es 0.
     */
    public static function fromString(string $value): self
    {
        $clean = str_replace(' ', '', trim($value));

        if ($clean === '') {
            throw new InvalidArgumentException('El valor está vacío.');
        }

        $parts = explode('/', $clean);

        if (count($parts) === 1) {
            return self::fromDecimal($parts[0]);
        }

        if (count($parts) === 2) {
            $denominator = self::fromDecimal($parts[1]);

            if ($denominator->isZero()) {
                throw new InvalidArgumentException("El denominador de \"{$value}\" no puede ser cero.");
            }

            return self::fromDecimal($parts[0])->dividedBy($denominator);
        }

        throw new InvalidArgumentException("\"{$value}\" no es un número válido.");
    }

    public static function tryFromString(?string $value): ?self
    {
        if ($value === null) {
            return null;
        }

        try {
            return self::fromString($value);
        } catch (InvalidArgumentException) {
            return null;
        }
    }

    private static function fromDecimal(string $value): self
    {
        if (! preg_match('/^([+-]?)(\d*)(?:\.(\d*))?$/', $value, $m) || ($m[2] === '' && ($m[3] ?? '') === '')) {
            throw new InvalidArgumentException("\"{$value}\" no es un número válido.");
        }

        $sign = $m[1] === '-' ? '-' : '';
        $integerPart = $m[2] === '' ? '0' : $m[2];
        $decimalPart = $m[3] ?? '';

        $numerator = BigInteger::of($sign.$integerPart.$decimalPart);
        $denominator = BigInteger::of('1'.str_repeat('0', strlen($decimalPart)));

        return self::normalized($numerator, $denominator);
    }

    private static function normalized(BigInteger $numerator, BigInteger $denominator): self
    {
        if ($denominator->isZero()) {
            throw new InvalidArgumentException('El denominador no puede ser cero.');
        }

        if ($numerator->isZero()) {
            return self::zero();
        }

        if ($denominator->isNegative()) {
            $numerator = $numerator->negated();
            $denominator = $denominator->negated();
        }

        $gcd = $numerator->gcd($denominator);

        return new self($numerator->quotient($gcd), $denominator->quotient($gcd));
    }

    // ── Aritmética ──────────────────────────────────────────────────────

    public function plus(self $other): self
    {
        return self::normalized(
            $this->numerator->multipliedBy($other->denominator)->plus($other->numerator->multipliedBy($this->denominator)),
            $this->denominator->multipliedBy($other->denominator),
        );
    }

    public function minus(self $other): self
    {
        return $this->plus($other->negated());
    }

    public function multipliedBy(self $other): self
    {
        return self::normalized(
            $this->numerator->multipliedBy($other->numerator),
            $this->denominator->multipliedBy($other->denominator),
        );
    }

    public function dividedBy(self $other): self
    {
        if ($other->isZero()) {
            throw new InvalidArgumentException('División entre cero.');
        }

        return $this->multipliedBy($other->reciprocal());
    }

    public function negated(): self
    {
        return new self($this->numerator->negated(), $this->denominator);
    }

    public function reciprocal(): self
    {
        if ($this->isZero()) {
            throw new InvalidArgumentException('El cero no tiene recíproco.');
        }

        return self::normalized($this->denominator, $this->numerator);
    }

    public function abs(): self
    {
        return $this->isNegative() ? $this->negated() : $this;
    }

    // ── Consultas ───────────────────────────────────────────────────────

    public function isZero(): bool
    {
        return $this->numerator->isZero();
    }

    public function isOne(): bool
    {
        return $this->numerator->isEqualTo(1) && $this->denominator->isEqualTo(1);
    }

    public function isNegative(): bool
    {
        return $this->numerator->isNegative();
    }

    public function isInteger(): bool
    {
        return $this->denominator->isEqualTo(1);
    }

    public function equals(self $other): bool
    {
        return $this->numerator->isEqualTo($other->numerator)
            && $this->denominator->isEqualTo($other->denominator);
    }

    // ── Presentación ────────────────────────────────────────────────────

    /** Forma exacta: "3", "-1/2", "2/3". */
    public function toString(): string
    {
        return $this->isInteger()
            ? $this->numerator->toString()
            : $this->numerator->toString().'/'.$this->denominator->toString();
    }

    public function __toString(): string
    {
        return $this->toString();
    }

    public function jsonSerialize(): string
    {
        return $this->toString();
    }
}
