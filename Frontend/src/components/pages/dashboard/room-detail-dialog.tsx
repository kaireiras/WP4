import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import {
  AlertCircle,
  Building2,
  Info,
  MapPin,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/shadcn/dialog'
import { Skeleton } from '#/components/ui/shadcn/skeleton'
import { MetricsGrid } from '#/components/ui/metrics-grid'
import type { MetricItem } from '#/components/ui/metrics-grid'
import type { TrendPoint } from '#/components/ui/metric-card'
import { isMonitoredRoom } from '#/components/ui/denah'
import { cn } from '#/lib/utils'
import {
  extractApiTime,
  formatApiDateTime,
  normalizeOccupancyLevel,
  resolveRoomDisplayLocation,
} from '#/services/alertService'
import { getRoomLiveDetail } from '#/services/dashboardService'
import { getHistoryChart } from '#/services/historyService'

export interface RoomDetailDialogProps {
  roomId: string | null
  isOpen: boolean
  onClose: () => void
  registeredApRoomIds?: Array<string>
}

function splitFormattedRate(
  formatted: string,
  fallbackRawKbs: number,
): { value: string; unit: string } {
  const parts = formatted.trim().split(/\s+/)
  if (parts.length >= 2) {
    return {
      value: parts[0],
      unit: parts.slice(1).join(' '),
    }
  }
  return {
    value: String(fallbackRawKbs),
    unit: 'KB/s',
  }
}

function buildFlatTrend(val: number, time?: string): Array<TrendPoint> {
  return [
    { time, value: val },
    { time, value: val },
  ]
}

export function RoomDetailDialog({
  roomId,
  isOpen,
  onClose,
  registeredApRoomIds = [],
}: RoomDetailDialogProps) {
  const getRoomLiveFn = useServerFn(getRoomLiveDetail)
  const getHistoryChartFn = useServerFn(getHistoryChart)

  const canFetchLive = Boolean(
    isOpen &&
    roomId &&
    (isMonitoredRoom(roomId) || registeredApRoomIds.includes(roomId)),
  )

  const roomLiveQuery = useQuery({
    queryKey: ['room-live', roomId],
    queryFn: () => getRoomLiveFn({ data: { roomId: roomId ?? '' } }),
    enabled: canFetchLive,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    staleTime: 10000,
  })

  const roomHistoryQuery = useQuery({
    queryKey: ['room-live-history', roomId],
    queryFn: () =>
      getHistoryChartFn({
        data: {
          params: {
            room_id: roomId ?? undefined,
            limit: 8,
          },
        },
      }),
    enabled: canFetchLive,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    staleTime: 10000,
  })

  const liveResult = roomLiveQuery.data
  const liveData = liveResult?.success ? liveResult.data : null

  const metrics = useMemo<Array<MetricItem>>(() => {
    if (!liveData) return []

    const rxFormatted =
      liveData.metrics.rx_rate_formatted || liveData.metrics.rx_rate || '0 KB/s'
    const rxRawKbs = liveData.metrics.rx_rate_kbs
    const txFormatted =
      liveData.metrics.tx_rate_formatted || liveData.metrics.tx_rate || '0 KB/s'
    const txRawKbs = liveData.metrics.tx_rate_kbs

    const rx = splitFormattedRate(rxFormatted, rxRawKbs)
    const tx = splitFormattedRate(txFormatted, txRawKbs)
    const syncDateTime = formatApiDateTime(liveData.last_sync)
    const syncTime = extractApiTime(liveData.last_sync)

    const historyRecords = [...(roomHistoryQuery.data?.data ?? [])].sort(
      (a, b) => a.ts.localeCompare(b.ts),
    )
    const isRxMb = rx.unit.toUpperCase() === 'MB/S'
    const isTxMb = tx.unit.toUpperCase() === 'MB/S'

    const rxHistoryPoints: Array<TrendPoint> = historyRecords.map((item) => {
      const raw = Number(item.rx_rate_kbs ?? item.rx_rate ?? 0)
      const scaled = isRxMb
        ? Number((raw / 1024).toFixed(2))
        : Number(raw.toFixed(2))
      return {
        time: extractApiTime(item.ts),
        value: Number.isFinite(scaled) ? scaled : 0,
      }
    })

    const txHistoryPoints: Array<TrendPoint> = historyRecords.map((item) => {
      const raw = Number(item.tx_rate_kbs ?? item.tx_rate ?? 0)
      const scaled = isTxMb
        ? Number((raw / 1024).toFixed(2))
        : Number(raw.toFixed(2))
      return {
        time: extractApiTime(item.ts),
        value: Number.isFinite(scaled) ? scaled : 0,
      }
    })

    const ppsHistoryPoints: Array<TrendPoint> = historyRecords.map((item) => {
      const raw = Number(item.packets_per_sec ?? 0)
      return {
        time: extractApiTime(item.ts),
        value: Number.isFinite(raw) ? raw : 0,
      }
    })

    const retriesHistoryPoints: Array<TrendPoint> = historyRecords.map(
      (item) => {
        const raw = Number(item.tx_retries ?? 0)
        return {
          time: extractApiTime(item.ts),
          value: Number.isFinite(raw) ? raw : 0,
        }
      },
    )

    const clientsHistoryPoints: Array<TrendPoint> = historyRecords
      .filter((item) => (item.active_clients ?? item.n_clients) !== null)
      .map((item) => {
        const raw = Number(item.active_clients ?? item.n_clients)
        return {
          time: extractApiTime(item.ts),
          value: Number.isFinite(raw) ? raw : 0,
        }
      })

    const lastHistoryRecord = historyRecords.at(-1)
    const lastHistoryTs = lastHistoryRecord
      ? formatApiDateTime(lastHistoryRecord.ts)
      : null
    const hasNewerLiveSync = Boolean(
      syncDateTime && (!lastHistoryTs || syncDateTime > lastHistoryTs),
    )

    if (hasNewerLiveSync) {
      rxHistoryPoints.push({
        time: syncTime,
        value: Number(rx.value) || 0,
      })
      txHistoryPoints.push({
        time: syncTime,
        value: Number(tx.value) || 0,
      })
      ppsHistoryPoints.push({
        time: syncTime,
        value: liveData.metrics.packets_per_sec,
      })
      retriesHistoryPoints.push({
        time: syncTime,
        value: liveData.metrics.tx_retries,
      })
      clientsHistoryPoints.push({
        time: syncTime,
        value: liveData.metrics.active_clients,
      })
    }

    const rxTrend: Array<TrendPoint> =
      rxHistoryPoints.length >= 2
        ? rxHistoryPoints
        : buildFlatTrend(Number(rx.value) || 0, syncTime)

    const txTrend: Array<TrendPoint> =
      txHistoryPoints.length >= 2
        ? txHistoryPoints
        : buildFlatTrend(Number(tx.value) || 0, syncTime)

    const ppsTrend: Array<TrendPoint> =
      ppsHistoryPoints.length >= 2
        ? ppsHistoryPoints
        : buildFlatTrend(liveData.metrics.packets_per_sec, syncTime)

    const retriesTrend: Array<TrendPoint> =
      retriesHistoryPoints.length >= 2
        ? retriesHistoryPoints
        : buildFlatTrend(liveData.metrics.tx_retries, syncTime)

    const clientsTrend: Array<TrendPoint> =
      clientsHistoryPoints.length >= 2
        ? clientsHistoryPoints
        : buildFlatTrend(liveData.metrics.active_clients, syncTime)

    return [
      {
        label: 'RX Rate',
        value: rx.value,
        unit: rx.unit,
        color: 'blue',
        trend: rxTrend,
      },
      {
        label: 'TX Rate',
        value: tx.value,
        unit: tx.unit,
        color: 'teal',
        trend: txTrend,
      },
      {
        label: 'Packets/sec',
        value: liveData.metrics.packets_per_sec.toLocaleString('en-US'),
        unit: 'pps',
        color: 'purple',
        trend: ppsTrend,
      },
      {
        label: 'Active Clients',
        value: liveData.metrics.active_clients.toLocaleString('en-US'),
        unit: 'klien',
        color: 'rose',
        trend: clientsTrend,
      },
      {
        label: 'TX Retries',
        value: (liveData.metrics.tx_retries || 0).toLocaleString('en-US'),
        unit: 'retry',
        color: 'orange',
        trend: retriesTrend,
      },
    ]
  }, [liveData, roomHistoryQuery.data])

  if (!roomId) return null

  const location = resolveRoomDisplayLocation(roomId)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-neutral-n800 rounded-2xl shadow-xl border border-neutral-n30 dark:border-neutral-n700">
        <DialogHeader className="space-y-1 pb-2 border-b border-neutral-n30 dark:border-neutral-n700">
          <div className="flex items-center gap-2 text-tiny-semibold text-primary-600 dark:text-primary-400">
            <Building2 className="w-4 h-4" />
            <span>
              {location.buildingName} · {location.wingName}
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-neutral-n900 dark:text-neutral-n10 flex items-center gap-2.5 flex-wrap">
            <span>Ruangan {roomId}</span>
            {liveData?.ap_id && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 text-xs font-semibold text-primary-700 dark:text-primary-300">
                <Wifi className="size-3" />
                <span>{liveData.ap_id}</span>
              </span>
            )}
            {liveData?.ip_address && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-neutral-n20 dark:bg-neutral-n700 border border-neutral-n40 dark:border-neutral-n600 text-xs font-medium text-neutral-n600 dark:text-neutral-n200">
                {liveData.ip_address}
              </span>
            )}
            {liveData?.connection_status && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none',
                  liveData.connection_status === 'ONLINE' &&
                    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
                  liveData.connection_status === 'OFFLINE' &&
                    'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
                  liveData.connection_status === 'UNKNOWN' &&
                    'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    liveData.connection_status === 'ONLINE' &&
                      'bg-emerald-500 animate-pulse',
                    liveData.connection_status === 'OFFLINE' && 'bg-rose-500',
                    liveData.connection_status === 'UNKNOWN' &&
                      'bg-neutral-400',
                  )}
                />
                <span>
                  {liveData.connection_status === 'ONLINE'
                    ? 'Online'
                    : liveData.connection_status === 'OFFLINE'
                      ? 'Offline'
                      : 'Unknown'}
                </span>
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-small-normal text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-n400" />
            <span>
              Lantai 2 · Departemen Teknik Elektro & Informatika (DTEDI) SV UGM
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          {canFetchLive && roomLiveQuery.isLoading ? (
            /* Loading State */
            <div className="space-y-4 py-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-64 rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <Skeleton key={idx} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : canFetchLive && roomLiveQuery.isError ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="size-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-neutral-n900 dark:text-neutral-n100">
                  Gagal memuat metrik ruangan {roomId}
                </p>
                <p className="text-xs text-muted-foreground max-w-md">
                  {roomLiveQuery.error instanceof Error
                    ? roomLiveQuery.error.message
                    : 'Terjadi gangguan koneksi ke server API.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => roomLiveQuery.refetch()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : liveData ? (
            /* Live Metrics Grid */
            <MetricsGrid
              roomName={liveData.room_id}
              statusLevel={normalizeOccupancyLevel(liveData.level)}
              confidence={
                liveData.accuracy_percent !== undefined
                  ? `${liveData.accuracy_percent}%`
                  : undefined
              }
              updatedAt={
                liveData.last_sync
                  ? `Diperbarui ${formatApiDateTime(liveData.last_sync)}`
                  : 'Belum ada data sinkronisasi'
              }
              metrics={metrics}
              className="max-w-none shadow-none border-0 p-0 bg-transparent"
            />
          ) : (
            /* Unmonitored Room Notice */
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-n30 dark:bg-neutral-n700 flex items-center justify-center text-neutral-n500 shrink-0">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-neutral-n900 dark:text-neutral-n10">
                    {roomId}
                  </h4>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-n30 dark:bg-neutral-n700 text-tiny-semibold text-neutral-n600 dark:text-neutral-n300 mt-0.5">
                    Ruangan Tanpa Access Point
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-n10 dark:bg-neutral-n700/60 border border-neutral-n30 dark:border-neutral-n600 text-small-normal text-neutral-n600 dark:text-neutral-n300 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-neutral-n800 dark:text-neutral-n100">
                  <Info className="w-4 h-4 text-neutral-n500" />
                  <span>Informasi Pemantauan</span>
                </div>
                <p>
                  {liveResult?.notFound
                    ? liveResult.message
                    : `Ruangan ${roomId} (${location.fullLabel}) saat ini belum terpasang perangkat Access Point (AP). Deteksi kepadatan keramaian secara real-time hanya tersedia pada ruangan yang telah dilengkapi sensor AP.`}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
