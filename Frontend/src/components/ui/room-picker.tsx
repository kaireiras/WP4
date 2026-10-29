import * as React from 'react'
import { Check, ChevronDown, DoorOpen } from 'lucide-react'
import { MONITORED_ROOM_IDS } from './denah'
import { resolveRoomDisplayLocation } from '#/services/alertService'
import { cn } from '#/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/shadcn/dropdown-menu'

export interface RoomOption {
  id: string
  name: string
  building: string
  wing?: string
}

export const ROOM_OPTIONS: Array<RoomOption> = [
  { id: 'all', name: 'Semua Ruangan', building: 'Seluruh Gedung' },
  ...MONITORED_ROOM_IDS.map((id) => {
    const loc = resolveRoomDisplayLocation(id)
    return {
      id,
      name: id,
      building: loc.buildingName,
      wing: loc.wingName,
    }
  }),
]

export interface RoomPickerProps {
  value?: string
  onChange?: (roomId: string) => void
  extraRooms?: Array<string>
  className?: string
}

export function RoomPicker({
  value = 'all',
  onChange,
  extraRooms = [],
  className,
}: RoomPickerProps) {
  const [selectedId, setSelectedId] = React.useState(value)

  React.useEffect(() => {
    setSelectedId(value)
  }, [value])

  const allOptions = React.useMemo<Array<RoomOption>>(() => {
    const dynamicExtras: Array<RoomOption> = []
    const existingIds = new Set(ROOM_OPTIONS.map((r) => r.id))

    extraRooms.forEach((rawId) => {
      const id = rawId.trim()
      if (!id || existingIds.has(id)) return
      existingIds.add(id)

      const loc = resolveRoomDisplayLocation(id)
      dynamicExtras.push({
        id,
        name: id,
        building: loc.buildingName,
        wing: loc.wingName,
      })
    })

    return [...ROOM_OPTIONS, ...dynamicExtras]
  }, [extraRooms])

  const currentRoom = React.useMemo(() => {
    return (
      allOptions.find((r) => r.id === selectedId) ?? {
        id: selectedId,
        name: selectedId === 'all' ? 'Semua Ruangan' : selectedId,
        building: 'Ruangan AP Terdaftar',
      }
    )
  }, [allOptions, selectedId])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    onChange?.(id)
  }

  const groupedBuildings = React.useMemo(() => {
    const list = allOptions.filter((r) => r.id !== 'all')
    const map = new Map<string, Array<RoomOption>>()
    for (const r of list) {
      if (!map.has(r.building)) {
        map.set(r.building, [])
      }
      map.get(r.building)?.push(r)
    }
    return Array.from(map.entries())
  }, [allOptions])

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'h-[38px] px-3.5 bg-white dark:bg-neutral-n800 border border-slate-200/90 dark:border-neutral-n700 rounded-2xl flex items-center gap-2 hover:bg-neutral-n10 dark:hover:bg-neutral-n700/60 transition-colors shadow-2xs cursor-pointer select-none text-left',
            className,
          )}
          aria-label="Pilih ruangan"
        >
          {/* Room Name */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-n900 dark:text-neutral-n100 whitespace-nowrap">
            <DoorOpen className="size-3.5 text-slate-500 shrink-0" />
            <span className="font-bold">{currentRoom.name}</span>
            {currentRoom.id !== 'all' && currentRoom.wing && (
              <span className="text-[11px] font-normal text-slate-400 hidden sm:inline">
                ({currentRoom.wing})
              </span>
            )}
          </div>

          {/* Chevron */}
          <ChevronDown className="size-3.5 text-neutral-500 shrink-0 ml-1" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64 max-h-[80vh] overflow-y-auto bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 shadow-xl rounded-xl p-1.5 z-50"
      >
        {/* All Rooms Option */}
        <DropdownMenuItem
          onClick={() => handleSelect('all')}
          className={cn(
            'text-xs cursor-pointer flex items-center justify-between py-1.5 px-2 font-medium rounded-md transition-colors',
            selectedId === 'all' &&
              'font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-8 text-center text-[11px] font-mono font-semibold py-0.5 rounded bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300">
              ALL
            </span>
            <span>Semua Ruangan</span>
          </div>
          {selectedId === 'all' && (
            <Check className="size-3.5 text-primary-600 shrink-0" />
          )}
        </DropdownMenuItem>

        {/* Grouped Rooms */}
        {groupedBuildings.map(([buildingName, rooms]) => (
          <React.Fragment key={buildingName}>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuLabel className="text-[11px] font-bold text-neutral-n500 uppercase tracking-wider px-2 py-1">
              {buildingName}
            </DropdownMenuLabel>
            <div className="space-y-0.5">
              {rooms.map((room) => {
                const isSelected = selectedId === room.id
                return (
                  <DropdownMenuItem
                    key={room.id}
                    onClick={() => handleSelect(room.id)}
                    className={cn(
                      'text-xs cursor-pointer flex items-center justify-between py-1.5 px-2 font-medium rounded-md transition-colors',
                      isSelected &&
                        'font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-block min-w-14 px-1.5 text-center text-[11px] font-mono font-semibold py-0.5 rounded bg-neutral-n20 dark:bg-neutral-n700 text-neutral-n700 dark:text-neutral-n200">
                        {room.name}
                      </span>
                      <span className="text-neutral-500 text-[11px]">
                        {room.wing}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="size-3.5 text-primary-600 shrink-0" />
                    )}
                  </DropdownMenuItem>
                )
              })}
            </div>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
