import * as React from 'react'
import { cn } from '#/lib/utils'

export interface DashboardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

export function DashboardHeader({
  title = 'Dashboard',
  subtitle = 'Lihat keadaan seluruh ruangan',
  className,
  ...props
}: DashboardHeaderProps) {
  return (
    <div
      className={cn('space-y-1 font-sans select-none', className)}
      {...props}
    >
      <h1 className="font-sans font-bold text-2xl lg:text-[28px] text-neutral-n900 dark:text-neutral-n10 leading-tight">
        {title}
      </h1>
      <p className="text-small-normal text-neutral-n500 dark:text-neutral-n400">
        {subtitle}
      </p>
    </div>
  )
}
