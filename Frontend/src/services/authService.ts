import axios from 'axios'
import { createServerFn } from '@tanstack/react-start'
import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'
import { api } from './api'

// Types
export interface AuthUser {
  id: number
  name: string
  email: string
  email_verified_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface AuthSuccessResponse {
  message: string
  access_token: string
  token_type: string
  user: AuthUser
}

export type AuthFieldErrors = Record<string, Array<string> | undefined> | null

export type AuthActionResult =
  | {
      ok: true
      message: string
      user: AuthUser
      token?: string
    }
  | {
      ok: false
      message: string
      errors: Record<string, Array<string> | undefined>
    }

interface LaravelValidationErrorData {
  message?: string
  errors?: Record<string, Array<string> | undefined>
}

const AUTH_STATUS_KEY = 'auth_status'
const AUTH_USER_KEY = 'auth_user'
const AUTH_TOKEN_KEY = 'auth_token'

// Persist token & user cookies on server
function persistAuthCookies(token: string, user: AuthUser) {
  const maxAge = 60 * 60 * 24 * 7

  setCookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
  })

  setCookie('user', JSON.stringify(user), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

// Clear token & user cookies on server
function clearAuthCookies() {
  try {
    deleteCookie('token', { path: '/' })
    deleteCookie('user', { path: '/' })
  } catch {
    // Response context unavailable
  }
}

// Normalize validation error from Laravel AuthController
function extractAuthFailure(
  error: unknown,
  fallbackMessage: string,
): AuthActionResult {
  if (axios.isAxiosError<LaravelValidationErrorData>(error)) {
    const data = error.response?.data
    return {
      ok: false,
      message: data?.message ?? (error.message || fallbackMessage),
      errors: data?.errors ?? {},
    }
  }

  return {
    ok: false,
    message: error instanceof Error ? error.message : fallbackMessage,
    errors: {},
  }
}

// Client session helpers
export function saveClientAuthSession(user: AuthUser, token?: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_STATUS_KEY, 'loged in')
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`
  }
}

export function clearClientAuthSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_STATUS_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
  document.cookie = 'token=; path=/; max-age=0; SameSite=Lax'
  document.cookie = 'user=; path=/; max-age=0; SameSite=Lax'
}

export function getClientAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isClientAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_STATUS_KEY) === 'loged in'
}

// Login user (POST /api/login)
export const loginUser = createServerFn({ method: 'POST' })
  .validator((data: LoginInput) => data)
  .handler(async ({ data }): Promise<AuthActionResult> => {
    try {
      const response = await api.post<AuthSuccessResponse>('/login', {
        email: data.email.trim(),
        password: data.password,
      })

      persistAuthCookies(response.data.access_token, response.data.user)

      return {
        ok: true,
        message: response.data.message || 'Login berhasil',
        user: response.data.user,
        token: response.data.access_token,
      }
    } catch (error) {
      return extractAuthFailure(error, 'Gagal masuk ke sistem.')
    }
  })

// Register new user (POST /api/register)
export const registerUser = createServerFn({ method: 'POST' })
  .validator((data: RegisterInput) => data)
  .handler(async ({ data }): Promise<AuthActionResult> => {
    try {
      const response = await api.post<AuthSuccessResponse>('/register', {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      })

      persistAuthCookies(response.data.access_token, response.data.user)

      return {
        ok: true,
        message: response.data.message || 'Registrasi berhasil',
        user: response.data.user,
        token: response.data.access_token,
      }
    } catch (error) {
      return extractAuthFailure(error, 'Gagal mendaftarkan akun.')
    }
  })

// Logout active user (POST /api/logout)
export const logoutUser = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ ok: boolean; message: string }> => {
    try {
      await api.post('/logout')
    } catch {
      // Tetap bersihkan sesi cookie meski token sudah kedaluwarsa
    } finally {
      clearAuthCookies()
    }

    return {
      ok: true,
      message: 'Logout berhasil, token telah dihapus.',
    }
  },
)

// Read cached user profile from cookie on server
function readAuthUserCookie(): AuthUser | null {
  try {
    const raw = getCookie('user')
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

// Fetch authenticated user profile (GET /api/user)
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser | null> => {
    try {
      const token = getCookie('token')
      if (!token) {
        return null
      }
    } catch {
      return null
    }

    try {
      const response = await api.get<AuthUser>('/user')
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearAuthCookies()
        return null
      }

      return readAuthUserCookie()
    }
  },
)
