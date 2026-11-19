import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import {
  LoginForm,
  LoginHero,
  LoginMobileHeader,
} from '#/components/pages/login'
import type { AuthFieldErrors } from '#/services/authService'
import {
  isClientAuthenticated,
  loginUser,
  saveClientAuthSession,
} from '#/services/authService'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (isClientAuthenticated()) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const loginUserFn = useServerFn(loginUser)

  const [isLoading, setIsLoading] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<AuthFieldErrors>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isClientAuthenticated()) {
      navigate({ to: '/dashboard', replace: true })
    }
  }, [navigate])

  const handleLogin = async (payload: { email: string; password: string }) => {
    setIsLoading(true)
    setFieldErrors(null)
    setErrorMessage(null)

    try {
      const result = await loginUserFn({ data: payload })

      if (!result.ok) {
        setFieldErrors(result.errors)
        setErrorMessage(result.message)
        toast.error(result.message)
        return
      }

      saveClientAuthSession(result.user, result.token)
      queryClient.clear()
      toast.success(result.message || 'Login berhasil')
      await navigate({ to: '/dashboard', replace: true })
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Gagal masuk ke sistem.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white dark:bg-neutral-n900 font-sans antialiased">
      {/* Formulir Login */}
      <section
        aria-label="Formulir Masuk"
        className="w-full lg:w-[480px] xl:w-[520px] shrink-0 min-h-screen bg-[#023373] flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-10 sm:py-12 text-white relative z-10"
      >
        <div className="w-full max-w-[400px] sm:max-w-[420px] mx-auto">
          {/* Header Mobile */}
          <LoginMobileHeader />

          {/* Form */}
          <LoginForm
            onLogin={handleLogin}
            isLoading={isLoading}
            errors={fieldErrors}
            errorMessage={errorMessage}
          />
        </div>
      </section>

      {/* Showcase Branding */}
      <section
        aria-label="Branding Institusi"
        className="hidden lg:flex flex-1 min-h-screen bg-white dark:bg-neutral-n800 overflow-hidden"
      >
        <LoginHero />
      </section>
    </div>
  )
}
