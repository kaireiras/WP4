import * as React from 'react'
import { cn } from '#/lib/utils'
import { ConnectionStatus } from './connection-status'
import type { ConnectionStateType } from './connection-status'

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  breadcrumbs?: string[]
  onToggleSidebar?: () => void
  connectionState?: ConnectionStateType
  connectionLabel?: string
  lastSyncTime?: string
  onRefresh?: () => void
  onNotificationClick?: () => void
  userName?: string
  userAvatar?: string
}

function SidebarDuotoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-6 h-6 shrink-0', className)}
      aria-hidden="true"
    >
      <g transform="translate(3 4.5)">
        <path
          d="M5.25 0L5.25 15L0.75 15C0.551088 15 0.360322 14.921 0.21967 14.7803C0.0790178 14.6397 0 14.4489 0 14.25L0 0.75C0 0.551088 0.0790178 0.360322 0.21967 0.21967C0.360322 0.0790178 0.551088 0 0.75 0L5.25 0Z"
          fill="currentColor"
          fillOpacity="0.08"
        />
      </g>
      <g transform="translate(2.25 3.75)">
        <path
          d="M18 0L1.5 0C1.10218 0 0.720644 0.158035 0.43934 0.43934C0.158035 0.720644 0 1.10218 0 1.5L0 15C0 15.3978 0.158035 15.7794 0.43934 16.0607C0.720644 16.342 1.10218 16.5 1.5 16.5L18 16.5C18.3978 16.5 18.7794 16.342 19.0607 16.0607C19.342 15.7794 19.5 15.3978 19.5 15L19.5 1.5C19.5 1.10218 19.342 0.720644 19.0607 0.43934C18.7794 0.158035 18.3978 0 18 0ZM1.5 10.5L3 10.5C3.19891 10.5 3.38968 10.421 3.53033 10.2803C3.67098 10.1397 3.75 9.94891 3.75 9.75C3.75 9.55109 3.67098 9.36032 3.53033 9.21967C3.38968 9.07902 3.19891 9 3 9L1.5 9L1.5 7.5L3 7.5C3.19891 7.5 3.38968 7.42098 3.53033 7.28033C3.67098 7.13968 3.75 6.94891 3.75 6.75C3.75 6.55109 3.67098 6.36032 3.53033 6.21967C3.38968 6.07902 3.19891 6 3 6L1.5 6L1.5 4.5L3 4.5C3.19891 4.5 3.38968 4.42098 3.53033 4.28033C3.67098 4.13968 3.75 3.94891 3.75 3.75C3.75 3.55109 3.67098 3.36032 3.53033 3.21967C3.38968 3.07902 3.19891 3 3 3L1.5 3L1.5 1.5L5.25 1.5L5.25 15L1.5 15L1.5 10.5ZM18 15L6.75 15L6.75 1.5L18 1.5L18 15Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

function BellDuotoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-6 h-6 shrink-0', className)}
      aria-hidden="true"
    >
      <g transform="translate(3.7545 3)">
        <path
          d="M15.7455 15L0.745489 15C0.61422 14.9992 0.485457 14.964 0.37207 14.8978C0.258683 14.8317 0.164644 14.7369 0.099352 14.6231C0.0340597 14.5092 -0.00019859 14.3801 8.65981e-07 14.2489C0.000200322 14.1176 0.0348505 13.9887 0.100489 13.875C0.718301 12.8062 1.49549 10.1072 1.49549 6.75C1.49549 4.95979 2.20665 3.2429 3.47252 1.97703C4.73839 0.711159 6.45528 0 8.24549 0C10.0357 0 11.7526 0.711159 13.0185 1.97703C14.2843 3.2429 14.9955 4.95979 14.9955 6.75C14.9955 10.1081 15.7736 12.8062 16.3924 13.875C16.4581 13.9888 16.4927 14.1179 16.4928 14.2493C16.493 14.3808 16.4585 14.5099 16.393 14.6239C16.3275 14.7378 16.2332 14.8325 16.1196 14.8985C16.0059 14.9645 15.8769 14.9995 15.7455 15Z"
          fill="currentColor"
          fillOpacity="0.08"
        />
      </g>
      <g transform="translate(3.0011 2.25)">
        <path
          d="M17.7927 14.2444C17.2724 13.3481 16.4989 10.8122 16.4989 7.5C16.4989 5.51088 15.7087 3.60322 14.3022 2.1967C12.8957 0.790176 10.988 0 8.99891 0C7.00979 0 5.10214 0.790176 3.69561 2.1967C2.28909 3.60322 1.49891 5.51088 1.49891 7.5C1.49891 10.8131 0.724538 13.3481 0.204226 14.2444C0.0713545 14.4722 0.000914339 14.7311 8.84153e-06 14.9949C-0.000896656 15.2586 0.0677647 15.518 0.199068 15.7467C0.330372 15.9755 0.519675 16.1656 0.747887 16.2978C0.976099 16.4301 1.23515 16.4998 1.49891 16.5L5.32485 16.5C5.49789 17.3467 5.95806 18.1077 6.62754 18.6542C7.29702 19.2007 8.1347 19.4992 8.99891 19.4992C9.86312 19.4992 10.7008 19.2007 11.3703 18.6542C12.0398 18.1077 12.4999 17.3467 12.673 16.5L16.4989 16.5C16.7626 16.4996 17.0215 16.4298 17.2496 16.2975C17.4777 16.1651 17.6669 15.975 17.7981 15.7463C17.9292 15.5176 17.9978 15.2583 17.9969 14.9946C17.9959 14.7309 17.9255 14.4722 17.7927 14.2444ZM8.99891 18C8.53374 17.9999 8.08005 17.8555 7.70029 17.5869C7.32052 17.3183 7.03335 16.9386 6.87829 16.5L11.1195 16.5C10.9645 16.9386 10.6773 17.3183 10.2975 17.5869C9.91777 17.8555 9.46408 17.9999 8.99891 18ZM1.49891 15C2.22079 13.7587 2.99891 10.8825 2.99891 7.5C2.99891 5.9087 3.63105 4.38258 4.75627 3.25736C5.88149 2.13214 7.40762 1.5 8.99891 1.5C10.5902 1.5 12.1163 2.13214 13.2416 3.25736C14.3668 4.38258 14.9989 5.9087 14.9989 7.5C14.9989 10.8797 15.7752 13.7559 16.4989 15L1.49891 15Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

function CaretDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-[15px] h-[15px] shrink-0', className)}
      aria-hidden="true"
    >
      <g transform="translate(2.1075 4.9195)">
        <path
          d="M10.5774 1.20298L5.88989 5.89048C5.82457 5.95603 5.74695 6.00804 5.66148 6.04353C5.57602 6.07901 5.48439 6.09728 5.39184 6.09728C5.2993 6.09728 5.20767 6.07901 5.12221 6.04353C5.03674 6.00804 4.95912 5.95603 4.8938 5.89048L0.206298 1.20298C0.0742076 1.07089 0 0.891734 0 0.704931C0 0.518127 0.0742076 0.338974 0.206298 0.206884C0.338388 0.0747935 0.517541 0.000586065 0.704345 0.000586063C0.891149 0.000586061 1.0703 0.0747935 1.20239 0.206884L5.39243 4.39692L9.58247 0.206298C9.71456 0.0742078 9.89371 0 10.0805 0C10.2673 0 10.4465 0.0742078 10.5786 0.206298C10.7107 0.338388 10.7849 0.517541 10.7849 0.704345C10.7849 0.891149 10.7107 1.0703 10.5786 1.20239L10.5774 1.20298Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

function DefaultAvatarSvg() {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="22" fill="#D6E4FF" />
      <circle cx="22" cy="17" r="7.5" fill="#F2C6A0" />
      <path
        d="M14.5 15.5C14.5 11.3579 17.8579 8 22 8C26.1421 8 29.5 11.3579 29.5 15.5C29.5 16.5 29 17.5 28 17C26.5 14.5 24 13.5 21 13.5C18 13.5 16 14.8 15 17C14.6 16.8 14.5 16.2 14.5 15.5Z"
        fill="#2E2E2E"
      />
      <path
        d="M9 40C9 32.8203 14.8203 27 22 27C29.1797 27 35 32.8203 35 40V44H9V40Z"
        fill="#1166D8"
      />
    </svg>
  )
}

export function Header({
  title = 'Dashboards',
  breadcrumbs,
  onToggleSidebar,
  connectionState = 'synced',
  connectionLabel,
  lastSyncTime,
  onNotificationClick,
  userName = 'Fauzan Trisuladana',
  userAvatar,
  className,
  ...props
}: HeaderProps) {
  return (
    <header
      className={cn(
        'w-full h-[76px] px-3 sm:px-5 py-2.5 bg-neutral-n0 dark:bg-neutral-n800 border-b-2 border-neutral-n40 dark:border-neutral-n700 flex items-center justify-between font-sans transition-colors',
        className,
      )}
      {...props}
    >
      {/* Left section: Icon-Breadcrumb (Figma 22:358) */}
      <div className="flex items-center h-14">
        <div className="flex items-center gap-2 rounded-lg">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
            className="w-12 h-12 sm:w-14 sm:h-14 p-3 sm:p-4 rounded-[20px] flex items-center justify-center text-neutral-n600 dark:text-neutral-n200 hover:bg-neutral-n20 dark:hover:bg-neutral-n700 transition-colors cursor-pointer"
          >
            <SidebarDuotoneIcon />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-lg">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <div className="flex items-center gap-1.5 text-small-semibold text-neutral-n600 dark:text-neutral-n100">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? 'text-neutral-n600 dark:text-neutral-n10'
                        : 'text-neutral-n300 dark:text-neutral-n400'
                    }
                  >
                    {crumb}
                  </span>
                  {idx < breadcrumbs.length - 1 && (
                    <span className="text-neutral-n300">/</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-small-semibold text-neutral-n600 dark:text-neutral-n100">
              {title}
            </span>
          )}
        </div>
      </div>

      {/* Right section: Terhubung + Bell + Avatar-Caret (Figma 22:361) */}
      <div className="flex items-center justify-end gap-2 sm:gap-5 h-14">
        {/* Connection status pill (Figma 22:442) */}
        <div className="flex items-center">
          <ConnectionStatus
            state={connectionState}
            label={connectionLabel}
            lastSyncTime={lastSyncTime}
          />
        </div>

        {/* Group: Notification Bell button (Figma 22:363 -> I22:363;10922:14268) */}
        <div className="flex items-center justify-end gap-2 rounded-lg">
          <button
            type="button"
            onClick={onNotificationClick}
            aria-label="Notifications"
            className="w-12 h-12 sm:w-14 sm:h-14 p-3 sm:p-4 rounded-[20px] flex items-center justify-center text-neutral-n600 dark:text-neutral-n200 hover:bg-neutral-n20 dark:hover:bg-neutral-n700 transition-colors cursor-pointer"
          >
            <BellDuotoneIcon />
          </button>
        </div>

        {/* User Avatar + CaretDown (Figma 22:364) */}
        <div
          className="flex items-center gap-[5px] h-11 cursor-pointer"
          title={userName}
        >
          <div
            className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-neutral-n30"
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px',
              flexShrink: 0,
            }}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                width={44}
                height={44}
                style={{
                  width: '44px',
                  height: '44px',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <DefaultAvatarSvg />
            )}
          </div>
          <CaretDownIcon className="text-neutral-n600 dark:text-neutral-n200" />
        </div>
      </div>
    </header>
  )
}
