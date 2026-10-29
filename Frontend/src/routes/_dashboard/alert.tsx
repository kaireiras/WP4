import { useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { Check, ChevronDown, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { DashboardHeader, DashboardHeaderActions } from '#/components/ui'
import type { TimeRangeValue } from '#/components/ui'
import { calculatePresetRange } from '#/components/ui/time-range-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/shadcn/dropdown-menu'
import { AlertTableCard } from '#/components/pages/alert'
import type { AlertItem } from '#/components/pages/alert'
import {
  acknowledgeAlert,
  getAlerts,
  mapApiAlertToAlertItem,
} from '#/services/alertService'
import type { ApiAlertStatus } from '#/services/alertService'
import { normalizeHistoryDateParam } from '#/services/historyService'
import { cn } from '#/lib/utils'

// Search Params Schema
const alertSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  per_page: z.coerce.number().int().positive().catch(20),
  status: z.enum(['ACTIVE', 'ACKNOWLEDGED']).optional().catch(undefined),
  range: z.string().catch('today'),
  from: z.string().optional(),
  to: z.string().optional(),
})

const STATUS_OPTIONS: Array<{
  value: ApiAlertStatus | undefined
  label: string
}> = [
  { value: undefined, label: 'Semua Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
]

export const Route = createFileRoute('/_dashboard/alert')({
  validateSearch: (search: Record<string, unknown>) => {
    const rawStatus =
      typeof search.status === 'string' && search.status.trim() !== ''
        ? search.status.trim().toUpperCase()
        : undefined
    return alertSearchSchema.parse({
      ...search,
      status: rawStatus,
      per_page: search.per_page ?? search.perpage,
      range: (typeof search.range === 'string' && search.range) || 'today',
    })
  },
  loaderDeps: ({ search }) => ({
    status: search.status,
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.prefetchQuery({
      queryKey: ['alerts', { status: deps.status }],
      queryFn: () => getAlerts({ data: { params: { status: deps.status } } }),
    })
  },
  component: AlertPage,
})

function AlertPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { page, per_page, status, range, from, to } = Route.useSearch()

  const getAlertsFn = useServerFn(getAlerts)
  const acknowledgeAlertFn = useServerFn(acknowledgeAlert)

  // Fetch Alerts
  const alertsQuery = useQuery({
    queryKey: ['alerts', { status }],
    queryFn: () => getAlertsFn({ data: { params: { status } } }),
    staleTime: 1000 * 30,
  })

  // Acknowledge Mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (id: number) => acknowledgeAlertFn({ data: { id } }),
    onSuccess: (result) => {
      toast.success(result.message || 'Alert berhasil di-acknowledge.')
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengonfirmasi alert.')
    },
  })

  const filteredAlerts = useMemo(() => {
    const rawList = alertsQuery.data?.data ?? []
    const mapped = rawList.map((item, idx) => mapApiAlertToAlertItem(item, idx))

    const bounds = from && to ? { from, to } : calculatePresetRange(range)
    const startBound = normalizeHistoryDateParam(bounds.from, false)
    const endBound = normalizeHistoryDateParam(bounds.to, true)

    return mapped
      .filter((item) => {
        if (startBound && item.timestamp < startBound) return false
        if (endBound && item.timestamp > endBound) return false
        return true
      })
      .map((item, idx) => ({
        ...item,
        no: idx + 1,
      }))
  }, [alertsQuery.data, range, from, to])

  const handleAcknowledge = (item: AlertItem) => {
    const numericId = Number(item.id)
    if (!Number.isFinite(numericId) || acknowledgeMutation.isPending) return
    acknowledgeMutation.mutate(numericId)
  }

  const handleStatusChange = (nextStatus: ApiAlertStatus | undefined) => {
    navigate({
      to: '/alert',
      search: (prev) => ({
        ...prev,
        status: nextStatus,
        page: 1,
        per_page: prev.per_page ?? per_page,
        range: prev.range ?? range,
      }),
      replace: true,
    })
  }

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/alert',
      search: (prev) => ({
        ...prev,
        page: newPage,
        per_page: prev.per_page ?? per_page,
        range: prev.range ?? range,
      }),
      replace: true,
    })
  }

  const handlePerPageChange = (newPageSize: number) => {
    navigate({
      to: '/alert',
      search: (prev) => ({
        ...prev,
        per_page: newPageSize,
        page: 1,
        range: prev.range ?? range,
      }),
      replace: true,
    })
  }

  const handleTimeRangeChange = (val: TimeRangeValue) => {
    navigate({
      to: '/alert',
      search: (prev) => ({
        ...prev,
        range: val.id,
        from: val.from,
        to: val.to,
        page: 1,
        per_page: prev.per_page ?? per_page,
      }),
      replace: true,
    })
  }

  const activeStatusLabel =
    STATUS_OPTIONS.find((opt) => opt.value === status)?.label ?? 'Semua Status'

  const acknowledgingId = acknowledgeMutation.isPending
    ? String(acknowledgeMutation.variables)
    : null

  return (
    <>
      {/* Header */}
      <DashboardHeader
        title="Riwayat Crowded"
        subtitle="Lihat riwayat kejadian Crowded dan status penanganannya"
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Filter */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-[38px] px-3.5 bg-white dark:bg-neutral-n800 border border-slate-200/90 dark:border-neutral-n700 rounded-2xl flex items-center gap-2 hover:bg-neutral-n10 dark:hover:bg-neutral-n700/60 transition-colors shadow-2xs cursor-pointer select-none text-xs font-semibold text-neutral-n900 dark:text-neutral-n100"
                  aria-label="Filter status alert"
                >
                  <Filter className="size-3.5 text-slate-500 shrink-0" />
                  <span>{activeStatusLabel}</span>
                  <ChevronDown className="size-3.5 text-neutral-500 shrink-0 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 p-1.5 bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 shadow-xl rounded-xl z-50"
              >
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = status === opt.value
                  return (
                    <DropdownMenuItem
                      key={opt.label}
                      onClick={() => handleStatusChange(opt.value)}
                      className={cn(
                        'text-xs cursor-pointer flex items-center justify-between py-1.5 px-2.5 font-medium rounded-md transition-colors',
                        isSelected &&
                          'font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40',
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check className="size-3.5 text-primary-600 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DashboardHeaderActions
              showCountdown={false}
              onRefresh={() => alertsQuery.refetch()}
              isRefreshing={alertsQuery.isFetching}
              timeRange={range}
              timeFrom={from}
              timeTo={to}
              onTimeRangeChange={handleTimeRangeChange}
            />
          </div>
        }
      />

      {/* Alert Table Card */}
      <AlertTableCard
        data={filteredAlerts}
        isLoading={alertsQuery.isLoading}
        isError={alertsQuery.isError}
        errorMessage={
          alertsQuery.error instanceof Error
            ? alertsQuery.error.message
            : undefined
        }
        onRetry={() => alertsQuery.refetch()}
        acknowledgingId={acknowledgingId}
        onAcknowledge={handleAcknowledge}
        page={page}
        perPage={per_page}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
      />
    </>
  )
}
