import * as React from 'react'
import { cn } from '#/lib/utils'

export type StatusBadgeType = 'active' | 'acknowledge' | 'acknowledged'

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusBadgeType
  size?: 'sm' | 'md' | 'lg'
}

const statusVariants: Record<
  'active' | 'acknowledge',
  { bg: string; text: string; label: string }
> = {
  active: {
    bg: 'bg-destructive-5',
    text: 'text-destructive-50',
    label: 'Active',
  },
  acknowledge: {
    bg: 'bg-neutral-n50',
    text: 'text-neutral-n500',
    label: 'Acknowledged',
  },
}

const sizeClasses = {
  sm: 'px-[6.52px] py-[3.26px] text-[9.78px] leading-[13.04px] tracking-[-0.05px] font-semibold gap-[3.26px]',
  md: 'px-[6.52px] py-[3.26px] text-[9.78px] leading-[13.04px] tracking-[-0.05px] font-semibold gap-[3.26px]',
  lg: 'px-3 py-1 text-tiny-semibold gap-1.5',
}

export function StatusBadge({
  status,
  size = 'md',
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const normalizedKey =
    status === 'acknowledged' || status === 'acknowledge'
      ? 'acknowledge'
      : 'active'
  const variant = statusVariants[normalizedKey]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-sans transition-colors select-none',
        variant.bg,
        variant.text,
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children ?? variant.label}
    </span>
  )
}
