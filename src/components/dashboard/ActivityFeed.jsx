import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowDownLeft,
  ArrowUpRight,
  LifeBuoy,
  ThumbsUp,
  Trash2,
  Activity as ActivityIcon
} from 'lucide-react'
import { formatMoney } from '../../utils/format'

/** Maps an activity's action_type onto an icon and accent colour. */
const presentation = (actionType = '') => {
  const type = actionType.toLowerCase()

  if (type.includes('contribution_deleted')) {
    return { icon: Trash2, accent: '#F87171' }
  }
  if (type.includes('contribution')) {
    return { icon: ArrowDownLeft, accent: '#10B981' }
  }
  if (type.includes('repay')) {
    return { icon: ArrowUpRight, accent: '#3B82F6' }
  }
  if (type.includes('vote')) {
    return { icon: ThumbsUp, accent: '#F59E0B' }
  }
  if (type.includes('mission')) {
    return { icon: LifeBuoy, accent: '#8B5CF6' }
  }
  return { icon: ActivityIcon, accent: '#A1A1AA' }
}

/**
 * Activity messages are composed by database triggers, so amounts arrive as
 * raw numerics like "₹5000.00". Re-render them with the app's money format.
 */
const tidyMessage = (message = '') =>
  message.replace(/₹\s*(\d+(?:\.\d+)?)/g, (_, amount) => formatMoney(amount))

const relativeTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}

const ActivityFeed = ({ activities = [] }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
    className="panel"
  >
    <header
      className="border-b px-5 py-3.5"
      style={{ borderColor: 'var(--line-subtle)' }}
    >
      <h2 className="text-sm font-semibold text-strong">Recent activity</h2>
    </header>

    {activities.length === 0 ? (
      <div className="px-5 py-10 text-center">
        <span
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'var(--surface-hover)' }}
        >
          <ActivityIcon className="h-[18px] w-[18px] text-faint" />
        </span>
        <p className="text-sm font-medium text-muted">Nothing yet</p>
        <p className="mt-1 text-xs text-faint">
          Contributions and requests will show up here.
        </p>
      </div>
    ) : (
      <ul className="divide-y divide-[color:var(--line-subtle)]">
        {activities.map((activity) => {
          const { icon: Icon, accent } = presentation(activity.action_type)

          return (
            <li key={activity.id} className="flex items-start gap-3 px-5 py-3">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${accent}1F`, color: accent }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>

              {/* The message already names the member, so the meta line is just time */}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-strong">
                  {tidyMessage(activity.message)}
                </p>
                <p className="mt-0.5 text-[11px] text-faint">
                  {relativeTime(activity.created_at)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    )}
  </motion.section>
)

export default ActivityFeed
