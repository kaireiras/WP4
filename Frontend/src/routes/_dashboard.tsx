import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Header } from '#/components/ui/header'
import { Sidebar, defaultNavItems } from '#/components/ui/sidebar'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('auth_status')
      if (auth !== 'loged in') {
        throw redirect({
          to: '/login',
        })
      }
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('auth_status')
      if (auth !== 'loged in') {
        navigate({ to: '/login' })
      }
    }
  }, [navigate, location.pathname])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_status')
    }
    navigate({ to: '/login' })
  }

  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  const activeNav =
    defaultNavItems.find((item) => location.pathname.startsWith(item.href)) ??
    defaultNavItems[0]

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev)
    } else {
      setIsSidebarOpen((prev) => !prev)
    }
  }

  return (
    <div className="flex h-screen h-dvh w-screen overflow-hidden bg-neutral-n20/60 dark:bg-neutral-n900 font-sans antialiased text-neutral-n900">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        current={activeNav.id}
        onSelect={() => setIsMobileOpen(false)}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onLogout={handleLogout}
        userName="Fauzan Trisuladana"
        userEmail="fauzantrisuladana@gmail.com"
        className="shrink-0"
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <Header
          title={activeNav.label}
          breadcrumbs={[activeNav.label]}
          onToggleSidebar={handleToggleSidebar}
          connectionState="synced"
          lastSyncTime="12:09:15"
          userName="Fauzan Trisuladana"
          userEmail="fauzantrisuladana@gmail.com"
          onLogout={handleLogout}
          className="shrink-0"
        />

        {/* Page Body */}
        <main className="flex flex-1 flex-col gap-4 p-4 shrink-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
