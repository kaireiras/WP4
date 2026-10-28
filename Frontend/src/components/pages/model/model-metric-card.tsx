import type * as React from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import type {
  MetricCardVariant,
  MetricColor,
  ModelMetricItem,
} from './model-data'
import { cn } from '#/lib/utils'

interface ColorStyles {
  bar: string
  text: string
  badge: string
  ring: string
  tintBg?: string
  tintBorder?: string
  accentIcon?: string
}

interface VariantCardProps extends React.HTMLAttributes<HTMLDivElement> {
  metric: ModelMetricItem
  colorStyles: ColorStyles
  deltaBadge: React.ReactNode
}

// 1. Skema Warna Terpusat (Map dictionary)
const COLOR_SCHEMES: Record<MetricColor, ColorStyles> = {
  primary: {
    bar: 'bg-primary-600 dark:bg-primary-500',
    text: 'text-primary-600 dark:text-primary-400',
    badge:
      'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
    ring: 'stroke-primary-600 dark:stroke-primary-500',
    tintBg:
      'bg-linear-to-b from-primary-50/50 via-white to-white dark:from-primary-950/20 dark:via-neutral-n800 dark:to-neutral-n800',
    tintBorder: 'border-primary-200 dark:border-primary-800/60',
    accentIcon: 'text-primary-500 dark:text-primary-400',
  },
  success: {
    bar: 'bg-emerald-500 dark:bg-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    ring: 'stroke-emerald-500 dark:stroke-emerald-400',
    tintBg:
      'bg-linear-to-b from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:via-neutral-n800 dark:to-neutral-n800',
    tintBorder: 'border-emerald-200 dark:border-emerald-900/60',
    accentIcon: 'text-emerald-500 dark:text-emerald-400',
  },
  indigo: {
    bar: 'bg-indigo-600 dark:bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    badge:
      'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    ring: 'stroke-indigo-600 dark:stroke-indigo-500',
    tintBg:
      'bg-linear-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-neutral-n800 dark:to-neutral-n800',
    tintBorder: 'border-indigo-200 dark:border-indigo-900/60',
    accentIcon: 'text-indigo-500 dark:text-indigo-400',
  },
  amber: {
    bar: 'bg-amber-500 dark:bg-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    badge:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    ring: 'stroke-amber-500 dark:stroke-amber-400',
    tintBg:
      'bg-linear-to-b from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-neutral-n800 dark:to-neutral-n800',
    tintBorder: 'border-amber-200 dark:border-amber-900/60',
    accentIcon: 'text-amber-500 dark:text-amber-400',
  },
  teal: {
    bar: 'bg-teal-500 dark:bg-teal-400',
    text: 'text-teal-600 dark:text-teal-400',
    badge:
      'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    ring: 'stroke-teal-500 dark:stroke-teal-400',
    tintBg:
      'bg-linear-to-b from-teal-50/50 via-white to-white dark:from-teal-950/20 dark:via-neutral-n800 dark:to-neutral-n800',
    tintBorder: 'border-teal-200 dark:border-teal-900/60',
    accentIcon: 'text-teal-500 dark:text-teal-400',
  },
  purple: {
    bar: 'bg-purple-600 dark:bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    badge:
      'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    ring: 'stroke-purple-600 dark:stroke-purple-500',
    tintBg:
      'bg-linear-to-b from-purple-50/50 via-white to-white dark:from-purple-950/20 dark:via-neutral-n800 dark:to-neutral-n800',
    tintBorder: 'border-purple-200 dark:border-purple-900/60',
    accentIcon: 'text-purple-500 dark:text-purple-400',
  },
  rose: {
    bar: 'bg-rose-500 dark:bg-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
    badge:
      'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    ring: 'stroke-rose-500 dark:stroke-rose-400',
    tintBg:
      'bg-linear-to-b from-rose-50/50 via-white to-white dark:from-rose-950/20 dark:via-neutral-n800 dark:to-neutral-n800',
    tintBorder: 'border-rose-200 dark:border-rose-900/60',
    accentIcon: 'text-rose-500 dark:text-rose-400',
  },
  cyan: {
    bar: 'bg-cyan-500 dark:bg-cyan-400',
    text: 'text-cyan-600 dark:text-cyan-400',
    badge:
      'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    ring: 'stroke-cyan-500 dark:stroke-cyan-400',
    tintBg:
      'bg-linear-to-b from-cyan-50/50 via-white to-white dark:from-cyan-950/20 dark:via-neutral-n800 dark:to-neutral-n800',
    tintBorder: 'border-cyan-200 dark:border-cyan-900/60',
    accentIcon: 'text-cyan-500 dark:text-cyan-400',
  },
}

// Map konfigurasi badge tren berdasarkan kategori metrik
const CATEGORY_DELTA_CONFIG: Record<
  ModelMetricItem['category'],
  {
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  regression: {
    icon: ArrowDownRight,
  },
  classification: {
    icon: ArrowUpRight,
  },
}

// Variasi 1: Radial / Circular Gauge Meter (Accuracy)
function RadialMetricCard({
  metric,
  colorStyles,
  deltaBadge,
  className,
  ...props
}: VariantCardProps) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset =
    circumference - (metric.progress / 100) * circumference

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-2xl p-5',
        'hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between',
        className,
      )}
      {...props}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              {metric.label}
            </span>
            <span
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-help transition-colors"
              title={metric.description}
            >
              <HelpCircle className="size-3.5" />
            </span>
          </div>
          {deltaBadge}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold font-sans text-neutral-900 dark:text-neutral-50 tracking-tight block">
              {metric.value}
            </span>
            {metric.subtitle && (
              <span
                className={cn(
                  'text-xs font-medium mt-1 block',
                  colorStyles.text,
                )}
              >
                {metric.subtitle}
              </span>
            )}
          </div>

          <div className="relative size-16 shrink-0 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r={radius}
                className="stroke-neutral-n20 dark:stroke-neutral-n700 fill-none"
                strokeWidth="5"
              />
              <circle
                cx="30"
                cy="30"
                r={radius}
                className={cn(
                  'fill-none transition-all duration-1000 ease-out',
                  colorStyles.ring,
                )}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
              {Math.round(metric.progress)}%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-n20 dark:border-neutral-n700/80">
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2">
          {metric.description}
        </p>
      </div>
    </div>
  )
}

// Variasi 2: Highlight Tinted Card (F1-Score)
function HighlightMetricCard({
  metric,
  colorStyles,
  deltaBadge,
  className,
  ...props
}: VariantCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-neutral-n800 border-2 rounded-2xl p-5',
        colorStyles.tintBorder ?? 'border-indigo-200 dark:border-indigo-900/60',
        colorStyles.tintBg ??
          'bg-linear-to-b from-indigo-50/40 via-white to-white dark:from-indigo-950/20 dark:via-neutral-n800 dark:to-neutral-n800',
        'hover:shadow-md transition-all duration-200 flex flex-col justify-between',
        className,
      )}
      {...props}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Sparkles
                className={cn(
                  'size-3.5',
                  colorStyles.accentIcon ?? 'text-indigo-500',
                )}
              />
              {metric.label}
            </span>
            <span
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-help transition-colors"
              title={metric.description}
            >
              <HelpCircle className="size-3.5" />
            </span>
          </div>
          {deltaBadge}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold font-sans text-neutral-900 dark:text-neutral-50 tracking-tight">
            {metric.value}
          </span>
          {metric.subtitle && (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {metric.subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-n20 dark:border-neutral-n700/80 space-y-2">
        <div className="w-full bg-neutral-n20 dark:bg-neutral-n700 h-2 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              colorStyles.bar,
            )}
            style={{ width: `${metric.progress}%` }}
          />
        </div>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2">
          {metric.description}
        </p>
      </div>
    </div>
  )
}

// Variasi 3: Compact Calibration Error Display (MAE & RMSE)
function CompactMetricCard({
  metric,
  colorStyles,
  deltaBadge,
  className,
  ...props
}: VariantCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-2xl p-5',
        'hover:border-primary-300 dark:hover:border-primary-700/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between',
        className,
      )}
      {...props}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              {metric.label}
            </span>
            <span
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-help transition-colors"
              title={metric.description}
            >
              <HelpCircle className="size-3.5" />
            </span>
          </div>
          {deltaBadge}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold font-sans text-neutral-900 dark:text-neutral-50 tracking-tight">
            {metric.value}
          </span>
          {metric.unit && (
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {metric.unit}
            </span>
          )}
        </div>

        {metric.subtitle && (
          <div
            className={cn(
              'mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium',
              colorStyles.text,
            )}
          >
            <CheckCircle2 className="size-3" />
            {metric.subtitle}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-n20 dark:border-neutral-n700/80 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Toleransi Error</span>
          <span className={cn('font-semibold', colorStyles.text)}>
            Optimal &lt; 4.0
          </span>
        </div>
        <div className="w-full bg-neutral-n20 dark:bg-neutral-n700 h-2 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              colorStyles.bar,
            )}
            style={{ width: `${metric.progress}%` }}
          />
        </div>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2 pt-0.5">
          {metric.description}
        </p>
      </div>
    </div>
  )
}

// Variasi 4: Standard Linear Progress Bar (Precision, Recall)
function BarMetricCard({
  metric,
  colorStyles,
  deltaBadge,
  className,
  ...props
}: VariantCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-2xl p-5',
        'hover:border-primary-300 dark:hover:border-primary-700/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between',
        className,
      )}
      {...props}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              {metric.label}
            </span>
            <span
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-help transition-colors"
              title={metric.description}
            >
              <HelpCircle className="size-3.5" />
            </span>
          </div>
          {deltaBadge}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold font-sans text-neutral-900 dark:text-neutral-50 tracking-tight">
            {metric.value}
          </span>
          {metric.subtitle && (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {metric.subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-n20 dark:border-neutral-n700/80 space-y-2">
        <div className="w-full bg-neutral-n20 dark:bg-neutral-n700 h-2 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              colorStyles.bar,
            )}
            style={{ width: `${metric.progress}%` }}
          />
        </div>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2">
          {metric.description}
        </p>
      </div>
    </div>
  )
}

// 2. Map Dictionary Komponen Variasi "{}" (Tanpa If-Else)
const VARIANT_COMPONENTS: Record<
  MetricCardVariant,
  React.ComponentType<VariantCardProps>
> = {
  radial: RadialMetricCard,
  highlight: HighlightMetricCard,
  compact: CompactMetricCard,
  bar: BarMetricCard,
}

export interface ModelMetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  metric: ModelMetricItem
  variant?: MetricCardVariant
  color?: MetricColor
}

export function ModelMetricCard({
  metric,
  variant = metric.variant ?? 'bar',
  color = metric.color ?? 'primary',
  className,
  ...props
}: ModelMetricCardProps) {
  const colorStyles = COLOR_SCHEMES[color]
  const deltaConfig = CATEGORY_DELTA_CONFIG[metric.category]
  const DeltaIcon = deltaConfig.icon
  const deltaBadgeClass = colorStyles.badge

  // Render delta badge dengan konfigurasi map dictionary
  const deltaBadge = metric.delta ? (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border',
        deltaBadgeClass,
      )}
    >
      <DeltaIcon className="size-3 shrink-0" />
      {metric.delta}
    </span>
  ) : null

  // Pemanggilan komponen langsung dari list dictionary "{}" tanpa percabangan if-else
  const CardComponent = VARIANT_COMPONENTS[variant]

  return (
    <CardComponent
      metric={metric}
      colorStyles={colorStyles}
      deltaBadge={deltaBadge}
      className={className}
      {...props}
    />
  )
}
