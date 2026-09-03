import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LogIn, ShieldAlert } from 'lucide-react'
import { ninjas } from '../contexts/AuthContext'
import { dbService } from '../services/supabase'
import { Avatar, Badge, EmptyState, Modal } from './ui'
import { getNinjaBorderColor, getNinjaByName } from '../utils/ninjaHelpers.jsx'
import { formatDateTime, formatRelative } from '../utils/format'

const TABS = [
  { key: 'signins', label: 'Sign-ins' },
  { key: 'keepalive', label: 'Keep-alive' }
]

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * Enough of the user agent to recognise your own phone, and no more.
 * Deliberately crude: this answers "was that me?", it is not analytics.
 */
const describeDevice = (userAgent) => {
  if (!userAgent) return 'Unknown device'

  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\//.test(userAgent)
      ? 'Opera'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Firefox\//.test(userAgent)
          ? 'Firefox'
          : /Safari\//.test(userAgent)
            ? 'Safari'
            : null

  const platform = /iPhone/.test(userAgent)
    ? 'iPhone'
    : /iPad/.test(userAgent)
      ? 'iPad'
      : /Android/.test(userAgent)
        ? 'Android'
        : /Windows/.test(userAgent)
          ? 'Windows'
          : /Mac OS X/.test(userAgent)
            ? 'Mac'
            : /Linux/.test(userAgent)
              ? 'Linux'
              : null

  if (browser && platform) return `${browser} on ${platform}`
  return browser || platform || 'Unknown device'
}

/**
 * Keys a run by its local calendar day.
 *
 * Local rather than the ISO date, because the cron fires at 05:00 UTC, which
 * is 10:30 the same morning in IST — slicing the ISO string would be right by
 * luck here and wrong for anyone east of it.
 */
const toDayKey = (value) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)

/**
 * Day cells for a month, padded at the front so the 1st sits under the right
 * weekday. Nulls are the padding.
 */
const buildMonthGrid = (cursor) => {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = Array.from({ length: new Date(year, month, 1).getDay() }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }

  return cells
}

const DayCell = ({ date, entry, isToday }) => {
  if (!date) return <div aria-hidden="true" />

  const isFuture = date > new Date()
  const tone = entry ? (entry.ok ? 'ok' : 'failed') : isFuture ? 'future' : 'missed'

  const styles = {
    ok: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    failed: 'bg-red-500/15 text-red-300 border-red-500/30',
    missed: 'text-faint border-[color:var(--line-subtle)]',
    future: 'text-faint/40 border-transparent'
  }[tone]

  const label = entry
    ? `${formatDateTime(entry.latest.ran_at)} — ${entry.ok ? 'success' : entry.latest.detail || 'failed'}`
    : isFuture
      ? ''
      : `${date.toLocaleDateString('en-IN', { dateStyle: 'medium' })} — no run recorded`

  return (
    <div
      title={label}
      className={`flex aspect-square items-center justify-center rounded-lg border text-xs ${styles}`}
      style={isToday ? { boxShadow: '0 0 0 1.5px var(--brand-gold)' } : undefined}
    >
      {date.getDate()}
    </div>
  )
}

const Legend = () => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-faint">
    {[
      ['bg-emerald-500/40', 'Ran successfully'],
      ['bg-red-500/40', 'Failed'],
      ['bg-[color:var(--line-subtle)]', 'No run']
    ].map(([swatch, label]) => (
      <span key={label} className="flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-sm ${swatch}`} />
        {label}
      </span>
    ))}
  </div>
)

const SignInList = ({ events }) => {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={LogIn}
        title="No sign-ins recorded yet"
        description="Every sign-in from now on will be listed here, including attempts with the wrong PIN."
      />
    )
  }

  return (
    <div className="divide-y divide-[color:var(--line-subtle)]">
      {events.map((event) => {
        const name = event.members?.name
        const ninja = getNinjaByName(name, ninjas)

        return (
          <div key={event.id} className="flex items-center gap-3 py-3">
            <Avatar
              src={ninja?.avatar}
              name={name}
              size="sm"
              borderColor={getNinjaBorderColor(ninja)}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-strong">
                {name || 'Unknown ninja'}
              </p>
              <p className="truncate text-xs text-faint">
                {describeDevice(event.user_agent)}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs text-muted" title={formatDateTime(event.created_at)}>
                {formatRelative(event.created_at)}
              </p>
              {!event.succeeded && (
                <Badge variant="danger" className="mt-1">
                  Wrong PIN
                </Badge>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const KeepAliveCalendar = ({ runs }) => {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))

  const runsByDay = useMemo(() => {
    const grouped = new Map()

    runs.forEach((run) => {
      const key = toDayKey(run.ran_at)
      const existing = grouped.get(key)

      if (!existing) {
        grouped.set(key, { total: 1, ok: run.ok, latest: run })
        return
      }

      // A day counts as healthy only if every run in it succeeded, so one bad
      // run is not hidden by a retry that happened to work.
      existing.total += 1
      existing.ok = existing.ok && run.ok
      if (new Date(run.ran_at) > new Date(existing.latest.ran_at)) existing.latest = run
    })

    return grouped
  }, [runs])

  // Runs arrive oldest first, so the most recent is the last one.
  const lastRun = runs[runs.length - 1]

  const health = useMemo(() => {
    let ran = 0

    for (let offset = 0; offset < 30; offset += 1) {
      const day = new Date()
      day.setDate(day.getDate() - offset)
      if (runsByDay.get(toDayKey(day))?.ok) ran += 1
    }

    return ran
  }, [runsByDay])

  const thisMonth = startOfMonth(new Date())
  const todayKey = toDayKey(new Date())
  const cells = buildMonthGrid(cursor)

  const shiftMonth = (delta) =>
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))

  return (
    <div className="space-y-4">
      {/* Headline status, so the answer is readable without counting squares */}
      <div
        className="rounded-xl border p-3"
        style={{ borderColor: 'var(--line-subtle)', background: 'var(--surface-raised)' }}
      >
        {lastRun ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${lastRun.ok ? 'bg-emerald-400' : 'bg-red-400'}`}
              />
              <p className="text-sm font-medium text-strong">
                {lastRun.ok ? 'Last run succeeded' : 'Last run failed'}
              </p>
              <span className="text-xs text-faint">{formatRelative(lastRun.ran_at)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {formatDateTime(lastRun.ran_at)}
              {lastRun.detail ? ` — ${lastRun.detail}` : ''}
            </p>
            <p className="mt-1 text-xs text-faint">
              {health} of the last 30 days pinged successfully. Supabase pauses a
              free project after 7 idle days.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-strong">No runs recorded yet</p>
            <p className="mt-1 text-xs text-muted">
              The cron job runs daily at 05:00 UTC (10:30 IST). The first entry
              appears after its next run.
            </p>
          </>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="focus-ring rounded-lg p-1.5 text-muted transition-colors hover:text-strong"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <p className="text-sm font-medium text-strong">
          {cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </p>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={cursor >= thisMonth}
          aria-label="Next month"
          className="focus-ring rounded-lg p-1.5 text-muted transition-colors hover:text-strong disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div>
        <div className="mb-1.5 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((day, index) => (
            <div key={index} className="text-center text-[11px] text-faint">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((date, index) => (
            <DayCell
              key={date ? date.getDate() : `pad-${index}`}
              date={date}
              entry={date ? runsByDay.get(toDayKey(date)) : undefined}
              isToday={Boolean(date) && toDayKey(date) === todayKey}
            />
          ))}
        </div>
      </div>

      <Legend />
    </div>
  )
}

/**
 * Vault Status, opened from the vault door in the sidebar and mobile header.
 *
 * Two things that were previously invisible from inside the app: who has been
 * signing in, and whether the daily keep-alive ping is actually running. The
 * second used to be answerable only from Vercel's log viewer.
 */
const VaultStatusModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState('signins')
  const [logins, setLogins] = useState([])
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  // Refetched on each open rather than cached: the whole point is to show the
  // current state, and both queries are small.
  useEffect(() => {
    if (!isOpen) return

    let active = true
    setLoading(true)
    setFailed(false)

    Promise.all([dbService.getLoginEvents(), dbService.getKeepAliveRuns()])
      .then(([loginData, runData]) => {
        if (!active) return
        setLogins(loginData)
        setRuns(runData)
      })
      .catch((error) => {
        console.error('Could not load vault status:', error.message)
        if (active) setFailed(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vault Status" size="xl">
      <div className="space-y-5">
        <div className="flex gap-1.5">
          {TABS.map(({ key, label }) => {
            const isActive = tab === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={isActive}
                className={`focus-ring flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-200'
                    : 'border-[color:var(--line-subtle)] text-muted hover:text-strong'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-xl"
                style={{ background: 'var(--surface-raised)' }}
              />
            ))}
          </div>
        ) : failed ? (
          <EmptyState
            icon={ShieldAlert}
            title="Could not load vault status"
            description="The database did not respond. Check your connection and try again."
          />
        ) : tab === 'signins' ? (
          <SignInList events={logins} />
        ) : (
          <KeepAliveCalendar runs={runs} />
        )}
      </div>
    </Modal>
  )
}

export default VaultStatusModal
