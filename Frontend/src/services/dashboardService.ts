import axios from 'axios'
import { createServerFn } from '@tanstack/react-start'
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
  const roomMap = new Map<string, OverviewRoomRecord>()

  rooms.forEach((candidate) => {
    const key = candidate.room_id.trim()
    if (!key) return

    const existing = roomMap.get(key)
    if (!existing) {
      roomMap.set(key, candidate)
      return
    }

    const existingTs = formatApiDateTime(existing.last_sync) ?? ''
    const candidateTs = formatApiDateTime(candidate.last_sync) ?? ''

    if (candidateTs > existingTs) {
      roomMap.set(key, candidate)
      return
    }

    if (candidateTs === existingTs) {
      const existingRank = getOccupancySeverityRank(existing.level)
      const candidateRank = getOccupancySeverityRank(candidate.level)

      if (
        candidateRank > existingRank ||
        (candidateRank === existingRank &&
          candidate.estimated_count >= existing.estimated_count)
      ) {
        roomMap.set(key, candidate)
      }
    }
  })

  return Array.from(roomMap.values()).sort((a, b) =>
    a.room_id.localeCompare(b.room_id),
  )
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
