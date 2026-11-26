export type AlertLevel = 'crowded' | 'high' | 'medium' | 'low'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved'

export interface AlertItem {
  id: string
  no: number
  timestamp: string
  level: AlertLevel
  estCount: string
  status: AlertStatus
  ackAt: string | null
  resolvedAt?: string | null
  roomName?: string
}
