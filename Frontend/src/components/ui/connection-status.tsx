import * as React from 'react'
import { cn } from '#/lib/utils'

export type ConnectionStateType =
  'connected' | 'synced' | 'disconnected' | 'blue' | 'green' | 'error'

export interface ConnectionStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: ConnectionStateType
  label?: string
  lastSyncTime?: string
  pulsing?: boolean
  showLabelOnMobile?: boolean
  dotOnly?: boolean
}

export const statusConfig: Record<
  ConnectionStateType,
  {
    desktopBgClass: string
    dotBg: string
    dotOnlyBg: string
    dotPingBg: string
    getDefaultText: (syncTime?: string) => string
  }
> = {
  connected: {
    desktopBgClass: 'sm:bg-primary-800',
    dotBg: 'bg-primary-600 sm:bg-primary-500',
    dotOnlyBg: 'bg-primary-600 dark:bg-primary-400',
    dotPingBg: 'bg-primary-400',
    getDefaultText: () => 'Connected',
  },
  blue: {
    desktopBgClass: 'sm:bg-primary-800',
    dotBg: 'bg-primary-600 sm:bg-primary-500',
    dotOnlyBg: 'bg-primary-600 dark:bg-primary-400',
    dotPingBg: 'bg-primary-400',
    getDefaultText: () => 'Connected',
  },
  synced: {
    desktopBgClass: 'sm:bg-success-50',
    dotBg: 'bg-success-50 sm:bg-success-20',
    dotOnlyBg: 'bg-success-50 dark:bg-success-40',
    dotPingBg: 'bg-success-40 sm:bg-success-20',
    getDefaultText: (syncTime) =>
      syncTime ? `Last sync: ${syncTime}` : 'Last sync: 12:09:15',
  },
  green: {
    desktopBgClass: 'sm:bg-success-50',
    dotBg: 'bg-success-50 sm:bg-success-20',
    dotOnlyBg: 'bg-success-50 dark:bg-success-40',
    dotPingBg: 'bg-success-40 sm:bg-success-20',
    getDefaultText: (syncTime) =>
      syncTime ? `Last sync: ${syncTime}` : 'Last sync: 12:09:15',
  },
  disconnected: {
    desktopBgClass: 'sm:bg-destructive-50',
    dotBg: 'bg-destructive-50 sm:bg-destructive-20',
    dotOnlyBg: 'bg-destructive-50 dark:bg-destructive-40',
    dotPingBg: 'bg-destructive-40 sm:bg-destructive-20',
    getDefaultText: () => 'Disconnected',
  },
  error: {
    desktopBgClass: 'sm:bg-destructive-50',
    dotBg: 'bg-destructive-50 sm:bg-destructive-20',
    dotOnlyBg: 'bg-destructive-50 dark:bg-destructive-40',
    dotPingBg: 'bg-destructive-40 sm:bg-destructive-20',
    getDefaultText: () => 'Disconnected',
  },
}

export function ConnectionStatus({
  state = 'connected',
  label,
  lastSyncTime,
  pulsing = true,
  showLabelOnMobile = false,
  dotOnly = false,
  className,
  ...props
}: ConnectionStatusProps) {
  const currentConfig = statusConfig[state]
  const displayText = label ?? currentConfig.getDefaultText(lastSyncTime)

  return (
    <div
      title={displayText}
      aria-label={displayText}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full select-none transition-all',
        dotOnly
          ? 'p-1.5 bg-transparent'
          : cn(
              'p-1.5 sm:px-4 sm:py-2 text-[12px] leading-[15px] font-normal bg-transparent sm:text-white',
              currentConfig.desktopBgClass,
            ),
        className,
      )}
      {...props}
    >
      <span className="relative flex size-2.5 sm:size-2 shrink-0">
        {pulsing && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              dotOnly ? currentConfig.dotOnlyBg : currentConfig.dotPingBg,
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full size-2.5 sm:size-2',
            dotOnly ? currentConfig.dotOnlyBg : currentConfig.dotBg,
            pulsing && 'animate-pulse',
          )}
        />
      </span>
      {!dotOnly && (
        <span
          className={cn(
            'whitespace-nowrap',
            showLabelOnMobile ? 'inline' : 'hidden sm:inline',
          )}
        >
          {displayText}
        </span>
      )}
    </div>
  )
}
