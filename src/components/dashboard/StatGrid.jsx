import { motion } from 'framer-motion'

/**
 * Compact row of supporting figures. Deliberately plain: no sparklines or
 * trend badges, because we have no historical series to back them up.
 *
 * The icon sits inline with the value rather than in a block above it, which
 * keeps these cards short next to the balance panel.
 */
const StatGrid = ({ items = [] }) => (
  <div className="grid grid-cols-3 gap-3">
    {items.map(({ label, value, icon: Icon, accent }, index) => (
      <motion.div
        key={label}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 * index, ease: 'easeOut' }}
        className="panel px-4 py-3"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="numeric text-lg font-semibold leading-none text-strong">
            {value}
          </p>
          {Icon && <Icon className="h-4 w-4 shrink-0" style={{ color: accent }} />}
        </div>
        <p className="mt-1.5 text-[11px] leading-tight text-faint">{label}</p>
      </motion.div>
    ))}
  </div>
)

export default StatGrid
