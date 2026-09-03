import { forwardRef } from 'react'

const VARIANTS = {
  default: 'bg-[color:var(--surface-hover)] text-muted border border-[color:var(--line-subtle)]',
  primary: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/25',
  info: 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  outline: 'bg-transparent text-muted border border-[color:var(--line-strong)]',
  solid: 'bg-[color:var(--surface-hover)] text-strong border border-[color:var(--line-strong)]'
}

const SIZES = {
  xs: 'h-5 px-2 text-[10px] gap-1',
  sm: 'h-6 px-2 text-[11px] gap-1',
  md: 'h-7 px-2.5 text-xs gap-1.5',
  lg: 'h-8 px-3 text-sm gap-1.5'
}

const Badge = forwardRef(({
  children,
  variant = 'default',
  size = 'sm',
  icon: Icon,
  pulse = false,
  className = '',
  ...props
}, ref) => (
  <span
    ref={ref}
    className={[
      'inline-flex shrink-0 select-none items-center whitespace-nowrap rounded-full font-medium',
      VARIANTS[variant] ?? VARIANTS.default,
      SIZES[size] ?? SIZES.sm,
      pulse ? 'animate-pulse' : '',
      className
    ].filter(Boolean).join(' ')}
    {...props}
  >
    {Icon && <Icon className="h-3 w-3" />}
    {children}
  </span>
))

Badge.displayName = 'Badge'

const STATUS_CONFIG = {
  active: { variant: 'success', children: 'Active' },
  inactive: { variant: 'default', children: 'Inactive' },
  pending: { variant: 'warning', children: 'Pending' },
  approved: { variant: 'success', children: 'Approved' },
  rejected: { variant: 'danger', children: 'Rejected' },
  completed: { variant: 'success', children: 'Completed' },
  paid: { variant: 'success', children: 'Paid' },
  overdue: { variant: 'danger', children: 'Overdue' }
}

export const StatusBadge = ({ status, ...props }) => (
  <Badge {...(STATUS_CONFIG[status] ?? STATUS_CONFIG.pending)} {...props} />
)

export default Badge
