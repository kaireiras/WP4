import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import { Header } from '#/components/ui/header'
import { Sidebar, defaultNavItems } from '#/components/ui/sidebar'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()

  const activeNav =
    defaultNavItems.find((item) => location.pathname.startsWith(item.href)) ??
    defaultNavItems[0]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-n20/60 dark:bg-neutral-n900 font-sans antialiased text-neutral-n900">
      {/* Persistent Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        current={activeNav.id}
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
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
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
