import { useEffect, useMemo, useState } from 'react'
import { dbService } from '../../services/supabase'
import { EmptyState, Modal } from '../ui'
import {
  ActivityIcon,
  presentation,
  tidyMessage
} from '../../utils/activityPresentation'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const ALL_DAYS = 'all'

const selectClass =
  'focus-ring h-9 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--surface-overlay)] px-2.5 text-sm text-strong'

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()

const timeOfDay = (timestamp) =>
  new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit'
  })

const dayHeading = (date) =>
  date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

/**
 * The full activity ledger, filtered by month and optionally by a single day.
 *
 * The dashboard panel deliberately shows only the last five entries; this is
 * where the rest lives. Entries are grouped under day headings rather than
 * listed flat, because "what happened and when" is the question being asked
 * and a bare list of relative times ("3 days ago") answers it poorly once you
 * are looking back over weeks.
 */
const ActivityHistoryModal = ({ isOpen, onClose }) => {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [day, setDay] = useState(ALL_DAYS)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  // Picking a day that the new month does not have (31st, then February)
  // would silently return nothing, so the filter resets with the month.
  useEffect(() => {
    setDay(ALL_DAYS)
  }, [year, month])

  const [from, to] = useMemo(() => {
    if (day === ALL_DAYS) {
      return [new Date(year, month, 1), new Date(year, month + 1, 1)]
    }

    const chosen = Number(day)
    return [new Date(year, month, chosen), new Date(year, month, chosen + 1)]
  }, [year, month, day])

  useEffect(() => {
    if (!isOpen) return

    let active = true
    setLoading(true)
    setFailed(false)

    dbService
      .getActivityRange(from, to)
      .then((data) => {
        if (active) setEntries(data)
      })
      .catch((error) => {
        console.error('Could not load activity history:', error.message)
        if (active) setFailed(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, from, to])

  // Grouped by local calendar day, preserving the newest-first order the
  // query returned.
  const grouped = useMemo(() => {
    const groups = []

    entries.forEach((entry) => {
      const at = new Date(entry.created_at)
      const key = `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`
      const last = groups[groups.length - 1]

      if (last?.key === key) last.items.push(entry)
      else groups.push({ key, date: at, items: [entry] })
    })

    return groups
  }, [entries])

  const years = Array.from({ length: 5 }, (_, index) => today.getFullYear() - index)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activity history" size="2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            aria-label="Month"
            className={selectClass}
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index}>{name}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            aria-label="Year"
            className={selectClass}
          >
            {years.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            value={day}
            onChange={(event) => setDay(event.target.value)}
            aria-label="Day"
            className={selectClass}
          >
            <option value={ALL_DAYS}>All days</option>
            {Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1).map(
              (option) => (
                <option key={option} value={option}>{option}</option>
              )
            )}
          </select>

          {!loading && !failed && (
            <span className="ml-auto text-xs text-faint">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-xl"
                style={{ background: 'var(--surface-raised)' }}
              />
            ))}
          </div>
        ) : failed ? (
          <EmptyState
            icon={ActivityIcon}
            title="Could not load the history"
            description="The database did not respond. Check your connection and try again."
          />
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="Nothing happened here"
            description={
              day === ALL_DAYS
                ? `No activity was recorded in ${MONTHS[month]} ${year}.`
                : `No activity was recorded on ${day} ${MONTHS[month]} ${year}.`
            }
          />
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <section key={group.key}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                  {dayHeading(group.date)}
                </h3>

                <ul className="divide-y divide-[color:var(--line-subtle)] rounded-xl border border-[color:var(--line-subtle)]">
                  {group.items.map((entry) => {
                    const { icon: Icon, accent } = presentation(entry.action_type)

                    return (
                      <li key={entry.id} className="flex items-start gap-3 px-3.5 py-3">
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `${accent}1F`, color: accent }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>

                        <p className="min-w-0 flex-1 text-sm leading-snug text-strong">
                          {tidyMessage(entry.message)}
                        </p>

                        <span className="numeric shrink-0 text-[11px] text-faint">
                          {timeOfDay(entry.created_at)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ActivityHistoryModal
