import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wallet, LifeBuoy, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Vault' },
  { path: '/contributions', icon: Wallet, label: 'Pay In' },
  { path: '/missions', icon: LifeBuoy, label: 'Emergency' },
  { path: '/settings', icon: Settings, label: 'Settings' }
]

const MobileBottomNav = () => (
  <nav
    className="shrink-0 border-t"
    style={{
      background: 'var(--surface-raised)',
      borderColor: 'var(--line-subtle)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}
  >
    <div className="flex items-stretch">
      {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `focus-ring relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
              isActive ? 'text-strong' : 'text-faint'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute top-0 h-0.5 w-8 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              <Icon
                className="h-[18px] w-[18px]"
                style={isActive ? { color: 'var(--accent)' } : undefined}
              />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
)

export default MobileBottomNav
