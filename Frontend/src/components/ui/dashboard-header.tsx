import * as React from 'react'
import { cn } from '#/lib/utils'

export interface DashboardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function DashboardHeader({
  title = 'Dashboard',
  subtitle = 'Lihat keadaan seluruh ruangan',
  actions,
  className,
  children,
  ...props
}: DashboardHeaderProps) {
  const content = actions ?? children

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans select-none',
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="font-sans font-bold text-2xl lg:text-[28px] text-neutral-n900 dark:text-neutral-n10 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-small-normal text-neutral-n500 dark:text-neutral-n400">
            {subtitle}
          </p>
        )}
      </div>

      {content && (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {content}
        </div>
      )}
    </div>
  )
}
