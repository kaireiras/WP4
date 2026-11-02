import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { DashboardHeader } from '#/components/ui'
import { Button } from '#/components/ui/shadcn/button'
import {
  ApAddDialog,
  ApDeleteDialog,
  ApEditDialog,
  ApTableCard,
} from '#/components/pages/ap'
import type { ApFormErrors, ApRecord } from '#/components/pages/ap'
import type { CreateApInput, UpdateApInput } from '#/services/apService'
import { createAp, deleteAp, getAps, updateAp } from '#/services/apService'

// Search params schema for pagination
const apSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  per_page: z.coerce.number().int().positive().catch(20),
})

export const Route = createFileRoute('/_dashboard/ap')({
  validateSearch: (search: Record<string, unknown>) => {
    return apSearchSchema.parse({
      ...search,
      per_page: search.per_page ?? search.perpage,
    })
  },
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery({
      queryKey: ['admin-aps'],
      queryFn: () => getAps(),
    })
  },
  component: ApManagementPage,
})

function ApManagementPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { page, per_page } = Route.useSearch()

  // Server functions
  const getApsFn = useServerFn(getAps)
  const createApFn = useServerFn(createAp)
  const updateApFn = useServerFn(updateAp)
  const deleteApFn = useServerFn(deleteAp)

  // Dialog states
  const [open, setOpen] = React.useState(false)
  const [addErrors, setAddErrors] = React.useState<ApFormErrors>(null)
  const [editingAp, setEditingAp] = React.useState<ApRecord | null>(null)
  const [editErrors, setEditErrors] = React.useState<ApFormErrors>(null)
  const [deletingAp, setDeletingAp] = React.useState<ApRecord | null>(null)

  // Fetch AP list
  const apsQuery = useQuery({
    queryKey: ['admin-aps'],
    queryFn: () => getApsFn(),
    staleTime: 1000 * 30,
  })

  // Handlers matching Fe-Voting pattern
  const handleAdd = async (payload: CreateApInput): Promise<boolean> => {
    setAddErrors(null)
    try {
      const result = await createApFn({ data: payload })
      toast.success(result.message || 'Access Point berhasil ditambahkan.')
      queryClient.invalidateQueries({ queryKey: ['admin-aps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
      setOpen(false)
      return true
    } catch (error: any) {
      const errors = error?.response?.data?.errors as ApFormErrors
      setAddErrors(errors)
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal menambahkan Access Point.'
      toast.error(msg)
      return false
    }
  }

  const handleEdit = async (payload: UpdateApInput): Promise<boolean> => {
    setEditErrors(null)
    try {
      const result = await updateApFn({ data: payload })
      toast.success(result.message || 'Data Access Point berhasil diperbarui.')
      queryClient.invalidateQueries({ queryKey: ['admin-aps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
      setEditingAp(null)
      return true
    } catch (error: any) {
      const errors = error?.response?.data?.errors as ApFormErrors
      setEditErrors(errors)
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal memperbarui Access Point.'
      toast.error(msg)
      return false
    }
  }

  const handleDelete = async (apId: string): Promise<boolean> => {
    try {
      const result = await deleteApFn({ data: { apId } })
      toast.success(
        result.message || 'Access Point berhasil dihapus dari pemantauan.',
      )
      queryClient.invalidateQueries({ queryKey: ['admin-aps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
      setDeletingAp(null)
      return true
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Gagal menghapus Access Point.'
      toast.error(msg)
      return false
    }
  }

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/ap',
      search: (prev) => ({
        ...prev,
        page: newPage,
        per_page: prev.per_page ?? per_page,
      }),
      replace: true,
    })
  }

  const handlePerPageChange = (newPerPage: number) => {
    navigate({
      to: '/ap',
      search: (prev) => ({
        ...prev,
        page: 1,
        per_page: newPerPage,
      }),
      replace: true,
    })
  }

  const apRecords = apsQuery.data?.data ?? []

  return (
    <>
      {/* Header */}
      <DashboardHeader
        title="AP Management"
        subtitle="Kelola daftar Access Point (AP) yang dipantau"
        actions={
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="h-[38px] px-[18px] py-[10px] rounded-[10px] bg-[#0B4088] hover:bg-[#083066] text-white font-bold text-sm shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>New AP</span>
          </Button>
        }
      />

      {/* Main Table Card */}
      <ApTableCard
        data={apRecords}
        isLoading={apsQuery.isLoading}
        isError={apsQuery.isError}
        errorMessage={
          apsQuery.error instanceof Error ? apsQuery.error.message : undefined
        }
        onRetry={() => apsQuery.refetch()}
        onAddNew={() => setOpen(true)}
        onEdit={(ap) => setEditingAp(ap)}
        onDelete={(ap) => setDeletingAp(ap)}
        page={page}
        perPage={per_page}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
      />

      {/* Add AP Dialog */}
      <ApAddDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) setAddErrors(null)
        }}
        onCreate={handleAdd}
        errors={addErrors}
      />

      {/* Edit AP Dialog */}
      <ApEditDialog
        open={Boolean(editingAp)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingAp(null)
            setEditErrors(null)
          }
        }}
        ap={editingAp}
        onUpdate={handleEdit}
        errors={editErrors}
      />

      {/* Delete AP Confirmation Dialog */}
      <ApDeleteDialog
        open={Boolean(deletingAp)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingAp(null)
        }}
        ap={deletingAp}
        onConfirm={handleDelete}
      />
    </>
  )
}
