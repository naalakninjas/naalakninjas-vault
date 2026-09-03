import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const TONES = {
  danger: {
    icon: Trash2,
    tint: 'rgba(239, 68, 68, 0.14)',
    color: '#F87171',
    button: 'danger'
  },
  warning: {
    icon: AlertTriangle,
    tint: 'rgba(245, 158, 11, 0.14)',
    color: '#FBBF24',
    button: 'warning'
  }
}

/**
 * Themed replacement for window.confirm for destructive or irreversible actions.
 *
 * `onConfirm` may return a promise; the confirm button shows a loading state
 * until it settles, and the dialog stays open if it rejects so the caller can
 * surface an error.
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  details,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger'
}) => {
  const [working, setWorking] = useState(false)
  const { icon: Icon, tint, color, button } = TONES[tone] ?? TONES.danger

  const handleConfirm = async () => {
    if (working) return

    setWorking(true)
    try {
      await onConfirm?.()
      onClose?.()
    } finally {
      setWorking(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={working ? undefined : onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!working}
      closeOnEscape={!working}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: tint, color }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>

          <div className="min-w-0 space-y-1">
            {message && (
              <p className="text-sm leading-relaxed text-muted">{message}</p>
            )}
            {details && (
              <p className="text-xs leading-relaxed text-faint">{details}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant={button}
            onClick={handleConfirm}
            loading={working}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={working}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
