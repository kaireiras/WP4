import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import {
  LoginDevCard,
  LoginForm,
  LoginHero,
  LoginMobileHeader,
} from '#/components/pages/login'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('auth_status')
      if (auth === 'loged in') {
        throw redirect({
          to: '/dashboard',
        })
      }
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('auth_status')
      if (auth === 'loged in') {
        navigate({ to: '/dashboard' })
      }
    }
  }, [navigate])

  const handleLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_status', 'loged in')
    }
    navigate({ to: '/dashboard' })
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

          {/* Mode Dev */}
          <LoginDevCard onLogin={handleLogin} />

          {/* Form */}
          <LoginForm onLogin={handleLogin} />
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
