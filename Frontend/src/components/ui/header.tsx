import * as React from 'react'
import {
  Bell,
  ChevronDown,
  Menu,
  Moon,
  RotateCw,
  Sun,
  User,
} from 'lucide-react'
import { cn } from '#/lib/utils'
import { ConnectionStatus } from './connection-status'
import type { ConnectionStateType } from './connection-status'

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  breadcrumbs?: string[]
  onToggleSidebar?: () => void
  connectionState?: ConnectionStateType
  connectionLabel?: string
  onRefresh?: () => void
  userName?: string
  userAvatar?: string
}

export function Header({
  title = 'Dashboards',
  breadcrumbs,
  onToggleSidebar,
  connectionState = 'synced',
  connectionLabel,
  onRefresh,
  userName = 'Admin',
  userAvatar,
  className,
  ...props
}: HeaderProps) {
  const [isDark, setIsDark] = React.useState(false)

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return next
    })
  }

  return (
    <header
      className={cn(
        'w-full h-16 md:h-[72px] px-4 md:px-6 bg-card border-b border-border flex items-center justify-between font-sans transition-colors',
        className,
      )}
      {...props}
    >
      {/* Left section: Sidebar toggle & Breadcrumb */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          className="p-2 rounded-lg text-neutral-n700 dark:text-neutral-n200 hover:bg-neutral-n20 dark:hover:bg-neutral-n700 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <div className="flex items-center gap-1.5 text-small-medium text-muted-foreground">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? 'text-neutral-n900 dark:text-neutral-n10 font-bold'
                        : ''
                    }
                  >
                    {crumb}
                  </span>
                  {idx < breadcrumbs.length - 1 && <span>/</span>}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-regular-bold md:text-large-bold text-neutral-n900 dark:text-neutral-n10 tracking-tight">
              {title}
            </span>
          )}
        </div>
      </div>

      {/* Right section: Status & Action Icons & User */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Connection status indicator */}
        <div className="hidden sm:block">
          <ConnectionStatus state={connectionState} label={connectionLabel} />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-neutral-n700 dark:text-neutral-200 hover:bg-neutral-n20 dark:hover:bg-neutral-n700 transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-warning-40" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh data"
            className="p-2 rounded-lg text-neutral-n700 dark:text-neutral-200 hover:bg-neutral-n20 dark:hover:bg-neutral-n700 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="p-2 rounded-lg text-neutral-n700 dark:text-neutral-200 hover:bg-neutral-n20 dark:hover:bg-neutral-n700 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive-60" />
          </button>
        </div>

        {/* User profile dropdown trigger */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs overflow-hidden border border-primary-200">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <span className="hidden md:inline-block text-small-medium text-neutral-n800 dark:text-neutral-n100">
            {userName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
