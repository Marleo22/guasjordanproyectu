import { parseFraction, prettyMinus } from '@/lib/formatters'

/** Muestra un número racional exacto; las fracciones se dibujan apiladas (numerador sobre denominador). */
export function FractionText({ value, className = '' }) {
  const fraction = parseFraction(value)
  if (!fraction) return <span className={className}>{prettyMinus(value)}</span>
  return (
    <span className={`frac-wrap ${className}`} aria-label={`${fraction.negative ? 'menos ' : ''}${fraction.numerator} entre ${fraction.denominator}`}>
      {fraction.negative && <span aria-hidden="true">−</span>}
      <span className="frac" aria-hidden="true">
        <span className="frac__num">{fraction.numerator}</span>
        <span className="frac__den">{fraction.denominator}</span>
      </span>
    </span>
  )
}

export default FractionText
