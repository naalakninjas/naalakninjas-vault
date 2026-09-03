import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getNinjaAccent } from '../utils/ninjaHelpers.jsx'
import ProfileSheet from './ProfileSheet'

const MobileHeader = ({ title = 'Vault' }) => {
  const { currentNinja } = useAuth()
  const [showProfileSheet, setShowProfileSheet] = useState(false)
  const accent = getNinjaAccent(currentNinja)

  return (
    <>
      <header
        className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b px-4"
        style={{
          background: 'color-mix(in srgb, var(--surface-base) 88%, transparent)',
          borderColor: 'var(--line-subtle)',
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Artwork is 3:2 with transparent padding either side of the door, so
            object-cover trims the padding instead of shrinking the door. */}
        <img
          src="/images/vault-door.png"
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          style={{ boxShadow: '0 0 0 2px var(--brand-gold)' }}
        />

        <h1 className="flex-1 truncate text-base font-semibold text-strong">{title}</h1>

        <button
          onClick={() => setShowProfileSheet(true)}
          aria-label="Open profile"
          className="focus-ring shrink-0 rounded-full"
        >
          <img
            src={currentNinja?.avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2px ${accent}` }}
          />
        </button>
      </header>

      <ProfileSheet
        isOpen={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
      />
    </>
  )
}

export default MobileHeader
