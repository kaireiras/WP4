import { WifiOff, Info, MapPin, Building2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/components/ui/shadcn/dialog'
import { MetricsGrid } from '#/components/ui/metrics-grid'
import { parseRoomLocation } from '#/components/ui/denah'
import { MONITORED_ROOMS_DATA } from './dashboard-data'

export interface RoomDetailDialogProps {
  roomId: string | null
  isOpen: boolean
  onClose: () => void
}

export function RoomDetailDialog({
  roomId,
  isOpen,
  onClose,
}: RoomDetailDialogProps) {
  if (!roomId) return null

  const roomDetail = MONITORED_ROOMS_DATA[roomId]
  const location = parseRoomLocation(roomId)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-neutral-n800 rounded-2xl shadow-xl border border-neutral-n30 dark:border-neutral-n700">
        <DialogHeader className="space-y-1 pb-2 border-b border-neutral-n30 dark:border-neutral-n700">
          <div className="flex items-center gap-2 text-tiny-semibold text-primary-600 dark:text-primary-400">
            <Building2 className="w-4 h-4" />
            <span>
              {location.buildingName} · {location.wingName}
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-neutral-n900 dark:text-neutral-n10 flex items-center gap-2">
            <span>Ruangan {roomId}</span>
          </DialogTitle>
          <DialogDescription className="text-small-normal text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-n400" />
            <span>
              Lantai 2 · Departemen Teknik Elektro & Informatika (DTEDI) SV UGM
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          {roomDetail ? (
            /* Monitored AP Room: Interactive 6-card MetricsGrid */
            <MetricsGrid
              roomName={roomDetail.name}
              statusLevel={roomDetail.statusLevel}
              estimatedPeople={roomDetail.crowdCount}
              confidence={roomDetail.confidence}
              updatedAt={roomDetail.updatedAt}
              metrics={roomDetail.metrics}
              className="max-w-none shadow-none border-0 p-0 bg-transparent"
            />
          ) : (
            /* Unmonitored Room Notice */
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-n30 dark:bg-neutral-n700 flex items-center justify-center text-neutral-n500 shrink-0">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-neutral-n900 dark:text-neutral-n10">
                    {roomId}
                  </h4>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-n30 dark:bg-neutral-n700 text-tiny-semibold text-neutral-n600 dark:text-neutral-n300 mt-0.5">
                    Ruangan Tanpa Access Point
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-n10 dark:bg-neutral-n700/60 border border-neutral-n30 dark:border-neutral-n600 text-small-normal text-neutral-n600 dark:text-neutral-n300 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-neutral-n800 dark:text-neutral-n100">
                  <Info className="w-4 h-4 text-neutral-n500" />
                  <span>Informasi Pemantauan</span>
                </div>
                <p>
                  Ruangan <strong>{roomId}</strong> ({location.fullLabel}) saat
                  ini belum terpasang perangkat Access Point (AP). Deteksi
                  kepadatan keramaian secara real-time hanya tersedia pada 11
                  ruangan yang telah dilengkapi sensor AP.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
