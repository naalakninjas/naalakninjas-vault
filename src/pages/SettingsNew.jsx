import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Save,
  Lock,
  Eye,
  EyeOff,
  DollarSign,
  Users,
  Percent,
  Clock
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
  Modal
} from '../components/ui'
import { getNinjaBorderColor } from '../utils/ninjaHelpers.jsx'
import { showError, showSuccess } from '../utils/toast'
import { formatMoney } from '../utils/format'

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

  const validatePin = () => {
    const newErrors = {}
    
    if (!pinForm.currentPin) {
      newErrors.currentPin = 'Current PIN is required'
    }
    
    if (!pinForm.newPin || pinForm.newPin.length !== 4) {
      newErrors.newPin = 'New PIN must be 4 digits'
    }
    
    if (pinForm.newPin !== pinForm.confirmPin) {
      newErrors.confirmPin = 'PINs do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validatePin()) {
      onSubmit(pinForm)
      onClose()
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' })
      setErrors({})
    }
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
          <Button variant="primary" onClick={handleSubmit} className="flex-1">
            Update PIN
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
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
  const { currentNinja, updateNinjaPin } = useAuth()
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

  useEffect(() => {
    loadSettings()
  }, [])

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
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
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

  const handlePinChange = (pinForm) => {
    try {
      updateNinjaPin(currentNinja.id, pinForm.newPin)
      showSuccess('PIN changed successfully!')
    } catch (error) {
      console.error('Error changing PIN:', error)
      showError('Failed to change PIN')
    }
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
          
          <VaultRulesSection
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onSave={handleSave}
            hasChanges={hasChanges}
            saving={saving}
          />
        </div>
      </div>
    </PageContainer>
  )
}

export default SettingsPage