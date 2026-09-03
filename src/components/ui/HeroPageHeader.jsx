import { motion } from 'framer-motion'
import Button from './Button'

/**
 * Page header. The title shows on desktop only — on mobile the sticky header
 * names the page, and repeating it here duplicated both the label and the h1.
 */
const HeroPageHeader = ({
  title,
  subtitle,
  description,
  actions = [],
  stats = [],
  className = ''
}) => (
  <motion.header
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className={`mb-5 ${className}`}
  >
    {/* Row at every width: below lg the title is hidden, so the action sits
        beside the subtitle instead of costing another stacked row. */}
    <div className="flex items-center justify-between gap-3 lg:items-start lg:gap-4">
      <div className="min-w-0">
        {/* Below lg the sticky mobile header already shows this exact title, so
            rendering it again duplicated the page name and the h1. */}
        <h1 className="hidden text-2xl font-semibold leading-tight text-strong lg:block">
          {title}
        </h1>

        {subtitle && <p className="text-sm text-muted lg:mt-1">{subtitle}</p>}

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-faint">
            {description}
          </p>
        )}
      </div>

      {actions.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {actions.map((action, index) => (
            <Button key={action.children ?? index} {...action} />
          ))}
        </div>
      )}
    </div>

    {stats.length > 0 && (
      <div
        className="mt-5 grid grid-cols-2 gap-3 border-t pt-5 sm:grid-cols-4"
        style={{ borderColor: 'var(--line-subtle)' }}
      >
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="numeric text-lg font-semibold leading-none text-strong">
              {stat.value}
            </p>
            <p className="mt-1.5 text-[11px] leading-tight text-faint">{stat.label}</p>
          </div>
        ))}
      </div>
    )}
  </motion.header>
)

export default HeroPageHeader
