import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Une clases condicionales y resuelve conflictos de Tailwind (patrón de shadcn/ui). */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
