import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { cn } from '#/lib/utils'

export interface RegisterFormProps {
  onRegister: (payload: {
    name: string
    email: string
    password: string
  }) => Promise<void> | void
  isLoading?: boolean
  errors?: Record<string, Array<string> | undefined> | null
  errorMessage?: string | null
  className?: string
}

export function RegisterForm({
  onRegister,
  isLoading = false,
  errors,
  errorMessage,
  className,
}: RegisterFormProps) {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)

  const nameError = errors?.name?.[0]
  const emailError = errors?.email?.[0]
  const passwordError = errors?.password?.[0]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    void onRegister({ name, email, password })
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
          Buat Akun Baru
        </h1>
        <p className="text-sm sm:text-base text-neutral-n10/90 mt-2 font-normal">
          Daftar untuk memantau keramaian secara realtime
        </p>
      </div>

      {/* General Error Banner */}
      {errorMessage && !nameError && !emailError && !passwordError && (
        <div
          role="alert"
          className="mb-4 rounded-2xl bg-red-500/20 border border-red-300/40 px-4 py-3 text-xs sm:text-sm text-red-100"
        >
          {errorMessage}
        </div>
      )}

      {/* Form Input Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="name-input"
            className="block text-xs sm:text-sm font-semibold text-neutral-n10"
          >
            Nama Lengkap
          </label>
          <div
            className={cn(
              'relative h-[52px] bg-neutral-n20 dark:bg-neutral-n700 border border-neutral-n40 dark:border-neutral-n600 rounded-2xl flex items-center px-4 transition-colors focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-400/20',
              nameError && 'border-red-400 focus-within:border-red-400',
            )}
          >
            <User className="size-[18px] text-neutral-n100 shrink-0 select-none mr-3" />
            <input
              id="name-input"
              type="text"
              required
              maxLength={255}
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="w-full bg-transparent border-0 outline-none text-sm sm:text-base text-neutral-n700 dark:text-neutral-n10 placeholder:text-neutral-n200/60 font-normal disabled:opacity-60"
            />
          </div>
          {nameError && <p className="text-xs text-red-200">{nameError}</p>}
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-email-input"
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
              id="register-email-input"
              type="email"
              required
              maxLength={255}
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
          <label
            htmlFor="register-password-input"
            className="block text-xs sm:text-sm font-semibold text-neutral-n10"
          >
            Kata Sandi
          </label>
          <div
            className={cn(
              'relative h-[52px] bg-neutral-n20 dark:bg-neutral-n700 border border-neutral-n40 dark:border-neutral-n600 rounded-2xl flex items-center px-4 transition-colors focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-400/20',
              passwordError && 'border-red-400 focus-within:border-red-400',
            )}
          >
            <Lock className="size-[18px] text-neutral-n100 shrink-0 select-none mr-3" />
            <input
              id="register-password-input"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
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
            {isLoading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center text-xs sm:text-sm text-neutral-n30 select-none">
        <span>Sudah punya akun? </span>
        <Link
          to="/login"
          className="font-semibold text-tertiary-400 hover:text-tertiary-300 transition-colors cursor-pointer"
        >
          Masuk sekarang
        </Link>
      </div>
    </div>
  )
}
