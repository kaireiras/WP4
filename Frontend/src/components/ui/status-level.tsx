import * as React from 'react'
import { cn } from '#/lib/utils'

export type StatusLevelType = 'crowded' | 'high' | 'medium' | 'low'

export interface StatusLevelProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusLevelType
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
}

const statusLevelVariants: Record<
  StatusLevelType,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  crowded: {
    bg: 'bg-destructive-5',
    text: 'text-destructive-50',
    border: 'border-destructive-20',
    dot: 'bg-destructive-50',
    label: 'Crowded',
  },
  high: {
    bg: 'bg-warning-5',
    text: 'text-warning-50',
    border: 'border-warning-20',
    dot: 'bg-warning-50',
    label: 'High',
  },
  medium: {
    bg: 'bg-yellow-50',
    text: 'text-tertiary-700',
    border: 'border-yellow-200',
    dot: 'bg-tertiary-500',
    label: 'Medium',
  },
  low: {
    bg: 'bg-success-5',
    text: 'text-success-60',
    border: 'border-success-20',
    dot: 'bg-success-50',
    label: 'Low',
  },
}

const sizeClasses = {
  sm: 'text-tiny-semibold px-2 py-0.5 rounded-sm gap-1',
  md: 'text-small-semibold px-2.5 py-1 rounded-md gap-1.5',
  lg: 'text-regular-semibold px-3 py-1.5 rounded-lg gap-2',
}

export function StatusLevel({
  status,
  size = 'md',
  showDot = false,
  className,
  children,
  ...props
}: StatusLevelProps) {
  const variant = statusLevelVariants[status]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-sans border transition-colors select-none',
        variant.bg,
        variant.text,
        variant.border,
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full shrink-0',
            variant.dot,
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
          )}
        />
      )}
      {children ?? variant.label}
    </span>
  )
}
