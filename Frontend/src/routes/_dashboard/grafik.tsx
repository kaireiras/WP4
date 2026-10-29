import { useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react'
import { z } from 'zod'
import { DashboardHeader, DashboardHeaderActions } from '#/components/ui'
import type { TimeRangeValue } from '#/components/ui'
import { calculatePresetRange } from '#/components/ui/time-range-picker'
import {
  ActiveClientsCard,
  GrafikCardsSkeleton,
  OccupancyTimelineCard,
  TrafficTrendCard,
} from '#/components/pages/grafik'
import { getDashboardOverview } from '#/services/dashboardService'
import {
  getHistoryChart,
  mapHistoryRecordsToGrafikData,
} from '#/services/historyService'

// Search Params Schema
const grafikSearchSchema = z.object({
  room: z.string().catch('all'),
  range: z.string().catch('today'),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().positive().max(1000).catch(100),
})

export const Route = createFileRoute('/_dashboard/grafik')({
  validateSearch: (search: Record<string, unknown>) => {
    return grafikSearchSchema.parse({
      ...search,
      room: (typeof search.room === 'string' && search.room) || 'all',
      range: (typeof search.range === 'string' && search.range) || 'today',
    })
  },
  loaderDeps: ({ search }) => ({
    room: search.room,
    range: search.range,
    from: search.from,
    to: search.to,
    limit: search.limit,
  }),
  loader: async ({ context, deps }) => {
    const bounds =
      deps.from && deps.to
        ? { from: deps.from, to: deps.to }
        : calculatePresetRange(deps.range)

    await context.queryClient.prefetchQuery({
      queryKey: [
        'history-grafik',
        {
          room: deps.room,
          range: deps.range,
          from: deps.from,
          to: deps.to,
          limit: deps.limit,
        },
      ],
      queryFn: () =>
        getHistoryChart({
          data: {
            params: {
              room_id: deps.room === 'all' ? undefined : deps.room,
              start: bounds.from,
              end: bounds.to,
              limit: deps.limit,
            },
          },
        }),
    })
  },
  component: GrafikPage,
})

function GrafikPage() {
  const navigate = useNavigate()
  const { room, range, from, to, limit } = Route.useSearch()

  const getHistoryChartFn = useServerFn(getHistoryChart)
  const getDashboardOverviewFn = useServerFn(getDashboardOverview)

  // Fetch History Data
  const historyQuery = useQuery({
    queryKey: ['history-grafik', { room, range, from, to, limit }],
    queryFn: () => {
      const bounds = from && to ? { from, to } : calculatePresetRange(range)

      return getHistoryChartFn({
        data: {
          params: {
            room_id: room === 'all' ? undefined : room,
            start: bounds.from,
            end: bounds.to,
            limit,
          },
        },
      })
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  })

  // Fetch Registered AP Rooms
  const overviewQuery = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => getDashboardOverviewFn(),
    staleTime: 30000,
  })

  const extraRooms = useMemo(() => {
    return (overviewQuery.data?.data.rooms ?? []).map((item) => item.room_id)
  }, [overviewQuery.data])

  const rawRecords = historyQuery.data?.data ?? []

  const chartData = useMemo(() => {
    return mapHistoryRecordsToGrafikData(rawRecords)
  }, [rawRecords])

  const handleRoomChange = (newRoom: string) => {
    navigate({
      to: '/grafik',
      search: (prev) => ({
        ...prev,
        room: newRoom,
        range: prev.range ?? range,
        limit: prev.limit ?? limit,
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
        limit: prev.limit ?? limit,
      }),
      replace: true,
    })
  }

  return (
    <>
      {/* Header */}
      <DashboardHeader
        title="Grafik"
        subtitle="Analisis tren trafik dan okupansi dalam rentang waktu tertentu"
        actions={
          <DashboardHeaderActions
            showCountdown={true}
            onRefresh={() => historyQuery.refetch()}
            isRefreshing={historyQuery.isFetching}
            lastUpdatedAt={historyQuery.dataUpdatedAt}
            showRoomPicker={true}
            selectedRoom={room}
            onRoomChange={handleRoomChange}
            extraRooms={extraRooms}
            timeRange={range}
            timeFrom={from}
            timeTo={to}
            onTimeRangeChange={handleTimeRangeChange}
          />
        }
      />

      {/* Main Content */}
      {historyQuery.isLoading ? (
        <GrafikCardsSkeleton />
      ) : historyQuery.isError ? (
        <div className="bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-xl p-10 shadow-xs flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-neutral-n900 dark:text-neutral-n100">
              Gagal memuat data riwayat grafik
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              {historyQuery.error instanceof Error
                ? historyQuery.error.message
                : 'Terjadi gangguan koneksi ke server API.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => historyQuery.refetch()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : rawRecords.length === 0 ? (
        <div className="bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-xl p-10 shadow-xs flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-10 rounded-full bg-neutral-n20 dark:bg-neutral-n700 text-neutral-n500 dark:text-neutral-n300 flex items-center justify-center">
            <BarChart3 className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-neutral-n900 dark:text-neutral-n100">
              Belum ada data riwayat grafik
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              Tidak ditemukan data trafik maupun okupansi untuk filter ruangan{' '}
              <strong>{room === 'all' ? 'Semua Ruangan' : room}</strong> pada
              rentang waktu yang dipilih.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Traffic Trend */}
          <TrafficTrendCard data={chartData.traffic} />

          {/* Active Clients */}
          <ActiveClientsCard data={chartData.clients} />

          {/* Occupancy Timeline */}
          <OccupancyTimelineCard data={chartData.occupancy} />
        </div>
      )}
    </>
  )
}
