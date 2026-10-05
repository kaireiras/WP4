import * as React from 'react'
import { Eye, EyeOff, Layers, Wifi, WifiOff } from 'lucide-react'
import { cn } from '#/lib/utils'
import { StatusLevel } from './status-level'
import type { StatusLevelType } from './status-level'

/**
 * 11 Ruangan yang terpasang Access Point (AP) dan dapat dideteksi keramaiannya.
 * Ruangan selain 11 ini tidak memiliki AP sehingga berstatus statis abu-abu (neutral-n40 / #DEDEDE).
 */
export const MONITORED_ROOM_IDS = [
  'CM201',
  'CU204',
  'CU205',
  'CU206',
  'CU207',
  'CU208',
  'HU202A',
  'HU206',
  'HU207',
  'HU208',
  'HU209',
] as const

export type MonitoredRoomId = (typeof MONITORED_ROOM_IDS)[number]

export function isMonitoredRoom(roomId: string): roomId is MonitoredRoomId {
  return (MONITORED_ROOM_IDS as readonly string[]).includes(roomId)
}

export interface RoomData {
  id: string
  name: string
  label?: string
  x: number // percentage
  y: number // percentage
  w: number // percentage
  h: number // percentage
  wing?: 'Barat' | 'Utara' | 'Timur' | 'Selatan' | 'Tengah'
  hasAp: boolean
  crowdCount?: string
  confidence?: string
}

export interface KosongAreaData {
  id: string
  name: string
  label: string
  description?: string
  x: number // percentage
  y: number // percentage
  w: number // percentage
  h: number // percentage
}

export interface DenahProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedRoom?: string
  onSelectRoom?: (roomId: string) => void
  roomStatuses?: Record<string, StatusLevelType | undefined>
  showKosong?: boolean
  allowKosongSelection?: boolean
}

// 51 Named Rooms from Figma Node 109:1163
const RAW_ROOMS: Omit<RoomData, 'hasAp'>[] = [
  // Sayap Barat & Utara (CU & CM)
  {
    id: 'CU204',
    name: 'CU204',
    x: 0.4,
    y: 0.8,
    w: 7.5,
    h: 15.7,
    wing: 'Barat',
    crowdCount: '~21 orang',
    confidence: '84%',
  },
  {
    id: 'CU205',
    name: 'CU205',
    x: 8.4,
    y: 0.8,
    w: 7.5,
    h: 15.7,
    wing: 'Barat',
    crowdCount: '~62 orang',
    confidence: '92%',
  },
  {
    id: 'CU206',
    name: 'CU206',
    x: 16.3,
    y: 0.8,
    w: 7.6,
    h: 15.7,
    wing: 'Barat',
    crowdCount: '~41 orang',
    confidence: '96%',
  },
  {
    id: 'CU207',
    name: 'CU207',
    x: 24.3,
    y: 0.8,
    w: 7.5,
    h: 15.7,
    wing: 'Barat',
    crowdCount: '~57 orang',
    confidence: '73%',
  },
  {
    id: 'CU208',
    name: 'CU208',
    x: 32.3,
    y: 0.8,
    w: 7.5,
    h: 15.7,
    wing: 'Barat',
    crowdCount: '~6 orang',
    confidence: '76%',
  },
  {
    id: 'CM202',
    name: 'CM202',
    x: 32.3,
    y: 17.3,
    w: 7.5,
    h: 7.5,
    wing: 'Barat',
  },
  {
    id: 'CU209',
    name: 'CU209',
    x: 40.3,
    y: 0.8,
    w: 3.6,
    h: 15.7,
    wing: 'Barat',
  },
  {
    id: 'CU203B',
    name: 'CU203B',
    x: 0.4,
    y: 17.3,
    w: 3.6,
    h: 7.5,
    wing: 'Barat',
  },
  {
    id: 'CU203A',
    name: 'CU203A',
    x: 4.4,
    y: 17.3,
    w: 3.5,
    h: 7.5,
    wing: 'Barat',
  },
  {
    id: 'CU202B',
    name: 'CU202B',
    x: 0.4,
    y: 25.7,
    w: 3.6,
    h: 7.4,
    wing: 'Barat',
  },
  {
    id: 'CU202A',
    name: 'CU202A',
    x: 4.4,
    y: 25.7,
    w: 3.5,
    h: 7.4,
    wing: 'Barat',
  },
  {
    id: 'CU201B',
    name: 'CU201B',
    x: 0.4,
    y: 33.9,
    w: 3.6,
    h: 7.4,
    wing: 'Barat',
  },
  {
    id: 'CU201A',
    name: 'CU201A',
    x: 4.4,
    y: 33.9,
    w: 3.5,
    h: 7.4,
    wing: 'Barat',
  },
  {
    id: 'CM201',
    name: 'CM201',
    x: 0.4,
    y: 42.3,
    w: 7.5,
    h: 15.7,
    wing: 'Barat',
    crowdCount: '~25 orang',
    confidence: '87%',
  },

  // Fasilitas Tengah
  {
    id: 'TOILET',
    name: 'TOILET',
    x: 44.3,
    y: 0.8,
    w: 3.5,
    h: 15.7,
    wing: 'Tengah',
  },
  {
    id: 'EASTEDI',
    name: 'EASTEDI',
    x: 48.2,
    y: 0.8,
    w: 3.6,
    h: 15.7,
    wing: 'Tengah',
  },

  // Sayap Utara (HU)
  {
    id: 'HU210B',
    name: 'HU210B',
    x: 52.2,
    y: 0.8,
    w: 3.5,
    h: 15.7,
    wing: 'Utara',
  },
  {
    id: 'HU2010A',
    name: 'HU2010A',
    x: 56.2,
    y: 0.8,
    w: 3.6,
    h: 15.7,
    wing: 'Utara',
  },
  {
    id: 'HU209',
    name: 'HU209',
    x: 60.2,
    y: 0.8,
    w: 7.5,
    h: 15.7,
    wing: 'Utara',
    crowdCount: '~67 orang',
    confidence: '87%',
  },
  {
    id: 'HU208',
    name: 'HU208',
    x: 68.1,
    y: 0.8,
    w: 7.5,
    h: 15.7,
    wing: 'Utara',
    crowdCount: '~37 orang',
    confidence: '78%',
  },
  {
    id: 'HU207',
    name: 'HU207',
    x: 76.1,
    y: 0.8,
    w: 7.6,
    h: 15.7,
    wing: 'Utara',
    crowdCount: '~67 orang',
    confidence: '84%',
  },
  {
    id: 'HU206',
    name: 'HU206',
    x: 84.1,
    y: 0.8,
    w: 7.5,
    h: 15.7,
    wing: 'Utara',
    crowdCount: '~65 orang',
    confidence: '72%',
  },
  {
    id: 'HU205',
    name: 'HU205',
    x: 92.0,
    y: 0.8,
    w: 3.5,
    h: 15.7,
    wing: 'Utara',
  },
  {
    id: 'HU204',
    name: 'HU204',
    x: 96.0,
    y: 0.8,
    w: 3.6,
    h: 15.7,
    wing: 'Utara',
  },
  {
    id: 'HU203B',
    name: 'HU203B',
    x: 96.0,
    y: 17.3,
    w: 3.6,
    h: 7.5,
    wing: 'Utara',
  },
  {
    id: 'HU203A',
    name: 'HU203A',
    x: 92.0,
    y: 17.3,
    w: 3.5,
    h: 7.5,
    wing: 'Utara',
  },
  {
    id: 'HU202B',
    name: 'HU202B',
    x: 96.0,
    y: 25.7,
    w: 3.6,
    h: 7.4,
    wing: 'Utara',
  },
  {
    id: 'HU202A',
    name: 'HU202A',
    x: 92.0,
    y: 25.7,
    w: 3.5,
    h: 7.4,
    wing: 'Utara',
    crowdCount: '~6 orang',
    confidence: '79%',
  },
  {
    id: 'HU201B',
    name: 'HU201B',
    x: 96.0,
    y: 33.9,
    w: 3.6,
    h: 7.4,
    wing: 'Utara',
  },
  {
    id: 'HU201A',
    name: 'HU201A',
    x: 92.0,
    y: 33.9,
    w: 3.5,
    h: 7.4,
    wing: 'Utara',
  },

  // Sayap Timur Tengah (HM)
  {
    id: 'HM205',
    name: 'HM205',
    x: 56.2,
    y: 42.2,
    w: 7.6,
    h: 15.7,
    wing: 'Timur',
  },
  {
    id: 'HM204',
    name: 'HM204',
    x: 64.2,
    y: 42.2,
    w: 3.5,
    h: 15.7,
    wing: 'Timur',
  },
  {
    id: 'HM203',
    name: 'HM203',
    x: 68.1,
    y: 42.2,
    w: 7.5,
    h: 15.7,
    wing: 'Timur',
  },
  {
    id: 'HM202',
    name: 'HM202',
    x: 76.1,
    y: 42.2,
    w: 7.6,
    h: 15.7,
    wing: 'Timur',
  },
  {
    id: 'HM201',
    name: 'HM201',
    x: 92.0,
    y: 42.2,
    w: 7.5,
    h: 15.7,
    wing: 'Timur',
  },

  // Sayap Timur Selatan (HS)
  {
    id: 'HS201B',
    name: 'HS201B',
    x: 96.0,
    y: 58.7,
    w: 3.6,
    h: 7.4,
    wing: 'Selatan',
  },
  {
    id: 'HS201A',
    name: 'HS201A',
    x: 92.0,
    y: 58.7,
    w: 3.5,
    h: 7.4,
    wing: 'Selatan',
  },
  {
    id: 'HS202B',
    name: 'HS202B',
    x: 96.0,
    y: 66.9,
    w: 3.6,
    h: 7.5,
    wing: 'Selatan',
  },
  {
    id: 'HS202A',
    name: 'HS202A',
    x: 92.0,
    y: 66.9,
    w: 3.5,
    h: 7.5,
    wing: 'Selatan',
  },
  {
    id: 'HS204',
    name: 'HS204',
    x: 96.0,
    y: 75.3,
    w: 3.6,
    h: 7.4,
    wing: 'Selatan',
  },
  {
    id: 'HS203',
    name: 'HS203',
    x: 92.0,
    y: 75.3,
    w: 3.5,
    h: 7.4,
    wing: 'Selatan',
  },
  {
    id: 'HS205',
    name: 'HS205',
    x: 92.0,
    y: 83.5,
    w: 7.5,
    h: 15.7,
    wing: 'Selatan',
  },
  {
    id: 'HS206',
    name: 'HS206',
    x: 84.1,
    y: 83.5,
    w: 7.5,
    h: 15.7,
    wing: 'Selatan',
  },
  {
    id: 'HS207',
    name: 'HS207',
    x: 76.1,
    y: 83.5,
    w: 7.6,
    h: 15.7,
    wing: 'Selatan',
  },
  {
    id: 'HS208',
    name: 'HS208',
    x: 68.1,
    y: 83.5,
    w: 7.5,
    h: 15.7,
    wing: 'Selatan',
  },
  {
    id: 'HS209',
    name: 'HS209',
    x: 64.2,
    y: 83.5,
    w: 3.5,
    h: 15.7,
    wing: 'Selatan',
  },
  {
    id: 'HS210',
    name: 'HS210',
    x: 60.2,
    y: 83.5,
    w: 3.6,
    h: 15.7,
    wing: 'Selatan',
  },
  {
    id: 'HS211',
    name: 'HS211',
    x: 56.2,
    y: 83.5,
    w: 3.6,
    h: 15.7,
    wing: 'Selatan',
  },
  {
    id: 'HS212A',
    name: 'HS212A',
    x: 52.2,
    y: 83.5,
    w: 3.5,
    h: 15.7,
    wing: 'Selatan',
  },
  {
    id: 'HS212B',
    name: 'HS212B',
    x: 48.2,
    y: 83.5,
    w: 3.6,
    h: 15.7,
    wing: 'Selatan',
  },
  {
    id: 'HS212C',
    name: 'HS212C',
    x: 44.3,
    y: 83.5,
    w: 3.5,
    h: 15.7,
    wing: 'Selatan',
  },
]

export const DENAH_ROOMS: RoomData[] = RAW_ROOMS.map((room) => ({
  ...room,
  hasAp: isMonitoredRoom(room.id),
}))

// 7 Empty Spaces / Voids / Corridors from Figma Node 109:1163
export const DENAH_KOSONG_AREAS: KosongAreaData[] = [
  {
    id: 'Kosong Barat Utara',
    name: 'Kosong Barat Utara',
    label: 'Void Barat Utara',
    description: 'Taman / Courtyard Terbuka Barat',
    x: 8.4,
    y: 17.3,
    w: 23.5,
    h: 24.0,
  },
  {
    id: 'Kosong Tengah',
    name: 'Kosong Tengah',
    label: 'Atrium / Koridor Utama',
    description: 'Area Sirkulasi & Void Tengah',
    x: 40.3,
    y: 17.3,
    w: 15.3,
    h: 65.3,
  },
  {
    id: 'Kosong Timur Utara',
    name: 'Kosong Timur Utara',
    label: 'Void Timur Utara',
    description: 'Courtyard Terbuka Timur Utara',
    x: 56.2,
    y: 17.3,
    w: 35.5,
    h: 24.0,
  },
  {
    id: 'Kosong Timur Selatan',
    name: 'Kosong Timur Selatan',
    label: 'Void Timur Selatan',
    description: 'Courtyard Terbuka Timur Selatan',
    x: 56.2,
    y: 58.7,
    w: 35.5,
    h: 24.0,
  },
  {
    id: 'Kosong',
    name: 'Kosong',
    label: 'Area Terbuka Barat',
    description: 'Selasar Terbuka Tengah Barat',
    x: 32.3,
    y: 25.7,
    w: 7.5,
    h: 15.7,
  },
  {
    id: 'Ruang',
    name: 'Ruang',
    label: 'Selasar Barat',
    description: 'Selasar & Koridor Terbuka Sayap Barat',
    x: 8.4,
    y: 42.2,
    w: 31.5,
    h: 15.7,
  },
  {
    id: 'Frame 39965',
    name: 'Frame 39965',
    label: 'Selasar Timur',
    description: 'Selasar Penghubung Sayap Timur',
    x: 84.1,
    y: 42.1,
    w: 7.5,
    h: 15.8,
  },
]

const statusStyles: Record<
  StatusLevelType,
  { bg: string; border: string; text: string; badge: string }
> = {
  crowded: {
    bg: 'bg-destructive-50/25 hover:bg-destructive-50/35',
    border: 'border-destructive-50',
    text: 'text-destructive-70 dark:text-destructive-40',
    badge: 'bg-destructive-60 text-white',
  },
  high: {
    bg: 'bg-warning-50/25 hover:bg-warning-50/35',
    border: 'border-warning-50',
    text: 'text-warning-80 dark:text-warning-30',
    badge: 'bg-warning-50 text-white',
  },
  medium: {
    bg: 'bg-yellow-400/25 hover:bg-yellow-400/35',
    border: 'border-yellow-500',
    text: 'text-yellow-900 dark:text-yellow-200',
    badge: 'bg-yellow-500 text-neutral-n900',
  },
  low: {
    bg: 'bg-success-50/25 hover:bg-success-50/35',
    border: 'border-success-50',
    text: 'text-success-80 dark:text-success-30',
    badge: 'bg-success-60 text-white',
  },
}

export const DEFAULT_ROOM_STATUSES: Record<MonitoredRoomId, StatusLevelType> = {
  CM201: 'medium',
  CU204: 'medium',
  CU205: 'crowded',
  CU206: 'high',
  CU207: 'crowded',
  CU208: 'low',
  HU202A: 'medium',
  HU206: 'crowded',
  HU207: 'crowded',
  HU208: 'high',
  HU209: 'crowded',
}

const defaultStatusMap = DEFAULT_ROOM_STATUSES

export function Denah({
  selectedRoom = 'CU205',
  onSelectRoom,
  roomStatuses = defaultStatusMap,
  showKosong: initialShowKosong = true,
  allowKosongSelection = true,
  className,
  ...props
}: DenahProps) {
  const [showKosong, setShowKosong] = React.useState(initialShowKosong)

  const selectedRoomObj = DENAH_ROOMS.find((r) => r.id === selectedRoom)
  const selectedKosongObj = DENAH_KOSONG_AREAS.find(
    (k) => k.id === selectedRoom,
  )

  return (
    <div
      className={cn(
        'w-full bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm space-y-4 font-sans',
        className,
      )}
      {...props}
    >
      {/* Top Header, Legend & Kosong Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-regular-bold md:text-large-bold text-neutral-n900 dark:text-neutral-n10 tracking-tight">
              Denah Lantai 2 · DTEDI SV UGM
            </h3>
          </div>
          <p className="text-tiny-normal text-muted-foreground mt-0.5">
            11 Ruangan Terpasang AP (Deteksi Aktif) · 40 Ruangan Statis (Tanpa
            AP) · 7 Area Kosong / Void (Figma Node 109:1163).
          </p>
        </div>

        {/* Controls & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Kosong */}
          <button
            type="button"
            onClick={() => setShowKosong((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-tiny-medium border transition-colors cursor-pointer',
              showKosong
                ? 'bg-neutral-n20 dark:bg-neutral-n700 border-neutral-n40 dark:border-neutral-n600 text-neutral-n800 dark:text-neutral-n100'
                : 'bg-transparent border-dashed border-neutral-n40 text-muted-foreground hover:bg-neutral-n10',
            )}
          >
            {showKosong ? (
              <Eye className="w-3.5 h-3.5 text-primary" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            <span>Area Kosong ({DENAH_KOSONG_AREAS.length})</span>
          </button>

          {/* Level Badges Legend */}
          <div className="flex flex-wrap items-center gap-1.5 pl-2 border-l border-border">
            <StatusLevel status="crowded" size="sm" showDot />
            <StatusLevel status="high" size="sm" showDot />
            <StatusLevel status="medium" size="sm" showDot />
            <StatusLevel status="low" size="sm" showDot />
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-neutral-n40 dark:bg-neutral-n700 text-neutral-n600 dark:text-neutral-n300 border border-neutral-n50 dark:border-neutral-n600">
              <WifiOff className="w-3 h-3 text-neutral-n100 dark:text-neutral-n400" />
              <span>Tanpa AP (Statis)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Selected Info Bar */}
      {(selectedRoomObj || selectedKosongObj) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-neutral-n10 dark:bg-neutral-n800 border border-neutral-n30 dark:border-neutral-n700 text-small-medium">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-tiny-bold text-muted-foreground uppercase tracking-wider">
              {selectedRoomObj ? 'Ruangan Terpilih:' : 'Area Terpilih:'}
            </span>
            <span className="font-bold text-primary-600 dark:text-primary-400">
              {selectedRoomObj?.name || selectedKosongObj?.label}
            </span>

            {selectedRoomObj ? (
              selectedRoomObj.hasAp ? (
                <>
                  {roomStatuses[selectedRoomObj.id] && (
                    <StatusLevel
                      status={roomStatuses[selectedRoomObj.id]!}
                      size="sm"
                    />
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                    <Wifi className="w-3 h-3" />
                    AP Terpasang
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-n40 text-neutral-n600 dark:bg-neutral-n700 dark:text-neutral-n300 border border-neutral-n50 dark:border-neutral-n600">
                  <WifiOff className="w-3 h-3 text-neutral-n100 dark:text-neutral-n400" />
                  Tanpa Access Point · Statis
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-n20 dark:bg-neutral-n700 text-neutral-n600 dark:text-neutral-n300 border border-neutral-n40 dark:border-neutral-n600">
                Area Void / Non-Ruangan
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-tiny-normal text-muted-foreground">
            {selectedRoomObj ? (
              selectedRoomObj.hasAp ? (
                <>
                  {selectedRoomObj.crowdCount && (
                    <span>Estimasi: {selectedRoomObj.crowdCount}</span>
                  )}
                  {selectedRoomObj.confidence && (
                    <span>Akurasi: {selectedRoomObj.confidence}</span>
                  )}
                </>
              ) : (
                <span>
                  Kepadatan tidak terpantau (ruangan tidak memiliki Access
                  Point)
                </span>
              )
            ) : (
              <span>{selectedKosongObj?.description}</span>
            )}
          </div>
        </div>
      )}

      {/* Floor Plan Canvas */}
      <div className="relative w-full aspect-2/1 bg-neutral-n10 dark:bg-neutral-n900 border border-neutral-n30 dark:border-neutral-n700 rounded-lg overflow-hidden p-2">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* 1. LAYER AREA KOSONG / VOID (Rendered underneath rooms) */}
        {showKosong &&
          DENAH_KOSONG_AREAS.map((area) => {
            const isSelected = selectedRoom === area.id

            return (
              <button
                key={area.id}
                type="button"
                disabled={!allowKosongSelection}
                onClick={() => onSelectRoom?.(area.id)}
                title={`${area.label} (${area.description || 'Void'})`}
                style={{
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  width: `${area.w}%`,
                  height: `${area.h}%`,
                }}
                className={cn(
                  'absolute rounded-md flex flex-col items-center justify-center text-center p-1 border border-dashed transition-all select-none',
                  'bg-neutral-n20/80 dark:bg-neutral-n800/80 border-neutral-n50 dark:border-neutral-n600 text-neutral-n500 dark:text-neutral-n400',
                  allowKosongSelection &&
                    'hover:bg-neutral-n30/90 dark:hover:bg-neutral-n700/90 cursor-pointer',
                  isSelected &&
                    'ring-2 ring-primary-500 bg-primary-50/50 border-solid border-primary-500 z-10 font-bold',
                )}
              >
                {/* Subtle hatched diagonal background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,#000,#000_2px,transparent_2px,transparent_8px)]" />

                <span className="relative text-[9px] md:text-[11px] lg:text-tiny-bold font-medium truncate px-1">
                  {area.label}
                </span>
                <span className="relative hidden md:inline-block text-[8px] lg:text-[10px] opacity-75 font-mono">
                  [Area Kosong]
                </span>
              </button>
            )
          })}

        {/* 2. LAYER RUANGAN (51 Rooms) */}
        {DENAH_ROOMS.map((room) => {
          const hasAp = Boolean(room.hasAp && isMonitoredRoom(room.id))
          const status = hasAp ? roomStatuses[room.id] : undefined
          const isSelected = selectedRoom === room.id
          const style = status ? statusStyles[status] : null

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom?.(room.id)}
              title={
                hasAp
                  ? `${room.name} · AP Terpasang ${status ? `(${status.toUpperCase()})` : ''} ${room.crowdCount || ''}`
                  : `${room.name} · Ruangan Statis (Tanpa Access Point)`
              }
              style={{
                left: `${room.x}%`,
                top: `${room.y}%`,
                width: `${room.w}%`,
                height: `${room.h}%`,
              }}
              className={cn(
                'absolute rounded flex flex-col items-center justify-center text-center transition-all cursor-pointer border select-none p-0.5',
                hasAp && style
                  ? cn(style.bg, style.border, style.text)
                  : hasAp
                    ? 'bg-white dark:bg-neutral-n800 border-primary-300 dark:border-primary-700 text-neutral-n800 dark:text-neutral-n100 hover:border-primary-500'
                    : 'bg-neutral-n40 dark:bg-neutral-n700 border-neutral-n50 dark:border-neutral-n600 text-neutral-n500 dark:text-neutral-n300 hover:border-neutral-n70 hover:text-neutral-n700',
                isSelected &&
                  (hasAp
                    ? 'ring-2 ring-primary-500 shadow-md scale-[1.02] z-20 font-bold border-primary-600'
                    : 'ring-2 ring-neutral-n300 dark:ring-neutral-n400 shadow-sm scale-[1.01] z-20 font-bold border-neutral-n200 dark:border-neutral-n300'),
              )}
            >
              <span className="text-[9px] md:text-[11px] lg:text-tiny-bold truncate px-0.5 leading-tight">
                {room.name}
              </span>

              {/* Show crowd status pill on monitored rooms if active */}
              {hasAp && status && (
                <span
                  className={cn(
                    'hidden lg:inline-block text-[8px] font-bold px-1 rounded-xs uppercase tracking-tighter mt-0.5',
                    style?.badge,
                  )}
                >
                  {status}
                </span>
              )}

              {/* Small indicator on large screens for static rooms without AP */}
              {!hasAp && (
                <span className="hidden xl:inline-block text-[7px] text-neutral-n400 dark:text-neutral-n400 tracking-tighter">
                  No AP
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
