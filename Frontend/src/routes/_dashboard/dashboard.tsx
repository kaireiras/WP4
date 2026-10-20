import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Denah, DENAH_ROOMS } from '#/components/ui/denah'
import {
  DashboardHeader,
  DashboardAlert,
  RoomDetailDialog,
  DASHBOARD_ROOM_STATUSES,
} from '#/components/pages/dashboard'

export const Route = createFileRoute('/_dashboard/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(true)

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    // Buka popup dialog jika yang diklik adalah ruangan (bukan area void/kosong)
    if (DENAH_ROOMS.some((r) => r.id === roomId)) {
      setIsDialogOpen(true)
    }
  }

  return (
    <>
      {/* 1. Alert Banner for Crowded Rooms (Figma 13:69 -> AlertBanner) */}
      <DashboardAlert
        isOpen={isAlertOpen}
        onDismiss={() => setIsAlertOpen(false)}
      />

      {/* 2. Main Page Header (Figma 13:69 -> Main-Header) */}
      <DashboardHeader
        title="Dashboard"
        subtitle="Lihat keadaan seluruh ruangan"
      />

      {/* 3. Interactive Floor Plan (Figma 13:69 -> Denah) */}
      <div className="w-full bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-2xl p-4 md:p-6 shadow-sm">
        <Denah
          selectedRoom={selectedRoomId ?? undefined}
          onSelectRoom={handleSelectRoom}
          roomStatuses={DASHBOARD_ROOM_STATUSES}
          showKosong={true}
        />
      </div>

      {/* 4. Centered Dialog Popup displaying MetricsGrid when a room is clicked */}
      <RoomDetailDialog
        roomId={selectedRoomId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  )
}
