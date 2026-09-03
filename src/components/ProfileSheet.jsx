import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getNinjaAccent } from '../utils/ninjaHelpers.jsx'

/**
 * Mobile identity sheet.
 *
 * Kept to the two actions the bottom nav does not already cover. The earlier
 * version also offered "Switch Ninja" (identical to logging out) and
 * "My Activity" (which now redirects to the dashboard).
 */
const ProfileSheet = ({ isOpen, onClose }) => {
  const { currentNinja, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !currentNinja) return null

  const accent = getNinjaAccent(currentNinja)

  const handleLogout = () => {
    logout()
    onClose?.()
    navigate('/ninja-select', { replace: true })
  }

  return (
    <div
      className="profile-sheet-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Your profile"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <img
            src={currentNinja.avatar}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2px ${accent}` }}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-strong">
              {currentNinja.name}
            </p>
            <p className="truncate text-xs text-faint">{currentNinja.title}</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="focus-ring -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:text-strong"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div
          className="mt-4 space-y-1 border-t pt-3"
          style={{ borderColor: 'var(--line-subtle)' }}
        >
          <button
            onClick={() => {
              navigate('/settings')
              onClose?.()
            }}
            className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-[color:var(--surface-hover)] hover:text-strong"
          >
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </button>

          <button
            onClick={handleLogout}
            className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileSheet
