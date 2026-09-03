import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, CreditCard, Edit, Trash2, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dbService } from '../services/supabase'
import { 
  PageContainer, 
  HeroPageHeader, 
  Card, 
  Button, 
  Table, 
  Badge, 
  Avatar, 
  EmptyState,
  SkeletonLoader,
  Modal,
  ConfirmDialog
} from '../components/ui'
import { getNinjaBorderColor } from '../utils/ninjaHelpers.jsx'
import { showError, showSuccess } from '../utils/toast'
import { formatMoney } from '../utils/format'
import ContributionForm from '../components/ContributionForm'

const ContributionsPage = () => {
  const { currentNinja, ninjas } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContribution, setEditingContribution] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  // Overwritten by the monthly_contribution setting once it loads.
  const [perMemberTarget, setPerMemberTarget] = useState(5000)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear])

  // Opened straight from a dashboard quick action. The state is cleared so a
  // refresh or back-navigation does not reopen the form.
  useEffect(() => {
    if (location.state?.openForm) {
      setShowForm(true)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  const loadData = async () => {
    try {
      const [contributionsData, settings] = await Promise.all([
        dbService.getContributions(),
        dbService.getSettings().catch(() => null)
      ])

      setContributions(contributionsData || [])

      const configured = parseFloat(
        (settings ?? []).find((s) => s.key === 'monthly_contribution')?.value
      )
      if (Number.isFinite(configured) && configured > 0) {
        setPerMemberTarget(configured)
      }
    } catch (error) {
      console.error('Error loading contributions:', error)
      setContributions([])
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (contributionData) => {
    try {
      if (editingContribution) {
        await dbService.updateContribution(editingContribution.id, contributionData)
      } else {
        await dbService.addContribution(contributionData)
      }
      
      await loadData()
      setShowForm(false)
      setEditingContribution(null)
      showSuccess(editingContribution ? 'Contribution updated successfully!' : 'Contribution added successfully!')
    } catch (error) {
      console.error('Error saving contribution:', error)
      showError(`Failed to save contribution: ${error.message}`)
    }
  }

  const handleDeleteContribution = async () => {
    const target = deleteTarget
    if (!target?.id) return

    try {
      await dbService.deleteContribution(target.id)
      await loadData()
      showSuccess('Contribution deleted')
    } catch (error) {
      console.error('Error deleting contribution:', error)
      showError('Failed to delete contribution')
    }
  }

  // Calculate statistics
  const totalThisMonth = contributions
    .filter(c => c.month === selectedMonth && c.year === selectedYear)
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
    
  const monthlyGoal = ninjas.length * perMemberTarget
  const progressPercentage = (totalThisMonth / monthlyGoal) * 100

  // Prepare table data
  const tableColumns = [
    {
      key: 'member',
      title: 'Member',
      render: (_, row) => {
        const ninja = ninjas.find(n => n.id === row.member_id)
        return (
          <div className="flex items-center gap-3">
            <Avatar 
              src={ninja?.avatar} 
              name={ninja?.name}
              size="sm"
              borderColor={getNinjaBorderColor(ninja)}
            />
            <div>
              <div className="font-medium text-strong">{ninja?.name}</div>
              <div className="text-xs text-muted">{ninja?.title}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'amount',
      title: 'Amount',
      render: (value) => (
        <div className="font-semibold text-emerald-400">
          ₹{parseFloat(value || 0).toLocaleString()}
        </div>
      )
    },
    {
      key: 'payment_date',
      title: 'Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'month',
      title: 'Period',
      render: (_, row) => `${months[row.month - 1]} ${row.year}`
    },
    {
      key: 'utr_number',
      title: 'UTR',
      render: (value) => value || '-'
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, row) => (
        <Badge variant="success">
          Paid
        </Badge>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => {
        // Each ninja manages only their own entries — editing someone else's
        // row would re-stamp it with the editor's member_id.
        if (row.member_id !== currentNinja?.id) {
          return <span className="text-xs text-faint">—</span>
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="xs"
              icon={Edit}
              aria-label="Edit contribution"
              onClick={(e) => {
                e.stopPropagation()
                setEditingContribution(row)
                setShowForm(true)
              }}
            />
            <Button
              variant="ghost"
              size="xs"
              icon={Trash2}
              aria-label="Delete contribution"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(row)
              }}
            />
          </div>
        )
      }
    }
  ]

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-8">
          <SkeletonLoader.PageHeaderSkeleton />
          <SkeletonLoader.TableSkeleton />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Hero Header */}
        <HeroPageHeader
          title="Pay In"
          subtitle="Monthly deposits"
          actions={[
            {
              variant: 'primary',
              icon: Plus,
              children: 'Add contribution',
              onClick: () => {
                setEditingContribution(null)
                setShowForm(true)
              }
            }
          ]}
        />

        {/* Monthly Progress */}
        <Card className="p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-strong">Monthly Progress</h3>
              <p className="mt-0.5 text-xs text-muted">
                <span className="numeric text-strong">{formatMoney(totalThisMonth)}</span>
                {' of '}
                <span className="numeric">{formatMoney(monthlyGoal)}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                aria-label="Month"
                className="focus-ring h-9 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--surface-overlay)] px-2.5 text-sm text-strong"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                aria-label="Year"
                className="focus-ring h-9 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--surface-overlay)] px-2.5 text-sm text-strong"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-faint">Squad progress</span>
              <span className="numeric text-sm font-medium text-strong">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[color:var(--line-subtle)]">
              <motion.div
                className="h-2 rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Who has paid this month */}
          <div className="divide-y divide-[color:var(--line-subtle)]">
            {ninjas.map(ninja => {
              // Summed, not found: a ninja may pay the month in instalments, and
              // only the total decides whether they have met the target.
              const amount = contributions
                .filter(c =>
                  c.member_id === ninja.id && c.month === selectedMonth && c.year === selectedYear
                )
                .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
              const paid = amount >= perMemberTarget

              return (
                <div key={ninja.id} className="flex items-center gap-3 py-2.5">
                  <Avatar
                    src={ninja.avatar}
                    name={ninja.name}
                    size="sm"
                    borderColor={getNinjaBorderColor(ninja)}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-strong">
                    {ninja.name}
                  </span>
                  <span className={`numeric text-sm ${amount > 0 ? 'text-strong' : 'text-faint'}`}>
                    {formatMoney(amount)}
                  </span>
                  {paid ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <span className="shrink-0 text-[11px] text-faint">due</span>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Contributions Table */}
        <Card padding="none">
          {contributions.length > 0 ? (
            <Table
              columns={tableColumns}
              data={contributions}
              searchable={true}
              filterable={true}
              exportable={true}
              pagination={true}
              pageSize={10}
            />
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No contributions yet"
              description="Start building your emergency fund by making your first contribution to the ninja vault."
            />
          )}
        </Card>
      </div>

      {/* Contribution Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingContribution(null)
        }}
        title={editingContribution ? 'Edit Contribution' : 'Add Contribution'}
        size="lg"
      >
        <ContributionForm
          contribution={editingContribution}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingContribution(null)
          }}
          contributions={contributions}
          monthlyTarget={perMemberTarget}
        />
      </Modal>

      {/* Deletes are permanent, so name the exact entry before confirming */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteContribution}
        title="Delete this contribution?"
        message={
          deleteTarget
            ? `${formatMoney(deleteTarget.amount)} for ${months[deleteTarget.month - 1]} ${deleteTarget.year} will be removed from the vault.`
            : ''
        }
        details="This cannot be undone and the vault balance will drop by that amount."
        confirmLabel="Delete"
      />
    </PageContainer>
  )
}

export default ContributionsPage