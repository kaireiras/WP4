import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  CrowdedAlertPayload,
  MetricRecordedPayload,
  OccupancyUpdatedPayload,
  ReverbConnectionState,
} from '#/services/echoService'
import { getEcho } from '#/services/echoService'

export interface UseReverbOptions {
  onCrowdedAlert?: (payload: CrowdedAlertPayload) => void
  onOccupancyUpdated?: (payload: OccupancyUpdatedPayload) => void
  onMetricRecorded?: (payload: MetricRecordedPayload) => void
  enableToastAlerts?: boolean
}

export function useReverb(options: UseReverbOptions = {}) {
  const {
    onCrowdedAlert,
    onOccupancyUpdated,
    onMetricRecorded,
    enableToastAlerts = true,
  } = options

  const queryClient = useQueryClient()
  const [connectionState, setConnectionState] =
    useState<ReverbConnectionState>('connecting')
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [lastAlert, setLastAlert] = useState<
    CrowdedAlertPayload['alert'] | null
  >(null)
  const [lastPrediction, setLastPrediction] = useState<
    OccupancyUpdatedPayload['prediction'] | null
  >(null)
  const [lastMetric, setLastMetric] = useState<MetricRecordedPayload | null>(
    null,
  )

  useEffect(() => {
    const echo = getEcho()
    if (!echo) return

    const pusher = echo.connector?.pusher
    if (pusher?.connection) {
      const handleStateChange = (states: {
        current: ReverbConnectionState
      }) => {
        setConnectionState(states.current)
      }

      setConnectionState(pusher.connection.state as ReverbConnectionState)
      pusher.connection.bind('state_change', handleStateChange)
    }

    const channel = echo.channel('metrics.live')

    // 1. Event CrowdedAlert
    const handleCrowdedAlert = (payload: CrowdedAlertPayload) => {
      const alert = payload.alert

      setLastAlert(alert)
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'))

      if (enableToastAlerts) {
        const roomName = alert.room_id || alert.ap_id
        toast.error(`Peringatan Keramaian: Ruangan ${roomName} CROWDED!`, {
          description: `Estimasi ~${alert.estimated_count} orang terdeteksi pada ${alert.triggered_at || 'saat ini'}.`,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })

      onCrowdedAlert?.(payload)
    }

    // 2. Event OccupancyUpdated
    const handleOccupancyUpdated = (payload: OccupancyUpdatedPayload) => {
      const prediction = payload.prediction

      setLastPrediction(prediction)
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'))

      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
      if (prediction.room_id) {
        queryClient.invalidateQueries({
          queryKey: ['room-live', prediction.room_id],
        })
      }
      queryClient.invalidateQueries({ queryKey: ['grafik'] })

      onOccupancyUpdated?.(payload)
    }

    // 3. Event MetricRecorded
    const handleMetricRecorded = (payload: MetricRecordedPayload) => {
      setLastMetric(payload)
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'))

      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
      queryClient.invalidateQueries({ queryKey: ['room-live'] })
      queryClient.invalidateQueries({ queryKey: ['room-live-history'] })
      queryClient.invalidateQueries({ queryKey: ['grafik'] })

      onMetricRecorded?.(payload)
    }

    // Listen with both standard and leading-dot names for robust compatibility
    channel.listen('.CrowdedAlert', handleCrowdedAlert)
    channel.listen('CrowdedAlert', handleCrowdedAlert)

    channel.listen('.OccupancyUpdated', handleOccupancyUpdated)
    channel.listen('OccupancyUpdated', handleOccupancyUpdated)

    channel.listen('.MetricRecorded', handleMetricRecorded)
    channel.listen('MetricRecorded', handleMetricRecorded)

    return () => {
      channel.stopListening('.CrowdedAlert')
      channel.stopListening('CrowdedAlert')
      channel.stopListening('.OccupancyUpdated')
      channel.stopListening('OccupancyUpdated')
      channel.stopListening('.MetricRecorded')
      channel.stopListening('MetricRecorded')
      echo.leaveChannel('metrics.live')
    }
  }, [
    queryClient,
    enableToastAlerts,
    onCrowdedAlert,
    onOccupancyUpdated,
    onMetricRecorded,
  ])

  return {
    connectionState,
    lastSyncTime,
    lastAlert,
    lastPrediction,
    lastMetric,
    isConnected: connectionState === 'connected',
  }
}
