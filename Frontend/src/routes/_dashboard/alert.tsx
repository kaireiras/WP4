import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { DashboardHeader } from '#/components/ui/dashboard-header'
import { AlertTableCard } from '#/components/pages/alert'

// ─── Search Params Schema ─────────────────────────────────────────────────────
const alertSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  per_page: z.coerce.number().int().positive().catch(20),
})

export const Route = createFileRoute('/_dashboard/alert')({
  validateSearch: (search: Record<string, unknown>) => {
    return alertSearchSchema.parse({
      ...search,
      per_page: search.per_page ?? search.perpage,
    })
  },
  component: AlertPage,
})

function AlertPage() {
  const navigate = useNavigate()
  const { page, per_page } = Route.useSearch()

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/alert',
      search: (prev) => ({
        ...prev,
        page: newPage,
        per_page: prev.per_page ?? per_page,
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
      }),
      replace: true,
    })
  }

  return (
    <>
      {/* 1. Page Header (Figma Main-Header) */}
      <DashboardHeader
        title="Riwayat Crowded"
        subtitle="Lihat riwayat kejadian Crowded dan status penanganannya"
      />

      {/* 2. Alert Table Card with Skeleton Loading & Pagination (Figma 13:71) */}
      <AlertTableCard
        page={page}
        perPage={per_page}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
      />
    </>
  )
}
