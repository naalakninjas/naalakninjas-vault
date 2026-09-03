import { forwardRef } from 'react'

/**
 * Surface container. Variants map onto the shared surface tokens so cards
 * stay in step with the app shell instead of drifting to their own palette.
 */
const VARIANTS = {
  default: 'bg-[color:var(--surface-raised)] border border-[color:var(--line-subtle)]',
  hero: 'bg-[color:var(--surface-overlay)] border border-[color:var(--line-strong)]',
  glass: 'bg-[color:var(--surface-raised)] border border-[color:var(--line-subtle)] backdrop-blur-sm',
  elevated: 'bg-[color:var(--surface-overlay)] border border-[color:var(--line-subtle)] shadow-xl shadow-black/30',
  flat: 'bg-[color:var(--surface-base)] border border-[color:var(--line-subtle)]',
  outline: 'bg-transparent border border-[color:var(--line-strong)]'
}

const PADDINGS = {
  none: '',
  xs: 'p-3',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8'
}

const Card = forwardRef(({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={[
      'rounded-2xl transition-colors duration-200',
      VARIANTS[variant] ?? VARIANTS.default,
      PADDINGS[padding] ?? PADDINGS.md,
      hover ? 'hover:bg-[color:var(--surface-hover)] hover:border-[color:var(--line-strong)]' : '',
      className
    ].filter(Boolean).join(' ')}
    {...props}
  >
    {children}
  </div>
))

Card.displayName = 'Card'

export default Card
