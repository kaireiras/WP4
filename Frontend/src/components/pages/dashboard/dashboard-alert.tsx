import { AlertBanner } from '#/components/ui/alert-banner'
import { CROWDED_ROOM_IDS } from './dashboard-data'

export interface DashboardAlertProps {
  isOpen?: boolean
  onDismiss?: () => void
}

export function DashboardAlert({
  isOpen = true,
  onDismiss,
}: DashboardAlertProps) {
  if (!isOpen) return null

  return (
    <div className="w-full transition-all duration-300">
      <AlertBanner
        crowdedRooms={[...CROWDED_ROOM_IDS]}
        onDismiss={onDismiss}
        showDismiss={true}
      />
    </div>
  )
}
