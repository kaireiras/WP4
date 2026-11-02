import { AlertBanner } from '#/components/ui/alert-banner'

export interface DashboardAlertProps {
  isOpen?: boolean
  crowdedRooms?: Array<string>
  onDismiss?: () => void
}

export function DashboardAlert({
  isOpen = true,
  crowdedRooms = [],
  onDismiss,
}: DashboardAlertProps) {
  if (!isOpen || crowdedRooms.length === 0) return null

  return (
    <div className="w-full transition-all duration-300">
      <AlertBanner
        crowdedRooms={crowdedRooms}
        onDismiss={onDismiss}
        showDismiss={true}
      />
    </div>
  )
}
