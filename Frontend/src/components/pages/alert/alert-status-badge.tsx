import * as React from 'react'
import type { AlertStatus } from './alert-data'
import { cn } from '#/lib/utils'

export interface AlertStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: AlertStatus
}

export function AlertStatusBadge({
  status,
  className,
  ...props
}: AlertStatusBadgeProps) {
  const isAcknowledged = status === 'acknowledged'
  const isResolved = status === 'resolved'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-sans text-[11px] leading-tight font-semibold px-2.5 py-0.5 select-none transition-colors border',
        isResolved &&
          'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/50',
        isAcknowledged &&
          'bg-neutral-n40 dark:bg-neutral-n700 text-neutral-n700 dark:text-neutral-n200 border-transparent',
        !isResolved &&
          !isAcknowledged &&
          'bg-[#fff1f2] dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50',
        className,
      )}
      {...props}
    >
      {isResolved ? 'Resolved' : isAcknowledged ? 'Acknowledged' : 'Active'}
    </span>
  )
}
