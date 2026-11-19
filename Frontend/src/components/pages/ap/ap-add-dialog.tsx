import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
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
import type { CreateApInput } from '#/services/apService'
import { validateIpAddress } from './ap-data'

export type ApAddDialogProps = {
  open?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onCreate?: (payload: CreateApInput) => Promise<boolean> | boolean
  onSubmit?: (data: CreateApInput) => Promise<void>
  errors?: ApFormErrors
  isSubmitting?: boolean
}

export function ApAddDialog({
  open,
  isOpen,
  onOpenChange,
  onCreate,
  onSubmit,
  errors: _errors,
  isSubmitting: externalIsSubmitting,
}: ApAddDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen =
    typeof open === 'boolean'
      ? open
      : typeof isOpen === 'boolean'
        ? isOpen
        : internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  const [apId, setApId] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [snmpCommunity, setSnmpCommunity] = useState('public')
  const [clientErrors, setClientErrors] = useState<{
    apId?: string
    ipAddress?: string
    snmpCommunity?: string
  }>({})
  const [showMaxCharWarning, setShowMaxCharWarning] = useState(false)
  const [internalLoading, setInternalLoading] = useState(false)

  const isLoading = externalIsSubmitting ?? internalLoading
  const isFormValid =
    apId.trim() !== '' &&
    apId.trim().length <= 20 &&
    ipAddress.trim() !== '' &&
    snmpCommunity.trim() !== ''

  const resetForm = () => {
    setApId('')
    setIpAddress('')
    setSnmpCommunity('public')
    setClientErrors({})
    setShowMaxCharWarning(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    const newErrors: {
      apId?: string
      ipAddress?: string
      snmpCommunity?: string
    } = {}

    if (!apId.trim()) {
      newErrors.apId = 'AP ID wajib diisi.'
    } else if (apId.trim().length > 20) {
      newErrors.apId = 'Maksimal 20 karakter'
      setShowMaxCharWarning(true)
    }

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
      const payload: CreateApInput = {
        ap_id: apId.trim(),
        ip_address: ipAddress.trim(),
        snmp_community: snmpCommunity.trim(),
      }

      if (onCreate) {
        const success = await onCreate(payload)
        if (success) {
          setDialogOpen(false)
          resetForm()
        }
      } else if (onSubmit) {
        await onSubmit(payload)
        setDialogOpen(false)
        resetForm()
      }
    } catch {
      toast.error('Gagal menambahkan Access Point baru')
    } finally {
      setInternalLoading(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm()
    setDialogOpen(val)
  }

  const generalError = _errors?.general?.[0]
  const apIdError = clientErrors.apId || _errors?.ap_id?.[0]
  const ipError = clientErrors.ipAddress || _errors?.ip_address?.[0]
  const snmpError = clientErrors.snmpCommunity || _errors?.snmp_community?.[0]

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogForm onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Tambah AP Baru
            </DialogTitle>
            <DialogDescription>
              Isi form berikut untuk menambahkan Access Point baru
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="grid gap-4 py-4">
            {/* AP ID */}
            <div className="grid gap-2">
              <Label htmlFor="ap-id" className="text-slate-600 font-medium">
                AP ID*
              </Label>
              <Input
                id="ap-id"
                value={apId}
                onChange={(e) => {
                  const nextVal = e.target.value
                  setApId(nextVal)
                  if (nextVal.length > 20) {
                    setShowMaxCharWarning(true)
                  } else {
                    setShowMaxCharWarning(false)
                  }
                  if (clientErrors.apId) {
                    setClientErrors((prev) => ({ ...prev, apId: undefined }))
                  }
                }}
                placeholder="Masukkan AP ID (contoh: AP-03)"
                className="h-12"
                disabled={isLoading}
              />
              {showMaxCharWarning ? (
                <div className="flex items-center justify-between text-xs text-destructive bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 rounded-md px-2.5 py-1.5 transition-all">
                  <span className="font-medium">Maksimal 20 karakter</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaxCharWarning(false)
                      if (clientErrors.apId) {
                        setClientErrors((prev) => ({
                          ...prev,
                          apId: undefined,
                        }))
                      }
                    }}
                    className="text-destructive hover:opacity-70 p-0.5 rounded cursor-pointer transition-opacity"
                    aria-label="Tutup pesan peringatan"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : apIdError ? (
                <p className="text-sm text-destructive">{apIdError}</p>
              ) : null}
            </div>

            {/* IP Address */}
            <div className="grid gap-2">
              <Label
                htmlFor="ip-address"
                className="text-slate-600 font-medium"
              >
                IP Address*
              </Label>
              <Input
                id="ip-address"
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
                htmlFor="snmp-community"
                className="text-slate-600 font-medium"
              >
                SNMP Community*
              </Label>
              <Input
                id="snmp-community"
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
export const NewApDialog = ApAddDialog
export type NewApDialogProps = ApAddDialogProps
