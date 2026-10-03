import { formatDistanceToNow } from 'date-fns'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  KeyRound,
  Landmark,
  LifeBuoy,
  LogIn,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  XCircle,
  Activity as ActivityIcon
} from 'lucide-react'
import { formatMoney } from './format'

/**
 * Shared by the dashboard feed and the full history modal, so one entry looks
 * the same wherever it is read.
 */

/** Maps an activity's action_type onto an icon and accent colour. */
export const presentation = (actionType = '') => {
  const type = actionType.toLowerCase()

  if (type.includes('contribution_deleted') || type.includes('deleted')) {
    return { icon: Trash2, accent: '#F87171' }
  }
  if (type.includes('contribution')) {
    return { icon: ArrowDownLeft, accent: '#10B981' }
  }
  if (type.includes('repay')) {
    return { icon: ArrowUpRight, accent: '#3B82F6' }
  }
  if (type.includes('repayment_deleted')) {
    return { icon: Trash2, accent: '#F87171' }
  }
  // A single ninja's vote, then the outcome it produced. Checked before the
  // generic 'vote' and 'mission' cases, which would flatten approve and reject
  // into one indistinguishable icon.
  if (type === 'mission_approved') {
    return { icon: CheckCircle2, accent: '#10B981' }
  }
  if (type === 'mission_rejected') {
    return { icon: XCircle, accent: '#F87171' }
  }
  if (type.includes('vote_reject')) {
    return { icon: ThumbsDown, accent: '#F87171' }
  }
  if (type.includes('vote')) {
    return { icon: ThumbsUp, accent: '#F59E0B' }
  }
  if (type.includes('mission')) {
    return { icon: LifeBuoy, accent: '#8B5CF6' }
  }
  // Bank statement lines nobody requested — distinct from a mission
  // disbursement, which the squad voted on. 'fee_deleted'/'interest_deleted'
  // never reach here: the 'deleted' catch-all at the top already gives every
  // deletion in the feed the same Trash2 icon.
  if (type.includes('interest')) {
    return { icon: TrendingUp, accent: '#10B981' }
  }
  if (type.includes('fee')) {
    return { icon: Landmark, accent: '#F87171' }
  }
  // Checked before the generic 'pin' case: one ninja acting on a teammate's
  // account is worth a visibly different icon from their own routine change.
  if (type.includes('pin_reset')) {
    return { icon: KeyRound, accent: '#F59E0B' }
  }
  if (type.includes('pin')) {
    return { icon: LogIn, accent: '#A78BFA' }
  }
  return { icon: ActivityIcon, accent: '#A1A1AA' }
}

export { ActivityIcon }

/**
 * Activity messages are composed by database triggers, so amounts arrive as
 * raw numerics like "₹5000.00". Re-render them with the app's money format.
 */
export const tidyMessage = (message = '') =>
  message.replace(/₹\s*(\d+(?:\.\d+)?)/g, (_, amount) => formatMoney(amount))

export const relativeTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}
