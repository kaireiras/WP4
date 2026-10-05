import * as React from 'react'
import {
  AlertTriangle,
  BarChart3,
  Cpu,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '#/lib/utils'

export type NavItemId = 'dashboard' | 'grafik' | 'alert' | 'model'

export interface NavItem {
  id: NavItemId
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  isOpen?: boolean
  current?: NavItemId
  onSelect?: (id: NavItemId) => void
  onToggle?: () => void
  onLogout?: () => void
}

const defaultNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'grafik', label: 'Grafik', icon: BarChart3 },
  { id: 'alert', label: 'Alert', icon: AlertTriangle, badge: '5' },
  { id: 'model', label: 'Model', icon: Cpu },
]

export function Sidebar({
  isOpen = true,
  current = 'dashboard',
  onSelect,
  onToggle,
  onLogout,
  className,
  ...props
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'h-screen bg-neutral-n10 dark:bg-neutral-n800 border-r border-border flex flex-col justify-between p-4 font-sans transition-all duration-300 ease-in-out shrink-0 select-none',
        isOpen ? 'w-64' : 'w-20',
        className,
      )}
      {...props}
    >
      {/* Top Header with UGM Logo */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo-ugm.svg"
            alt="Logo UGM"
            className="w-10 h-10 object-contain shrink-0"
          />
          {isOpen && (
            <div className="min-w-0 flex-1">
              <h2 className="text-small-bold text-primary-600 leading-tight">
                Aplikasi Pendeteksi Keramaian
              </h2>
              <span className="text-tiny-normal text-muted-foreground">
                PLMD · DTEDI SV UGM
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Sidebar Navigation">
          {defaultNavItems.map((item) => {
            const Icon = item.icon
            const isActive = current === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect?.(item.id)}
                title={!isOpen ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-small-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-primary-800 text-white shadow-xs font-semibold'
                    : 'text-neutral-n600 dark:text-neutral-n300 hover:bg-neutral-n20 dark:hover:bg-neutral-n700',
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-white' : 'text-neutral-n500',
                  )}
                />
                {isOpen && (
                  <span className="flex-1 text-left truncate">
                    {item.label}
                  </span>
                )}
                {isOpen && item.badge && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-tiny-bold shrink-0',
                      isActive
                        ? 'bg-destructive-50 text-white'
                        : 'bg-destructive-10 text-destructive-70',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom section: Toggle & Logout */}
      <div className="space-y-2 pt-4 border-t border-border">
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-small-medium text-muted-foreground hover:bg-neutral-n20 dark:hover:bg-neutral-n700 transition-colors cursor-pointer"
          >
            {isOpen ? (
              <>
                <PanelLeftClose className="w-5 h-5 shrink-0" />
                <span className="truncate">Tutup Menu</span>
              </>
            ) : (
              <PanelLeftOpen className="w-5 h-5 shrink-0 mx-auto" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-small-medium bg-destructive-60 hover:bg-destructive-70 text-white transition-colors cursor-pointer shadow-xs',
            !isOpen && 'justify-center px-0',
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {isOpen && <span className="truncate">Keluar</span>}
        </button>
      </div>
    </aside>
  )
}
