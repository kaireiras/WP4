import axios from 'axios'
import { getRequest } from '@tanstack/react-start/server'
import { parseCookie, stringifySetCookie } from 'cookie'
import { env } from '#/env'

export function getApiBaseUrl(): string {
  // Jika di lingkungan server (Node.js/Nitro di dalam container), utamakan SERVER_URL dari runtime env (misal: http://backend)
  const serverRuntimeUrl =
    typeof process !== 'undefined' ? process.env.SERVER_URL : undefined

  const baseUrl = serverRuntimeUrl ?? env.SERVER_URL
  const rawBaseUrl = baseUrl.replace(/\/+$/, '')
  return rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null && v !== '') {
              searchParams.append(`${key}[]`, String(v))
            }
          })
        } else if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      return searchParams.toString()
    },
  },
})

api.interceptors.request.use((config) => {
  // Pastikan baseURL selalu mengikuti konfigurasi runtime terbaru
  config.baseURL = getApiBaseUrl()

  try {
    const request = getRequest()
    const cookieHeader = request.headers.get('cookie') ?? ''
    const cookies = parseCookie(cookieHeader)
    const token = cookies.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // Request context unavailable
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        const tokenCookie = stringifySetCookie({
          name: 'token',
          value: '',
          httpOnly: true,
          secure: env.VITE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 0,
        })

        const userCookie = stringifySetCookie({
          name: 'user',
          value: '',
          httpOnly: false,
          secure: env.VITE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 0,
        })

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            'Set-Cookie': [tokenCookie, userCookie].join(', '),
            'Content-Type': 'application/json',
          },
        })
      }

      if (error.code === 'ECONNABORTED') {
        console.warn('Request timed out (30s limit exceeded)')
      }
    }

    return Promise.reject(error)
  },
)
