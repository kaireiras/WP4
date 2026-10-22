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
  const radius = 7
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
      {/* Circular Progress Ring matching user design */}
      <svg
        className="size-[18px] -rotate-90 shrink-0"
        viewBox="0 0 18 18"
        aria-hidden="true"
      >
        <circle
          cx="9"
          cy="9"
          r={radius}
          fill="none"
          strokeWidth="2.4"
          className="stroke-slate-200 dark:stroke-neutral-700"
        />
        <circle
          cx="9"
          cy="9"
          r={radius}
          fill="none"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="stroke-[#503cf6] transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Countdown Number */}
      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-neutral-200 tabular-nums ml-2">
        {seconds}s
      </span>

      {/* Auto-Refresh Label */}
      {label && (
        <span className="text-xs font-normal text-slate-400 dark:text-neutral-400 ml-1.5">
          {label}
        </span>
      )}
    </div>
  )
}
