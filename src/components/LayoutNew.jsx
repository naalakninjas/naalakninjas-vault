import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './SidebarNew'
import MobileBottomNav from './MobileBottomNav'
import MobileHeader from './MobileHeader'

const PAGE_TITLES = {
  '/dashboard': 'Naalak Ninjas Vault',
  '/contributions': 'Pay In',
  '/missions': 'Emergency',
  '/settings': 'Settings'
}

const DESKTOP_BREAKPOINT = 1024

const Layout = () => {
  const { currentNinja } = useAuth()
  const location = useLocation()
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
  )

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const sync = (event) => setIsDesktop(event.matches)

    setIsDesktop(query.matches)
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  if (!currentNinja) {
    return null
  }

  const title = PAGE_TITLES[location.pathname] ?? 'Naalak Ninjas Vault'

  if (isDesktop) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--surface-base)' }}>
        <Sidebar />
        <main className="ml-64 min-h-screen">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden"
      style={{ background: 'var(--surface-base)' }}
    >
      <MobileHeader title={title} />

      {/* The single scroll container for mobile */}
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>

      <MobileBottomNav />
    </div>
  )
}

export default Layout
