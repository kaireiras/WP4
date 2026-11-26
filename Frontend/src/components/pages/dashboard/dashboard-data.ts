import type { StatusLevelType } from '#/components/ui/status-level'
import type { MetricItem } from '#/components/ui/metrics-grid'

export interface MonitoredRoomDetail {
  id: string
  name: string
  statusLevel: StatusLevelType
  buildingName?: string
  wingName?: string
  wing?: 'Barat' | 'Utara' | 'Timur' | 'Selatan' | 'Tengah'
  updatedAt: string
  metrics: MetricItem[]
}
