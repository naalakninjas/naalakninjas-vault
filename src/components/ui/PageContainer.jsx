import { motion } from 'framer-motion'

const MAX_WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
}

/**
 * Standard page gutter. Background comes from the layout, so this only owns
 * width, padding, and the entrance transition.
 */
const PageContainer = ({
  children,
  maxWidth = '6xl',
  padding = true,
  className = ''
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className={[
      'mx-auto w-full',
      MAX_WIDTHS[maxWidth] ?? MAX_WIDTHS['6xl'],
      padding ? 'px-4 py-5 sm:px-6 sm:py-8' : '',
      className
    ].filter(Boolean).join(' ')}
  >
    {children}
  </motion.div>
)

export default PageContainer
