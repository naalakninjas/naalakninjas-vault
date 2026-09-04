import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LifeBuoy, ThumbsUp, ThumbsDown, Trash2, Share2 } from 'lucide-react'
import { useAuth, ninjas } from '../contexts/AuthContext'
import { dbService } from '../services/supabase'
import { 
  PageContainer, 
  HeroPageHeader, 
  Card, 
  Button, 
  Badge, 
  Avatar,
  EmptyState,
  SkeletonLoader,
  Modal,
  ConfirmDialog
} from '../components/ui'
import { getNinjaBorderColor, getNinjaByName } from '../utils/ninjaHelpers.jsx'
import { showError, showSuccess, showWarning } from '../utils/toast'
import { formatDate, formatMoney } from '../utils/format'
import {
  DEFAULT_EDIT_WINDOW_HOURS,
  editWindowRemaining,
  isWithinEditWindow,
  readEditWindowHours
} from '../utils/editWindow'
import { buildVoteReminder, shareOnWhatsApp } from '../utils/share'
import MissionForm from '../components/MissionForm'
import RepaymentForm from '../components/RepaymentForm'

const MissionCard = ({
  mission,
  onVote,
  onViewDetails,
  onRepayment,
  onDelete,
  onShare,
  currentNinja,
  userVotes = [],
  editWindowHours = DEFAULT_EDIT_WINDOW_HOURS
}) => {
  const ninja = mission.member_name
  const ninjaRecord = getNinjaByName(ninja, ninjas)
  const isOwnMission = mission.member_id === currentNinja.id
  const hasVoted = userVotes.some(vote => vote.mission_id === mission.id && vote.member_id === currentNinja.id)
  // Only the requester can withdraw their own request, and only while nothing
  // has moved and the window is open: an approved or repaid one is already part
  // of the balance, and the database refuses both cases anyway.
  const canDelete =
    isOwnMission &&
    ['pending', 'rejected'].includes(mission.status) &&
    isWithinEditWindow(mission.created_at, editWindowHours)

  // Anyone can nudge the squad about a request still waiting on votes, not
  // just the ninja who asked.
  const canShare = mission.status === 'pending'
  
  const getStatusColor = () => {
    switch (mission.status) {
      case 'pending': return 'warning'
      case 'approved': return 'success' 
      case 'rejected': return 'danger'
      case 'repaid': return 'success'
      default: return 'default'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group"
    >
      <Card className="cursor-pointer p-4 sm:p-5" onClick={() => onViewDetails(mission)}>
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={ninjaRecord?.avatar}
              name={ninja}
              size="sm"
              borderColor={getNinjaBorderColor(ninjaRecord)}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-strong">{ninja}</div>
              <div className="text-xs text-faint">
                {formatDate(mission.created_at)}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant={getStatusColor()}>
              {mission.status}
            </Badge>
            {(canShare || canDelete) && (
              <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
                {canShare && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Share2}
                    aria-label="Share on WhatsApp"
                    title="Remind the squad on WhatsApp"
                    onClick={() => onShare(mission)}
                  />
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Trash2}
                    aria-label="Withdraw request"
                    title={`Can be withdrawn for ${editWindowHours} hours — ${editWindowRemaining(mission.created_at, editWindowHours)}`}
                    onClick={() => onDelete(mission)}
                  />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-3">
          <div className="numeric text-xl font-semibold text-strong">
            {formatMoney(mission.amount)}
          </div>
          {mission.status === 'approved' && mission.total_repaid > 0 && (
            <div className="mt-0.5 text-xs text-muted">
              {formatMoney(mission.total_repaid)} repaid
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="mb-3">
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">
            {mission.reason}
          </p>
        </div>

        {/* Voting Stats */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-emerald-400">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm font-medium">{mission.approval_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-red-400">
              <ThumbsDown className="w-4 h-4" />
              <span className="text-sm font-medium">{mission.rejection_count || 0}</span>
            </div>
          </div>
          
          {mission.status === 'approved' && (
            <div className="text-xs text-muted">
              Remaining: {formatMoney(mission.amount - (mission.total_repaid || 0))}
            </div>
          )}
        </div>

        {/* Actions */}
        {mission.status === 'pending' && !isOwnMission && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="success"
              size="sm"
              icon={ThumbsUp}
              onClick={() => onVote(mission.id, 'approve')}
              disabled={hasVoted}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={ThumbsDown}
              onClick={() => onVote(mission.id, 'reject')}
              disabled={hasVoted}
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        )}

        {/* Repayment Action */}
        {mission.status === 'approved' && isOwnMission && (mission.amount - (mission.total_repaid || 0)) > 0 && (
          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onRepayment(mission)}
              className="w-full"
            >
              Repay {formatMoney(mission.amount - (mission.total_repaid || 0))}
            </Button>
          </div>
        )}

        {isOwnMission && mission.status === 'pending' && (
          <div className="text-center text-sm text-muted">
            Awaiting council decision...
          </div>
        )}

        {hasVoted && mission.status === 'pending' && (
          <div className="text-center">
            <Badge variant="primary">Vote Cast</Badge>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'repaid', label: 'Repaid' }
]

/**
 * Status filter. Replaces the previous four-column board: with a squad this
 * size most columns sit empty, and four parallel columns cramped every card.
 */
const StatusFilter = ({ options, active, onChange }) => (
  <div className="flex gap-1.5 overflow-x-auto pb-1">
    {options.map(({ key, label, count }) => {
      const isActive = active === key

      return (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-pressed={isActive}
          className={`focus-ring flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            isActive
              ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
              : 'border-[color:var(--line-subtle)] text-muted hover:text-strong'
          }`}
        >
          {label}
          {count > 0 && (
            <span className={`numeric ${isActive ? 'text-violet-300' : 'text-faint'}`}>
              {count}
            </span>
          )}
        </button>
      )
    })}
  </div>
)

const MissionDetailsModal = ({ mission, isOpen, onClose, onShare }) => {
  if (!mission) return null

  const ninjaRecord = getNinjaByName(mission.member_name, ninjas)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mission Details"
      size="xl"
    >
      <div className="space-y-4">
        {/* Mission Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={ninjaRecord?.avatar}
              name={mission.member_name}
              size="md"
              borderColor={getNinjaBorderColor(ninjaRecord)}
            />
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-strong">{mission.member_name}</h3>
              <p className="text-xs text-faint">
                Requested on {formatDate(mission.created_at)}
              </p>
            </div>
          </div>
          <Badge variant={mission.status === 'approved' ? 'success' : mission.status === 'rejected' ? 'danger' : 'warning'}>
            {mission.status}
          </Badge>
        </div>

        {/* Amount */}
        <Card className="p-4 text-center sm:p-5">
          <div className="numeric text-2xl font-semibold text-strong">
            {formatMoney(mission.amount)}
          </div>
          <p className="mt-1 text-xs text-faint">Requested Amount</p>
        </Card>

        {/* Reason */}
        <Card className="p-4 sm:p-5">
          <h4 className="mb-2 text-sm font-semibold text-strong">Reason</h4>
          <p className="text-sm leading-relaxed text-muted">{mission.reason}</p>
        </Card>

        {/* Voting Results */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <div className="numeric text-xl font-semibold text-emerald-400">
              {mission.approval_count || 0}
            </div>
            <p className="mt-1 text-xs text-faint">Approvals</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="numeric text-xl font-semibold text-red-400">
              {mission.rejection_count || 0}
            </div>
            <p className="mt-1 text-xs text-faint">Rejections</p>
          </Card>
        </div>

        {/* A pending request is waiting on the others, so offer the nudge here
            as well as on the card. */}
        {mission.status === 'pending' && (
          <Button
            variant="secondary"
            icon={Share2}
            onClick={() => onShare(mission)}
            className="w-full"
          >
            Remind the squad on WhatsApp
          </Button>
        )}

        {/* Repayment Progress (if approved) */}
        {mission.status === 'approved' && (
          <Card className="p-4 sm:p-5">
            <h4 className="mb-3 text-sm font-semibold text-strong">Repayment Progress</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Repaid</span>
                <span className="numeric text-strong">{formatMoney(mission.total_repaid || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Remaining</span>
                <span className="numeric text-strong">{formatMoney(mission.amount - (mission.total_repaid || 0))}</span>
              </div>
              <div className="w-full bg-[color:var(--line-subtle)] rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.min(((mission.total_repaid || 0) / mission.amount) * 100, 100)}%` }}
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </Modal>
  )
}

const MissionsPage = () => {
  const { currentNinja } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [missions, setMissions] = useState([])
  const [userVotes, setUserVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedMission, setSelectedMission] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showRepaymentForm, setShowRepaymentForm] = useState(false)
  const [selectedRepaymentMission, setSelectedRepaymentMission] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pendingVote, setPendingVote] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editWindowHours, setEditWindowHours] = useState(DEFAULT_EDIT_WINDOW_HOURS)
  const [requiredApprovals, setRequiredApprovals] = useState(null)

  useEffect(() => {
    loadMissions()
  }, [])

  // Non-critical: the window falls back to 24 hours and the reminder text
  // simply omits the target count, so a failure here must not blank the page.
  useEffect(() => {
    dbService
      .getSettings()
      .then((settings) => {
        setEditWindowHours(readEditWindowHours(settings))

        const approvals = parseInt(
          (settings ?? []).find((s) => s.key === 'required_approvals')?.value,
          10
        )
        if (Number.isFinite(approvals)) setRequiredApprovals(approvals)
      })
      .catch((error) => console.warn('Could not load vault settings:', error.message))
  }, [])

  // Opened straight from a dashboard quick action.
  useEffect(() => {
    if (location.state?.openForm) {
      setShowForm(true)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate])

  const loadMissions = async () => {
    try {
      const missionsData = await dbService.getMissions()
      setMissions(missionsData || [])

      // Vote lookups run in parallel; serialising them made load time scale
      // with the number of missions.
      const voteResults = await Promise.allSettled(
        (missionsData || []).map((mission) => dbService.getVotesForMission(mission.id))
      )

      setUserVotes(
        voteResults.flatMap((result, index) => {
          if (result.status === 'fulfilled') return result.value ?? []
          console.warn(
            `Failed to load votes for mission ${missionsData[index]?.id}:`,
            result.reason?.message
          )
          return []
        })
      )
    } catch (error) {
      console.error('Error loading missions:', error)
      setMissions([])
      setUserVotes([])
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (missionData) => {
    try {
      await dbService.createMission(missionData)
      await loadMissions()
      setShowForm(false)
      showSuccess('Mission created successfully!')
    } catch (error) {
      console.error('Error creating mission:', error)
      showError(`Failed to create mission: ${error.message}`)
    }
  }

  // A vote cannot be changed once cast, so it goes through a confirmation first.
  const requestVote = (missionId, voteType) => {
    const mission = missions.find(m => m.id === missionId)
    if (mission && mission.member_id === currentNinja.id) {
      showWarning("You cannot vote on your own request")
      return
    }
    setPendingVote({ mission, voteType })
  }

  const handleVote = async () => {
    const pending = pendingVote
    if (!pending?.mission) return

    try {
      await dbService.addVote({
        mission_id: pending.mission.id,
        member_id: currentNinja.id,
        vote: pending.voteType
      })
      await loadMissions()
      showSuccess(pending.voteType === 'approve' ? 'Vote recorded: approved' : 'Vote recorded: rejected')
    } catch (error) {
      console.error('Error voting on mission:', error)
      showError(`Failed to submit vote: ${error.message}`)
    }
  }

  const handleViewDetails = (mission) => {
    setSelectedMission(mission)
    setShowDetails(true)
  }

  const handleShare = (mission) => {
    shareOnWhatsApp(buildVoteReminder(mission, requiredApprovals))
  }

  const handleDeleteMission = async () => {
    const target = deleteTarget
    if (!target?.id) return

    try {
      await dbService.deleteMission(target.id)
      await loadMissions()
      showSuccess('Request withdrawn')
    } catch (error) {
      console.error('Error deleting mission:', error)
      showError(`Failed to withdraw request: ${error.message}`)
    }
  }

  const handleRepaymentClick = (mission) => {
    setSelectedRepaymentMission(mission)
    setShowRepaymentForm(true)
  }

  const handleRepaymentSubmit = async (repaymentData) => {
    try {
      await dbService.addRepayment(repaymentData)
      
      // Refresh missions to update status
      await loadMissions()
      
      setShowRepaymentForm(false)
      setSelectedRepaymentMission(null)
      showSuccess('Repayment recorded successfully!')
    } catch (error) {
      console.error('Failed to record repayment:', error)
      showError(`Failed to record repayment: ${error.message}`)
    }
  }

  const visibleMissions = statusFilter === 'all'
    ? missions
    : missions.filter((m) => m.status === statusFilter)

  const activeFilterLabel =
    FILTERS.find((f) => f.key === statusFilter)?.label ?? 'matching'

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-8">
          <SkeletonLoader.PageHeaderSkeleton />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
          title="Emergency"
          subtitle="Request, vote, repay"
          actions={[
            {
              variant: 'primary',
              icon: Plus,
              children: 'New request',
              onClick: () => setShowForm(true)
            }
          ]}
        />

        {/* Requests, filtered by status */}
        <div className="space-y-4">
          <StatusFilter
            options={FILTERS.map(({ key, label }) => ({
              key,
              label,
              count: key === 'all'
                ? missions.length
                : missions.filter((m) => m.status === key).length
            }))}
            active={statusFilter}
            onChange={setStatusFilter}
          />

          {visibleMissions.length === 0 ? (
            <Card padding="none">
              <EmptyState
                icon={LifeBuoy}
                title={
                  missions.length === 0
                    ? 'No requests yet'
                    : `No ${activeFilterLabel.toLowerCase()} requests`
                }
                description={
                  missions.length === 0
                    ? 'When someone needs emergency funds, their request will appear here for the squad to vote on.'
                    : 'Try a different status filter.'
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {visibleMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    onVote={requestVote}
                    onViewDetails={handleViewDetails}
                    onRepayment={handleRepaymentClick}
                    onDelete={setDeleteTarget}
                    onShare={handleShare}
                    currentNinja={currentNinja}
                    userVotes={userVotes}
                    editWindowHours={editWindowHours}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Mission Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Request emergency fund"
        size="lg"
      >
        <MissionForm
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Mission Details Modal */}
      <MissionDetailsModal
        mission={selectedMission}
        isOpen={showDetails}
        onShare={handleShare}
        onClose={() => {
          setShowDetails(false)
          setSelectedMission(null)
        }}
      />

      {/* Repayment Modal */}
      <Modal
        isOpen={showRepaymentForm}
        onClose={() => {
          setShowRepaymentForm(false)
          setSelectedRepaymentMission(null)
        }}
        title="Record Repayment"
        size="lg"
      >
        <RepaymentForm
          activeMissions={missions.filter(m => m.status === 'approved' && m.member_id === currentNinja.id)}
          selectedMission={selectedRepaymentMission}
          onSubmit={handleRepaymentSubmit}
          onCancel={() => {
            setShowRepaymentForm(false)
            setSelectedRepaymentMission(null)
          }}
        />
      </Modal>

      {/* Votes are final once cast */}
      <ConfirmDialog
        isOpen={Boolean(pendingVote)}
        onClose={() => setPendingVote(null)}
        onConfirm={handleVote}
        tone={pendingVote?.voteType === 'approve' ? 'warning' : 'danger'}
        title={pendingVote?.voteType === 'approve' ? 'Approve this request?' : 'Reject this request?'}
        message={
          pendingVote?.mission
            ? `${pendingVote.mission.member_name} asked for ${formatMoney(pendingVote.mission.amount)}.`
            : ''
        }
        details="You cannot change your vote afterwards."
        confirmLabel={pendingVote?.voteType === 'approve' ? 'Approve' : 'Reject'}
      />

      {/* Withdrawing takes any votes already cast with it, so say so */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMission}
        title="Withdraw this request?"
        message={
          deleteTarget
            ? `Your ${formatMoney(deleteTarget.amount)} request will be removed from the council.`
            : ''
        }
        details={
          (deleteTarget?.approval_count || 0) + (deleteTarget?.rejection_count || 0) > 0
            ? 'This cannot be undone, and the votes cast on it will be deleted too.'
            : 'This cannot be undone.'
        }
        confirmLabel="Withdraw"
      />
    </PageContainer>
  )
}

export default MissionsPage