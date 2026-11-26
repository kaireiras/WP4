import type { StatusLevelType } from '#/components/ui/status-level'

export interface TrafficDataPoint {
  pointKey?: string
  time: string
  fullTime?: string
  rxRate: number // in KB/s or Mbps
  txRate: number
}

export interface ActiveClientsDataPoint {
  pointKey?: string
  time: string
  fullTime?: string
  clients: number
  isNull?: boolean
}

export interface OccupancyDataPoint {
  pointKey?: string
  time: string
  fullTime?: string
  levelValue: number // 0: Low, 1: Medium, 2: High, 3: Crowded
  level: StatusLevelType
  estCount: string
}

export interface GrafikAnalyticsData {
  traffic: TrafficDataPoint[]
  clients: ActiveClientsDataPoint[]
  occupancy: OccupancyDataPoint[]
}

export function getOccupancyLevelFromValue(val: number): StatusLevelType {
  switch (val) {
    case 3:
      return 'crowded'
    case 2:
      return 'high'
    case 1:
      return 'medium'
    case 0:
    default:
      return 'low'
  }
}

export function getOccupancyColor(level: StatusLevelType): string {
  switch (level) {
    case 'crowded':
      return '#f43f5e' // red
    case 'high':
      return '#f97316' // orange
    case 'medium':
      return '#eab308' // yellow
    case 'low':
      return '#22c55e' // green
    default:
      return '#94a3b8'
  }
}

export function getOccupancyLabel(level: StatusLevelType): string {
  switch (level) {
    case 'crowded':
      return 'Crowded'
    case 'high':
      return 'High'
    case 'medium':
      return 'Medium'
    case 'low':
      return 'Low'
    default:
      return 'Unknown'
  }
}
