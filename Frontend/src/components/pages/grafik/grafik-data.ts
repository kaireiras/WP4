import type { StatusLevelType } from '#/components/ui/status-level'

export interface TrafficDataPoint {
  time: string
  rxRate: number // in KB/s or Mbps
  txRate: number
}

export interface ActiveClientsDataPoint {
  time: string
  clients: number
}

export interface OccupancyDataPoint {
  time: string
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

/**
 * Generate mock time series points based on selected room and range
 */
export function generateGrafikData(
  room: string = 'all',
  range: string = '1d',
): GrafikAnalyticsData {
  // Tentukan label waktu berdasarkan range
  let timeLabels: string[] = []

  switch (range) {
    case '1h':
      timeLabels = [
        '12:00',
        '12:05',
        '12:10',
        '12:15',
        '12:20',
        '12:25',
        '12:30',
        '12:35',
        '12:40',
        '12:45',
        '12:50',
        '12:55',
        '13:00',
      ]
      break
    case '3h':
    case '6h':
      timeLabels = [
        '08:00',
        '08:30',
        '09:00',
        '09:30',
        '10:00',
        '10:30',
        '11:00',
        '11:30',
        '12:00',
        '12:30',
        '13:00',
        '13:30',
        '14:00',
      ]
      break
    case '7d':
    case 'prev_week':
    case 'this_week':
      timeLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
      break
    case 'this_month':
    case 'prev_month':
      timeLabels = ['W1', 'W2', 'W3', 'W4', 'W5']
      break
    case '1d':
    default:
      timeLabels = [
        '08:00',
        '09:00',
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
        '15:00',
        '16:00',
        '17:00',
        '18:00',
        '19:00',
        '20:00',
      ]
      break
  }

  // Room modifier multiplier
  const roomSeed =
    room === 'all' ? 1.0 : ((room.charCodeAt(room.length - 1) % 5) + 7) / 10

  const traffic: TrafficDataPoint[] = timeLabels.map((time, idx) => {
    // Kurva puncak di siang hari (indeks 4-6)
    const bellFactor = Math.sin((idx / (timeLabels.length - 1)) * Math.PI)
    const baseRx =
      25 + Math.round(bellFactor * 60 * roomSeed + ((idx * 7) % 15))
    const baseTx =
      15 + Math.round(bellFactor * 45 * roomSeed + ((idx * 5) % 10))

    return {
      time,
      rxRate: Math.min(100, Math.max(5, baseRx)),
      txRate: Math.min(100, Math.max(2, baseTx)),
    }
  })

  const clients: ActiveClientsDataPoint[] = timeLabels.map((time, idx) => {
    const bellFactor = Math.sin((idx / (timeLabels.length - 1)) * Math.PI)
    const count =
      room === 'all'
        ? Math.round(20 + bellFactor * 110 + ((idx * 13) % 20))
        : Math.round(5 + bellFactor * 45 * roomSeed + ((idx * 7) % 8))

    return {
      time,
      clients: Math.max(0, count),
    }
  })

  const occupancy: OccupancyDataPoint[] = timeLabels.map((time, idx) => {
    // Variasi level 0..3
    let levelValue = 0
    if (idx === 4 || idx === 5) {
      levelValue = 3 // Crowded saat jam makan siang / kuliah puncak
    } else if (idx === 3 || idx === 6 || idx === 7) {
      levelValue = 2 // High
    } else if (idx === 2 || idx === 8) {
      levelValue = 1 // Medium
    } else {
      levelValue = 0 // Low
    }

    const level = getOccupancyLevelFromValue(levelValue)
    let estCount = '~10-25 Orang'
    if (level === 'crowded')
      estCount = room === 'all' ? '~120-150 Orang' : '~80 Orang'
    else if (level === 'high')
      estCount = room === 'all' ? '~70-90 Orang' : '~50 Orang'
    else if (level === 'medium')
      estCount = room === 'all' ? '~40-60 Orang' : '~25 Orang'
    else estCount = room === 'all' ? '~10-20 Orang' : '~5-10 Orang'

    return {
      time,
      levelValue,
      level,
      estCount,
    }
  })

  return {
    traffic,
    clients,
    occupancy,
  }
}
