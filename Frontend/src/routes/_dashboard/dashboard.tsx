import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DashboardHeader } from '#/components/ui/dashboard-header'
import { Denah, DENAH_ROOMS } from '#/components/ui/denah'
import {
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
    if (DENAH_ROOMS.some((r) => r.id === roomId)) {
      setIsDialogOpen(true)
    }
  }

  return (
    <>
      {/* Alert Banner */}
      <DashboardAlert
        isOpen={isAlertOpen}
        onDismiss={() => setIsAlertOpen(false)}
      />

      {/* Header */}
      <DashboardHeader
        title="Dashboard"
        subtitle="Lihat keadaan seluruh ruangan"
      />

      {/* Denah */}
      <Denah
        selectedRoom={selectedRoomId ?? undefined}
        onSelectRoom={handleSelectRoom}
        roomStatuses={DASHBOARD_ROOM_STATUSES}
        showKosong={true}
      />

      {/* Room Detail Dialog */}
      <RoomDetailDialog
        roomId={selectedRoomId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  )
}
