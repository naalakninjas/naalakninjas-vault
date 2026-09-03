import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, LifeBuoy, ChevronRight } from 'lucide-react'

/**
 * The two things people actually come here to do, styled as real buttons so
 * they read as actions rather than as more dashboard cards.
 *
 * `openForm` lets the destination page open its modal straight away, so a
 * quick action is one tap rather than two.
 */
const ACTIONS = [
  {
    icon: Plus,
    label: 'Add contribution',
    hint: 'Log this month’s deposit',
    path: '/contributions',
    primary: true
  },
  {
    icon: LifeBuoy,
    label: 'Request emergency',
    hint: 'Ask the squad for funds',
    path: '/missions',
    primary: false
  }
]

const QuickActions = () => {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-2 gap-3">
      {ACTIONS.map(({ icon: Icon, label, hint, path, primary }, index) => (
        <motion.button
          key={path}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 * index, ease: 'easeOut' }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate(path, { state: { openForm: true } })}
          className={[
            'focus-ring flex flex-col items-start gap-2 rounded-2xl p-3 text-left transition-colors',
            'sm:flex-row sm:items-center sm:gap-3.5 sm:p-4',
            primary
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500'
              : 'border border-violet-500/30 bg-[color:var(--surface-raised)] hover:border-violet-500/50 hover:bg-[color:var(--surface-hover)]'
          ].join(' ')}
        >
          <span
            className={[
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10',
              primary ? 'bg-white/20 text-white' : 'bg-violet-500/15 text-violet-300'
            ].join(' ')}
          >
            <Icon className="h-5 w-5" />
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={`block text-[13px] font-semibold leading-tight sm:truncate sm:text-sm ${
                primary ? 'text-white' : 'text-strong'
              }`}
            >
              {label}
            </span>
            {/* The hint needs a row layout to fit; below sm the label carries it. */}
            <span
              className={`hidden truncate text-xs sm:block ${
                primary ? 'text-white/70' : 'text-faint'
              }`}
            >
              {hint}
            </span>
          </span>

          <ChevronRight
            className={`hidden h-4 w-4 shrink-0 sm:block ${primary ? 'text-white/70' : 'text-faint'}`}
          />
        </motion.button>
      ))}
    </div>
  )
}

export default QuickActions
