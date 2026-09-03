import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getNinjaAccent } from '../utils/ninjaHelpers.jsx'
import {
  LayoutDashboard,
  Wallet,
  LifeBuoy,
  Settings,
  LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Vault', path: '/dashboard' },
  { icon: Wallet, label: 'Pay In', path: '/contributions' },
  { icon: LifeBuoy, label: 'Emergency', path: '/missions' },
  { icon: Settings, label: 'Settings', path: '/settings' }
]

const NavItem = ({ icon: Icon, label, isActive, onClick, badge }) => (
  <button
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
    className={`focus-ring group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'text-strong'
        : 'text-muted hover:text-strong'
    }`}
    style={isActive ? { background: 'var(--surface-hover)' } : undefined}
  >
    {/* Active rail */}
    {isActive && (
      <motion.span
        layoutId="sidebarActiveRail"
        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
        style={{ background: 'var(--accent)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      />
    )}

    <Icon className="h-[18px] w-[18px] shrink-0" />
    <span className="flex-1 text-left">{label}</span>

    {badge > 0 && (
      <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-red-400">
        {badge}
      </span>
    )}
  </button>
)

const Sidebar = ({ pendingVotes = 0 }) => {
  const { currentNinja, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const accent = getNinjaAccent(currentNinja)

  const handleLogout = () => {
    logout()
    navigate('/ninja-select')
  }

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r"
      style={{ background: 'var(--surface-raised)', borderColor: 'var(--line-subtle)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        {/* Artwork is 3:2 with transparent padding either side of the door, so
            object-cover trims the padding instead of shrinking the door. */}
        <img
          src="/images/vault-door.png"
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          style={{ boxShadow: '0 0 0 2px var(--brand-gold)' }}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-strong">Ninja Vault</p>
          <p className="text-[11px] text-faint">Emergency Fund</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            badge={item.path === '/missions' ? pendingVotes : 0}
          />
        ))}
      </nav>

      <div className="flex-1" />

      {/* Signed-in ninja */}
      <div className="border-t px-3 py-3 hairline" style={{ borderColor: 'var(--line-subtle)' }}>
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <img
            src={currentNinja?.avatar}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2px ${accent}` }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-strong">{currentNinja?.name}</p>
            <p className="truncate text-[11px] text-faint">{currentNinja?.title}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="focus-ring mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
