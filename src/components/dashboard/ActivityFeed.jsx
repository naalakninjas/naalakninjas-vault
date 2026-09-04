import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import {
  ActivityIcon,
  presentation,
  relativeTime,
  tidyMessage
} from '../../utils/activityPresentation'

/**
 * The five most recent entries, with everything older behind "View all".
 *
 * The list used to grow with whatever the dashboard fetched, which pushed the
 * squad panel beside it out of alignment and buried the balance on a phone.
 * The cap is enforced here as well as in the query, so this panel stays a
 * fixed size regardless of what it is handed.
 */
const VISIBLE_COUNT = 5

const ActivityFeed = ({ activities = [], onViewAll }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
    className="panel"
  >
    <header
      className="flex items-center gap-3 border-b px-5 py-3.5"
      style={{ borderColor: 'var(--line-subtle)' }}
    >
      <h2 className="flex-1 text-sm font-semibold text-strong">Recent activity</h2>

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="focus-ring -mr-1 flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 py-1 text-xs font-medium text-muted transition-colors hover:text-strong"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
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
        {activities.slice(0, VISIBLE_COUNT).map((activity) => {
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
