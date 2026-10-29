import * as React from 'react'
import { Calendar, CheckCircle2 } from 'lucide-react'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  useLegacyTable as useReactTable,
} from '@tanstack/react-table/legacy'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { toast } from 'sonner'
import { DUMMY_ALERTS } from './alert-data'
import type { AlertItem } from './alert-data'
import { AlertStatusBadge } from './alert-status-badge'
import { AlertPagination } from './alert-pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/shadcn/table'
import { TableSkeleton } from '#/components/ui/shadcn/table-skeleton'
import { StatusLevel } from '#/components/ui/status-level'
import { cn } from '#/lib/utils'

export interface AlertTableCardProps {
  data?: Array<AlertItem>
  isLoading?: boolean
  className?: string
  page?: number
  perPage?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  onAcknowledge?: (item: AlertItem) => void
}

export function AlertTableCard({
  data = DUMMY_ALERTS,
  isLoading = false,
  className,
  page: controlledPage,
  perPage: controlledPerPage,
  onPageChange: controlledOnPageChange,
  onPerPageChange: controlledOnPerPageChange,
  onAcknowledge,
}: AlertTableCardProps) {
  const [alerts, setAlerts] = React.useState<Array<AlertItem>>(data)
  const [internalPage, setInternalPage] = React.useState(1)
  const [internalPerPage, setInternalPerPage] = React.useState(20)

  const currentPage = controlledPage ?? internalPage
  const perPage = controlledPerPage ?? internalPerPage

  // Sync internal state when external data prop changes
  React.useEffect(() => {
    setAlerts(data)
  }, [data])

  // Pagination calculation
  const totalItems = alerts.length
  const totalPages = Math.ceil(totalItems / perPage) || 1
  const startIndex = (currentPage - 1) * perPage
  const paginatedAlerts = React.useMemo(
    () => alerts.slice(startIndex, startIndex + perPage),
    [alerts, startIndex, perPage],
  )

  // Handle acknowledge action
  const handleAcknowledge = React.useCallback(
    (id: string) => {
      const target = alerts.find((a) => a.id === id)
      if (!target) return

      const now = new Date()
      const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

      let updatedItem: AlertItem = target

      setAlerts((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const nextStatus =
              item.status === 'active' ? 'acknowledged' : 'active'
            updatedItem = {
              ...item,
              status: nextStatus,
              ackAt: nextStatus === 'acknowledged' ? formattedNow : null,
            }
            return updatedItem
          }
          return item
        }),
      )

      onAcknowledge?.(updatedItem)

      if (target.status === 'active') {
        toast.success(
          `Alert #${target.no} (${target.estCount}) berhasil di-acknowledge!`,
          {
            description: target.roomName ?? 'Status telah diperbarui.',
          },
        )
      } else {
        toast.info(`Status Alert #${target.no} dikembalikan ke Active.`)
      }
    },
    [alerts, onAcknowledge],
  )

  // Define table columns using TanStack Table ColumnDef
  const columns = React.useMemo<Array<ColumnDef<AlertItem>>>(
    () => [
      {
        id: 'no',
        header: 'No.',
        cell: ({ row }) => (
          <span className="text-xs font-bold text-neutral-n800 dark:text-neutral-n200 pl-2">
            {startIndex + row.index + 1}.
          </span>
        ),
      },
      {
        accessorKey: 'timestamp',
        header: 'Waktu',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-n800 dark:text-neutral-n200 whitespace-nowrap">
            <Calendar className="size-3.5 text-neutral-n600 dark:text-neutral-400 shrink-0" />
            <span>{row.original.timestamp}</span>
          </div>
        ),
      },
      {
        accessorKey: 'roomName',
        header: 'Ruangan',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-neutral-n800 dark:text-neutral-n200 whitespace-nowrap">
            {row.original.roomName ?? '-'}
          </span>
        ),
      },
      {
        accessorKey: 'level',
        header: 'Level',
        cell: ({ row }) => (
          <StatusLevel status={row.original.level} size="sm" />
        ),
      },
      {
        accessorKey: 'estCount',
        header: 'EST. Count',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-neutral-n800 dark:text-neutral-n200 whitespace-nowrap">
            {row.original.estCount}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <AlertStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'ackAt',
        header: 'Ack. At',
        cell: ({ row }) =>
          row.original.ackAt ? (
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-n800 dark:text-neutral-n200 whitespace-nowrap">
              <Calendar className="size-3.5 text-neutral-n600 dark:text-neutral-400 shrink-0" />
              <span>{row.original.ackAt}</span>
            </div>
          ) : (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono pl-4">
              -
            </span>
          ),
      },
      {
        id: 'action',
        header: () => <span className="text-right block pr-1">Action</span>,
        cell: ({ row }) => {
          const item = row.original
          const isActive = item.status === 'active'
          return (
            <div className="text-right pr-1">
              <button
                type="button"
                onClick={() => handleAcknowledge(item.id)}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95',
                  isActive
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                    : 'bg-neutral-n20 dark:bg-neutral-n700 border border-neutral-n40 dark:border-neutral-n600 text-neutral-n700 dark:text-neutral-n200 hover:bg-neutral-n30',
                )}
              >
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>Acknowledge</span>
              </button>
            </div>
          )
        },
      },
    ],
    [startIndex, handleAcknowledge],
  )

  const table = useReactTable({
    data: paginatedAlerts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handlePageChange = (newPage: number) => {
    if (controlledOnPageChange) {
      controlledOnPageChange(newPage)
    } else {
      setInternalPage(newPage)
    }
  }

  const handlePerPageChange = (newPerPage: number) => {
    if (controlledOnPerPageChange) {
      controlledOnPerPageChange(newPerPage)
    } else {
      setInternalPerPage(newPerPage)
      setInternalPage(1)
    }
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-2xl shadow-md overflow-hidden flex flex-col',
        className,
      )}
    >
      {/* Table Content */}
      {isLoading ? (
        <TableSkeleton
          columns={columns.length}
          rows={perPage}
          className="border-0 rounded-none bg-transparent"
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f8fafd] dark:bg-neutral-n800/90 border-b border-neutral-n40 dark:border-neutral-n700">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-neutral-n40 dark:border-neutral-n700"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-extrabold text-neutral-n900 dark:text-neutral-n100 px-4 py-3"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="h-[58px] hover:bg-neutral-n20/50 dark:hover:bg-neutral-n700/40 border-b border-neutral-n30/70 dark:border-neutral-n700/70 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    Tidak ada data riwayat kejadian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (
        <AlertPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          perPage={perPage}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      )}
    </div>
  )
}
