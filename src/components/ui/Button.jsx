import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

/**
 * Flat, single-fill buttons. No gradients or coloured glows — those read as
 * decorative and fight the neutral dark surfaces.
 */
const VARIANTS = {
  primary: 'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700',
  secondary:
    'text-strong hover:brightness-125 active:brightness-95 border border-[color:var(--line-strong)] bg-[color:var(--surface-overlay)]',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700',
  warning: 'bg-amber-500 text-neutral-950 hover:bg-amber-400 active:bg-amber-600',
  danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
  ghost: 'text-muted hover:text-strong hover:bg-[color:var(--surface-hover)]',
  outline:
    'border border-[color:var(--line-strong)] text-muted hover:text-strong hover:bg-[color:var(--surface-hover)]'
}

const SIZES = {
  xs: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  sm: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2',
  xl: 'h-12 px-6 text-base rounded-xl gap-2.5'
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const isBlocked = loading || disabled

  return (
    <button
      ref={ref}
      type={type}
      onClick={isBlocked ? undefined : onClick}
      disabled={isBlocked}
      aria-busy={loading || undefined}
      className={[
        'focus-ring inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        // `shrink` counteracts the base `shrink-0` so a full-width button
        // placed in a flex row can still give way instead of overflowing.
        fullWidth ? 'w-full shrink min-w-0' : '',
        className
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
