import type { ApRegistryRecord } from '#/services/apService'
import { formatApCreatedAt } from '#/services/apService'

// Table row data structure for AP
export interface ApItem {
  no: number
  ap_id: string
  ip_address: string
  snmp_community: string
  created_at: string
  rawCreatedAt?: string | null
}

// Client-side IP validation helper (supports IPv4 with optional port)
export function validateIpAddress(ip: string): boolean {
  if (!ip || !ip.trim()) return false
  const trimmed = ip.trim()

  // Match standard IPv4 or IPv4:port
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::[0-9]{1,5})?$/
  return ipv4Regex.test(trimmed)
}

// Map raw API record to ApItem
export function mapApRecordToItem(
  record: ApRegistryRecord,
  index: number,
): ApItem {
  return {
    no: index + 1,
    ap_id: record.ap_id,
    ip_address: record.ip_address,
    snmp_community: record.snmp_community,
    created_at: formatApCreatedAt(record.created_at),
    rawCreatedAt: record.created_at,
  }
}
