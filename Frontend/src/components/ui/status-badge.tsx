import * as React from 'react'
import { cn } from '#/lib/utils'

export type StatusBadgeType = 'active' | 'acknowledge' | 'acknowledged'

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusBadgeType
  size?: 'sm' | 'md'
}

const statusVariants: Record<
  'active' | 'acknowledge',
  { bg: string; text: string; border: string; label: string }
> = {
  active: {
    bg: 'bg-destructive-5',
    text: 'text-destructive-50',
    border: 'border-destructive-20',
    label: 'Active',
  },
  acknowledge: {
    bg: 'bg-neutral-n30',
    text: 'text-neutral-n500',
    border: 'border-neutral-n40',
    label: 'Acknowledged',
  },
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
        'inline-flex items-center justify-center font-sans border font-semibold select-none rounded-md',
        variant.bg,
        variant.text,
        variant.border,
        size === 'sm'
          ? 'text-tiny-semibold px-2 py-0.5'
          : 'text-small-semibold px-2.5 py-1',
        className,
      )}
      {...props}
    >
      {children ?? variant.label}
    </span>
  )
}
