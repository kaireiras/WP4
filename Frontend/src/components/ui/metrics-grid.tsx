import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '#/lib/utils'
import { StatusLevel } from './status-level'
import type { StatusLevelType } from './status-level'
import { MetricCard } from './metric-card'
import type { MetricColor, MetricTrendInput } from './metric-card'

export interface MetricItem {
  label: string
  value: string | number
  unit: string
  color?: MetricColor
  trend?: MetricTrendInput
  delta?: string | number
}

export interface MetricsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  roomName?: string
  statusLevel?: StatusLevelType
  isLive?: boolean
  updatedAt?: string
  metrics?: MetricItem[]
  estimatedPeople?: string
  confidence?: string
  onClose?: () => void
}

export const defaultMetrics: MetricItem[] = [
  {
    label: 'RX Rate',
    value: '1.24',
    unit: 'MB/s',
    color: 'blue',
    trend: [0.42, 0.65, 0.88, 1.05, 1.15, 1.24],
  },
  {
    label: 'TX Rate',
    value: '486',
    unit: 'KB/s',
    color: 'teal',
    trend: [120, 240, 310, 420, 450, 486],
  },
  {
    label: 'Packets/sec',
    value: '3,420',
    unit: 'pps',
    color: 'purple',
    trend: [1200, 1850, 2400, 2900, 3150, 3420],
  },
  {
    label: 'Flow Count',
    value: '1,286',
    unit: 'flow',
    color: 'orange',
    trend: [620, 780, 940, 1100, 1210, 1286],
  },
  {
    label: 'Active Clients',
    value: '62',
    unit: 'klien',
    color: 'rose',
    trend: [15, 28, 40, 52, 58, 62],
  },
  {
    label: 'Connection Rate',
    value: '148',
    unit: '/s',
    color: 'green',
    trend: [35, 60, 92, 115, 130, 148],
  },
]

export function MetricsGrid({
  roomName = 'CU205',
  statusLevel = 'crowded',
  isLive = true,
  updatedAt = 'Diperbarui 12:09:15',
  metrics = defaultMetrics,
  estimatedPeople,
  confidence,
  onClose,
  className,
  ...props
}: MetricsGridProps) {
  return (
    <div
      className={cn(
        'w-full max-w-md bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-2xl p-5 shadow-md space-y-4 font-sans select-none',
        className,
      )}
      {...props}
    >
      {/* Header (Figma I125:1581;128:1260) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-sans font-bold text-xl text-neutral-n900 dark:text-neutral-n10 tracking-tight">
            {roomName}
          </h3>
          <StatusLevel status={statusLevel} size="sm" />
        </div>

        <div className="flex items-center gap-3">
          {isLive && (
            <div className="flex items-center gap-1.5 text-tiny-semibold text-neutral-n500 dark:text-neutral-n300 bg-success-10 dark:bg-success-950/40 px-2 py-0.5 rounded-full border border-success-20 dark:border-success-800">
              <span className="w-2 h-2 rounded-full bg-success-50 animate-pulse" />
              <span>Live</span>
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panel metrik"
              className="p-1 rounded-lg text-neutral-n400 hover:text-neutral-n700 hover:bg-neutral-n20 dark:hover:bg-neutral-n700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Optional room summary pill if estimatedPeople / confidence is provided */}
      {(estimatedPeople || confidence) && (
        <div className="flex items-center gap-2 text-tiny-medium text-neutral-n500 dark:text-neutral-n400 bg-neutral-n20 dark:bg-neutral-n700/60 px-3 py-1.5 rounded-lg border border-neutral-n30 dark:border-neutral-n600">
          {estimatedPeople && (
            <span>
              Estimasi:{' '}
              <strong className="text-neutral-n800 dark:text-neutral-n10">
                {estimatedPeople}
              </strong>
            </span>
          )}
          {estimatedPeople && confidence && <span>•</span>}
          {confidence && (
            <span>
              Akurasi:{' '}
              <strong className="text-neutral-n800 dark:text-neutral-n10">
                {confidence}
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Grid of 6 line cards (Figma I125:1581;128:1268) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((m, idx) => (
          <MetricCard
            key={idx}
            label={m.label}
            value={m.value}
            unit={m.unit}
            color={m.color}
            trend={m.trend}
            delta={m.delta}
            showDelta={true}
            chartHeight="h-16"
          />
        ))}
      </div>

      {/* Footer / Updated At (Figma I125:1581;128:1325) */}
      <div className="text-tiny-normal text-neutral-n400 dark:text-neutral-n400 text-right pt-0.5">
        {updatedAt}
      </div>
    </div>
  )
}
