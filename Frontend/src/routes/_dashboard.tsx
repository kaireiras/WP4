import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { useState } from 'react'
import { Header } from '#/components/ui/header'
import { Sidebar } from '#/components/ui/sidebar'
import type { NavItemId } from '#/components/ui/sidebar'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  // Match current route to sidebar active state and header breadcrumbs
  const pathname = location.pathname
  let currentNav: NavItemId = 'dashboard'
  let pageTitle = 'Dashboard'
  let breadcrumbs = ['Dashboard']

  if (pathname.startsWith('/grafik')) {
    currentNav = 'grafik'
    pageTitle = 'Grafik'
    breadcrumbs = ['Grafik']
  } else if (pathname.startsWith('/alert')) {
    currentNav = 'alert'
    pageTitle = 'Alert'
    breadcrumbs = ['Alert']
  } else if (pathname.startsWith('/model')) {
    currentNav = 'model'
    pageTitle = 'Model'
    breadcrumbs = ['Model']
  }

  const handleSelectNav = (id: NavItemId) => {
    navigate({ to: `/${id}` })
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-n20 font-sans antialiased text-neutral-n900">
      {/* Persistent Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        current={currentNav}
        onSelect={handleSelectNav}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        userName="Fauzan Trisuladana"
        userEmail="fauzantrisuladana@gmail.com"
        className="shrink-0"
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Persistent Header */}
        <Header
          title={pageTitle}
          breadcrumbs={breadcrumbs}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          connectionState="synced"
          lastSyncTime="12:09:15"
          userName="Fauzan Trisuladana"
          className="shrink-0"
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
