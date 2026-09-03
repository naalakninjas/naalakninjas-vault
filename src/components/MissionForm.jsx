import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dbService } from '../services/supabase'
import { Button, Input } from './ui'
import { formatMoney } from '../utils/format'

const REASON_MAX = 200
const REASON_MIN = 10

/**
 * Emergency fund request form.
 *
 * Rendered inside a <Modal>, so it deliberately owns no overlay, title bar or
 * close button of its own.
 */
const MissionForm = ({ onSubmit, onCancel }) => {
  const { currentNinja } = useAuth()
  const [formData, setFormData] = useState({ amount: '', reason: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [vault, setVault] = useState({
    availableBalance: 0,
    withdrawalPercent: 50,
    requiredApprovals: 3,
    loading: true
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [availableBalance, settings] = await Promise.all([
          dbService.getAvailableBalance(),
          dbService.getSettings().catch(() => [])
        ])

        if (cancelled) return

        const read = (key, fallback) => {
          const raw = (settings ?? []).find((s) => s.key === key)?.value
          const parsed = parseFloat(raw)
          return Number.isFinite(parsed) ? parsed : fallback
        }

        setVault({
          availableBalance,
          withdrawalPercent: read('withdrawal_percentage', 50),
          requiredApprovals: read('required_approvals', 3),
          loading: false
        })
      } catch (error) {
        if (cancelled) return
        console.error('Error loading vault data:', error)
        setVault((prev) => ({ ...prev, loading: false }))
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // availableBalance already excludes the minimum reserve, so the cap is just
  // the configured share of it — subtracting the reserve again would double-count it.
  const maxWithdrawal = Math.floor(vault.availableBalance * (vault.withdrawalPercent / 100))

  const validate = () => {
    const next = {}
    const amount = parseFloat(formData.amount)
    const reason = formData.reason.trim()

    if (!formData.amount || Number.isNaN(amount) || amount <= 0) {
      next.amount = 'Enter an amount greater than zero'
    } else if (maxWithdrawal <= 0) {
      next.amount = 'The vault has no funds available to request right now'
    } else if (amount > maxWithdrawal) {
      next.amount = `The most you can request right now is ${formatMoney(maxWithdrawal)}`
    }

    if (!reason) {
      next.reason = 'A reason is required'
    } else if (reason.length < REASON_MIN) {
      next.reason = `Please add a little more detail (at least ${REASON_MIN} characters)`
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
        member_id: currentNinja?.id,
        amount: parseFloat(formData.amount),
        reason: formData.reason.trim()
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* What the vault can currently support */}
      <div className="inset p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-faint">Available</p>
            <p className="numeric mt-0.5 text-sm font-semibold text-emerald-400">
              {vault.loading ? '—' : formatMoney(vault.availableBalance)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-faint">
              You can request
            </p>
            <p className="numeric mt-0.5 text-sm font-semibold text-strong">
              {vault.loading ? '—' : formatMoney(maxWithdrawal)}
            </p>
          </div>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-faint">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span>
            Up to {vault.withdrawalPercent}% of the available balance, and{' '}
            {vault.requiredApprovals} of {4} squad members must approve.
          </span>
        </p>
      </div>

      <Input
        label="Requesting as"
        value={currentNinja?.name ?? ''}
        readOnly
        disabled
      />

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
        hint={
          !errors.amount && !vault.loading
            ? `Maximum ${formatMoney(maxWithdrawal)}`
            : undefined
        }
      />

      <div className="space-y-1.5">
        <label htmlFor="mission-reason" className="block text-sm font-medium text-muted">
          Why do you need it?
        </label>
        <textarea
          id="mission-reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows={4}
          maxLength={REASON_MAX}
          aria-invalid={Boolean(errors.reason) || undefined}
          placeholder="Describe the emergency and why you need these funds…"
          className={`ninja-input resize-none ${errors.reason ? 'border-red-500' : ''}`}
        />
        {errors.reason ? (
          <p className="text-xs text-red-400">{errors.reason}</p>
        ) : (
          <p className="numeric text-xs text-faint">
            {formData.reason.length}/{REASON_MAX}
          </p>
        )}
      </div>

      <p className="text-xs leading-relaxed text-faint">
        This goes to the whole squad for a vote. Be clear and honest about the
        situation.
      </p>

      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" loading={submitting} className="flex-1">
          Submit request
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default MissionForm
