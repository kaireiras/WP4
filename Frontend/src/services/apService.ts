import { createServerFn } from '@tanstack/react-start'
import { api } from './api'
import { handleApiError } from './errorService'

// Types
export interface ApRegistryRecord {
  ap_id: string
  ip_address: string
  snmp_community: string
  created_at?: string | null
  updated_at?: string | null
}

export interface ApListResponse {
  success: boolean
  message: string
  data: Array<ApRegistryRecord>
}

export interface ApDetailResponse {
  success: boolean
  message: string
  data: ApRegistryRecord
}

export interface ApActionResponse {
  success: boolean
  message: string
  data?: ApRegistryRecord
}

export interface CreateApInput {
  ap_id: string
  ip_address: string
  snmp_community: string
}

export interface UpdateApInput {
  apId: string
  ip_address: string
  snmp_community: string
}

export interface DeleteApInput {
  apId: string
}

// Format API datetime for table display
export function formatApCreatedAt(value: string | null | undefined): string {
  if (!value) return '—'
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)/)
  if (match) {
    const timePart = match[2].length === 5 ? `${match[2]}:00` : match[2]
    return `${match[1]} ${timePart}`
  }
  return value
}

// Get list of APs
export const getAps = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await api.get<ApListResponse>('/v1/admin/ap')
    return response.data
  } catch (error) {
    return handleApiError(error)
  }
})

// Get AP detail
export const getApDetail = createServerFn({ method: 'GET' })
  .validator((data: { apId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const response = await api.get<ApDetailResponse>(
        `/v1/admin/ap/${encodeURIComponent(data.apId)}`,
      )
      return response.data
    } catch (error) {
      return handleApiError(error)
    }
  })

// Create new AP
export const createAp = createServerFn({ method: 'POST' })
  .validator((data: CreateApInput) => data)
  .handler(async ({ data }) => {
    try {
      const response = await api.post<ApActionResponse>('/v1/admin/ap', {
        ap_id: data.ap_id.trim(),
        ip_address: data.ip_address.trim(),
        snmp_community: data.snmp_community.trim(),
      })
      return response.data
    } catch (error) {
      return handleApiError(error)
    }
  })

// Update AP
export const updateAp = createServerFn({ method: 'POST' })
  .validator((data: UpdateApInput) => data)
  .handler(async ({ data }) => {
    try {
      const response = await api.put<ApActionResponse>(
        `/v1/admin/ap/${encodeURIComponent(data.apId)}`,
        {
          ip_address: data.ip_address.trim(),
          snmp_community: data.snmp_community.trim(),
        },
      )
      return response.data
    } catch (error) {
      return handleApiError(error)
    }
  })

// Delete AP
export const deleteAp = createServerFn({ method: 'POST' })
  .validator((data: DeleteApInput) => data)
  .handler(async ({ data }) => {
    try {
      const response = await api.delete<ApActionResponse>(
        `/v1/admin/ap/${encodeURIComponent(data.apId)}`,
      )
      return response.data
    } catch (error) {
      return handleApiError(error)
    }
  })
