import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { DashboardHeader, DashboardHeaderActions } from '#/components/ui'
import { DENAH_ROOMS, Denah } from '#/components/ui/denah'
import type { StatusLevelType } from '#/components/ui/status-level'
import { DashboardAlert, RoomDetailDialog } from '#/components/pages/dashboard'
import { normalizeOccupancyLevel } from '#/services/alertService'
import { getDashboardOverview } from '#/services/dashboardService'

export const Route = createFileRoute('/_dashboard/dashboard')({
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery({
      queryKey: ['dashboard-overview'],
      queryFn: () => getDashboardOverview(),
    })
  },
  component: DashboardPage,
})

function DashboardPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(true)

  const getDashboardOverviewFn = useServerFn(getDashboardOverview)

  // Fetch Overview
  const overviewQuery = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => getDashboardOverviewFn(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  })

  const overviewRooms = useMemo(() => {
    return overviewQuery.data?.data.rooms ?? []
  }, [overviewQuery.data])

  const roomStatuses = useMemo(() => {
    const statuses: Record<string, StatusLevelType | undefined> = {}
    overviewRooms.forEach((room) => {
      statuses[room.room_id] = normalizeOccupancyLevel(room.level)
    })
    return statuses
  }, [overviewRooms])

  const registeredApRoomIds = useMemo(() => {
    return overviewRooms.map((room) => room.room_id)
  }, [overviewRooms])

  const crowdedRooms = useMemo(() => {
    const crowdedSet = new Set<string>()
    const activeAlerts = overviewQuery.data?.data.active_alerts ?? []

    activeAlerts.forEach((alert) => {
      if (alert.level.toUpperCase() === 'CROWDED') {
        crowdedSet.add(alert.room_id ?? alert.ap_id)
      }
    })

    overviewRooms.forEach((room) => {
      if (room.level.toUpperCase() === 'CROWDED') {
        crowdedSet.add(room.room_id)
      }
    })

    return Array.from(crowdedSet)
  }, [overviewQuery.data, overviewRooms])

  const crowdedSignature = crowdedRooms.join(',')

  useEffect(() => {
    if (crowdedSignature.length > 0) {
      setIsAlertOpen(true)
    }
  }, [crowdedSignature])

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    if (
      DENAH_ROOMS.some((r) => r.id === roomId) ||
      registeredApRoomIds.includes(roomId)
    ) {
      setIsDialogOpen(true)
    }
  }

  return (
    <>
      {/* Alert Banner */}
      <DashboardAlert
        isOpen={isAlertOpen}
        crowdedRooms={crowdedRooms}
        onDismiss={() => setIsAlertOpen(false)}
      />

      {/* Header */}
      <DashboardHeader
        title="Dashboard"
        subtitle="Lihat keadaan seluruh ruangan"
        actions={
          <DashboardHeaderActions
            showCountdown={true}
            showTimeRange={false}
            onRefresh={() => overviewQuery.refetch()}
            isRefreshing={overviewQuery.isFetching}
            lastUpdatedAt={overviewQuery.dataUpdatedAt}
          />
        }
      />

      {/* Denah */}
      <Denah
        selectedRoom={selectedRoomId ?? undefined}
        onSelectRoom={handleSelectRoom}
        roomStatuses={roomStatuses}
        showKosong={true}
      />

      {/* Room Detail Dialog */}
      <RoomDetailDialog
        roomId={selectedRoomId}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        registeredApRoomIds={registeredApRoomIds}
      />
    </>
  )
}
