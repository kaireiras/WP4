import { cn } from '#/lib/utils'

export interface AutoRefreshCountdownProps {
  seconds: number
  totalSeconds?: number
  label?: string
  className?: string
}

export function AutoRefreshCountdown({
  seconds,
  totalSeconds = 30,
  label = 'auto-refresh',
  className,
}: AutoRefreshCountdownProps) {
  const radius = 8
  const circumference = 2 * Math.PI * radius
  const progressRatio = Math.max(0, Math.min(1, seconds / totalSeconds))
  const strokeDashoffset = (1 - progressRatio) * circumference

  return (
    <div
      className={cn(
        'h-[38px] px-3.5 rounded-2xl bg-white dark:bg-neutral-n800 border border-slate-200/90 dark:border-neutral-n700 flex items-center shadow-2xs select-none transition-colors',
        className,
      )}
      title={`Otomatis memuat ulang data dalam ${seconds} detik`}
      aria-label={`Otomatis memuat ulang data dalam ${seconds} detik`}
    >
      {/* Circular Progress Ring */}
      <svg
        className="size-5 -rotate-90 shrink-0"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          strokeWidth="2.5"
          className="stroke-slate-200/90 dark:stroke-neutral-700"
        />
        <circle
          cx="10"
          cy="10"
          r={radius}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="stroke-[#503cf6] transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Countdown Number */}
      <span className="text-sm font-medium text-slate-700 dark:text-neutral-200 tabular-nums ml-2.5">
        {seconds}s
      </span>

      {/* Auto-Refresh Label */}
      {label && (
        <span className="text-sm font-normal text-slate-400 dark:text-neutral-400 ml-2">
          {label}
        </span>
      )}
    </div>
  )
}
