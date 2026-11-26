import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '#/lib/utils'

export interface LoginFormProps {
  onLogin: (payload: {
    email: string
    password: string
  }) => Promise<void> | void
  isLoading?: boolean
  errors?: Record<string, Array<string> | undefined> | null
  errorMessage?: string | null
  className?: string
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function LoginForm({
  onLogin,
  isLoading = false,
  errors,
  errorMessage,
  className,
}: LoginFormProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)

  const emailError = errors?.email?.[0]
  const passwordError = errors?.password?.[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    void onLogin({ email, password })
  }

  return (
    <div
      className={cn(
        'w-full max-w-[400px] sm:max-w-[420px] mx-auto flex flex-col justify-center',
        className,
      )}
    >
      {/* Header Formulir */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-white tracking-tight leading-tight">
          Selamat datang kembali
        </h1>
        <p className="text-sm sm:text-base text-neutral-n10/90 mt-2 font-normal">
          Lihat Keramaian secara realtime
        </p>
      </div>

      {/* General Error Banner */}
      {errorMessage && !emailError && !passwordError && (
        <div
          role="alert"
          className="mb-4 rounded-2xl bg-red-500/20 border border-red-300/40 px-4 py-3 text-xs sm:text-sm text-red-100"
        >
          {errorMessage}
        </div>
      )}

      {/* Form Input Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email-input"
            className="block text-xs sm:text-sm font-semibold text-neutral-n10"
          >
            Email
          </label>
          <div
            className={cn(
              'relative h-[52px] bg-neutral-n20 dark:bg-neutral-n700 border border-neutral-n40 dark:border-neutral-n600 rounded-2xl flex items-center px-4 transition-colors focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-400/20',
              emailError && 'border-red-400 focus-within:border-red-400',
            )}
          >
            <Mail className="size-[18px] text-neutral-n100 shrink-0 select-none mr-3" />
            <input
              id="email-input"
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full bg-transparent border-0 outline-none text-sm sm:text-base text-neutral-n700 dark:text-neutral-n10 placeholder:text-neutral-n200/60 font-normal disabled:opacity-60"
            />
          </div>
          {emailError && <p className="text-xs text-red-200">{emailError}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password-input"
              className="block text-xs sm:text-sm font-semibold text-neutral-n10"
            >
              Kata Sandi
            </label>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => toast.info('Fitur lupa kata sandi segera hadir')}
              className="text-xs sm:text-sm font-normal text-tertiary-400 hover:text-tertiary-300 transition-colors cursor-pointer"
            >
              Lupa kata sandi?
            </button>
          </div>
          <div
            className={cn(
              'relative h-[52px] bg-neutral-n20 dark:bg-neutral-n700 border border-neutral-n40 dark:border-neutral-n600 rounded-2xl flex items-center px-4 transition-colors focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-400/20',
              passwordError && 'border-red-400 focus-within:border-red-400',
            )}
          >
            <Lock className="size-[18px] text-neutral-n100 shrink-0 select-none mr-3" />
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full bg-transparent border-0 outline-none text-sm sm:text-base text-neutral-n700 dark:text-neutral-n10 placeholder:text-neutral-n200/60 font-normal pr-2 disabled:opacity-60"
            />
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
              }
              className="text-neutral-n100 hover:text-neutral-n300 transition-colors p-1 cursor-pointer disabled:opacity-60"
            >
              {showPassword ? (
                <EyeOff className="size-4 shrink-0" />
              ) : (
                <Eye className="size-4 shrink-0" />
              )}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs text-red-200">{passwordError}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[52px] bg-tertiary-600 hover:bg-tertiary-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-full font-semibold text-base flex items-center justify-center transition-all cursor-pointer shadow-md shadow-tertiary-600/25 select-none"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5 select-none">
        <div className="flex-1 h-px bg-neutral-n40/30" />
        <span className="text-xs sm:text-sm font-normal text-neutral-n30/80">
          atau
        </span>
        <div className="flex-1 h-px bg-neutral-n40/30" />
      </div>

      {/* Google Login Button */}
      <button
        type="button"
        disabled={isLoading}
        onClick={() =>
          toast.info(
            'Login dengan Google segera hadir. Silakan gunakan email dan kata sandi.',
          )
        }
        className="w-full h-[52px] bg-white hover:bg-neutral-n10 active:scale-[0.99] disabled:opacity-60 border border-neutral-n40 text-neutral-n700 rounded-full font-medium text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs select-none"
      >
        <GoogleIcon className="size-5 shrink-0" />
        <span>Masuk dengan Google</span>
      </button>

      {/* Footer */}
      <div className="mt-8 text-center text-xs sm:text-sm text-neutral-n30 select-none">
        <span>Belum punya akun? </span>
        <Link
          to="/register"
          className="font-semibold text-tertiary-400 hover:text-tertiary-300 transition-colors cursor-pointer"
        >
          Daftar sekarang
        </Link>
      </div>
    </div>
  )
}
