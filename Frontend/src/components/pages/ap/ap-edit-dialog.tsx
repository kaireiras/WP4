import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { FormEvent } from 'react'
import type { ApFormErrors } from './types'
import { Button } from '#/components/ui/shadcn/button'
import { Input } from '#/components/ui/shadcn/input'
import { Label } from '#/components/ui/shadcn/label'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogForm,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/shadcn/dialog'
import type { ApRegistryRecord, UpdateApInput } from '#/services/apService'
import { validateIpAddress } from './ap-data'

export type ApEditDialogProps = {
  open?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  ap: ApRegistryRecord | null
  onUpdate?: (payload: UpdateApInput) => Promise<boolean> | boolean
  onSubmit?: (data: UpdateApInput) => Promise<void>
  errors?: ApFormErrors
  isSubmitting?: boolean
}

export function ApEditDialog({
  open,
  isOpen,
  onOpenChange,
  ap,
  onUpdate,
  onSubmit,
  errors: _errors,
  isSubmitting: externalIsSubmitting,
}: ApEditDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen =
    typeof open === 'boolean'
      ? open
      : typeof isOpen === 'boolean'
        ? isOpen
        : internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const [ipAddress, setIpAddress] = useState('')
  const [snmpCommunity, setSnmpCommunity] = useState('')
  const [clientErrors, setClientErrors] = useState<{
    ipAddress?: string
    snmpCommunity?: string
  }>({})
  const [internalLoading, setInternalLoading] = useState(false)

  const isLoading = externalIsSubmitting ?? internalLoading

  useEffect(() => {
    if (ap && dialogOpen) {
      setIpAddress(ap.ip_address || '')
      setSnmpCommunity(ap.snmp_community || '')
      setClientErrors({})
    }
  }, [ap, dialogOpen])

  const isFormValid = ipAddress.trim() !== '' && snmpCommunity.trim() !== ''

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!ap) return

    const newErrors: { ipAddress?: string; snmpCommunity?: string } = {}
    if (!ipAddress.trim()) {
      newErrors.ipAddress = 'IP Address wajib diisi.'
    } else if (!validateIpAddress(ipAddress)) {
      newErrors.ipAddress = 'Format IP address tidak valid.'
    }

    if (!snmpCommunity.trim()) {
      newErrors.snmpCommunity = 'SNMP Community wajib diisi.'
    }

    if (Object.keys(newErrors).length > 0) {
      setClientErrors(newErrors)
      return
    }

    setClientErrors({})
    setInternalLoading(true)
    try {
      const payload: UpdateApInput = {
        apId: ap.ap_id,
        ip_address: ipAddress.trim(),
        snmp_community: snmpCommunity.trim(),
      }

      if (onUpdate) {
        const success = await onUpdate(payload)
        if (success) {
          setDialogOpen(false)
        }
      } else if (onSubmit) {
        await onSubmit(payload)
        setDialogOpen(false)
      }
    } catch {
      toast.error('Gagal memperbarui Access Point')
    } finally {
      setInternalLoading(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) setClientErrors({})
    setDialogOpen(val)
  }

  const generalError = _errors?.general?.[0]
  const ipError = clientErrors.ipAddress || _errors?.ip_address?.[0]
  const snmpError = clientErrors.snmpCommunity || _errors?.snmp_community?.[0]

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogForm onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Edit Access Point
            </DialogTitle>
            <DialogDescription>
              Silakan ubah data Access Point
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="grid gap-4 py-4">
            {/* AP ID (Readonly) */}
            <div className="grid gap-2">
              <Label
                htmlFor="edit-ap-id"
                className="text-slate-600 font-medium"
              >
                AP ID*
              </Label>
              <Input
                id="edit-ap-id"
                value={ap?.ap_id ?? ''}
                disabled
                className="h-12 bg-slate-100 dark:bg-neutral-800 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                AP ID tidak dapat diubah
              </p>
            </div>

            {/* IP Address */}
            <div className="grid gap-2">
              <Label
                htmlFor="edit-ip-address"
                className="text-slate-600 font-medium"
              >
                IP Address*
              </Label>
              <Input
                id="edit-ip-address"
                value={ipAddress}
                onChange={(e) => {
                  setIpAddress(e.target.value)
                  if (clientErrors.ipAddress) {
                    setClientErrors((prev) => ({
                      ...prev,
                      ipAddress: undefined,
                    }))
                  }
                }}
                placeholder="Masukkan IP address"
                className="h-12"
                disabled={isLoading}
              />
              {ipError ? (
                <p className="text-sm text-destructive">{ipError}</p>
              ) : null}
            </div>

            {/* SNMP Community */}
            <div className="grid gap-2">
              <Label
                htmlFor="edit-snmp-community"
                className="text-slate-600 font-medium"
              >
                SNMP Community*
              </Label>
              <Input
                id="edit-snmp-community"
                value={snmpCommunity}
                onChange={(e) => {
                  setSnmpCommunity(e.target.value)
                  if (clientErrors.snmpCommunity) {
                    setClientErrors((prev) => ({
                      ...prev,
                      snmpCommunity: undefined,
                    }))
                  }
                }}
                placeholder="Masukkan SNMP community"
                className="h-12"
                disabled={isLoading}
              />
              {snmpError ? (
                <p className="text-sm text-destructive">{snmpError}</p>
              ) : null}
            </div>

            {generalError ? (
              <p className="text-sm text-destructive">{generalError}</p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              className="md:w-[50%] w-full h-12 cursor-pointer"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="md:w-[50%] w-full bg-slate-900 text-white hover:bg-slate-800 h-12 cursor-pointer"
              disabled={isLoading || !isFormValid}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogForm>
      </DialogContent>
    </Dialog>
  )
}

// Backward-compatible alias
export const EditApDialog = ApEditDialog
export type EditApDialogProps = ApEditDialogProps
