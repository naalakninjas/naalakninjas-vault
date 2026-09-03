import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { formatMoney } from '../../utils/format'

/**
 * Counts up to `value`. Skips the animation entirely when the user has
 * asked for reduced motion, or when the value is zero.
 */
const AnimatedMoney = ({ value }) => {
  const prefersReducedMotion = useReducedMotion()
  const target = Math.round(Number(value) || 0)
  const [shown, setShown] = useState(target)

  useEffect(() => {
    if (prefersReducedMotion || target === 0) {
      setShown(target)
      return
    }

    const duration = 420
    let frame
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setShown(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, prefersReducedMotion])

  return <span className="numeric">{formatMoney(shown)}</span>
}

const Metric = ({ label, value, tone = 'default' }) => {
  const tones = {
    default: 'text-strong',
    positive: 'text-emerald-400',
    warning: 'text-amber-400'
  }

  return (
    <div className="inset px-3 py-2.5">
      <p className="truncate text-[10px] uppercase tracking-wide text-faint sm:text-[11px]">
        {label}
      </p>
      <p className={`numeric mt-1 text-sm font-semibold sm:text-base ${tones[tone]}`}>
        {formatMoney(value)}
      </p>
    </div>
  )
}

const BalancePanel = ({
  vaultBalance = 0,
  availableBalance = 0,
  outstandingAmount = 0,
  lockedReserve = 0
}) => {
  const reserveIntact = vaultBalance >= lockedReserve
  const headroom = vaultBalance - lockedReserve

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="panel overflow-hidden"
    >
      {/* Headline number */}
      <div className="p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">
          Total vault balance
        </p>

        <p className="mt-2 text-[2.5rem] font-semibold leading-none text-strong sm:text-5xl">
          <AnimatedMoney value={vaultBalance} />
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {reserveIntact ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="text-muted">
                Reserve intact
                {headroom > 0 && (
                  <> · <span className="numeric">{formatMoney(headroom)}</span> above the floor</>
                )}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span className="text-muted">
                <span className="numeric">{formatMoney(lockedReserve - vaultBalance)}</span>{' '}
                below the reserve floor
              </span>
            </>
          )}
        </div>
      </div>

      {/* Breakdown, recessed so it reads as supporting detail. Stays three
          across on phones so it does not push the actions below the fold. */}
      <div
        className="grid grid-cols-3 gap-2 border-t p-3"
        style={{ borderColor: 'var(--line-subtle)' }}
      >
        <Metric label="Available" value={availableBalance} tone="positive" />
        <Metric
          label="Outstanding"
          value={outstandingAmount}
          tone={outstandingAmount > 0 ? 'warning' : 'default'}
        />
        <Metric label="Reserve" value={lockedReserve} />
      </div>
    </motion.section>
  )
}

export default BalancePanel
