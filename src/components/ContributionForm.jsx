import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input } from './ui'
import { getNinjaAccent } from '../utils/ninjaHelpers.jsx'
import { formatMoney } from '../utils/format'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const today = () => new Date().toISOString().split('T')[0]

/** Current year plus the two before it, so the list never goes stale. */
const yearOptions = () => {
  const current = new Date().getFullYear()
  return [current, current - 1, current - 2]
}

const num = (value) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Logs or edits a monthly contribution.
 *
 * Rendered inside a <Modal>, so it owns no overlay or title bar. When the
 * entry would push the member past their monthly target, the form swaps to an
 * inline confirmation step rather than stacking a second dialog.
 */
const ContributionForm = ({
  contribution,
  onSubmit,
  onCancel,
  contributions = [],
  monthlyTarget = 5000
}) => {
  const { currentNinja } = useAuth()
  const accent = getNinjaAccent(currentNinja)

  const [formData, setFormData] = useState({
    amount: String(monthlyTarget),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    payment_date: today()
  })
  const [errors, setErrors] = useState({})
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (contribution) {
      setFormData({
        amount: String(num(contribution.amount)),
        month: contribution.month,
        year: contribution.year,
        payment_date: contribution.payment_date || today()
      })
    }
  }, [contribution])

  /** What this member has already logged for the selected month, excluding the row being edited. */
  const alreadyLogged = contributions
    .filter((c) =>
      c.member_id === currentNinja?.id &&
      Number(c.month) === Number(formData.month) &&
      Number(c.year) === Number(formData.year) &&
      (!contribution || c.id !== contribution.id)
    )
    .reduce((total, c) => total + num(c.amount), 0)

  const amount = num(formData.amount)
  const newTotal = alreadyLogged + amount
  const overBy = newTotal - monthlyTarget

  const validate = () => {
    const next = {}

    if (!formData.amount || amount <= 0) {
      next.amount = 'Enter an amount greater than zero'
    }

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      next.month = 'Select a month'
    }

    if (!formData.payment_date) {
      next.payment_date = 'Pick the date you paid'
    } else if (formData.payment_date > today()) {
      next.payment_date = 'The payment date cannot be in the future'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({
        // Preserve ownership when editing; new entries belong to the signed-in ninja.
        member_id: contribution?.member_id ?? currentNinja?.id,
        amount,
        month: parseInt(formData.month, 10),
        year: parseInt(formData.year, 10),
        payment_date: formData.payment_date
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate() || submitting) return

    if (overBy > 0) {
      setConfirming(true)
      return
    }

    submit()
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  // Inline confirmation instead of a stacked dialog.
  if (confirming) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(245, 158, 11, 0.14)' }}
          >
            <AlertTriangle className="h-[18px] w-[18px] text-amber-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-strong">
              That is more than your monthly target
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Your target for {MONTHS[formData.month - 1]} is{' '}
              {formatMoney(monthlyTarget)}. Extra is welcome — just confirming it
              is intentional.
            </p>
          </div>
        </div>

        <div className="inset divide-y divide-[color:var(--line-subtle)] p-0">
          {[
            ['Already logged', formatMoney(alreadyLogged)],
            ['This entry', formatMoney(amount)],
            ['New total', formatMoney(newTotal)],
            ['Over target by', formatMoney(overBy)]
          ].map(([label, value], index) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-muted">{label}</span>
              <span
                className={`numeric text-sm font-medium ${
                  index === 3 ? 'text-amber-400' : 'text-strong'
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={submit} loading={submitting} className="flex-1">
            Yes, log it
          </Button>
          <Button variant="secondary" onClick={() => setConfirming(false)} className="flex-1">
            Go back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Who is contributing — fixed to the signed-in ninja */}
      <div className="inset flex items-center gap-3 p-4">
        <img
          src={currentNinja?.avatar}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover"
          style={{ boxShadow: `0 0 0 2px ${accent}` }}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-strong">{currentNinja?.name}</p>
          <p className="truncate text-xs text-faint">{currentNinja?.title}</p>
        </div>
      </div>

      <Input
        label="Amount (₹)"
        type="number"
        name="amount"
        value={formData.amount}
        onChange={handleChange}
        min="1"
        step="1"
        error={errors.amount}
        hint={!errors.amount ? `Monthly target ${formatMoney(monthlyTarget)}` : undefined}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="contribution-month" className="block text-sm font-medium text-muted">
            Month
          </label>
          <select
            id="contribution-month"
            name="month"
            value={formData.month}
            onChange={handleChange}
            className={`ninja-input ${errors.month ? 'border-red-500' : ''}`}
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>
          {errors.month && <p className="text-xs text-red-400">{errors.month}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contribution-year" className="block text-sm font-medium text-muted">
            Year
          </label>
          <select
            id="contribution-year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="ninja-input"
          >
            {yearOptions().map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Payment date"
        type="date"
        name="payment_date"
        value={formData.payment_date}
        onChange={handleChange}
        max={today()}
        error={errors.payment_date}
      />

      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" loading={submitting} className="flex-1">
          {contribution ? 'Update contribution' : 'Add contribution'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default ContributionForm
