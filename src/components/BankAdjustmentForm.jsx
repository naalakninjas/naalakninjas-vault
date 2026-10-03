import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input } from './ui'

/** Postgres DECIMAL columns can arrive as strings, so coerce before arithmetic. */
const num = (value) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const today = () => new Date().toISOString().split('T')[0]

// Common bank statement lines, so most entries are a couple of taps rather
// than four friends slowly converging on how to spell "maintenance fee" the
// same way each time. 'Other' drops to a free-text field for anything unlisted.
const REASONS = {
  fee: ['Maintenance fee', 'SMS/alert charges', 'Minimum balance penalty', 'Other'],
  interest: ['Savings interest', 'Fixed deposit interest', 'Other']
}

/** Whether a preset reason covers this value, or it needs the 'Other' free-text field. */
const isPresetReason = (kind, reason) => REASONS[kind].includes(reason)

/**
 * Builds the initial form state for a given adjustment, or the blank
 * defaults when `adjustment` is null (logging a new one). A reason saved
 * before today's preset list existed, or typed as something not on it, still
 * needs to land in the free-text field rather than silently resetting to the
 * first preset.
 */
const initialState = (adjustment) => {
  if (!adjustment) {
    return {
      kind: 'fee',
      reason: REASONS.fee[0],
      customReason: '',
      amount: '',
      entry_date: today(),
      notes: ''
    }
  }

  const kind = adjustment.kind === 'interest' ? 'interest' : 'fee'
  const matchesPreset = isPresetReason(kind, adjustment.reason)

  return {
    kind,
    reason: matchesPreset ? adjustment.reason : 'Other',
    customReason: matchesPreset ? '' : (adjustment.reason || ''),
    amount: String(adjustment.amount ?? ''),
    entry_date: adjustment.entry_date || today(),
    notes: adjustment.notes || ''
  }
}

/**
 * Logs a line from the bank statement that nobody in the squad requested — a
 * fee that shrinks the vault, or interest the bank credited that grows it.
 * Pass `adjustment` to edit an existing entry instead of logging a new one.
 * Rendered inside a <Modal>, so it owns no overlay or title bar. See
 * log_bank_adjustment() in db/schema.sql for how this feeds the balance.
 */
const BankAdjustmentForm = ({ adjustment = null, onSubmit, onCancel }) => {
  const { currentNinja } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState(() => initialState(adjustment))

  const isOther = formData.reason === 'Other'

  const setKind = (kind) => {
    setFormData((prev) => ({ ...prev, kind, reason: REASONS[kind][0], customReason: '' }))
    setErrors({})
  }

  const validate = () => {
    const next = {}
    const amount = num(formData.amount)

    if (!formData.amount || amount <= 0) {
      next.amount = 'Enter an amount greater than zero'
    }

    if (isOther && !formData.customReason.trim()) {
      next.customReason = 'Describe what this line was for'
    }

    if (!formData.entry_date) {
      next.entry_date = 'Pick the date on the bank statement'
    } else if (formData.entry_date > today()) {
      next.entry_date = 'The date cannot be in the future'
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
        // Editing keeps the original logger — this is a correction, not a
        // claim that whoever fixed a typo is the one who noticed the charge.
        member_id: adjustment ? adjustment.member_id : currentNinja?.id,
        kind: formData.kind,
        amount: num(formData.amount),
        reason: isOther ? formData.customReason.trim() : formData.reason,
        entry_date: formData.entry_date,
        notes: formData.notes.trim() || null
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Fee vs interest, side by side — picking wrong is a one-tap fix before
          submitting, so this stays a toggle rather than a dropdown. */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setKind('fee')}
          className={`focus-ring rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
            formData.kind === 'fee'
              ? 'border-red-500/60 bg-red-500/10 text-red-400'
              : 'border-[color:var(--line-strong)] text-muted hover:text-strong'
          }`}
        >
          Bank fee
        </button>
        <button
          type="button"
          onClick={() => setKind('interest')}
          className={`focus-ring rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
            formData.kind === 'interest'
              ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
              : 'border-[color:var(--line-strong)] text-muted hover:text-strong'
          }`}
        >
          Interest credited
        </button>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="adjustment-reason" className="block text-sm font-medium text-muted">
          {formData.kind === 'fee' ? 'What kind of charge?' : 'What kind of credit?'}
        </label>
        <select
          id="adjustment-reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className="ninja-input"
        >
          {REASONS[formData.kind].map((reason) => (
            <option key={reason} value={reason}>{reason}</option>
          ))}
        </select>
      </div>

      {isOther && (
        <Input
          label={formData.kind === 'fee' ? 'Describe the charge' : 'Describe the credit'}
          name="customReason"
          value={formData.customReason}
          onChange={handleChange}
          placeholder={formData.kind === 'fee' ? 'e.g. Cheque book charges' : 'e.g. Quarterly bonus interest'}
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
        label="Statement date"
        type="date"
        name="entry_date"
        value={formData.entry_date}
        onChange={handleChange}
        max={today()}
        error={errors.entry_date}
        hint="The date on the bank statement, not today's date."
      />

      <div className="space-y-1.5">
        <label htmlFor="adjustment-notes" className="block text-sm font-medium text-muted">
          Notes <span className="text-faint">(optional)</span>
        </label>
        <textarea
          id="adjustment-notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Anything worth remembering about this line"
          className="ninja-input resize-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" loading={submitting} className="flex-1">
          {adjustment
            ? 'Save changes'
            : formData.kind === 'fee' ? 'Log fee' : 'Log interest'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default BankAdjustmentForm
