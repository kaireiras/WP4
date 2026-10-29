import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { AlertCircle, RefreshCw, Users, Wifi } from 'lucide-react'
import { DashboardHeader, DashboardHeaderActions } from '#/components/ui'
import { DENAH_ROOMS, Denah } from '#/components/ui/denah'
import { StatusLevel } from '#/components/ui/status-level'
import type { StatusLevelType } from '#/components/ui/status-level'
import { DashboardAlert, RoomDetailDialog } from '#/components/pages/dashboard'
import {
  normalizeOccupancyLevel,
  resolveRoomDisplayLocation,
} from '#/services/alertService'
import {
  formatConfidencePercent,
  getDashboardOverview,
} from '#/services/dashboardService'
import { cn } from '#/lib/utils'

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

      {/* Error State */}
      {overviewQuery.isError && (
        <div className="w-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="size-4 shrink-0" />
            <span className="font-medium truncate">
              {overviewQuery.error instanceof Error
                ? overviewQuery.error.message
                : 'Gagal memuat data overview dashboard.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => overviewQuery.refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Monitored AP Rooms */}
      {overviewRooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {overviewRooms.map((room) => {
            const level = normalizeOccupancyLevel(room.level)
            const location = resolveRoomDisplayLocation(room.room_id)
            const isSelected = selectedRoomId === room.room_id && isDialogOpen

            return (
              <button
                key={room.room_id}
                type="button"
                onClick={() => handleSelectRoom(room.room_id)}
                className={cn(
                  'bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-xl p-3.5 shadow-2xs hover:border-primary-400 dark:hover:border-primary-500 transition-all text-left flex items-center justify-between gap-3 cursor-pointer',
                  isSelected && 'ring-2 ring-primary-500 border-primary-500',
                )}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-n900 dark:text-neutral-n100">
                      {room.room_id}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-n20 dark:bg-neutral-n700 text-[11px] font-semibold text-neutral-n600 dark:text-neutral-n300">
                      <Wifi className="size-3 text-primary-500" />
                      <span>{room.ap_id}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {location.fullLabel}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-neutral-n700 dark:text-neutral-n300 pt-0.5">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Users className="size-3.5 text-neutral-n500" />
                      <span>~{room.estimated_count} orang</span>
                    </span>
                    <span className="text-neutral-n400">•</span>
                    <span className="text-[11px] text-muted-foreground">
                      Akurasi {formatConfidencePercent(room.confidence)}
                    </span>
                  </div>
                </div>

                <StatusLevel status={level} size="sm" className="shrink-0" />
              </button>
            )
          })}
        </div>
      )}

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
