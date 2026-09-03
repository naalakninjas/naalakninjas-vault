import { motion } from 'framer-motion'
import Button from './Button'

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  className = ''
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className={`px-6 py-14 text-center ${className}`}
  >
    {illustration ? (
      <div className="mx-auto mb-4 h-24 w-24">{illustration}</div>
    ) : Icon ? (
      <span
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: 'var(--surface-hover)' }}
      >
        <Icon className="h-5 w-5 text-faint" />
      </span>
    ) : null}

    <h3 className="text-base font-semibold text-strong">{title}</h3>

    {description && (
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
        {description}
      </p>
    )}

    {action && (
      <div className="mt-5 flex justify-center">
        <Button {...action} />
      </div>
    )}
  </motion.div>
)

export default EmptyState
