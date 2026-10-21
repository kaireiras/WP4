import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Header } from '#/components/ui/header'
import { Sidebar, defaultNavItems } from '#/components/ui/sidebar'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  // Otomatis tutup sidebar mobile saat berpindah halaman
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
      {/* Sidebar (Responsive: drawer di mobile, persistent di desktop) */}
      <Sidebar
        isOpen={isSidebarOpen}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        current={activeNav.id}
        onSelect={() => setIsMobileOpen(false)}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        userName="Fauzan Trisuladana"
        userEmail="fauzantrisuladana@gmail.com"
        className="shrink-0"
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Persistent Header */}
        <Header
          title={activeNav.label}
          breadcrumbs={[activeNav.label]}
          onToggleSidebar={handleToggleSidebar}
          connectionState="synced"
          lastSyncTime="12:09:15"
          userName="Fauzan Trisuladana"
          className="shrink-0"
        />

        {/* Scrollable Page Body */}
        <main className="flex flex-1 flex-col gap-4 p-4 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
