import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Save,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  DollarSign,
  Users,
  Percent,
  Clock,
  Landmark,
  Trash2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dbService } from '../services/supabase'
import { 
  PageContainer, 
  HeroPageHeader, 
  Card, 
  Button, 
  Input,
  Avatar,
  SkeletonLoader,
  Modal,
  ConfirmDialog
} from '../components/ui'
import { getNinjaBorderColor } from '../utils/ninjaHelpers.jsx'
import { showError, showSuccess } from '../utils/toast'
import { formatDate, formatMoney } from '../utils/format'
import {
  DEFAULT_EDIT_WINDOW_HOURS,
  editWindowRemaining,
  isWithinEditWindow,
  readEditWindowHours
} from '../utils/editWindow'
import BankAdjustmentForm from '../components/BankAdjustmentForm'
import { useLiveRefresh } from '../hooks/useLiveRefresh'

const SettingsSection = ({ title, children, className = '' }) => (
  <Card className={`p-5 ${className}`}>
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-faint">
      {title}
    </h2>
    {children}
  </Card>
)

const ProfileSection = ({ currentNinja, onPinChange, stats }) => {
  const [showPinChange, setShowPinChange] = useState(false)
  
  const figures = [
    ['Contributed', stats.contributed, 'text-emerald-400'],
    ['Borrowed', stats.borrowed, 'text-amber-400'],
    ['Outstanding', stats.outstanding, 'text-strong']
  ]

  // Deliberately has no section heading or blurb: the page header already
  // frames this, and the avatar makes it self-evident.
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar
          src={currentNinja?.avatar}
          name={currentNinja?.name}
          size="lg"
          borderColor={getNinjaBorderColor(currentNinja)}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-strong">
            {currentNinja?.name}
          </p>
          <p className="truncate text-sm text-faint">{currentNinja?.title}</p>
        </div>

        {/* Full width on phones so the name above it keeps its room */}
        <Button
          variant="secondary"
          size="sm"
          icon={Lock}
          onClick={() => setShowPinChange(true)}
          className="w-full sm:w-auto"
        >
          Change PIN
        </Button>
      </div>

      <div
        className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4"
        style={{ borderColor: 'var(--line-subtle)' }}
      >
        {figures.map(([label, value, tone]) => (
          <div key={label} className="flex items-baseline gap-2">
            <span className="text-xs text-faint">{label}</span>
            <span className={`numeric text-sm font-semibold ${tone}`}>
              {formatMoney(value)}
            </span>
          </div>
        ))}
      </div>

      <PinChangeModal
        isOpen={showPinChange}
        onClose={() => setShowPinChange(false)}
        onSubmit={onPinChange}
        currentNinja={currentNinja}
      />
    </Card>
  )
}

const PinChangeModal = ({ isOpen, onClose, onSubmit, currentNinja }) => {
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  })
  const [showPins, setShowPins] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const validatePin = () => {
    const newErrors = {}
    
    // Shape only. Whether the current PIN is actually right is decided by the
    // database, which is the only place the hash exists.
    if (!/^\d{4}$/.test(pinForm.currentPin)) {
      newErrors.currentPin = 'Enter your current 4-digit PIN'
    }
    
    if (!/^\d{4}$/.test(pinForm.newPin)) {
      newErrors.newPin = 'New PIN must be 4 digits'
    }
    
    if (pinForm.newPin !== pinForm.confirmPin) {
      newErrors.confirmPin = 'PINs do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validatePin()) return

    setSaving(true)
    const result = await onSubmit(pinForm)
    setSaving(false)

    // Held open when the server refuses, because the reason is nearly always a
    // wrong current PIN and closing would throw that away along with the form.
    if (!result?.success) {
      setErrors({ currentPin: result?.error || 'Could not update your PIN.' })
      return
    }

    onClose()
    setPinForm({ currentPin: '', newPin: '', confirmPin: '' })
    setErrors({})
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change PIN" size="md">
      <div className="space-y-6">
        <Input
          label="Current PIN"
          type={showPins.current ? 'text' : 'password'}
          value={pinForm.currentPin}
          onChange={(e) => setPinForm({...pinForm, currentPin: e.target.value})}
          error={errors.currentPin}
          icon={showPins.current ? EyeOff : Eye}
          showPasswordToggle
        />
        
        <Input
          label="New PIN"
          type={showPins.new ? 'text' : 'password'}
          value={pinForm.newPin}
          onChange={(e) => setPinForm({...pinForm, newPin: e.target.value})}
          error={errors.newPin}
          maxLength={4}
        />
        
        <Input
          label="Confirm New PIN"
          type={showPins.confirm ? 'text' : 'password'}
          value={pinForm.confirmPin}
          onChange={(e) => setPinForm({...pinForm, confirmPin: e.target.value})}
          error={errors.confirmPin}
          maxLength={4}
        />
        
        <div className="flex gap-3 pt-4">
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={saving}
            className="flex-1"
          >
            Update PIN
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Clears a teammate's PIN so they see first-run setup again next time they
 * open the vault. Gated on the acting ninja's *own* PIN rather than any
 * special permission — anyone in the squad can vouch for a reset, but only
 * by proving it is really them, not by knowing the locked-out ninja's secret.
 *
 * The target picks their own new PIN afterwards; this modal never sets one
 * on their behalf, so no one but them ever knows it.
 */
const ResetPinModal = ({ isOpen, onClose, onSubmit, candidates }) => {
  const [targetId, setTargetId] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setTargetId('')
    setAdminPin('')
    setError('')
  }

  const handleSubmit = async () => {
    if (!targetId) {
      setError('Choose who needs a reset.')
      return
    }
    if (!/^\d{4}$/.test(adminPin)) {
      setError('Enter your own 4-digit PIN to confirm.')
      return
    }

    setSaving(true)
    const result = await onSubmit(Number(targetId), adminPin)
    setSaving(false)

    // Held open on failure, same as PinChangeModal: the reason is almost
    // always a mistyped PIN, and closing would make them start over blind.
    if (!result?.success) {
      setError(result?.error || 'Could not reset that PIN.')
      return
    }

    onClose()
    reset()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose()
        reset()
      }}
      title="Reset a teammate's PIN"
      size="md"
    >
      <div className="space-y-6">
        <p className="text-sm text-muted">
          This clears their PIN so they are asked to choose a new one next time
          they open the vault. You cannot choose it for them, and everyone will
          see in the activity feed that you did this.
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Who forgot their PIN?
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded-lg border bg-[color:var(--surface-base)] px-3 py-2.5 text-sm text-strong"
            style={{ borderColor: 'var(--line-subtle)' }}
          >
            <option value="">Select a ninja...</option>
            {candidates.map((ninja) => (
              <option key={ninja.id} value={ninja.id}>
                {ninja.name}
              </option>
            ))}
          </select>
          {candidates.length === 0 && (
            <p className="mt-1.5 text-xs text-faint">
              Nobody else has a PIN set yet — there is nothing to reset.
            </p>
          )}
        </div>

        <Input
          label="Your PIN"
          type="password"
          value={adminPin}
          onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          error={error}
          maxLength={4}
          hint="Proves it's really you asking, not just anyone on this device."
        />

        <div className="flex gap-3 pt-2">
          <Button
            variant="warning"
            onClick={handleSubmit}
            loading={saving}
            disabled={candidates.length === 0}
            className="flex-1"
          >
            Reset their PIN
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onClose()
              reset()
            }}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const LockedOutSection = ({ candidates, onReset }) => {
  const [showReset, setShowReset] = useState(false)

  return (
    <SettingsSection title="Locked out teammate?">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-muted">
          If someone forgot their PIN, you can clear it for them here instead of
          going into Supabase. They will choose a brand new one themselves.
        </p>
        <Button
          variant="secondary"
          size="sm"
          icon={KeyRound}
          onClick={() => setShowReset(true)}
          className="w-full sm:w-auto"
        >
          Reset a PIN
        </Button>
      </div>

      <ResetPinModal
        isOpen={showReset}
        onClose={() => setShowReset(false)}
        onSubmit={onReset}
        candidates={candidates}
      />
    </SettingsSection>
  )
}

/**
 * Lines the bank adds to the statement that nobody in the squad requested —
 * fees on one side, interest credited on the other.
 * get_vault_balance() already nets both in, so this section exists purely so
 * the squad can see and manage the ledger entries behind that movement,
 * instead of the balance just quietly being different than everyone expected.
 */
const BankActivitySection = ({ adjustments, editWindowHours, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false)

  const totalFees = adjustments
    .filter((a) => a.kind === 'fee')
    .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
  const totalInterest = adjustments
    .filter((a) => a.kind === 'interest')
    .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)

  const renderActions = (adjustment) => {
    if (!isWithinEditWindow(adjustment.created_at, editWindowHours)) {
      return (
        <span
          className="text-[11px] text-faint"
          title={`Editing closed ${editWindowHours} hours after the entry was added`}
        >
          Locked
        </span>
      )
    }

    return (
      <button
        type="button"
        onClick={() => onDelete(adjustment)}
        className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
        title={`Can be removed for ${editWindowRemaining(adjustment.created_at, editWindowHours)}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove
      </button>
    )
  }

  return (
    <SettingsSection title="Bank activity">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-muted">
          Fees and interest the bank adds to the statement without anyone
          asking. Logging these here keeps the vault balance honest.
          {(totalFees > 0 || totalInterest > 0) && (
            <>
              {' '}
              {totalFees > 0 && (
                <span className="numeric font-medium text-red-400">
                  -{formatMoney(totalFees)} fees
                </span>
              )}
              {totalFees > 0 && totalInterest > 0 && ', '}
              {totalInterest > 0 && (
                <span className="numeric font-medium text-emerald-400">
                  +{formatMoney(totalInterest)} interest
                </span>
              )}
              {' so far.'}
            </>
          )}
        </p>
        <Button
          variant="secondary"
          size="sm"
          icon={Landmark}
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto"
        >
          Log bank activity
        </Button>
      </div>

      {adjustments.length === 0 ? (
        <p className="py-4 text-center text-sm text-faint">Nothing logged yet.</p>
      ) : (
        <ul className="divide-y divide-[color:var(--line-subtle)]">
          {adjustments.map((adjustment) => {
            const isInterest = adjustment.kind === 'interest'
            return (
              <li key={adjustment.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-strong">{adjustment.reason}</p>
                  <p className="text-[11px] text-faint">
                    {formatDate(adjustment.entry_date)}
                    {adjustment.members?.name ? ` · logged by ${adjustment.members.name}` : ''}
                  </p>
                </div>
                <span
                  className={`numeric shrink-0 text-sm font-semibold ${
                    isInterest ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isInterest ? '+' : '-'}{formatMoney(adjustment.amount)}
                </span>
                {renderActions(adjustment)}
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Log bank activity"
        size="md"
      >
        <BankAdjustmentForm
          onSubmit={async (data) => {
            await onAdd(data)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </SettingsSection>
  )
}

const VaultRulesSection = ({ settings, onSettingsChange, onSave, hasChanges, saving }) => (
  <SettingsSection title="Vault rules">
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="Monthly Contribution"
          type="number"
          value={settings.monthly_contribution}
          onChange={(e) => onSettingsChange('monthly_contribution', e.target.value)}
          icon={DollarSign}
          hint="Required monthly contribution per ninja"
        />
        
        <Input
          label="Minimum Balance"
          type="number"
          value={settings.minimum_balance}
          onChange={(e) => onSettingsChange('minimum_balance', e.target.value)}
          icon={Shield}
          hint="Emergency reserve that must remain in vault"
        />
        
        <Input
          label="Withdrawal Percentage"
          type="number"
          value={settings.withdrawal_percentage}
          onChange={(e) => onSettingsChange('withdrawal_percentage', e.target.value)}
          icon={Percent}
          hint="Maximum % of available balance for missions"
        />
        
        <Input
          label="Required Approvals"
          type="number"
          value={settings.required_approvals}
          onChange={(e) => onSettingsChange('required_approvals', e.target.value)}
          icon={Users}
          hint="Votes needed to approve a mission"
        />

        <Input
          label="Lock Period (Months)"
          type="number"
          value={settings.lock_period_months}
          onChange={(e) => onSettingsChange('lock_period_months', e.target.value)}
          icon={Clock}
          hint="Months before contributions become withdrawable"
        />
      </div>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
        >
          <p className="text-sm text-amber-400">Unsaved changes</p>
          <Button
            variant="warning"
            size="sm"
            icon={Save}
            onClick={onSave}
            loading={saving}
          >
            Save changes
          </Button>
        </motion.div>
      )}
    </div>
  </SettingsSection>
)


const SettingsPage = () => {
  const { currentNinja, updateNinjaPin, resetNinjaPin, ninjas, pinStatus } = useAuth()
  const [settings, setSettings] = useState({
    monthly_contribution: '5000',
    minimum_balance: '50000',
    withdrawal_percentage: '50',
    required_approvals: '3',
    lock_period_months: '3'
  })
  const [profileStats, setProfileStats] = useState({
    contributed: 0,
    borrowed: 0,
    outstanding: 0
  })
  const [originalSettings, setOriginalSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [adjustments, setAdjustments] = useState([])
  const [editWindowHours, setEditWindowHours] = useState(DEFAULT_EDIT_WINDOW_HOURS)
  const [adjustmentDeleteTarget, setAdjustmentDeleteTarget] = useState(null)

  useEffect(() => {
    loadSettings()
    loadAdjustments()
  }, [])

  // Someone logging a fee or interest, or deleting one, should not need a
  // reload on every other ninja's phone before they see it.
  useLiveRefresh(['bank_adjustments'], () => loadAdjustments())

  useEffect(() => {
    const changed = Object.keys(settings).some(key => settings[key] !== originalSettings[key])
    setHasChanges(changed)
  }, [settings, originalSettings])

  /** Real contribution/borrowing figures for the signed-in ninja. */
  const loadProfileStats = async () => {
    if (!currentNinja?.id) return

    const [contributions, missions, repayments] = await Promise.all([
      dbService.getContributions(currentNinja.id).catch(() => []),
      dbService.getMissions().catch(() => []),
      dbService.getRepayments().catch(() => [])
    ])

    const sum = (rows) =>
      rows.reduce((total, row) => total + (parseFloat(row.amount) || 0), 0)

    const myApproved = missions.filter(
      (m) => m.member_id === currentNinja.id && ['approved', 'repaid'].includes(m.status)
    )
    const myRepayments = repayments.filter((r) => r.member_id === currentNinja.id)

    const borrowed = sum(myApproved)
    const repaid = sum(myRepayments)

    setProfileStats({
      contributed: sum(contributions),
      borrowed,
      outstanding: Math.max(0, borrowed - repaid)
    })
  }

  const loadSettings = async () => {
    try {
      const [settingsData] = await Promise.all([
        dbService.getSettings(),
        loadProfileStats()
      ])

      const saved = {}
      ;(settingsData ?? []).forEach(setting => {
        if (setting?.key != null) saved[setting.key] = String(setting.value ?? '')
      })

      // Saved values win; the defaults only cover keys the table has not been seeded with.
      const resolved = {
        monthly_contribution: saved.monthly_contribution || '5000',
        minimum_balance: saved.minimum_balance || '50000',
        withdrawal_percentage: saved.withdrawal_percentage || '50',
        required_approvals: saved.required_approvals || '3',
        lock_period_months: saved.lock_period_months || '3'
      }

      setSettings(resolved)
      setOriginalSettings(resolved)
      setEditWindowHours(readEditWindowHours(settingsData))
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdjustments = async () => {
    try {
      setAdjustments(await dbService.getBankAdjustments())
    } catch (error) {
      console.error('Error loading bank activity:', error)
    }
  }

  const handleAddAdjustment = async (adjustmentData) => {
    try {
      await dbService.addBankAdjustment(adjustmentData)
      await loadAdjustments()
      showSuccess(adjustmentData.kind === 'interest' ? 'Interest logged' : 'Fee logged')
    } catch (error) {
      console.error('Error logging bank activity:', error)
      showError(`Failed to log that: ${error.message}`)
    }
  }

  const handleDeleteAdjustment = async () => {
    const target = adjustmentDeleteTarget
    if (!target?.id) return

    try {
      await dbService.deleteBankAdjustment(target.id)
      await loadAdjustments()
      showSuccess('Entry removed')
    } catch (error) {
      console.error('Error deleting bank activity entry:', error)
      showError(`Failed to remove that: ${error.message}`)
    } finally {
      setAdjustmentDeleteTarget(null)
    }
  }

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== originalSettings[key]) {
          await dbService.updateSetting(key, value)
        }
      }
      
      setOriginalSettings(settings)
      setHasChanges(false)
      showSuccess('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      showError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Returns the result so the modal can stay open and show why a change was
  // refused — the current PIN is checked in Postgres, not here.
  const handlePinChange = async (pinForm) => {
    const result = await updateNinjaPin(
      currentNinja.id,
      pinForm.newPin,
      pinForm.currentPin
    )

    if (result.success) showSuccess('PIN changed successfully!')
    else showError(result.error)

    return result
  }

  // Only teammates who already have a PIN are worth offering — resetting one
  // that was never set would just hand back the same first-run screen they
  // are already on.
  const lockedOutCandidates = ninjas.filter(
    (ninja) => ninja.id !== currentNinja?.id && pinStatus?.[ninja.id]
  )

  const handleResetPin = async (targetId, adminPin) => {
    const result = await resetNinjaPin(currentNinja.id, adminPin, targetId)
    const targetName = ninjas.find((ninja) => ninja.id === targetId)?.name || 'Their'

    if (result.success) {
      showSuccess(`${targetName}'s PIN was reset. They'll choose a new one next time they open the vault.`)
    } else {
      showError(result.error)
    }

    return result
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-8">
          <SkeletonLoader.PageHeaderSkeleton />
          <div className="space-y-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonLoader.CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Hero Header */}
        <HeroPageHeader
          title="Settings"
          subtitle="Your profile, security, and vault rules"
        />

        {/* Settings Sections */}
        <div className="space-y-5">
          <ProfileSection 
            currentNinja={currentNinja} 
            onPinChange={handlePinChange}
            stats={profileStats}
          />

          <LockedOutSection
            candidates={lockedOutCandidates}
            onReset={handleResetPin}
          />

          <BankActivitySection
            adjustments={adjustments}
            editWindowHours={editWindowHours}
            onAdd={handleAddAdjustment}
            onDelete={setAdjustmentDeleteTarget}
          />
          
          <VaultRulesSection
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onSave={handleSave}
            hasChanges={hasChanges}
            saving={saving}
          />
        </div>
      </div>

      {/* Deletes are permanent, so name the exact entry before confirming */}
      <ConfirmDialog
        isOpen={Boolean(adjustmentDeleteTarget)}
        onClose={() => setAdjustmentDeleteTarget(null)}
        onConfirm={handleDeleteAdjustment}
        title="Remove this entry?"
        message={
          adjustmentDeleteTarget
            ? `${formatMoney(adjustmentDeleteTarget.amount)} for "${adjustmentDeleteTarget.reason}" will be removed.`
            : ''
        }
        details={
          adjustmentDeleteTarget?.kind === 'interest'
            ? 'This cannot be undone and the vault balance will drop by that amount.'
            : 'This cannot be undone and the vault balance will rise by that amount.'
        }
        confirmLabel="Remove"
      />
    </PageContainer>
  )
}

export default SettingsPage