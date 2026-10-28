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
  { bg: string; dot: string; label: string }
> = {
  crowded: {
    bg: 'bg-destructive-5',
    dot: 'bg-destructive-50',
    label: 'Crowded',
  },
  high: {
    bg: 'bg-warning-5',
    dot: 'bg-warning-50',
    label: 'High',
  },
  medium: {
    bg: 'bg-yellow-50',
    dot: 'bg-yellow-500',
    label: 'Medium',
  },
  low: {
    bg: 'bg-success-5',
    dot: 'bg-success-50',
    label: 'Low',
  },
}

const sizeClasses = {
  sm: 'px-[6.52px] py-[3.26px] text-[9.78px] leading-[13.04px] tracking-[-0.05px] font-semibold gap-[3.26px]',
  md: 'px-[6.52px] py-[3.26px] text-[9.78px] leading-[13.04px] tracking-[-0.05px] font-semibold gap-[3.26px]',
  lg: 'px-3 py-1 text-tiny-semibold gap-1.5',
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
        'inline-flex items-center justify-center rounded-full font-sans text-neutral-n900 transition-colors select-none',
        variant.bg,
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
