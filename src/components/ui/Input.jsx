import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  hint,
  icon: Icon,
  showPasswordToggle = false,
  className = '',
  containerClassName = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`

  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type
  const hasError = Boolean(error)
  const canToggle = showPasswordToggle || isPassword

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-muted">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        )}

        <input
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={hasError || undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={[
            'h-11 w-full rounded-xl border bg-[color:var(--surface-base)] px-3.5 text-sm text-strong',
            'placeholder:text-faint transition-colors duration-150',
            'focus:outline-none focus-visible:outline-none',
            hasError
              ? 'border-red-500/60 focus:border-red-500'
              : 'border-[color:var(--line-strong)] hover:border-white/20 focus:border-violet-500',
            Icon ? 'pl-10' : '',
            canToggle ? 'pr-11' : '',
            className
          ].filter(Boolean).join(' ')}
          {...props}
        />

        {canToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="focus-ring absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-faint transition-colors hover:text-strong"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p id={messageId} className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
