import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LifeBuoy, ThumbsUp, Wallet, RefreshCw, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dbService } from '../services/supabase'
import BalancePanel from '../components/dashboard/BalancePanel'
import QuickActions from '../components/dashboard/QuickActions'
import StatGrid from '../components/dashboard/StatGrid'
import SquadPanel from '../components/dashboard/SquadPanel'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import { formatMoney } from '../utils/format'

const EMPTY = {
  vaultBalance: 0,
  availableBalance: 0,
  outstandingAmount: 0,
  totalContributions: 0,
  activeMissions: 0,
  pendingMissions: 0,
  memberTotals: [],
  recentActivity: []
}

// Used only when vault_settings has not been seeded yet.
const SETTING_FALLBACKS = {
  monthly_contribution: 5000,
  minimum_balance: 50000
}

const readSetting = (settings, key) => {
  const raw = settings?.find((s) => s.key === key)?.value
  const parsed = Number(raw)
  return Number.isFinite(parsed) && raw !== null && raw !== ''
    ? parsed
    : SETTING_FALLBACKS[key]
}

const sumAmounts = (rows = []) =>
  rows.reduce((total, row) => total + (Number(row.amount) || 0), 0)

const Dashboard = () => {
  const { currentNinja, ninjas } = useAuth()
  const [data, setData] = useState(EMPTY)
  const [settings, setSettings] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error

  const load = useCallback(async (signal) => {
    setStatus('loading')

    try {
      // Settings are non-critical: fall back to defaults rather than failing
      // the whole dashboard when the table has not been seeded.
      const [summary, loadedSettings] = await Promise.all([
        dbService.getDashboardSummary(),
        dbService.getSettings().catch(() => null)
      ])

      if (signal?.aborted) return

      const approvedTotal = sumAmounts(
        summary.missions?.filter((m) => m.status === 'approved')
      )
      const repaidTotal = sumAmounts(summary.repayments)

      setData({
        vaultBalance: Number(summary.vaultBalance) || 0,
        availableBalance: Number(summary.availableBalance) || 0,
        outstandingAmount: Math.max(0, approvedTotal - repaidTotal),
        totalContributions: Number(summary.totalContributions) || 0,
        activeMissions: summary.activeMissions || 0,
        pendingMissions: summary.pendingMissions || 0,
        memberTotals: summary.monthlyStatus || [],
        recentActivity: summary.recentActivity || []
      })
      setSettings(loadedSettings)
      setStatus('ready')
    } catch (error) {
      if (signal?.aborted) return
      console.error('Failed to load dashboard:', error)
      setData(EMPTY)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  if (status === 'loading') {
    return <DashboardSkeleton />
  }

  if (status === 'error') {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-20 text-center">
        <span
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(239, 68, 68, 0.12)' }}
        >
          <AlertCircle className="h-5 w-5 text-red-400" />
        </span>
        <h1 className="text-base font-semibold text-strong">Couldn’t load your vault</h1>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          The vault data didn’t come back. Check your connection and try again.
        </p>
        <button
          onClick={() => load()}
          className="focus-ring panel-interactive mt-5 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-strong"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    )
  }

  const perMember = readSetting(settings, 'monthly_contribution')
  const reserveFloor = readSetting(settings, 'minimum_balance')
  const monthlyGoal = perMember * (ninjas.length || 0)

  const stats = [
    {
      label: 'Contributed all time',
      value: formatMoney(data.totalContributions),
      icon: Wallet,
      accent: '#10B981'
    },
    {
      label: 'Active requests',
      value: data.activeMissions,
      icon: LifeBuoy,
      accent: '#8B5CF6'
    },
    {
      label: 'Awaiting your vote',
      value: data.pendingMissions,
      icon: ThumbsUp,
      accent: '#F59E0B'
    }
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      {/* Greeting — the mobile header already names the page, so this is desktop only */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-6 hidden lg:block"
      >
        <h1 className="text-xl font-semibold text-strong">
          Welcome back, {currentNinja?.name}
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          {monthlyGoal > 0 ? (
            <>
              The squad targets <span className="numeric">{formatMoney(monthlyGoal)}</span> a month.
            </>
          ) : (
            'Here’s where the vault stands today.'
          )}
        </p>
      </motion.header>

      <div className="space-y-4">
        <BalancePanel
          vaultBalance={data.vaultBalance}
          availableBalance={data.availableBalance}
          outstandingAmount={data.outstandingAmount}
          lockedReserve={reserveFloor}
        />

        <QuickActions />

        <StatGrid items={stats} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ActivityFeed activities={data.recentActivity} />
          </div>
          <div className="lg:col-span-2">
            <SquadPanel
              ninjas={ninjas}
              totals={data.memberTotals}
              currentNinjaId={currentNinja?.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
