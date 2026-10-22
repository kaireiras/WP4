import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { DashboardHeader, DashboardHeaderActions } from '#/components/ui'
import type { TimeRangeValue } from '#/components/ui'
import { AlertTableCard, DUMMY_ALERTS } from '#/components/pages/alert'

// ─── Search Params Schema ─────────────────────────────────────────────────────
const alertSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  per_page: z.coerce.number().int().positive().catch(20),
  range: z.string().catch('1d'),
  from: z.string().optional(),
  to: z.string().optional(),
})

export const Route = createFileRoute('/_dashboard/alert')({
  validateSearch: (search: Record<string, unknown>) => {
    return alertSearchSchema.parse({
      ...search,
      per_page: search.per_page ?? search.perpage,
      range: (typeof search.range === 'string' && search.range) || '1d',
    })
  },
  component: AlertPage,
})

function AlertPage() {
  const navigate = useNavigate()
  const { page, per_page, range, from, to } = Route.useSearch()

  // ─── TanStack Query Integration ─────────────────────────────────────────────
  const alertsQuery = useQuery({
    queryKey: ['alerts', { page, per_page, range, from, to }],
    queryFn: async () => {
      // Simulate real network fetch latency
      await new Promise((resolve) => setTimeout(resolve, 600))
      return DUMMY_ALERTS
    },
  })

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

  return (
    <>
      {/* 1. Page Header with Reusable DashboardHeaderActions (Refresh & TimePicker) */}
      <DashboardHeader
        title="Riwayat Crowded"
        subtitle="Lihat riwayat kejadian Crowded dan status penanganannya"
        actions={
          <DashboardHeaderActions
            showCountdown={false}
            onRefresh={() => alertsQuery.refetch()}
            isRefreshing={alertsQuery.isFetching}
            timeRange={range}
            onTimeRangeChange={handleTimeRangeChange}
          />
        }
      />

      {/* 2. Alert Table Card with Skeleton Loading & Pagination (Figma 13:71) */}
      <AlertTableCard
        data={alertsQuery.data}
        isLoading={alertsQuery.isLoading}
        page={page}
        perPage={per_page}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
      />
    </>
  )
}
