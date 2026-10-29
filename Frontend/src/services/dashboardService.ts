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
  confidence: number | string
  last_sync: string | null
}

export type DashboardOverviewData = {
  rooms: Array<OverviewRoomRecord>
  active_alerts: Array<ApiAlertRecord>
}

export type DashboardOverviewResponse = {
  success: boolean
  message: string
  last_sync: string | null
  data: DashboardOverviewData
}

export type RoomLiveMetrics = {
  rx_rate: string
  rx_rate_raw_kbs: number
  tx_rate: string
  tx_rate_raw_kbs: number
  packets_per_sec: number
  flow_count: number
  active_clients: number
  connection_rate: number
}

export type RoomLiveDetailData = {
  room_id: string
  ap_id: string
  last_sync: string | null
  level: ApiOccupancyLevel
  estimated_count: number
  accuracy_percent: number
  metrics: RoomLiveMetrics
}

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
  async () => {
    try {
      const response = await api.get<DashboardOverviewResponse>(
        '/v1/dashboard/overview',
      )
      return {
        ...response.data,
        data: {
          rooms: normalizeOverviewRooms(response.data.data.rooms),
          active_alerts: sortAlertRecordsLatestFirst(
            response.data.data.active_alerts,
          ),
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
      const response = await api.get<RoomLiveDetailResponse>(
        `/v1/rooms/${encodeURIComponent(data.roomId)}/live`,
      )
      return {
        success: true,
        notFound: false,
        message: response.data.message,
        data: response.data.data,
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
