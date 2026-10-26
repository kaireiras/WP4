import * as React from 'react'
import { Calendar as CalendarIcon, Check, ChevronDown } from 'lucide-react'
import { cn } from '#/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/shadcn/dropdown-menu'

export interface TimeRangeValue {
  id: string
  label: string
  badge: string
  from: string
  to: string
}

function formatDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function calculatePresetRange(id: string): { from: string; to: string } {
  const now = new Date()
  const toStr = formatDatetime(now)
  let fromDate = new Date(now)

  switch (id) {
    case '1h':
      fromDate.setHours(now.getHours() - 1)
      break
    case '3h':
      fromDate.setHours(now.getHours() - 3)
      break
    case '6h':
      fromDate.setHours(now.getHours() - 6)
      break
    case '12h':
      fromDate.setHours(now.getHours() - 12)
      break
    case '1d':
      fromDate.setDate(now.getDate() - 1)
      break
    case '2d':
      fromDate.setDate(now.getDate() - 2)
      break
    case '7d':
      fromDate.setDate(now.getDate() - 7)
      break
    case 'today':
      fromDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      )
      break
    case 'yesterday': {
      const yFrom = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
        0,
        0,
        0,
      )
      const yTo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
        23,
        59,
        59,
      )
      return { from: formatDatetime(yFrom), to: formatDatetime(yTo) }
    }
    case 'this_week': {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
      fromDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0)
      break
    }
    case 'prev_week': {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7
      const pFrom = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0)
      const pTo = new Date(
        now.getFullYear(),
        now.getMonth(),
        diff + 6,
        23,
        59,
        59,
      )
      return { from: formatDatetime(pFrom), to: formatDatetime(pTo) }
    }
    case 'this_month':
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      break
    case 'prev_month': {
      const pmFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
      const pmTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return { from: formatDatetime(pmFrom), to: formatDatetime(pmTo) }
    }
    case 'this_year':
      fromDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
      break
    case 'prev_year': {
      const pyFrom = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0)
      const pyTo = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
      return { from: formatDatetime(pyFrom), to: formatDatetime(pyTo) }
    }
    default:
      fromDate.setDate(now.getDate() - 1)
  }

  return { from: formatDatetime(fromDate), to: toStr }
}

const QUICK_PRESETS = [
  { id: '1h', label: 'Past 1 Hour', badge: '1h' },
  { id: '3h', label: 'Past 3 Hours', badge: '3h' },
  { id: '6h', label: 'Past 6 Hours', badge: '6h' },
  { id: '12h', label: 'Past 12 Hours', badge: '12h' },
  { id: '1d', label: 'Past 24 Hours', badge: '1d' },
  { id: '2d', label: 'Past 48 Hours', badge: '2d' },
  { id: '7d', label: 'Past Week', badge: '7d' },
]

const RELATIVE_PRESETS = [
  { id: 'today', label: 'Today', badge: '14h' },
  { id: 'yesterday', label: 'Yesterday', badge: '24h' },
  { id: 'this_week', label: 'This Week', badge: '4d' },
  { id: 'prev_week', label: 'Prev Week', badge: '7d' },
  { id: 'this_month', label: 'This Month', badge: '17d' },
  { id: 'prev_month', label: 'Prev Month', badge: '31d' },
  { id: 'this_year', label: 'This Year', badge: '9mo' },
  { id: 'prev_year', label: 'Prev Year', badge: '1y' },
]

export interface TimeRangePickerProps {
  value?: string
  onChange?: (val: TimeRangeValue) => void
  className?: string
}

export function TimeRangePicker({
  value = '1d',
  onChange,
  className,
}: TimeRangePickerProps) {
  const [selectedId, setSelectedId] = React.useState(value)
  const [isCustomOpen, setIsCustomOpen] = React.useState(false)
  const [customFrom, setCustomFrom] = React.useState('')
  const [customTo, setCustomTo] = React.useState('')

  React.useEffect(() => {
    setSelectedId(value)
  }, [value])

  // Get current active preset or custom label
  const activePreset = React.useMemo(() => {
    const all = [...QUICK_PRESETS, ...RELATIVE_PRESETS]
    return (
      all.find((p) => p.id === selectedId) || {
        id: 'custom',
        label: 'Custom Range',
        badge: 'Custom',
      }
    )
  }, [selectedId])

  const rangeDates = React.useMemo(() => {
    if (selectedId === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }
    return calculatePresetRange(selectedId)
  }, [selectedId, customFrom, customTo])

  const handleSelectPreset = (id: string, label: string, badge: string) => {
    setSelectedId(id)
    setIsCustomOpen(false)
    const { from, to } = calculatePresetRange(id)
    onChange?.({ id, label, badge, from, to })
  }

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) return
    setSelectedId('custom')
    onChange?.({
      id: 'custom',
      label: 'Custom Range',
      badge: 'Custom',
      from: customFrom,
      to: customTo,
    })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'h-[38px] px-3.5 bg-white dark:bg-neutral-n800 border border-slate-200/90 dark:border-neutral-n700 rounded-2xl flex items-center gap-2.5 hover:bg-neutral-n10 dark:hover:bg-neutral-n700/60 transition-colors shadow-2xs cursor-pointer select-none text-left',
            className,
          )}
          aria-label="Pilih rentang waktu"
        >
          {/* Badge Indicator */}
          <span className="bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 font-bold text-[11px] leading-tight px-1.5 py-0.5 rounded border border-primary-200/60 dark:border-primary-800/60 shrink-0">
            {activePreset.badge}
          </span>

          {/* Formatted Date Range String */}
          <span className="text-xs font-semibold text-neutral-n900 dark:text-neutral-n100 tracking-tight whitespace-nowrap">
            {rangeDates.from} - {rangeDates.to}
          </span>

          {/* Dropdown Chevron */}
          <ChevronDown className="size-3.5 text-neutral-500 shrink-0 ml-auto" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 sm:w-80 p-2 max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 shadow-xl rounded-xl z-50"
      >
        {/* Quick Ranges */}
        <DropdownMenuLabel className="text-[11px] font-bold text-neutral-n500 uppercase tracking-wider px-2 py-1">
          Rentang Terakhir
        </DropdownMenuLabel>
        <div className="space-y-0.5">
          {QUICK_PRESETS.map((preset) => {
            const isSelected = selectedId === preset.id
            return (
              <DropdownMenuItem
                key={preset.id}
                onClick={() =>
                  handleSelectPreset(preset.id, preset.label, preset.badge)
                }
                className={cn(
                  'text-xs cursor-pointer flex items-center justify-between py-1.5 px-2 font-medium rounded-md transition-colors',
                  isSelected &&
                    'font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-block w-8 text-center text-[11px] font-mono font-semibold py-0.5 rounded bg-neutral-n20 dark:bg-neutral-n700 text-neutral-n700 dark:text-neutral-n200">
                    {preset.badge}
                  </span>
                  <span>{preset.label}</span>
                </div>
                {isSelected && (
                  <Check className="size-3.5 text-primary-600 shrink-0" />
                )}
              </DropdownMenuItem>
            )
          })}
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Relative Calendar Ranges */}
        <DropdownMenuLabel className="text-[11px] font-bold text-neutral-n500 uppercase tracking-wider px-2 py-1">
          Kalender Relatif
        </DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-1 px-1">
          {RELATIVE_PRESETS.map((preset) => {
            const isSelected = selectedId === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  handleSelectPreset(preset.id, preset.label, preset.badge)
                }
                className={cn(
                  'text-xs cursor-pointer flex items-center justify-between py-1.5 px-2 font-medium rounded-md text-left transition-colors',
                  isSelected
                    ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40'
                    : 'text-neutral-n800 dark:text-neutral-n200 hover:bg-neutral-n20 dark:hover:bg-neutral-n700',
                )}
              >
                <span className="truncate">{preset.label}</span>
                <span className="text-[10px] text-neutral-400 font-mono ml-1">
                  {preset.badge}
                </span>
              </button>
            )
          })}
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Custom Range */}
        {!isCustomOpen ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setIsCustomOpen(true)
            }}
            className="w-full text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary-50/60 dark:hover:bg-primary-950/30 cursor-pointer transition-colors"
          >
            <CalendarIcon className="size-3.5" />
            <span>Custom range...</span>
          </button>
        ) : (
          <div className="p-2 space-y-2 bg-neutral-n10 dark:bg-neutral-n700/40 rounded-lg border border-neutral-n30 dark:border-neutral-n700">
            <span className="text-[11px] font-bold text-neutral-n700 dark:text-neutral-n200 block">
              Pilih Tanggal & Waktu:
            </span>
            <div className="space-y-1.5 text-xs">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">
                  Dari:
                </label>
                <input
                  type="datetime-local"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full h-7 px-2 text-xs rounded border border-neutral-n40 dark:border-neutral-n600 bg-white dark:bg-neutral-n800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">
                  Sampai:
                </label>
                <input
                  type="datetime-local"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full h-7 px-2 text-xs rounded border border-neutral-n40 dark:border-neutral-n600 bg-white dark:bg-neutral-n800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={!customFrom || !customTo}
              className="w-full mt-1.5 py-1 text-xs font-bold bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded transition-colors cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
