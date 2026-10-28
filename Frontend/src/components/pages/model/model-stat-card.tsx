import type * as React from 'react'
import { cn } from '#/lib/utils'

export interface ModelStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtitle: string
}

export function ModelStatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  className,
  ...props
}: ModelStatCardProps) {
  return (
    <div
      className={cn(
        'p-3.5 rounded-xl bg-neutral-n10 dark:bg-neutral-n900/50 border border-neutral-n30 dark:border-neutral-n700 flex flex-col justify-between transition-colors',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs">
        <Icon className="size-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2">
        <span className="text-lg sm:text-xl font-bold font-sans text-neutral-900 dark:text-neutral-100 block truncate">
          {value}
        </span>
        <span className="text-[11px] text-muted-foreground block mt-0.5 truncate">
          {subtitle}
        </span>
      </div>
    </div>
  )
}
