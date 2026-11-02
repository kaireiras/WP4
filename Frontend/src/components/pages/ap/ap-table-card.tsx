import * as React from 'react'
import { AlertCircle, Calendar, Edit2, RefreshCw, Trash2 } from 'lucide-react'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  useLegacyTable as useReactTable,
} from '@tanstack/react-table/legacy'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import type { ApItem } from './ap-data'
import { mapApRecordToItem } from './ap-data'
import { ApPagination } from './ap-pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/shadcn/table'
import { TableSkeleton } from '#/components/ui/shadcn/table-skeleton'
import type { ApRegistryRecord } from '#/services/apService'
import { cn } from '#/lib/utils'

export interface ApTableCardProps {
  data?: Array<ApRegistryRecord>
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  onAddNew?: () => void
  onEdit?: (ap: ApRegistryRecord) => void
  onDelete?: (ap: ApRegistryRecord) => void
  page?: number
  perPage?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  className?: string
}

export function ApTableCard({
  data = [],
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  onAddNew: _onAddNew,
  onEdit,
  onDelete,
  page: controlledPage,
  perPage: controlledPerPage,
  onPageChange: controlledOnPageChange,
  onPerPageChange: controlledOnPerPageChange,
  className,
}: ApTableCardProps) {
  const [internalPage, setInternalPage] = React.useState(1)
  const [internalPerPage, setInternalPerPage] = React.useState(20)

  const currentPage = controlledPage ?? internalPage
  const perPage = controlledPerPage ?? internalPerPage

  // Pagination calculation
  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / perPage) || 1
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * perPage

  const paginatedData = React.useMemo(
    () => data.slice(startIndex, startIndex + perPage),
    [data, startIndex, perPage],
  )

  const mappedItems: Array<ApItem> = React.useMemo(() => {
    return paginatedData.map((record, index) =>
      mapApRecordToItem(record, startIndex + index),
    )
  }, [paginatedData, startIndex])

  // Table Columns
  const columns = React.useMemo<Array<ColumnDef<ApItem>>>(
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
        accessorKey: 'ap_id',
        header: 'AP ID',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-neutral-n800 dark:text-neutral-n200 whitespace-nowrap">
            {row.original.ap_id}
          </span>
        ),
      },
      {
        accessorKey: 'ip_address',
        header: 'IP Address',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-neutral-n800 dark:text-neutral-n200 whitespace-nowrap">
            {row.original.ip_address}
          </span>
        ),
      },
      {
        accessorKey: 'snmp_community',
        header: 'SNMP Community',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-neutral-n800 dark:text-neutral-n200 whitespace-nowrap">
            {row.original.snmp_community}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-n800 dark:text-neutral-n200 whitespace-nowrap">
            <Calendar className="size-3.5 text-neutral-n600 dark:text-neutral-400 shrink-0" />
            <span>{row.original.created_at}</span>
          </div>
        ),
      },
      {
        id: 'action',
        header: () => <span className="text-right block pr-1">Action</span>,
        cell: ({ row }) => {
          const originalRecord = paginatedData[row.index]
          return (
            <div className="flex items-center justify-end gap-2 pr-1">
              {/* Edit Button */}
              <button
                type="button"
                onClick={() => onEdit?.(originalRecord)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#0E53B0] hover:bg-[#0a428e] shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Edit2 className="size-3.5 text-white stroke-[2.5]" />
                <span>Edit</span>
              </button>

              {/* Hapus Button */}
              <button
                type="button"
                onClick={() => onDelete?.(originalRecord)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#E11D48] hover:bg-[#c0153c] shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="size-3.5 text-white stroke-[2.5]" />
                <span>Hapus</span>
              </button>
            </div>
          )
        },
      },
    ],
    [startIndex, paginatedData, onEdit, onDelete],
  )

  const table = useReactTable({
    data: mappedItems,
    columns,
    getRowId: (row) => row.ap_id,
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
              Gagal memuat daftar Access Point
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
                    Tidak ada data Access Point.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && !isError && (
        <ApPagination
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
