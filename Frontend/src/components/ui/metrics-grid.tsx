import * as React from 'react'
import { cn } from '#/lib/utils'
import { StatusLevel } from './status-level'
import type { StatusLevelType } from './status-level'
import { MetricCard } from './metric-card'
import type { MetricColor } from './metric-card'

export interface MetricItem {
  label: string
  value: string | number
  unit: string
  color?: MetricColor
  trend?: number[]
}

export interface MetricsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  roomName?: string
  statusLevel?: StatusLevelType
  isLive?: boolean
  updatedAt?: string
  metrics?: MetricItem[]
}

const defaultMetrics: MetricItem[] = [
  {
    label: 'RX Rate',
    value: '1.24',
    unit: 'MB/s',
    color: 'blue',
    trend: [30, 42, 38, 55, 62, 70, 65, 82],
  },
  {
    label: 'TX Rate',
    value: '486',
    unit: 'KB/s',
    color: 'teal',
    trend: [40, 50, 45, 60, 58, 65, 75, 70],
  },
  {
    label: 'Packets/sec',
    value: '3,420',
    unit: 'pps',
    color: 'purple',
    trend: [35, 48, 52, 65, 70, 72, 80, 88],
  },
  {
    label: 'Flow Count',
    value: '1,286',
    unit: 'flow',
    color: 'orange',
    trend: [45, 40, 55, 52, 68, 60, 72, 78],
  },
  {
    label: 'Active Clients',
    value: '62',
    unit: 'klien',
    color: 'rose',
    trend: [20, 30, 42, 50, 58, 62, 60, 65],
  },
  {
    label: 'Connection Rate',
    value: '148',
    unit: '/s',
    color: 'green',
    trend: [30, 35, 45, 50, 55, 65, 70, 80],
  },
]

export function MetricsGrid({
  roomName = 'CU205',
  statusLevel = 'crowded',
  isLive = true,
  updatedAt = 'Diperbarui 12:09:15',
  metrics = defaultMetrics,
  className,
  ...props
}: MetricsGridProps) {
  return (
    <div
      className={cn(
        'w-full max-w-md bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 font-sans',
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-large-bold text-neutral-n900 tracking-tight">
            {roomName}
          </h3>
          <StatusLevel status={statusLevel} size="sm" />
        </div>

        {isLive && (
          <div className="flex items-center gap-1.5 text-tiny-medium text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success-50 animate-pulse" />
            <span>Live</span>
          </div>
        )}
      </div>

      {/* Grid of 6 metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {metrics.map((m, idx) => (
          <MetricCard
            key={idx}
            label={m.label}
            value={m.value}
            unit={m.unit}
            color={m.color}
            trend={m.trend}
          />
        ))}
      </div>

      {/* Footer / Updated At */}
      <div className="text-tiny-normal text-muted-foreground text-right pt-1">
        {updatedAt}
      </div>
    </div>
  )
}
