import { createServerFn } from '@tanstack/react-start'
import { isMonitoredRoom, parseRoomLocation } from '#/components/ui/denah'
import type { RoomLocation } from '#/components/ui/denah'
import type { StatusLevelType } from '#/components/ui/status-level'
import type { AlertItem } from '#/components/pages/alert/alert-data'
import { api } from './api'
import { handleApiError } from './errorService'

// Types
export type ApiOccupancyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CROWDED'
export type ApiAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED'

export type ApiAlertRecord = {
  id: number
  triggered_at: string
  ap_id: string
  room_id: string | null
  level: ApiOccupancyLevel
  estimated_count: number
  status: ApiAlertStatus
  acknowledged_at: string | null
}

export type AlertsResponse = {
  success: boolean
  message: string
  data: Array<ApiAlertRecord>
}

export type AcknowledgeAlertResponse = {
  success: boolean
  message: string
  data: ApiAlertRecord
}

export type GetAlertsParams = {
  status?: ApiAlertStatus
}

// Helpers
export function formatApiDateTime(
  value: string | null | undefined,
): string | null {
  if (!value) return null
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)/)
  if (match) {
    const timePart = match[2].length === 5 ? `${match[2]}:00` : match[2]
    return `${match[1]} ${timePart}`
  }
  return value
}

export function extractApiTime(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined
  const match = value.match(/[T ](\d{2}:\d{2}(?::\d{2})?)/)
  if (!match) return undefined
  return match[1].length === 5 ? `${match[1]}:00` : match[1]
}

export function normalizeOccupancyLevel(
  level: string | null | undefined,
): StatusLevelType {
  switch (level?.toUpperCase()) {
    case 'CROWDED':
      return 'crowded'
    case 'HIGH':
      return 'high'
    case 'MEDIUM':
      return 'medium'
    case 'LOW':
    default:
      return 'low'
  }
}

export function resolveRoomDisplayLocation(roomId: string): RoomLocation {
  const clean = roomId.trim().toUpperCase()

  if (clean.startsWith('LAB-') || clean.startsWith('LAB_')) {
    return {
      buildingName: 'Laboratorium DTEDI',
      wingName: 'Area Praktikum',
      fullLabel: 'Laboratorium DTEDI · Area Praktikum',
    }
  }

  if ((clean.startsWith('C') || clean.startsWith('H')) && clean[1] === 'W') {
    const buildingName =
      clean[0] === 'C' ? 'Gedung Cahyono Adi' : 'Gedung Herman Yohanes'
    return {
      buildingName,
      wingName: 'Sayap Barat',
      fullLabel: `${buildingName} · Sayap Barat`,
    }
  }

  if ((clean.startsWith('C') || clean.startsWith('H')) && clean[1] === 'E') {
    const buildingName =
      clean[0] === 'C' ? 'Gedung Cahyono Adi' : 'Gedung Herman Yohanes'
    return {
      buildingName,
      wingName: 'Sayap Timur',
      fullLabel: `${buildingName} · Sayap Timur`,
    }
  }

  return parseRoomLocation(clean)
}

export function formatAlertRoomLabel(
  roomId: string | null,
  apId: string,
): string {
  if (roomId && isMonitoredRoom(roomId)) {
    const loc = resolveRoomDisplayLocation(roomId)
    return `${roomId} (${loc.fullLabel})`
  }
  if (roomId) {
    return `${roomId} (${apId})`
  }
  return apId
}

export function sortAlertRecordsLatestFirst(
  records: Array<ApiAlertRecord>,
): Array<ApiAlertRecord> {
  return [...records].sort((a, b) => {
    const tsA = formatApiDateTime(a.triggered_at) ?? a.triggered_at
    const tsB = formatApiDateTime(b.triggered_at) ?? b.triggered_at
    const cmp = tsB.localeCompare(tsA)
    if (cmp !== 0) return cmp
    return b.id - a.id
  })
}

export function mapApiAlertToAlertItem(
  record: ApiAlertRecord,
  index: number,
): AlertItem {
  return {
    id: String(record.id),
    no: index + 1,
    timestamp: formatApiDateTime(record.triggered_at) ?? record.triggered_at,
    level: normalizeOccupancyLevel(record.level),
    estCount: `~${record.estimated_count} Orang`,
    status: record.status === 'ACKNOWLEDGED' ? 'acknowledged' : 'active',
    ackAt: formatApiDateTime(record.acknowledged_at),
    roomName: formatAlertRoomLabel(record.room_id, record.ap_id),
  }
}

// Get alerts
export const getAlerts = createServerFn({ method: 'GET' })
  .validator((data: { params?: GetAlertsParams } | undefined) => data)
  .handler(async ({ data }) => {
    try {
      const response = await api.get<AlertsResponse>('/v1/alerts', {
        params: data?.params,
      })
      return {
        ...response.data,
        data: sortAlertRecordsLatestFirst(response.data.data),
      }
    } catch (error) {
      return handleApiError(error)
    }
  })

// Acknowledge alert
export const acknowledgeAlert = createServerFn({ method: 'POST' })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    try {
      const response = await api.patch<AcknowledgeAlertResponse>(
        `/v1/alerts/${data.id}/ack`,
      )
      return response.data
    } catch (error) {
      return handleApiError(error)
    }
  })
