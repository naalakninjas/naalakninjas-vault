import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button, Input } from './ui'
import { formatMoney } from '../utils/format'

/** Postgres DECIMAL columns can arrive as strings, so coerce before arithmetic. */
const num = (value) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const today = () => new Date().toISOString().split('T')[0]

/**
 * Records a repayment against one of the signed-in ninja's approved requests.
 * Rendered inside a <Modal>, so it owns no overlay or title bar.
 */
const RepaymentForm = ({ activeMissions = [], selectedMission, onSubmit, onCancel }) => {
  const { currentNinja } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    mission_id: selectedMission?.id ?? '',
    amount: '',
    payment_date: today()
  })

  // Only the current ninja's outstanding requests are repayable here.
  const repayable = useMemo(
    () => activeMissions.filter((m) => num(m.remaining_amount) > 0),
    [activeMissions]
  )

  const mission = useMemo(() => {
    if (selectedMission) return selectedMission
    return repayable.find((m) => String(m.id) === String(formData.mission_id))
  }, [selectedMission, repayable, formData.mission_id])

  const remaining = num(mission?.remaining_amount)
  const repaid = num(mission?.total_repaid)
  const original = num(mission?.amount)

  // Default the amount to the full outstanding balance once a request is chosen.
  useEffect(() => {
    if (!mission) return
    setFormData((prev) => ({
      ...prev,
      mission_id: mission.id,
      amount: prev.amount === '' ? String(num(mission.remaining_amount)) : prev.amount
    }))
  }, [mission])

  const validate = () => {
    const next = {}
    const amount = num(formData.amount)

    if (!formData.mission_id) {
      next.mission_id = 'Choose which request you are repaying'
    }

    if (!formData.amount || amount <= 0) {
      next.amount = 'Enter an amount greater than zero'
    } else if (mission && amount > remaining) {
      next.amount = `That is more than the ${formatMoney(remaining)} still outstanding`
    }

    if (!formData.payment_date) {
      next.payment_date = 'Pick the date you paid'
    } else if (formData.payment_date > today()) {
      next.payment_date = 'The payment date cannot be in the future'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate() || submitting) return

    setSubmitting(true)
    try {
      await onSubmit({
        mission_id: parseInt(formData.mission_id, 10),
        member_id: currentNinja?.id,
        amount: num(formData.amount),
        payment_date: formData.payment_date
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const afterPayment = remaining - num(formData.amount)

  if (repayable.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm font-medium text-muted">Nothing to repay</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-faint">
          You have no approved requests with an outstanding balance.
        </p>
        <Button variant="secondary" onClick={onCancel} className="mt-5">
          Close
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Which request */}
      <div className="space-y-1.5">
        <label htmlFor="repayment-mission" className="block text-sm font-medium text-muted">
          Repaying
        </label>
        <select
          id="repayment-mission"
          name="mission_id"
          value={formData.mission_id}
          onChange={handleChange}
          disabled={Boolean(selectedMission)}
          className={`ninja-input ${errors.mission_id ? 'border-red-500' : ''} disabled:opacity-60`}
        >
          <option value="">Select a request</option>
          {repayable.map((item) => (
            <option key={item.id} value={item.id}>
              {formatMoney(num(item.remaining_amount))} outstanding — {item.reason?.slice(0, 40) ?? 'Request'}
            </option>
          ))}
        </select>
        {errors.mission_id && <p className="text-xs text-red-400">{errors.mission_id}</p>}
      </div>

      {/* Current standing on that request */}
      {mission && (
        <div className="inset grid grid-cols-3 gap-3 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-faint">Borrowed</p>
            <p className="numeric mt-0.5 text-sm font-semibold text-strong">
              {formatMoney(original)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-faint">Repaid</p>
            <p className="numeric mt-0.5 text-sm font-semibold text-emerald-400">
              {formatMoney(repaid)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-faint">Outstanding</p>
            <p className="numeric mt-0.5 text-sm font-semibold text-amber-400">
              {formatMoney(remaining)}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Input
          label="Amount (₹)"
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          min="1"
          max={remaining || undefined}
          step="1"
          placeholder="Enter amount"
          error={errors.amount}
        />

        {/* Shortcuts derived from the actual balance, not fixed figures */}
        {mission && remaining > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, amount: String(remaining) }))}
              className="focus-ring rounded-lg border border-[color:var(--line-subtle)] px-2.5 py-1 text-xs text-muted transition-colors hover:text-strong"
            >
              Full · {formatMoney(remaining)}
            </button>
            {remaining > 1 && (
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, amount: String(Math.floor(remaining / 2)) }))
                }
                className="focus-ring rounded-lg border border-[color:var(--line-subtle)] px-2.5 py-1 text-xs text-muted transition-colors hover:text-strong"
              >
                Half · {formatMoney(Math.floor(remaining / 2))}
              </button>
            )}
          </div>
        )}
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

      {/* What this payment leaves behind */}
      {mission && num(formData.amount) > 0 && (
        <div className="inset p-3">
          <p className="text-xs text-muted">
            {afterPayment <= 0 ? (
              <span className="font-medium text-emerald-400">
                This clears the request in full.
              </span>
            ) : (
              <>
                Leaves{' '}
                <span className="numeric font-medium text-strong">
                  {formatMoney(afterPayment)}
                </span>{' '}
                outstanding.
              </>
            )}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" loading={submitting} className="flex-1">
          Record repayment
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default RepaymentForm
