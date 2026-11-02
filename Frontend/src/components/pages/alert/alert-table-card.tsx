import * as React from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  useLegacyTable as useReactTable,
} from '@tanstack/react-table/legacy'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
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
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  acknowledgingId?: string | null
  className?: string
  page?: number
  perPage?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  onAcknowledge?: (item: AlertItem) => void
}

export function AlertTableCard({
  data = [],
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  acknowledgingId = null,
  className,
  page: controlledPage,
  perPage: controlledPerPage,
  onPageChange: controlledOnPageChange,
  onPerPageChange: controlledOnPerPageChange,
  onAcknowledge,
}: AlertTableCardProps) {
  const [internalPage, setInternalPage] = React.useState(1)
  const [internalPerPage, setInternalPerPage] = React.useState(20)

  const currentPage = controlledPage ?? internalPage
  const perPage = controlledPerPage ?? internalPerPage

  // Pagination
  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / perPage) || 1
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * perPage
  const paginatedAlerts = React.useMemo(
    () => data.slice(startIndex, startIndex + perPage),
    [data, startIndex, perPage],
  )

  // Table Columns
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
          const isProcessing = acknowledgingId === item.id

          return (
            <div className="text-right pr-1">
              <button
                type="button"
                disabled={!isActive || isProcessing}
                onClick={() => isActive && onAcknowledge?.(item)}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-xs',
                  isActive
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed'
                    : 'bg-neutral-n20 dark:bg-neutral-n700 border border-neutral-n40 dark:border-neutral-n600 text-neutral-n500 dark:text-neutral-n400 cursor-not-allowed',
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>{isActive ? 'Acknowledge' : 'Acknowledged'}</span>
                  </>
                )}
              </button>
            </div>
          )
        },
      },
    ],
    [startIndex, acknowledgingId, onAcknowledge],
  )

  const table = useReactTable({
    data: paginatedAlerts,
    columns,
    getRowId: (row) => row.id,
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
          rows={Math.min(perPage, 10)}
          className="border-0 rounded-none bg-transparent"
        />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
          <div className="size-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-neutral-n900 dark:text-neutral-n100">
              Gagal memuat riwayat alert
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              {errorMessage ?? 'Terjadi gangguan koneksi ke server API.'}
            </p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>Coba Lagi</span>
            </button>
          )}
        </div>
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
      {!isLoading && !isError && (
        <AlertPagination
          currentPage={safePage}
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
