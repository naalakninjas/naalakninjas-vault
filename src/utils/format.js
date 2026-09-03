// Shared formatters so every screen renders money and dates identically.

const INR = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
})

/** Full amount with Indian digit grouping: 125000 -> "₹1,25,000" */
export const formatMoney = (value) => `₹${INR.format(Math.round(Number(value) || 0))}`

/** Plain grouped number, no symbol: 125000 -> "1,25,000" */
export const formatNumber = (value) => INR.format(Math.round(Number(value) || 0))

/** Compact form for tight spaces: 125000 -> "₹1.25L" */
export const formatMoneyCompact = (value) => {
  const amount = Math.round(Number(value) || 0)
  if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
  if (Math.abs(amount) >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * How long ago, in the shortest form that is still unambiguous. Switches to a
 * plain date after a week, where "eleven days ago" has stopped being easier to
 * read than the date itself.
 */
export const formatRelative = (value) => {
  const then = new Date(value)
  if (Number.isNaN(then.getTime())) return ''

  const elapsed = Date.now() - then.getTime()

  if (elapsed < 0) return 'just now'
  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`

  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Date and time together, for the exact moment behind a relative label. */
export const formatDateTime = (value) => {
  const at = new Date(value)
  if (Number.isNaN(at.getTime())) return ''

  return at.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Clamp a ratio to a 0-100 percentage. */
export const toPercent = (value, total) => {
  const denominator = Number(total) || 0
  if (denominator <= 0) return 0
  return Math.max(0, Math.min(100, (Number(value) || 0) / denominator * 100))
}
