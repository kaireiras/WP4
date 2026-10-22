import * as React from 'react'
import { RotateCw } from 'lucide-react'
import { AutoRefreshCountdown } from './auto-refresh-countdown'
import { TimeRangePicker } from './time-range-picker'
import type { TimeRangeValue } from './time-range-picker'
import { cn } from '#/lib/utils'

export interface DashboardHeaderActionsProps {
  /** Callback saat tombol refresh ditekan atau hitung mundur mencapai 0 */
  onRefresh?: () => void
  /** Status apakah query sedang memuat ulang data */
  isRefreshing?: boolean
  /** Timestamp waktu terakhir data diperbarui (untuk me-reset hitung mundur otomatis) */
  lastUpdatedAt?: number
  /** Total durasi hitung mundur dalam detik (default: 30) */
  totalSeconds?: number
  /** Nilai detik hitung mundur secara manual/controlled (opsional) */
  seconds?: number
  /** Preset rentang waktu aktif (default: '1d') */
  timeRange?: string
  /** Callback saat rentang waktu diubah dari TimeRangePicker */
  onTimeRangeChange?: (value: TimeRangeValue) => void
  /** Apakah menampilkan TimeRangePicker dropdown (default: true) */
  showTimeRange?: boolean
  /** Apakah menampilkan countdown ring (default: true) */
  showCountdown?: boolean
  /** Label untuk countdown pill (default: 'auto-refresh') */
  countdownLabel?: string
  /** ClassName kustom untuk wrapper */
  className?: string
}

export function DashboardHeaderActions({
  onRefresh,
  isRefreshing = false,
  lastUpdatedAt,
  totalSeconds = 30,
  seconds: controlledSeconds,
  timeRange = '1d',
  onTimeRangeChange,
  showTimeRange = true,
  showCountdown = true,
  countdownLabel = 'auto-refresh',
  className,
}: DashboardHeaderActionsProps) {
  const [internalSeconds, setInternalSeconds] = React.useState(totalSeconds)

  const isControlled = controlledSeconds !== undefined
  const seconds = isControlled ? controlledSeconds : internalSeconds

  // Hitung mundur otomatis internal jika tidak di-control dari parent
  React.useEffect(() => {
    if (isControlled) return

    const timer = setInterval(() => {
      setInternalSeconds((prev) => {
        if (prev <= 1) {
          onRefresh?.()
          return totalSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isControlled, onRefresh, totalSeconds])

  // Reset hitung mundur saat data sukses diperbarui
  React.useEffect(() => {
    if (!isControlled && lastUpdatedAt !== undefined) {
      setInternalSeconds(totalSeconds)
    }
  }, [isControlled, lastUpdatedAt, totalSeconds])

  const handleRefreshClick = () => {
    if (!isControlled) {
      setInternalSeconds(totalSeconds)
    }
    onRefresh?.()
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 flex-wrap sm:flex-nowrap',
        className,
      )}
    >
      {/* 1. Auto-Refresh Countdown Ring & Label */}
      {showCountdown && (
        <AutoRefreshCountdown
          seconds={seconds}
          totalSeconds={totalSeconds}
          label={countdownLabel}
        />
      )}

      {/* 2. Manual Refresh Button */}
      <button
        type="button"
        onClick={handleRefreshClick}
        disabled={isRefreshing}
        className="h-[38px] px-4 bg-[#503cf6] hover:bg-[#4332d9] active:scale-95 text-white rounded-2xl flex items-center gap-2 shadow-sm shadow-[#503cf6]/25 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed font-medium text-xs sm:text-sm select-none"
        title="Muat ulang data sekarang"
        aria-label="Muat ulang data"
      >
        <RotateCw
          className={cn(
            'size-3.5 sm:size-4 shrink-0 transition-transform',
            isRefreshing && 'animate-spin',
          )}
        />
        <span>Refresh</span>
      </button>

      {/* 3. Time Range Picker Dropdown */}
      {showTimeRange && (
        <TimeRangePicker value={timeRange} onChange={onTimeRangeChange} />
      )}
    </div>
  )
}
