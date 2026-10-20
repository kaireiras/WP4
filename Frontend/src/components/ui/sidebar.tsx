import * as React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '#/lib/utils'

export type NavItemId = 'dashboard' | 'grafik' | 'alert' | 'model'
export type NavRoutePath = '/dashboard' | '/grafik' | '/alert' | '/model'

export interface NavItem {
  id: NavItemId
  label: string
  href: NavRoutePath
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

export interface SidebarProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'onSelect'
> {
  isOpen?: boolean
  current?: NavItemId
  onSelect?: (id: NavItemId) => void
  onToggle?: () => void
  onLogout?: () => void
  userName?: string
  userEmail?: string
  userAvatar?: string
}

function SvgIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      className={cn('inline-block size-6 shrink-0 bg-current', className)}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
      aria-hidden="true"
    />
  )
}

function HomeNavIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/nav-dashboard.svg" className={className} />
}

function ChartLineNavIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/nav-grafik.svg" className={className} />
}

function ExclamationMarkNavIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/nav-alert.svg" className={className} />
}

function GraphNavIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/nav-model.svg" className={className} />
}

function LogoutFigmaIcon({ className }: { className?: string }) {
  return <SvgIcon src="/icons/logout.svg" className={className} />
}

export const defaultNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: HomeNavIcon,
  },
  { id: 'grafik', label: 'Grafik', href: '/grafik', icon: ChartLineNavIcon },
  { id: 'alert', label: 'Alert', href: '/alert', icon: ExclamationMarkNavIcon },
  { id: 'model', label: 'Model', href: '/model', icon: GraphNavIcon },
]

export function Sidebar({
  isOpen = true,
  current,
  onSelect,
  onLogout,
  userName = 'Fauzan Trisuladana',
  userEmail = 'fauzantrisuladana@gmail.com',
  userAvatar,
  className,
  ...props
}: SidebarProps) {
  const location = useLocation()
  const activeId =
    current ??
    defaultNavItems.find((item) => location.pathname.startsWith(item.href))
      ?.id ??
    'dashboard'
  return (
    <aside
      className={cn(
        'h-screen bg-neutral-n10 dark:bg-neutral-n800 border-r border-neutral-n30 dark:border-neutral-n700 flex flex-col justify-between font-sans transition-all duration-300 ease-in-out shrink-0 select-none relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)] overflow-hidden',
        isOpen ? 'w-[300px] p-4' : 'w-[72px] px-2.5 py-4',
        className,
      )}
      {...props}
    >
      {/* Top Header with UGM Logo */}
      <Link
        to="/dashboard"
        className={cn(
          'flex items-center shrink-0 cursor-pointer no-underline transition-all duration-300 ease-in-out overflow-hidden rounded-xl hover:bg-neutral-n20/60 dark:hover:bg-neutral-n700/60 p-1.5',
          isOpen
            ? 'w-full gap-3 min-h-[48px]'
            : 'w-full h-11 justify-center gap-0',
        )}
      >
        <img
          src="/logo-ugm.svg"
          alt="Logo UGM"
          className="size-11 object-contain shrink-0"
        />
        <div
          className={cn(
            'flex flex-col justify-center min-w-0 transition-all duration-300 ease-in-out overflow-hidden',
            isOpen
              ? 'opacity-100 max-w-[215px]'
              : 'opacity-0 max-w-0 pointer-events-none',
          )}
        >
          <span className="font-sans font-bold text-base text-primary-600 leading-tight truncate">
            Pendeteksi Keramaian
          </span>
          <span className="font-sans font-medium text-xs text-muted-foreground leading-tight truncate mt-0.5">
            PLMD · DTEDI SV UGM
          </span>
        </div>
      </Link>

      {/* Navigation Items */}
      <nav
        className="flex-1 flex flex-col gap-2 my-2.5 w-full transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden"
        aria-label="Sidebar Navigation"
      >
        {defaultNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeId === item.id

          return (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => onSelect?.(item.id)}
              title={!isOpen ? item.label : undefined}
              className={cn(
                'h-12 px-3.5 rounded-xl flex items-center transition-all duration-300 ease-in-out cursor-pointer border no-underline overflow-hidden',
                isOpen
                  ? 'w-full gap-3.5 justify-start'
                  : 'w-full justify-center gap-0 px-0',
                isActive
                  ? 'bg-primary-800 border-neutral-n200 text-white font-semibold shadow-xs'
                  : 'bg-transparent border-transparent text-neutral-800 dark:text-neutral-n100 hover:bg-neutral-n20 dark:hover:bg-neutral-n700 font-medium',
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6 shrink-0 transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-neutral-700 dark:text-neutral-200',
                )}
              />
              <span
                className={cn(
                  'text-left text-[15px] truncate whitespace-nowrap transition-all duration-300 ease-in-out',
                  isOpen
                    ? 'opacity-100 max-w-[210px]'
                    : 'opacity-0 max-w-0 pointer-events-none overflow-hidden',
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-neutral-800 dark:text-neutral-n100',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section: User Profile & Log out */}
      <div className="flex flex-col gap-2.5 pt-2.5 border-t border-neutral-n30 dark:border-neutral-n700 w-full shrink-0 transition-all duration-300 ease-in-out overflow-hidden">
        {/* User Profile Row */}
        <div
          className={cn(
            'min-h-[46px] flex items-center rounded-xl p-1 transition-all duration-300 ease-in-out overflow-hidden',
            isOpen ? 'w-full gap-3' : 'w-full justify-center gap-0',
          )}
          title={!isOpen ? `${userName} (${userEmail})` : undefined}
        >
          <div className="size-10 rounded-full overflow-hidden shrink-0 bg-neutral-n30 dark:bg-neutral-n700 border border-neutral-n40 dark:border-neutral-n600">
            <img
              src={userAvatar || '/icons/default-avatar.svg'}
              alt={userName}
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className={cn(
              'flex-1 min-w-0 flex flex-col justify-center transition-all duration-300 ease-in-out overflow-hidden',
              isOpen
                ? 'opacity-100 max-w-[210px]'
                : 'opacity-0 max-w-0 pointer-events-none',
            )}
          >
            <span className="text-[14px] font-semibold text-neutral-n900 dark:text-neutral-n10 truncate leading-tight">
              {userName}
            </span>
            <span className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
              {userEmail}
            </span>
          </div>
        </div>

        {/* Log out Button */}
        <button
          type="button"
          onClick={onLogout}
          title={!isOpen ? 'Log out' : undefined}
          className={cn(
            'h-11 rounded-xl bg-destructive-60 hover:bg-destructive-70 border border-destructive-50 text-white flex items-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden font-medium text-sm',
            isOpen
              ? 'w-full px-3.5 gap-2.5 justify-center'
              : 'w-full justify-center gap-0 px-0',
          )}
        >
          <LogoutFigmaIcon className="w-5 h-5 text-white shrink-0" />
          <span
            className={cn(
              'truncate whitespace-nowrap transition-all duration-300 ease-in-out',
              isOpen
                ? 'opacity-100 max-w-[150px]'
                : 'opacity-0 max-w-0 pointer-events-none',
            )}
          >
            Log out
          </span>
        </button>
      </div>
    </aside>
  )
}
