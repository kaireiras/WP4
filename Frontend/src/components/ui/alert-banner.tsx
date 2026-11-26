import * as React from 'react'
import { AlertCircle, X } from 'lucide-react'
import { cn } from '#/lib/utils'

export interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  crowdedRooms?: string[]
  onDismiss?: () => void
  showDismiss?: boolean
}

export function AlertBanner({
  message,
  crowdedRooms = ['CU205', 'CU207', 'HU206', 'HU207', 'HU209'],
  onDismiss,
  showDismiss = true,
  className,
  ...props
}: AlertBannerProps) {
  const defaultMessage =
    crowdedRooms.length > 0
      ? `CROWDED terdeteksi di ${crowdedRooms.length} ruangan: ${crowdedRooms.join(', ')}`
      : 'Perhatian: Lonjakan kepadatan ruangan terdeteksi'

  return (
    <div
      role="alert"
      className={cn(
        'w-full bg-destructive-60 text-white min-h-[48px] px-4 py-2 flex items-center justify-between gap-4 rounded-lg shadow-sm transition-all',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-6 h-6 rounded-full bg-white text-destructive-60 flex items-center justify-center shrink-0 font-bold text-xs">
          <AlertCircle className="w-4 h-4 fill-destructive-60 text-white" />
        </div>
        <p className="text-small-medium truncate">
          {message ?? defaultMessage}
        </p>
      </div>

      {showDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-destructive-50 hover:bg-destructive-70 text-white text-tiny-semibold transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Tutup</span>
        </button>
      )}
    </div>
  )
}
