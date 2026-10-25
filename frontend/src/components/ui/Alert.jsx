import { cn } from '@/lib/utils'

const VARIANTS = {
  info: 'alert--info',
  success: 'alert--success',
  error: 'alert--error',
  destructive: 'alert--error',
  warning: 'alert--warning',
}

/** Alerta del sistema visual (Yorman). `destructive` es alias de `error` para compatibilidad con shadcn. */
export function Alert({ children, variant = 'info', className = '', ...props }) {
  return (
    <div className={cn('alert flex flex-col gap-1', VARIANTS[variant] ?? VARIANTS.info, className)} role="alert" {...props}>
      {children}
    </div>
  )
}

export function AlertTitle({ className, ...props }) {
  return <p className={cn('m-0 font-semibold', className)} {...props} />
}

export function AlertDescription({ className, ...props }) {
  return <div className={cn('text-sm', className)} {...props} />
}

export default Alert
