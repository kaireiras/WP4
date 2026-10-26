import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { DashboardHeader, DashboardHeaderActions } from '#/components/ui'
import type { TimeRangeValue } from '#/components/ui'
import {
  ActiveClientsCard,
  GrafikCardsSkeleton,
  OccupancyTimelineCard,
  TrafficTrendCard,
  generateGrafikData,
} from '#/components/pages/grafik'

// ─── Search Params Schema ─────────────────────────────────────────────────────
const grafikSearchSchema = z.object({
  room: z.string().catch('all'),
  range: z.string().catch('1d'),
  from: z.string().optional(),
  to: z.string().optional(),
})

export const Route = createFileRoute('/_dashboard/grafik')({
  validateSearch: (search: Record<string, unknown>) => {
    return grafikSearchSchema.parse({
      ...search,
      room: (typeof search.room === 'string' && search.room) || 'all',
      range: (typeof search.range === 'string' && search.range) || '1d',
    })
  },
  component: GrafikPage,
})

function GrafikPage() {
  const navigate = useNavigate()
  const { room, range, from, to } = Route.useSearch()

  // ─── TanStack Query Integration with 30s Auto-Refetch ──────────────────────
  const grafikQuery = useQuery({
    queryKey: ['grafik-analytics', { room, range, from, to }],
    queryFn: async () => {
      // Simulasi latency fetch data
      await new Promise((resolve) => setTimeout(resolve, 500))
      return generateGrafikData(room, range)
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  })

  const handleRoomChange = (newRoom: string) => {
    navigate({
      to: '/grafik',
      search: (prev) => ({
        ...prev,
        room: newRoom,
        range: prev.range ?? range,
      }),
      replace: true,
    })
  }

  const handleTimeRangeChange = (val: TimeRangeValue) => {
    navigate({
      to: '/grafik',
      search: (prev) => ({
        ...prev,
        range: val.id,
        from: val.from,
        to: val.to,
        room: prev.room ?? room,
      }),
      replace: true,
    })
  }

  return (
    <>
      {/* 1. Page Header (Figma Main-Header 66:8651) with Actions */}
      <DashboardHeader
        title="Grafik"
        subtitle="Analisis tren trafik dan okupansi dalam rentang waktu tertentu"
        actions={
          <DashboardHeaderActions
            showCountdown={true}
            onRefresh={() => grafikQuery.refetch()}
            isRefreshing={grafikQuery.isFetching}
            lastUpdatedAt={grafikQuery.dataUpdatedAt}
            showRoomPicker={true}
            selectedRoom={room}
            onRoomChange={handleRoomChange}
            timeRange={range}
            onTimeRangeChange={handleTimeRangeChange}
          />
        }
      />

      {/* 2. Main Analytics Data Area (Figma 66:8655) */}
      {grafikQuery.isLoading || !grafikQuery.data ? (
        <GrafikCardsSkeleton />
      ) : (
        <div className="space-y-5">
          {/* Card 1: Traffic Trend (Figma 91:2355) */}
          <TrafficTrendCard data={grafikQuery.data.traffic} />

          {/* Card 2: Active Clients (Figma 135:1325) */}
          <ActiveClientsCard data={grafikQuery.data.clients} />

          {/* Card 3: Occupancy Timeline (Figma 82:1064) */}
          <OccupancyTimelineCard data={grafikQuery.data.occupancy} />
        </div>
      )}
    </>
  )
}
