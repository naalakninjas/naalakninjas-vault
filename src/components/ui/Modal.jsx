import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useEffect, useId } from 'react'

const SIZES = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-full'
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnEscape = true,
  closeOnBackdrop = true,
  className = ''
}) => {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // Lock background scroll while open, restoring whatever was there before.
  useEffect(() => {
    if (!isOpen) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={(event) => event.stopPropagation()}
            className={[
              // Bottom sheet on phones, centred dialog from sm up.
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden',
              'rounded-t-2xl sm:rounded-2xl',
              'border border-[color:var(--line-strong)] bg-[color:var(--surface-overlay)] shadow-2xl shadow-black/50',
              SIZES[size] ?? SIZES.md,
              className
            ].filter(Boolean).join(' ')}
          >
            {(title || showCloseButton) && (
              <header
                className="flex shrink-0 items-center gap-3 border-b px-5 py-4"
                style={{ borderColor: 'var(--line-subtle)' }}
              >
                {title && (
                  <h2 id={titleId} className="min-w-0 flex-1 truncate text-base font-semibold text-strong">
                    {title}
                  </h2>
                )}

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="focus-ring -mr-1 ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-[color:var(--surface-hover)] hover:text-strong"
                  >
                    <X className="h-[18px] w-[18px]" />
                  </button>
                )}
              </header>
            )}

            {/* The only scroll container, so tall forms stay reachable on phones */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default Modal
