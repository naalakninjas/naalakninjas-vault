import { User } from 'lucide-react'
import { forwardRef, useState } from 'react'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-lg',
  '2xl': 'h-24 w-24 text-xl'
}

const STATUS_COLORS = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
  offline: 'bg-neutral-500'
}

const initialsOf = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const Avatar = forwardRef(({
  src,
  alt,
  name,
  size = 'md',
  status,
  fallback,
  className = '',
  borderColor,
  ringColor,
  onClick,
  ...props
}, ref) => {
  // Track load failure in state so the fallback actually renders, rather than
  // hiding the image and leaving an empty circle.
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      ref={ref}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative shrink-0 ${onClick ? 'focus-ring rounded-full transition-transform active:scale-95' : ''}`}
      {...props}
    >
      <div
        className={[
          SIZES[size] ?? SIZES.md,
          'flex items-center justify-center overflow-hidden rounded-full',
          'bg-[color:var(--surface-hover)]',
          borderColor ? `border-2 ${borderColor}` : '',
          className
        ].filter(Boolean).join(' ')}
        style={ringColor ? { boxShadow: `0 0 0 2px ${ringColor}` } : undefined}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt ?? name ?? ''}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : fallback ? (
          fallback
        ) : name ? (
          <span className="font-semibold text-muted">{initialsOf(name)}</span>
        ) : (
          <User className="h-1/2 w-1/2 text-faint" />
        )}
      </div>

      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${
            STATUS_COLORS[status] ?? STATUS_COLORS.offline
          }`}
          style={{ boxShadow: '0 0 0 2px var(--surface-raised)' }}
        />
      )}
    </Wrapper>
  )
})

Avatar.displayName = 'Avatar'

export default Avatar
