import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { env } from '#/env'

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo<any>
  }
}

export interface CrowdedAlertPayload {
  alert: {
    id: number
    triggered_at: string
    ap_id: string
    room_id: string
    level: string
    estimated_count: number
    status: string
    acknowledged_at?: string | null
  }
}

export interface OccupancyUpdatedPayload {
  prediction: {
    id?: number
    ts: string
    ap_id: string
    room_id: string
    estimated_count: number
    level: string
    confidence?: number
    model_version_id?: number
  }
}

export interface MetricRecordedPayload {
  apId: string
  nClients: number
  pollOk: boolean
  timestamp: string
}

export type ReverbConnectionState =
  | 'connecting'
  | 'connected'
  | 'synced'
  | 'disconnected'
  | 'unavailable'
  | 'failed'

let echoInstance: Echo<any> | null = null

export function getEcho(): Echo<any> | null {
  if (typeof window === 'undefined') return null

  if (!echoInstance) {
    window.Pusher = Pusher

    const appKey = env.VITE_REVERB_APP_KEY
    const host =
      env.VITE_REVERB_HOST === 'localhost' && window.location.hostname
        ? window.location.hostname
        : env.VITE_REVERB_HOST
    const port = env.VITE_REVERB_PORT
    const isTls =
      env.VITE_REVERB_SCHEME === 'https' ||
      window.location.protocol === 'https:'

    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: appKey,
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: isTls,
      enabledTransports: ['ws', 'wss'],
    })

    window.Echo = echoInstance
  }

  return echoInstance
}

export function disconnectEcho(): void {
  if (echoInstance) {
    try {
      echoInstance.disconnect()
    } catch {
      // Ignore disconnect error
    }
    echoInstance = null
  }
}
