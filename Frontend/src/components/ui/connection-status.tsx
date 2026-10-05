import * as React from 'react'
import { cn } from '#/lib/utils'

export type ConnectionStateType =
  'connected' | 'synced' | 'disconnected' | 'blue' | 'green' | 'error'

export interface ConnectionStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: ConnectionStateType
  label?: string
  lastSyncTime?: string
  pulsing?: boolean
}

export function ConnectionStatus({
  state = 'connected',
  label,
  lastSyncTime,
  pulsing = true,
  className,
  ...props
}: ConnectionStatusProps) {
  let bgClass = 'bg-primary-800 text-white'
  let dotBg = 'bg-primary-400'
  let defaultText = 'Connected'

  if (state === 'synced' || state === 'green') {
    bgClass = 'bg-success-50 text-white'
    dotBg = 'bg-success-20'
    defaultText = lastSyncTime
      ? `Last sync: ${lastSyncTime}`
      : 'Last sync: 12:09:15'
  } else if (state === 'disconnected' || state === 'error') {
    bgClass = 'bg-destructive-50 text-white'
    dotBg = 'bg-destructive-20'
    defaultText = 'Disconnected'
  } else {
    // connected / blue
    bgClass = 'bg-primary-800 text-white'
    dotBg = 'bg-primary-500'
    defaultText = label ?? 'Connected'
  }

  const displayText = label ?? defaultText

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-tiny-semibold md:text-small-semibold shadow-xs select-none transition-all',
        bgClass,
        className,
      )}
      {...props}
    >
      <span className="relative flex h-2 w-2">
        {pulsing && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              dotBg,
            )}
          />
        )}
        <span
          className={cn('relative inline-flex rounded-full h-2 w-2', dotBg)}
        />
      </span>
      <span>{displayText}</span>
    </div>
  )
}
