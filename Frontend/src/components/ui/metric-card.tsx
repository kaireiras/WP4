import * as React from 'react'
import { cn } from '#/lib/utils'

export type MetricColor =
  'blue' | 'teal' | 'purple' | 'orange' | 'rose' | 'green'

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  unit: string
  color?: MetricColor
  trend?: number[] // Array of points 0-100 for SVG sparkline
}

const colorThemes: Record<
  MetricColor,
  { line: string; area: string; dot: string }
> = {
  blue: {
    line: '#267BEE',
    area: 'rgba(77, 147, 241, 0.18)',
    dot: '#267BEE',
  },
  teal: {
    line: '#0D9488',
    area: 'rgba(13, 148, 136, 0.18)',
    dot: '#0D9488',
  },
  purple: {
    line: '#7C3AED',
    area: 'rgba(124, 58, 237, 0.18)',
    dot: '#7C3AED',
  },
  orange: {
    line: '#EA580C',
    area: 'rgba(234, 88, 12, 0.18)',
    dot: '#EA580C',
  },
  rose: {
    line: '#D81827',
    area: 'rgba(244, 63, 94, 0.18)',
    dot: '#D81827',
  },
  green: {
    line: '#16A34A',
    area: 'rgba(34, 197, 94, 0.18)',
    dot: '#16A34A',
  },
}

export function MetricCard({
  label,
  value,
  unit,
  color = 'blue',
  trend = [30, 45, 38, 60, 52, 75, 68, 85],
  className,
  ...props
}: MetricCardProps) {
  const theme = colorThemes[color]

  // Compute SVG sparkline path
  const width = 100
  const height = 32
  const points = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * (width - 8) + 4
    const y = height - (v / 100) * (height - 8) - 4
    return { x, y }
  })

  const pathData = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    '',
  )
  const lastPoint = points[points.length - 1] || { x: width - 4, y: height / 2 }
  const areaData = `${pathData} L ${lastPoint.x} ${height} L ${points[0]?.x || 0} ${height} Z`

  return (
    <div
      className={cn(
        'bg-neutral-n10 dark:bg-neutral-n700 border border-neutral-n30 dark:border-neutral-n600 rounded-lg p-3 flex flex-col justify-between transition-all hover:border-primary-300',
        className,
      )}
      {...props}
    >
      <span className="text-tiny-medium text-muted-foreground truncate">
        {label}
      </span>

      <div className="flex items-baseline gap-1 my-1">
        <span className="text-large-bold text-neutral-n800 dark:text-neutral-n10 tracking-tight">
          {value}
        </span>
        <span className="text-tiny-medium text-muted-foreground">{unit}</span>
      </div>

      <div className="w-full h-8 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <path d={areaData} fill={theme.area} />
          <path
            d={pathData}
            fill="none"
            stroke={theme.line}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill={theme.dot} />
        </svg>
      </div>
    </div>
  )
}
