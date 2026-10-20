import * as React from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '#/lib/utils'

export type MetricColor =
  'blue' | 'teal' | 'purple' | 'orange' | 'rose' | 'green'

export interface TrendPoint {
  time?: string
  value: number
}

export type MetricTrendInput = number[] | TrendPoint[]

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  unit: string
  color?: MetricColor
  trend?: MetricTrendInput
  delta?: string | number
  showDelta?: boolean
  chartHeight?: string
}

const colorThemes: Record<
  MetricColor,
  { line: string; area: string; dot: string; text: string }
> = {
  blue: {
    line: '#267BEE',
    area: 'rgba(77, 147, 241, 0.18)',
    dot: '#267BEE',
    text: 'text-primary-600',
  },
  teal: {
    line: '#0D9488',
    area: 'rgba(13, 148, 136, 0.18)',
    dot: '#0D9488',
    text: 'text-teal-600',
  },
  purple: {
    line: '#7C3AED',
    area: 'rgba(124, 58, 237, 0.18)',
    dot: '#7C3AED',
    text: 'text-purple-600',
  },
  orange: {
    line: '#EA580C',
    area: 'rgba(234, 88, 12, 0.18)',
    dot: '#EA580C',
    text: 'text-orange-600',
  },
  rose: {
    line: '#D81827',
    area: 'rgba(244, 63, 94, 0.18)',
    dot: '#D81827',
    text: 'text-destructive-60',
  },
  green: {
    line: '#16A34A',
    area: 'rgba(34, 197, 94, 0.18)',
    dot: '#16A34A',
    text: 'text-success-60',
  },
}

export function MetricCard({
  label,
  value,
  unit,
  color = 'blue',
  trend = [30, 45, 38, 60, 52, 75, 68, 85],
  delta,
  showDelta = false,
  chartHeight = 'h-16',
  className,
  ...props
}: MetricCardProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
  const theme = colorThemes[color]

  // Parse points to structured array
  const pointsData: TrendPoint[] = React.useMemo(() => {
    if (trend.length === 0) return []
    return trend.map((item, idx) => {
      if (typeof item === 'number') {
        return { value: item, time: `T-${trend.length - idx}m` }
      }
      return { value: item.value, time: item.time }
    })
  }, [trend])

  // Compute dynamic min/max scaling
  const { minVal, range } = React.useMemo(() => {
    if (pointsData.length === 0) return { minVal: 0, range: 100 }
    const vals = pointsData.map((p) => p.value)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    return {
      minVal: min,
      range: max - min || 1,
    }
  }, [pointsData])

  // Compute SVG sparkline path
  const width = 100
  const height = 50
  const paddingX = 4
  const paddingY = 6

  const svgPoints = React.useMemo(() => {
    if (pointsData.length <= 1) {
      return [{ x: width / 2, y: height / 2, raw: pointsData[0] }]
    }
    return pointsData.map((p, i) => {
      const x =
        paddingX + (i / (pointsData.length - 1)) * (width - paddingX * 2)
      const normalizedY = (p.value - minVal) / range
      const y = height - paddingY - normalizedY * (height - paddingY * 2)
      return { x, y, raw: p }
    })
  }, [pointsData, minVal, range])

  const pathData = React.useMemo(() => {
    if (svgPoints.length <= 1) return ''
    let d = `M ${svgPoints[0].x.toFixed(2)} ${svgPoints[0].y.toFixed(2)}`
    for (let i = 0; i < svgPoints.length - 1; i++) {
      const p0 = svgPoints[Math.max(i - 1, 0)]
      const p1 = svgPoints[i]
      const p2 = svgPoints[i + 1]
      const p3 = svgPoints[Math.min(i + 2, svgPoints.length - 1)]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
    }
    return d
  }, [svgPoints])

  const lastPoint = svgPoints[svgPoints.length - 1] || {
    x: width - paddingX,
    y: height / 2,
    raw: { value: 0 },
  }
  const areaData = `${pathData} L ${lastPoint.x.toFixed(2)} ${height} L ${svgPoints[0]?.x.toFixed(2) || 0} ${height} Z`

  // Calculate percentage delta if not provided
  const computedDelta = React.useMemo(() => {
    if (delta !== undefined) return delta
    if (pointsData.length < 2) return null
    const first = pointsData[0].value
    const last = pointsData[pointsData.length - 1].value
    if (first === 0) return null
    const diff = Math.round(((last - first) / first) * 100)
    return diff > 0 ? `+${diff}%` : `${diff}%`
  }, [delta, pointsData])

  const isPositive =
    typeof computedDelta === 'string'
      ? computedDelta.startsWith('+')
      : typeof computedDelta === 'number'
        ? computedDelta >= 0
        : true

  const activePoint =
    hoveredIndex !== null ? svgPoints[hoveredIndex] : lastPoint

  return (
    <div
      className={cn(
        'bg-neutral-n10 dark:bg-neutral-n700 border border-neutral-n30 dark:border-neutral-n600 rounded-lg p-3 flex flex-col justify-between transition-all hover:border-primary-300 dark:hover:border-primary-500 shadow-2xs group relative',
        className,
      )}
      {...props}
    >
      {/* Top Label & Delta */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-tiny-medium text-neutral-n500 dark:text-neutral-n300 truncate">
          {label}
        </span>
        {showDelta && computedDelta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1 rounded-xs',
              isPositive
                ? 'text-success-60 bg-success-10 dark:bg-success-950/40'
                : 'text-destructive-60 bg-destructive-10 dark:bg-destructive-950/40',
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" />
            )}
            <span>{computedDelta}</span>
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-large-bold text-neutral-n800 dark:text-neutral-n10 tracking-tight">
          {value}
        </span>
        <span className="text-tiny-medium text-neutral-n400 dark:text-neutral-n300">
          {unit}
        </span>
      </div>

      {/* Visual Line Chart / Sparkline */}
      <div
        className={cn(
          'w-full h-16 overflow-hidden relative mt-1 select-none',
          chartHeight,
        )}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id={`grad-${color}-${label.replace(/[^a-zA-Z0-9]/g, '-')}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={theme.dot} stopOpacity="0.32" />
              <stop offset="100%" stopColor={theme.dot} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Shaded Gradient Area */}
          <path
            d={areaData}
            fill={`url(#grad-${color}-${label.replace(/[^a-zA-Z0-9]/g, '-')})`}
          />

          {/* Smooth Trend Line */}
          <path
            d={pathData}
            fill="none"
            stroke={theme.line}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Active Pin Indicator (Rendered as exact circular HTML div with ring and shadow to prevent oval distortion) */}
        <div
          className="absolute w-2.5 h-2.5 rounded-full pointer-events-none transition-all duration-150 -translate-x-1/2 -translate-y-1/2 shadow-xs ring-2 ring-white dark:ring-neutral-n800 z-10"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.y / height) * 100}%`,
            backgroundColor: theme.dot,
          }}
        />

        {/* Hover overlay targets for tooltip interaction */}
        <div className="absolute inset-0 flex z-20">
          {svgPoints.map((pt, idx) => (
            <div
              key={idx}
              className="flex-1 h-full cursor-crosshair"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              title={`${pt.raw.time ? `${pt.raw.time}: ` : ''}${pt.raw.value} ${unit}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
