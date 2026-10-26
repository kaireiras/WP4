import * as React from 'react'
import { CheckIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '#/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/shadcn/dropdown-menu'

export interface AlertPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  className?: string
}

export function AlertPagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  className,
}: AlertPaginationProps) {
  const [inputVal, setInputVal] = React.useState(String(perPage))

  React.useEffect(() => {
    setInputVal(String(perPage))
  }, [perPage])

  const handleCommit = () => {
    const parsed = parseInt(inputVal, 10)
    if (isNaN(parsed) || parsed < 1) {
      setInputVal(String(perPage))
      return
    }
    const clamped = Math.min(parsed, 500)
    setInputVal(String(clamped))
    if (clamped !== perPage) {
      onPerPageChange(clamped)
    }
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalItems)

  // Generate visible page numbers (up to 5 pages)
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5]
    }

    if (currentPage >= totalPages - 2) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ]
  }

  const pages = getVisiblePages()

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 py-4 px-4 text-xs font-sans text-neutral-n700 dark:text-neutral-n300 select-none border-t border-neutral-n30 dark:border-neutral-n700',
        className,
      )}
    >
      {/* Item Range Summary */}
      <span className="text-muted-foreground whitespace-nowrap">
        {startItem}-{endItem} of {totalItems} items
      </span>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
          className="size-7 inline-flex items-center justify-center rounded-md hover:bg-neutral-n20 dark:hover:bg-neutral-n700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-neutral-600 dark:text-neutral-300"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pages.map((pageNum) => {
          const isActive = pageNum === currentPage
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'size-7 inline-flex items-center justify-center rounded-md text-xs font-semibold transition-all cursor-pointer',
                isActive
                  ? 'bg-primary-600 text-white shadow-xs font-bold'
                  : 'text-neutral-n700 dark:text-neutral-n300 hover:bg-neutral-n20 dark:hover:bg-neutral-n700',
              )}
            >
              {pageNum}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
          className="size-7 inline-flex items-center justify-center rounded-md hover:bg-neutral-n20 dark:hover:bg-neutral-n700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-neutral-600 dark:text-neutral-300"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Per-Page Selector */}
      <div className="flex items-center gap-1.5 whitespace-nowrap text-xs">
        <span className="text-neutral-n700 dark:text-neutral-n300 font-medium">
          Per-Page:
        </span>
        <div className="inline-flex items-center gap-1 border-b border-neutral-n900 dark:border-neutral-n100 pb-0.5 focus-within:border-primary-600 transition-colors">
          <input
            type="number"
            min={1}
            max={500}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommit()
                e.currentTarget.blur()
              }
            }}
            style={{ width: `${Math.max(2, inputVal.length)}ch` }}
            className="text-center font-bold bg-transparent text-neutral-n900 dark:text-neutral-n100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 cursor-text leading-tight"
            title="Ketik angka per halaman lalu tekan Enter"
            aria-label="Jumlah baris per halaman"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-0.5 text-neutral-n900 dark:text-neutral-n100 hover:text-primary-600 transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
                aria-label="Pilih opsi per halaman"
              >
                <ChevronDown className="size-3.5 stroke-[2.5]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[5.5rem] p-1 bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 shadow-md rounded-lg"
            >
              {[10, 20, 50, 100].map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => {
                    setInputVal(String(option))
                    onPerPageChange(option)
                  }}
                  className={cn(
                    'text-xs cursor-pointer justify-between py-1.5 px-2 font-medium rounded-md hover:bg-neutral-n20 dark:hover:bg-neutral-n700 transition-colors',
                    perPage === option &&
                      'font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40',
                  )}
                >
                  <span>{option}</span>
                  {perPage === option && (
                    <CheckIcon className="size-3 text-primary-600 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
