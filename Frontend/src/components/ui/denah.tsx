import * as React from 'react'
import { Eye, EyeOff, Layers, Wifi, WifiOff } from 'lucide-react'
import { cn } from '#/lib/utils'
import { StatusLevel } from './status-level'
import type { StatusLevelType } from './status-level'

/**
 * Dimensi standar kanvas denah dari Figma Node 109:1163.
 * Seluruh koordinat dan jarak antar-ruangan (gap) berbasis grid 10px seragam.
 */
export const CANVAS_WIDTH = 2400
export const CANVAS_HEIGHT = 1200
export const DENAH_GAP = 10

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

export interface RoomLocation {
  buildingName: string
  wingName: string
  fullLabel: string
}

/**
 * Parsing lokasi gedung dan sayap berdasarkan kode ruangan:
 * - Huruf ke-1:
 *   - 'C' = Gedung Cahyono Adi
 *   - 'H' = Gedung Herman Yohanes
 * - Huruf ke-2:
 *   - 'U' = Sayap Utara
 *   - 'M' = Middle / Tengah
 *   - 'S' = Sayap Selatan
 */
export function parseRoomLocation(roomId: string): RoomLocation {
  const clean = roomId.trim().toUpperCase()

  if (clean === 'TOILET') {
    return {
      buildingName: 'Fasilitas Umum',
      wingName: 'Lantai 2',
      fullLabel: 'Toilet · Lantai 2',
    }
  }

  if (clean === 'EASTEDI') {
    return {
      buildingName: 'Laboratorium DTEDI',
      wingName: 'Lantai 2',
      fullLabel: 'Lab EASTEDI · Lantai 2',
    }
  }

  const bChar = clean[0]
  const wChar = clean[1]

  const buildingName =
    bChar === 'C'
      ? 'Gedung Cahyono Adi'
      : bChar === 'H'
        ? 'Gedung Herman Yohanes'
        : 'DTEDI UGM'

  const wingName =
    wChar === 'U'
      ? 'Sayap Utara'
      : wChar === 'M'
        ? 'Middle / Tengah'
        : wChar === 'S'
          ? 'Sayap Selatan'
          : 'Area Tengah'

  return {
    buildingName,
    wingName,
    fullLabel: `${buildingName} · ${wingName}`,
  }
}

export interface RoomData {
  id: string
  name: string
  x: number // absolute px in 2400x1200 canvas
  y: number // absolute px in 2400x1200 canvas
  w: number // absolute px in 2400x1200 canvas
  h: number // absolute px in 2400x1200 canvas
  hasAp: boolean
  crowdCount?: string
  confidence?: string
}

export interface KosongAreaData {
  id: string
  name: string
  label: string
  description?: string
  x: number // absolute px in 2400x1200 canvas
  y: number // absolute px in 2400x1200 canvas
  w: number // absolute px in 2400x1200 canvas
  h: number // absolute px in 2400x1200 canvas
}

export interface DenahProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedRoom?: string
  onSelectRoom?: (roomId: string) => void
  roomStatuses?: Record<string, StatusLevelType | undefined>
  showKosong?: boolean
  allowKosongSelection?: boolean
}

/**
 * 51 Ruangan dari Figma Node 109:1163.
 * Seluruh koordinat x, y, w, h dijamin memiliki jarak (gap) persis 10px antar-ruangan yang berdampingan.
 */
const RAW_ROOMS: Omit<RoomData, 'hasAp'>[] = [
  // -------------------------------------------------------------
  // 1. BARIS ATAS (Sayap Utara / Top Row: y=10, h=188, Gap=10px)
  // -------------------------------------------------------------
  {
    id: 'CU204',
    name: 'CU204',
    x: 10,
    y: 10,
    w: 181,
    h: 188,
    crowdCount: '~21 orang',
    confidence: '84%',
  },
  {
    id: 'CU205',
    name: 'CU205',
    x: 201,
    y: 10,
    w: 181,
    h: 188,
    crowdCount: '~62 orang',
    confidence: '92%',
  },
  {
    id: 'CU206',
    name: 'CU206',
    x: 392,
    y: 10,
    w: 182,
    h: 188,
    crowdCount: '~41 orang',
    confidence: '96%',
  },
  {
    id: 'CU207',
    name: 'CU207',
    x: 584,
    y: 10,
    w: 181,
    h: 188,
    crowdCount: '~57 orang',
    confidence: '73%',
  },
  {
    id: 'CU208',
    name: 'CU208',
    x: 775,
    y: 10,
    w: 181,
    h: 188,
    crowdCount: '~6 orang',
    confidence: '76%',
  },
  {
    id: 'CU209',
    name: 'CU209',
    x: 966,
    y: 10,
    w: 86,
    h: 188,
  },
  {
    id: 'TOILET',
    name: 'TOILET',
    x: 1062,
    y: 10,
    w: 85,
    h: 188,
  },
  {
    id: 'EASTEDI',
    name: 'EASTEDI',
    x: 1157,
    y: 10,
    w: 86,
    h: 188,
  },
  {
    id: 'HU210B',
    name: 'HU210B',
    x: 1253,
    y: 10,
    w: 85,
    h: 188,
  },
  {
    id: 'HU2010A',
    name: 'HU2010A',
    x: 1348,
    y: 10,
    w: 86,
    h: 188,
  },
  {
    id: 'HU209',
    name: 'HU209',
    x: 1444,
    y: 10,
    w: 181,
    h: 188,
    crowdCount: '~67 orang',
    confidence: '87%',
  },
  {
    id: 'HU208',
    name: 'HU208',
    x: 1635,
    y: 10,
    w: 181,
    h: 188,
    crowdCount: '~37 orang',
    confidence: '78%',
  },
  {
    id: 'HU207',
    name: 'HU207',
    x: 1826,
    y: 10,
    w: 182,
    h: 188,
    crowdCount: '~67 orang',
    confidence: '84%',
  },
  {
    id: 'HU206',
    name: 'HU206',
    x: 2018,
    y: 10,
    w: 181,
    h: 188,
    crowdCount: '~65 orang',
    confidence: '72%',
  },
  {
    id: 'HU205',
    name: 'HU205',
    x: 2209,
    y: 10,
    w: 85,
    h: 188,
  },
  {
    id: 'HU204',
    name: 'HU204',
    x: 2304,
    y: 10,
    w: 86,
    h: 188,
  },

  // -------------------------------------------------------------
  // 2. KOLOM BARAT (Gedung Cahyono Adi: y=208..506, Gap=10px)
  // -------------------------------------------------------------
  {
    id: 'CU203B',
    name: 'CU203B',
    x: 10,
    y: 208,
    w: 86,
    h: 90,
  },
  {
    id: 'CU203A',
    name: 'CU203A',
    x: 106,
    y: 208,
    w: 85,
    h: 90,
  },
  {
    id: 'CM202',
    name: 'CM202',
    x: 775,
    y: 208,
    w: 181,
    h: 90,
  },
  {
    id: 'CU202B',
    name: 'CU202B',
    x: 10,
    y: 308,
    w: 86,
    h: 89,
  },
  {
    id: 'CU202A',
    name: 'CU202A',
    x: 106,
    y: 308,
    w: 85,
    h: 89,
  },
  {
    id: 'CU201B',
    name: 'CU201B',
    x: 10,
    y: 407,
    w: 86,
    h: 89,
  },
  {
    id: 'CU201A',
    name: 'CU201A',
    x: 106,
    y: 407,
    w: 85,
    h: 89,
  },
  {
    id: 'CM201',
    name: 'CM201',
    x: 10,
    y: 506,
    w: 181,
    h: 188,
    crowdCount: '~25 orang',
    confidence: '87%',
  },

  // -------------------------------------------------------------
  // 3. KOLOM TIMUR ATAS (HU: y=208..407, Gap=10px)
  // -------------------------------------------------------------
  {
    id: 'HU203A',
    name: 'HU203A',
    x: 2209,
    y: 208,
    w: 85,
    h: 90,
  },
  {
    id: 'HU203B',
    name: 'HU203B',
    x: 2304,
    y: 208,
    w: 86,
    h: 90,
  },
  {
    id: 'HU202A',
    name: 'HU202A',
    x: 2209,
    y: 308,
    w: 85,
    h: 89,
    crowdCount: '~6 orang',
    confidence: '79%',
  },
  {
    id: 'HU202B',
    name: 'HU202B',
    x: 2304,
    y: 308,
    w: 86,
    h: 89,
  },
  {
    id: 'HU201A',
    name: 'HU201A',
    x: 2209,
    y: 407,
    w: 85,
    h: 89,
  },
  {
    id: 'HU201B',
    name: 'HU201B',
    x: 2304,
    y: 407,
    w: 86,
    h: 89,
  },

  // -------------------------------------------------------------
  // 4. BARIS TENGAH TIMUR (HM: y=506, h=188, Gap=10px)
  // Catatan: Area di antara HM202 dan HM201 (x=2008..2209) adalah selasar timur
  // yang sengaja dikosongkan tanpa teks/label sesuai permintaan user.
  // -------------------------------------------------------------
  {
    id: 'HM205',
    name: 'HM205',
    x: 1348,
    y: 506,
    w: 182,
    h: 188,
  },
  {
    id: 'HM204',
    name: 'HM204',
    x: 1540,
    y: 506,
    w: 85,
    h: 188,
  },
  {
    id: 'HM203',
    name: 'HM203',
    x: 1635,
    y: 506,
    w: 181,
    h: 188,
  },
  {
    id: 'HM202',
    name: 'HM202',
    x: 1826,
    y: 506,
    w: 182,
    h: 188,
  },
  {
    id: 'HM201',
    name: 'HM201',
    x: 2209,
    y: 506,
    w: 181,
    h: 188,
  },

  // -------------------------------------------------------------
  // 5. KOLOM TIMUR BAWAH (HS: y=704..903, Gap=10px)
  // -------------------------------------------------------------
  {
    id: 'HS201A',
    name: 'HS201A',
    x: 2209,
    y: 704,
    w: 85,
    h: 89,
  },
  {
    id: 'HS201B',
    name: 'HS201B',
    x: 2304,
    y: 704,
    w: 86,
    h: 89,
  },
  {
    id: 'HS202A',
    name: 'HS202A',
    x: 2209,
    y: 803,
    w: 85,
    h: 90,
  },
  {
    id: 'HS202B',
    name: 'HS202B',
    x: 2304,
    y: 803,
    w: 86,
    h: 90,
  },
  {
    id: 'HS203',
    name: 'HS203',
    x: 2209,
    y: 903,
    w: 85,
    h: 89,
  },
  {
    id: 'HS204',
    name: 'HS204',
    x: 2304,
    y: 903,
    w: 86,
    h: 89,
  },

  // -------------------------------------------------------------
  // 6. BARIS BAWAH (Sayap Selatan / HS Row: y=1002, h=188, Gap=10px)
  // -------------------------------------------------------------
  {
    id: 'HS212C',
    name: 'HS212C',
    x: 1062,
    y: 1002,
    w: 85,
    h: 188,
  },
  {
    id: 'HS212B',
    name: 'HS212B',
    x: 1157,
    y: 1002,
    w: 86,
    h: 188,
  },
  {
    id: 'HS212A',
    name: 'HS212A',
    x: 1253,
    y: 1002,
    w: 85,
    h: 188,
  },
  {
    id: 'HS211',
    name: 'HS211',
    x: 1348,
    y: 1002,
    w: 86,
    h: 188,
  },
  {
    id: 'HS210',
    name: 'HS210',
    x: 1444,
    y: 1002,
    w: 86,
    h: 188,
  },
  {
    id: 'HS209',
    name: 'HS209',
    x: 1540,
    y: 1002,
    w: 85,
    h: 188,
  },
  {
    id: 'HS208',
    name: 'HS208',
    x: 1635,
    y: 1002,
    w: 181,
    h: 188,
  },
  {
    id: 'HS207',
    name: 'HS207',
    x: 1826,
    y: 1002,
    w: 182,
    h: 188,
  },
  {
    id: 'HS206',
    name: 'HS206',
    x: 2018,
    y: 1002,
    w: 181,
    h: 188,
  },
  {
    id: 'HS205',
    name: 'HS205',
    x: 2209,
    y: 1002,
    w: 181,
    h: 188,
  },
]

export const DENAH_ROOMS: RoomData[] = RAW_ROOMS.map((room) => ({
  ...room,
  hasAp: isMonitoredRoom(room.id),
}))

/**
 * 6 Area Terbuka / Void dari Figma Node 109:1163.
 * Selasar Timur (Frame 39965) telah dihapus sehingga koridor timur bersih dan kosong tanpa label.
 */
export const DENAH_KOSONG_AREAS: KosongAreaData[] = [
  {
    id: 'Kosong Barat Utara',
    name: 'Kosong Barat Utara',
    label: 'Void Barat Utara',
    description: 'Taman / Courtyard Terbuka Barat',
    x: 201,
    y: 208,
    w: 564,
    h: 288,
  },
  {
    id: 'Kosong Tengah',
    name: 'Kosong Tengah',
    label: 'Atrium / Koridor Utama',
    description: 'Area Sirkulasi & Void Tengah',
    x: 966,
    y: 208,
    w: 372,
    h: 784,
  },
  {
    id: 'Kosong Timur Utara',
    name: 'Kosong Timur Utara',
    label: 'Void Timur Utara',
    description: 'Courtyard Terbuka Timur Utara',
    x: 1348,
    y: 208,
    w: 851,
    h: 288,
  },
  {
    id: 'Kosong Timur Selatan',
    name: 'Kosong Timur Selatan',
    label: 'Void Timur Selatan',
    description: 'Courtyard Terbuka Timur Selatan',
    x: 1348,
    y: 704,
    w: 851,
    h: 288,
  },
  {
    id: 'Kosong',
    name: 'Kosong',
    label: 'Area Terbuka Barat',
    description: 'Selasar Terbuka Tengah Barat',
    x: 775,
    y: 308,
    w: 181,
    h: 188,
  },
  {
    id: 'Ruang',
    name: 'Ruang',
    label: 'Selasar Barat',
    description: 'Selasar & Koridor Terbuka Sayap Barat',
    x: 201,
    y: 506,
    w: 755,
    h: 188,
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

export function Denah({
  selectedRoom = 'CU205',
  onSelectRoom,
  roomStatuses = DEFAULT_ROOM_STATUSES,
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
  const selectedLocation = selectedRoomObj
    ? parseRoomLocation(selectedRoomObj.id)
    : null

  return (
    <div
      className={cn(
        'w-full bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm space-y-4 font-sans',
        className,
      )}
      {...props}
    >
      {/* Top Header & Legend */}
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
            AP) · 6 Area Terbuka / Void.
          </p>
        </div>

        {/* Controls & Level Badges Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Ruang Kosong */}
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
            {selectedLocation && (
              <span className="text-tiny-medium text-neutral-n500 dark:text-neutral-n400">
                ({selectedLocation.fullLabel})
              </span>
            )}

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

      {/* Floor Plan Canvas Container */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="relative w-full min-w-[2000px] min-h-[1000px] aspect-2/1 bg-neutral-n10 dark:bg-neutral-900 border border-neutral-n30 dark:border-neutral-n700 rounded-lg overflow-hidden p-2 select-none">
          {/* Blueprint subtle background pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* 1. LAYER AREA KOSONG / VOID (Underneath rooms, Selasar Timur dihapus) */}
          {showKosong &&
            DENAH_KOSONG_AREAS.map((area) => {
              const isSelected = selectedRoom === area.id
              const leftPct = `${(area.x / CANVAS_WIDTH) * 100}%`
              const topPct = `${(area.y / CANVAS_HEIGHT) * 100}%`
              const widthPct = `${(area.w / CANVAS_WIDTH) * 100}%`
              const heightPct = `${(area.h / CANVAS_HEIGHT) * 100}%`

              return (
                <button
                  key={area.id}
                  type="button"
                  disabled={!allowKosongSelection}
                  onClick={() => onSelectRoom?.(area.id)}
                  title={`${area.label} (${area.description || 'Void'})`}
                  style={{
                    left: leftPct,
                    top: topPct,
                    width: widthPct,
                    height: heightPct,
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
                  {/* Subtle hatched diagonal pattern */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,#000,#000_2px,transparent_2px,transparent_8px)]" />

                  <span className="relative text-xs md:text-sm font-bold truncate px-1">
                    {area.label}
                  </span>
                  <span className="relative text-[10px] md:text-xs opacity-75 font-mono mt-0.5">
                    [Area Kosong]
                  </span>
                </button>
              )
            })}

          {/* 2. LAYER 51 RUANGAN (Dengan Jarak/Gap 10px Seragam di Semua Sisi) */}
          {DENAH_ROOMS.map((room) => {
            const hasAp = Boolean(room.hasAp && isMonitoredRoom(room.id))
            const status = hasAp ? roomStatuses[room.id] : undefined
            const isSelected = selectedRoom === room.id
            const style = status ? statusStyles[status] : null

            // Exact percentage coordinates derived from 2400x1200 canvas
            const leftPct = `${(room.x / CANVAS_WIDTH) * 100}%`
            const topPct = `${(room.y / CANVAS_HEIGHT) * 100}%`
            const widthPct = `${(room.w / CANVAS_WIDTH) * 100}%`
            const heightPct = `${(room.h / CANVAS_HEIGHT) * 100}%`

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
                  left: leftPct,
                  top: topPct,
                  width: widthPct,
                  height: heightPct,
                }}
                className={cn(
                  'absolute rounded flex flex-col items-center justify-center text-center transition-all cursor-pointer border select-none p-1',
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
                <span className="text-xs md:text-[13px] font-bold truncate px-0.5 leading-tight">
                  {room.name}
                </span>

                {/* Status pill on monitored rooms */}
                {hasAp && status && (
                  <span
                    className={cn(
                      'inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-tight mt-1',
                      style?.badge,
                    )}
                  >
                    {status}
                  </span>
                )}

                {/* Small indicator for static rooms without AP */}
                {!hasAp && (
                  <span className="inline-block text-[8px] text-neutral-n400 dark:text-neutral-n400 tracking-tighter mt-0.5">
                    No AP
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
