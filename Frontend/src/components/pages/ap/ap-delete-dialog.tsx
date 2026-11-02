import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { ApRegistryRecord } from '#/services/apService'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/shadcn/alert-dialog'

export interface ApDeleteDialogProps {
  open?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  ap: ApRegistryRecord | null
  onConfirm?: (apId: string) => Promise<boolean> | boolean | Promise<void>
  isDeleting?: boolean
}

export function ApDeleteDialog({
  open,
  isOpen,
  onOpenChange,
  ap,
  onConfirm,
  isDeleting: externalIsDeleting,
}: ApDeleteDialogProps) {
  const [internalDeleting, setInternalDeleting] = useState(false)
  const isDeleting = externalIsDeleting ?? internalDeleting

  const dialogOpen =
    typeof open === 'boolean'
      ? open
      : typeof isOpen === 'boolean'
        ? isOpen
        : false
  const setDialogOpen = onOpenChange ?? (() => {})

  const handleConfirm = async (apId: string) => {
    setInternalDeleting(true)
    try {
      if (onConfirm) {
        const result = await onConfirm(apId)
        if (result === undefined || result === true) {
          setDialogOpen(false)
        }
      }
    } finally {
      setInternalDeleting(false)
    }
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Hapus data Access Point?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus AP <b>{ap?.ap_id}</b> (
            {ap?.ip_address})?
            <br />
            Tindakan ini tidak dapat dibatalkan dan Access Point tidak akan
            dipantau lagi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="md:w-[50%] w-full bg-slate-900 text-white hover:text-white hover:bg-slate-800 h-12 cursor-pointer"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-rose-600 hover:bg-rose-700 md:w-[50%] w-full h-12 cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              if (ap) handleConfirm(ap.ap_id)
            }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              'Ya, Hapus'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Backward-compatible alias
export const DeleteApDialog = ApDeleteDialog
export type DeleteApDialogProps = ApDeleteDialogProps
