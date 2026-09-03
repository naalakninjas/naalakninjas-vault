import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { getNinjaAccent } from '../../utils/ninjaHelpers.jsx'
import { formatMoney } from '../../utils/format'

/**
 * Contribution standing for each ninja.
 *
 * `totals` comes from the member-totals aggregate, which is all-time
 * (not current month) — the copy reflects that.
 *
 * Each ninja is one compact line. An earlier version put a share bar under
 * every name, which at zero rendered as a full-width grey rule and collided
 * with the row dividers.
 */
const SquadPanel = ({ ninjas = [], totals = [], currentNinjaId }) => {
  const rows = ninjas.map((ninja) => ({
    ninja,
    amount: Number(totals.find((t) => t.member_id === ninja.id)?.amount) || 0
  }))

  const combined = rows.reduce((sum, r) => sum + r.amount, 0)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
      className="panel"
    >
      <header
        className="flex items-center justify-between border-b px-5 py-3.5"
        style={{ borderColor: 'var(--line-subtle)' }}
      >
        <h2 className="text-sm font-semibold text-strong">
          Squad contributions
          <span className="ml-2 font-normal text-faint">all time</span>
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-faint">
          <Users className="h-3.5 w-3.5" />
          {ninjas.length}
        </div>
      </header>

      <div className="divide-y divide-[color:var(--line-subtle)]">
        {rows.map(({ ninja, amount }) => {
          const isYou = ninja.id === currentNinjaId

          return (
            <div key={ninja.id} className="flex items-center gap-3 px-5 py-3">
              <img
                src={ninja.avatar}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover"
                style={{ boxShadow: `0 0 0 2px ${getNinjaAccent(ninja)}` }}
              />

              <p className="min-w-0 flex-1 truncate text-sm font-medium text-strong">
                {ninja.name}
                {isYou && (
                  <span className="ml-1.5 text-xs font-normal text-faint">(you)</span>
                )}
              </p>

              <p
                className={`numeric shrink-0 text-sm font-semibold ${
                  amount > 0 ? 'text-strong' : 'text-faint'
                }`}
              >
                {formatMoney(amount)}
              </p>
            </div>
          )
        })}
      </div>

      <footer
        className="flex items-center justify-between border-t px-5 py-3"
        style={{ borderColor: 'var(--line-subtle)' }}
      >
        <span className="text-xs text-faint">Combined</span>
        <span className="numeric text-sm font-semibold text-strong">
          {formatMoney(combined)}
        </span>
      </footer>
    </motion.section>
  )
}

export default SquadPanel
