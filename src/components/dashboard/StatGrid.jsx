import { motion } from 'framer-motion'

/**
 * Compact row of supporting figures. Deliberately plain: no sparklines or
 * trend badges, because we have no historical series to back them up.
 *
 * Three cards across a phone leaves roughly 80px for each value, which a
 * six-figure rupee amount overruns — it used to push the icon out through the
 * card's edge. So the value owns its own full-width line and the icon sits
 * with the label, where a wrapping two-word caption has room anyway.
 *
 * `compactValue` is the abbreviated form (₹5.05L) for callers whose figure is
 * long; it replaces the full value below `sm`, where the space isn't there.
 */
const StatGrid = ({ items = [] }) => (
  <div className="grid grid-cols-3 gap-3">
    {items.map(({ label, value, compactValue, icon: Icon, accent }, index) => (
      <motion.div
        key={label}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 * index, ease: 'easeOut' }}
        className="panel px-3 py-3 sm:px-4"
      >
        {compactValue ? (
          <p className="numeric truncate text-base font-semibold leading-none text-strong sm:text-lg">
            <span className="sm:hidden">{compactValue}</span>
            <span className="hidden sm:inline">{value}</span>
          </p>
        ) : (
          <p className="numeric truncate text-base font-semibold leading-none text-strong sm:text-lg">
            {value}
          </p>
        )}

        <div className="mt-2 flex items-start gap-1.5">
          {Icon && (
            <Icon
              className="mt-px h-3.5 w-3.5 shrink-0"
              style={{ color: accent }}
            />
          )}
          <p className="text-[11px] leading-tight text-faint">{label}</p>
        </div>
      </motion.div>
    ))}
  </div>
)

export default StatGrid
