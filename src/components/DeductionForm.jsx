import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input } from './ui'

/** Postgres DECIMAL columns can arrive as strings, so coerce before arithmetic. */
const num = (value) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const today = () => new Date().toISOString().split('T')[0]

// Common bank-side charges, so most entries are a couple of taps rather than
// four friends slowly converging on how to spell "maintenance fee" the same
// way each time. 'Other' drops to a free-text field for anything unlisted.
const REASONS = [
  'Maintenance fee',
  'SMS/alert charges',
  'Minimum balance penalty',
  'Other'
]

/**
 * Logs a bank-side deduction — a charge nobody in the squad requested, like a
 * maintenance fee. Rendered inside a <Modal>, so it owns no overlay or title
 * bar. See reset_member_pin()'s neighbour, log_deduction(), in db/schema.sql
 * for how this feeds the vault balance.
 */
const DeductionForm = ({ onSubmit, onCancel }) => {
  const { currentNinja } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    reason: REASONS[0],
    customReason: '',
    amount: '',
    charge_date: today(),
    notes: ''
  })

  const isOther = formData.reason === 'Other'

  const validate = () => {
    const next = {}
    const amount = num(formData.amount)

    if (!formData.amount || amount <= 0) {
      next.amount = 'Enter an amount greater than zero'
    }

    if (isOther && !formData.customReason.trim()) {
      next.customReason = 'Describe what this charge was for'
    }

    if (!formData.charge_date) {
      next.charge_date = 'Pick the date the bank charged this'
    } else if (formData.charge_date > today()) {
      next.charge_date = 'The charge date cannot be in the future'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate() || submitting) return

    setSubmitting(true)
    try {
      await onSubmit({
        member_id: currentNinja?.id,
        amount: num(formData.amount),
        reason: isOther ? formData.customReason.trim() : formData.reason,
        charge_date: formData.charge_date,
        notes: formData.notes.trim() || null
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="deduction-reason" className="block text-sm font-medium text-muted">
          What kind of charge?
        </label>
        <select
          id="deduction-reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className="ninja-input"
        >
          {REASONS.map((reason) => (
            <option key={reason} value={reason}>{reason}</option>
          ))}
        </select>
      </div>

      {isOther && (
        <Input
          label="Describe the charge"
          name="customReason"
          value={formData.customReason}
          onChange={handleChange}
          placeholder="e.g. Cheque book charges"
          error={errors.customReason}
        />
      )}

      <Input
        label="Amount (₹)"
        type="number"
        name="amount"
        value={formData.amount}
        onChange={handleChange}
        min="1"
        step="1"
        placeholder="Enter amount"
        error={errors.amount}
      />

      <Input
        label="Charge date"
        type="date"
        name="charge_date"
        value={formData.charge_date}
        onChange={handleChange}
        max={today()}
        error={errors.charge_date}
        hint="The date on the bank statement, not today's date."
      />

      <div className="space-y-1.5">
        <label htmlFor="deduction-notes" className="block text-sm font-medium text-muted">
          Notes <span className="text-faint">(optional)</span>
        </label>
        <textarea
          id="deduction-notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Anything worth remembering about this charge"
          className="ninja-input resize-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" loading={submitting} className="flex-1">
          Log deduction
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default DeductionForm
