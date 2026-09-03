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

/** Clamp a ratio to a 0-100 percentage. */
export const toPercent = (value, total) => {
  const denominator = Number(total) || 0
  if (denominator <= 0) return 0
  return Math.max(0, Math.min(100, (Number(value) || 0) / denominator * 100))
}
