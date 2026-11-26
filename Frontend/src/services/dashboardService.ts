import axios from 'axios'
import { createServerFn } from '@tanstack/react-start'
import type { ApConnectionStatus } from './apService'
import type { ApiAlertRecord, ApiOccupancyLevel } from './alertService'
import { formatApiDateTime, sortAlertRecordsLatestFirst } from './alertService'
import { api } from './api'
import { handleApiError } from './errorService'

// Types
export type OverviewRoomRecord = {
  room_id: string
  ap_id: string
  level: ApiOccupancyLevel
  estimated_count: number
  confidence?: number | string | null
  last_sync: string | null
  poll_ok?: boolean | null
  connection_status?: ApConnectionStatus
  last_poll_at?: string | null
}

export type DashboardOverviewData = {
  rooms: Array<OverviewRoomRecord>
  active_alerts: Array<ApiAlertRecord>
}

export type DashboardOverviewApiPayload = {
  success: boolean
  message?: string
  last_sync: string | null
  total_rooms?: number
  total_clients?: number
  rooms?: Array<OverviewRoomRecord>
  active_alerts?: Array<ApiAlertRecord>
  data?: {
    rooms?: Array<OverviewRoomRecord>
    active_alerts?: Array<ApiAlertRecord>
  }
}

export type DashboardOverviewResponse = {
  success: boolean
  message: string
  last_sync: string | null
  total_rooms: number
  total_clients: number
  data: DashboardOverviewData
}

export type RoomLiveMetrics = {
  active_clients: number
  rx_rate_kbs: number
  tx_rate_kbs: number
  rx_rate_formatted: string
  tx_rate_formatted: string
  packets_per_sec: number
  tx_retries: number
  rx_rate?: string
  rx_rate_raw_kbs?: number
  tx_rate?: string
  tx_rate_raw_kbs?: number
  flow_count?: number
  connection_rate?: number
}

export type RoomLiveDetailData = {
  room_id: string
  ap_id: string
  ip_address?: string
  last_sync: string | null
  level: ApiOccupancyLevel
  estimated_count: number
  accuracy_percent?: number
  poll_ok?: boolean | null
  connection_status?: ApConnectionStatus
  last_poll_at?: string | null
  metrics: RoomLiveMetrics
}

export type RoomLiveDetailApiPayload = {
  success: boolean
  message?: string
  data?: RoomLiveDetailData
} & Partial<RoomLiveDetailData>

export type RoomLiveDetailResponse = {
  success: boolean
  message: string
  data: RoomLiveDetailData
}

export type RoomLiveDetailResult =
  | {
      success: true
      notFound: false
      message: string
      data: RoomLiveDetailData
    }
  | {
      success: false
      notFound: true
      message: string
      data: null
    }

// Helpers
export function extractRoomIdFromAp(apOrRoomId: string): string {
  const trimmed = apOrRoomId.trim()
  if (!trimmed) return ''
  const dashIdx = trimmed.lastIndexOf('-')
  return dashIdx >= 0
    ? trimmed.slice(dashIdx + 1).toUpperCase()
    : trimmed.toUpperCase()
}

export function classifyOccupancyByClients(count: number): ApiOccupancyLevel {
  if (count > 40) return 'CROWDED'
  if (count > 25) return 'HIGH'
  if (count > 10) return 'MEDIUM'
  return 'LOW'
}

function getOccupancySeverityRank(level: string): number {
  switch (level.toUpperCase()) {
    case 'CROWDED':
      return 3
    case 'HIGH':
      return 2
    case 'MEDIUM':
      return 1
    case 'LOW':
    default:
      return 0
  }
}

export function normalizeOverviewRooms(
  rooms: Array<OverviewRoomRecord>,
): Array<OverviewRoomRecord> {
  const roomGroups = new Map<string, Array<OverviewRoomRecord>>()

  rooms.forEach((candidate) => {
    const key = extractRoomIdFromAp(candidate.room_id || candidate.ap_id)
    if (!key) return
    const list = roomGroups.get(key)
    if (list) {
      list.push(candidate)
    } else {
      roomGroups.set(key, [candidate])
    }
  })

  const normalized: Array<OverviewRoomRecord> = []

  roomGroups.forEach((group, roomId) => {
    const byAp = new Map<string, OverviewRoomRecord>()
    group.forEach((item) => {
      const apKey = item.ap_id.trim() || roomId
      const existing = byAp.get(apKey)
      if (!existing) {
        byAp.set(apKey, item)
        return
      }
      const existingTs = formatApiDateTime(existing.last_sync) ?? ''
      const itemTs = formatApiDateTime(item.last_sync) ?? ''
      if (itemTs >= existingTs) {
        byAp.set(apKey, item)
      }
    })

    const distinctAps = Array.from(byAp.values())
    const totalCount = distinctAps.reduce(
      (sum, item) => sum + Math.max(0, Number(item.estimated_count || 0)),
      0,
    )

    const apIds = distinctAps
      .map((item) => item.ap_id.trim())
      .filter(Boolean)
      .join(', ')

    const latestSync = distinctAps.reduce<string | null>((latest, item) => {
      if (!item.last_sync) return latest
      if (!latest) return item.last_sync
      const itemTs = formatApiDateTime(item.last_sync) ?? item.last_sync
      const latestTs = formatApiDateTime(latest) ?? latest
      return itemTs > latestTs ? item.last_sync : latest
    }, null)

    const latestPollAt = distinctAps.reduce<string | null>((latest, item) => {
      if (!item.last_poll_at) return latest
      if (!latest) return item.last_poll_at
      return item.last_poll_at > latest ? item.last_poll_at : latest
    }, null)

    const pollValues = distinctAps
      .map((item) => item.poll_ok)
      .filter((v): v is boolean => v !== null && v !== undefined)
    const pollOk =
      pollValues.length === 0 ? undefined : pollValues.some((v) => v)

    const highestReported = distinctAps.reduce<ApiOccupancyLevel>(
      (best, item) =>
        getOccupancySeverityRank(item.level) > getOccupancySeverityRank(best)
          ? item.level
          : best,
      'LOW',
    )

    let resolvedLevel: ApiOccupancyLevel
    if (totalCount > 0) {
      const classified = classifyOccupancyByClients(totalCount)
      resolvedLevel =
        getOccupancySeverityRank(classified) >=
        getOccupancySeverityRank(highestReported)
          ? classified
          : highestReported
    } else if (pollOk === false) {
      resolvedLevel = 'UNKNOWN'
    } else {
      resolvedLevel = highestReported
    }

    normalized.push({
      room_id: roomId,
      ap_id: apIds || distinctAps[0].ap_id,
      level: resolvedLevel,
      estimated_count: totalCount,
      last_sync: latestSync,
      poll_ok: pollOk ?? null,
      connection_status:
        pollOk === undefined
          ? distinctAps[0].connection_status
          : pollOk
            ? 'ONLINE'
            : 'OFFLINE',
      last_poll_at: latestPollAt,
    })
  })

  return normalized.sort((a, b) => a.room_id.localeCompare(b.room_id))
}

export function formatConfidencePercent(
  confidence: number | string | null | undefined,
): string {
  const num = Number(confidence)
  if (!Number.isFinite(num) || num <= 0) return '0%'
  const pct = num <= 1 ? Math.round(num * 100) : Math.round(num)
  return `${pct}%`
}

// Get dashboard overview
export const getDashboardOverview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DashboardOverviewResponse> => {
    try {
      const response = await api.get<DashboardOverviewApiPayload>(
        '/v1/dashboard/overview',
      )
      const rawRooms = response.data.rooms ?? response.data.data?.rooms ?? []
      const rawAlerts =
        response.data.active_alerts ?? response.data.data?.active_alerts ?? []
      const normalizedRooms = normalizeOverviewRooms(rawRooms)
      const normalizedAlerts = sortAlertRecordsLatestFirst(rawAlerts)

      return {
        success: response.data.success,
        message: response.data.message ?? 'Data dashboard berhasil diambil.',
        last_sync: response.data.last_sync,
        total_rooms: response.data.total_rooms ?? normalizedRooms.length,
        total_clients:
          response.data.total_clients ??
          normalizedRooms.reduce((acc, r) => acc + (r.estimated_count || 0), 0),
        data: {
          rooms: normalizedRooms,
          active_alerts: normalizedAlerts,
        },
      }
    } catch (error) {
      return handleApiError(error)
    }
  },
)

// Get room live detail
export const getRoomLiveDetail = createServerFn({ method: 'GET' })
  .validator((data: { roomId: string }) => data)
  .handler(async ({ data }): Promise<RoomLiveDetailResult> => {
    try {
      const response = await api.get<RoomLiveDetailApiPayload>(
        `/v1/rooms/${encodeURIComponent(data.roomId)}/live`,
      )
      const payload = response.data
      const detailData: RoomLiveDetailData | undefined =
        payload.data ??
        (payload.room_id && payload.ap_id && payload.metrics
          ? {
              room_id: payload.room_id,
              ap_id: payload.ap_id,
              ip_address: payload.ip_address,
              last_sync: payload.last_sync ?? null,
              level: payload.level ?? 'UNKNOWN',
              estimated_count: payload.estimated_count ?? 0,
              accuracy_percent: payload.accuracy_percent,
              metrics: payload.metrics,
            }
          : undefined)

      if (!detailData) {
        return {
          success: false,
          notFound: true,
          message:
            payload.message ??
            `Data live untuk ruangan ${data.roomId} tidak ditemukan.`,
          data: null,
        }
      }

      const liveCount = Math.max(
        Number(detailData.metrics.active_clients || 0),
        Number(detailData.estimated_count || 0),
      )

      if (liveCount > 0 || detailData.poll_ok === true) {
        detailData.estimated_count = liveCount
        detailData.level = classifyOccupancyByClients(liveCount)
      }

      return {
        success: true,
        notFound: false,
        message: payload.message ?? 'Data live ruangan berhasil diambil.',
        data: detailData,
      }
    } catch (error) {
      if (
        axios.isAxiosError<{ message?: string }>(error) &&
        error.response?.status === 404
      ) {
        return {
          success: false,
          notFound: true,
          message:
            error.response.data.message ??
            `Ruangan ${data.roomId} tidak memiliki AP terdaftar.`,
          data: null,
        }
      }
      return handleApiError(error)
    }
  })
