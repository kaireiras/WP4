import { createServerFn } from '@tanstack/react-start'
import type { StatusLevelType } from '#/components/ui/status-level'
import type {
  ActiveClientsDataPoint,
  GrafikAnalyticsData,
  OccupancyDataPoint,
  TrafficDataPoint,
} from '#/components/pages/grafik/grafik-data'
import { getOccupancyLevelFromValue } from '#/components/pages/grafik/grafik-data'
import type { ApiOccupancyLevel } from './alertService'
import { formatApiDateTime, normalizeOccupancyLevel } from './alertService'
import { api } from './api'
import { handleApiError } from './errorService'

// Types
export type GetHistoryParams = {
  ap_id?: string
  room_id?: string
  start?: string
  end?: string
  limit?: number
}

export type HistoryChartRecord = {
  ts: string
  ap_id?: string
  room_id: string | null
  estimated_count?: number | string | null
  level?: ApiOccupancyLevel
  confidence?: number | string | null
  n_clients?: number | string | null
  active_clients?: number | string | null
  rx_rate?: number | string | null
  tx_rate?: number | string | null
  rx_rate_kbs?: number | string | null
  tx_rate_kbs?: number | string | null
  rx_rate_formatted?: string
  tx_rate_formatted?: string
  packets_per_sec?: number
}

export type HistoryChartResponse = {
  success: boolean
  message: string
  data: Array<HistoryChartRecord>
}

// Helpers
export function sortHistoryRecordsChronologically(
  records: Array<HistoryChartRecord>,
): Array<HistoryChartRecord> {
  return [...records].sort((a, b) => {
    const tsA = formatApiDateTime(a.ts) ?? a.ts
    const tsB = formatApiDateTime(b.ts) ?? b.ts
    return tsA.localeCompare(tsB)
  })
}

export function normalizeHistoryDateParam(
  value: string | undefined,
  isEnd = false,
): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:${isEnd ? '59' : '00'}`
  }
  return normalized
}

function getLevelValueFromStatus(level: StatusLevelType): number {
  switch (level) {
    case 'crowded':
      return 3
    case 'high':
      return 2
    case 'medium':
      return 1
    case 'low':
    default:
      return 0
  }
}

function deriveAggregateLevelValue(estimatedCount: number): number {
  if (estimatedCount >= 60) return 3
  if (estimatedCount >= 35) return 2
  if (estimatedCount >= 15) return 1
  return 0
}

function formatChartTimeLabels(
  records: Array<HistoryChartRecord>,
): Array<string> {
  const parsed = records.map((item) => {
    const match = item.ts.match(
      /^(\d{4})-(\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/,
    )
    if (!match) {
      return {
        date: item.ts,
        monthDay: item.ts,
        hm: item.ts,
        hms: item.ts,
      }
    }
    const sec = match[4] || '00'
    return {
      date: `${match[1]}-${match[2]}`,
      monthDay: match[2],
      hm: match[3],
      hms: `${match[3]}:${sec}`,
    }
  })

  const uniqueDates = new Set(parsed.map((p) => p.date))
  const isMultiDay = uniqueDates.size > 1

  const shortLabels = parsed.map((p) =>
    isMultiDay ? `${p.monthDay} ${p.hm}` : p.hm,
  )
  const longLabels = parsed.map((p) =>
    isMultiDay ? `${p.monthDay} ${p.hms}` : p.hms,
  )
  const shouldShowSeconds = new Set(longLabels).size > new Set(shortLabels).size

  return shouldShowSeconds ? longLabels : shortLabels
}

export function mapHistoryRecordsToGrafikData(
  records: Array<HistoryChartRecord>,
): GrafikAnalyticsData {
  const sortedRecords = sortHistoryRecordsChronologically(records)
  const labels = formatChartTimeLabels(sortedRecords)

  const traffic: Array<TrafficDataPoint> = []
  const clients: Array<ActiveClientsDataPoint> = []
  const occupancy: Array<OccupancyDataPoint> = []

  sortedRecords.forEach((record, index) => {
    const pointKey = String(index)
    const time = labels[index] ?? record.ts
    const fullTime = formatApiDateTime(record.ts) ?? record.ts
    const rxRateRaw = record.rx_rate_kbs ?? record.rx_rate ?? 0
    const txRateRaw = record.tx_rate_kbs ?? record.tx_rate ?? 0
    const rxRate = Number(rxRateRaw)
    const txRate = Number(txRateRaw)

    const rawClients = record.active_clients ?? record.n_clients
    const isClientsNull = rawClients === null || rawClients === undefined
    const nClients = isClientsNull ? 0 : Number(rawClients)

    const rawEstCount =
      record.estimated_count ?? record.active_clients ?? record.n_clients
    const estimatedCount = Number(rawEstCount ?? 0)

    let level: StatusLevelType
    let levelValue: number

    if (record.level) {
      level = normalizeOccupancyLevel(record.level)
      levelValue = getLevelValueFromStatus(level)
    } else {
      levelValue = deriveAggregateLevelValue(estimatedCount)
      level = getOccupancyLevelFromValue(levelValue)
    }

    traffic.push({
      pointKey,
      time,
      fullTime,
      rxRate: Number.isFinite(rxRate) ? rxRate : 0,
      txRate: Number.isFinite(txRate) ? txRate : 0,
    })

    clients.push({
      pointKey,
      time,
      fullTime,
      clients: Number.isFinite(nClients) ? nClients : 0,
      isNull: isClientsNull,
    })

    occupancy.push({
      pointKey,
      time,
      fullTime,
      levelValue,
      level,
      estCount: `~${Number.isFinite(estimatedCount) ? estimatedCount : 0} Orang`,
    })
  })

  return {
    traffic,
    clients,
    occupancy,
  }
}

// Get history chart data
export const getHistoryChart = createServerFn({ method: 'GET' })
  .validator((data: { params?: GetHistoryParams } | undefined) => data)
  .handler(async ({ data }) => {
    try {
      const rawParams = data?.params
      const response = await api.get<HistoryChartResponse>('/v1/grafik', {
        params: rawParams
          ? {
              ap_id: rawParams.ap_id,
              room_id:
                rawParams.room_id && rawParams.room_id !== 'all'
                  ? rawParams.room_id
                  : undefined,
              start: normalizeHistoryDateParam(rawParams.start, false),
              end: normalizeHistoryDateParam(rawParams.end, true),
              limit: rawParams.limit ?? 100,
            }
          : { limit: 100 },
      })
      return {
        ...response.data,
        data: sortHistoryRecordsChronologically(response.data.data),
      }
    } catch (error) {
      return handleApiError(error)
    }
  })
