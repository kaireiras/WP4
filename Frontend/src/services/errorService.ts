import axios from 'axios'

interface ApiErrorPayload {
  message?: string
  errors?: Record<string, Array<string>>
}

interface ApiError extends Error {
  apiErrors?: Record<string, Array<string>>
  status?: number
}

const extractErrorInfo = (err: unknown, customMessage?: string) => {
  if (axios.isAxiosError<ApiErrorPayload>(err)) {
    const data = err.response?.data
    const message =
      customMessage ?? data?.message ?? (err.message || 'Terjadi kesalahan')
    const errors = data?.errors ?? {}
    const status = err.response?.status ?? 500
    return { message, errors, status }
  }

  if (err instanceof Error) {
    return {
      message: customMessage ?? err.message,
      errors: {},
      status: 500,
    }
  }

  return {
    message: customMessage ?? 'Terjadi kesalahan',
    errors: {},
    status: 500,
  }
}

const handleApiError = (err: unknown): never => {
  const { message, errors, status } = extractErrorInfo(err)
  const error: ApiError = new Error(message)
  error.apiErrors = errors
  error.status = status
  throw error
}

const handleApiErrorWithMessage = (
  err: unknown,
  customMessage?: string,
): never => {
  const { message, errors, status } = extractErrorInfo(err, customMessage)
  const error: ApiError = new Error(message)
  error.apiErrors = errors
  error.status = status
  throw error
}

const isApiError = (err: unknown): err is ApiError => {
  if (!(err instanceof Error)) return false
  const candidate = err as ApiError
  return candidate.status !== undefined && candidate.apiErrors !== undefined
}

const getErrorMessages = (err: ApiError): Array<string> => {
  const messages: Array<string> = []
  const errors = err.apiErrors ?? {}

  Object.values(errors).forEach((fieldErrors) => {
    if (Array.isArray(fieldErrors)) {
      messages.push(...fieldErrors)
    }
  })

  return messages
}

const getFieldError = (err: ApiError, field: string): string | undefined => {
  return err.apiErrors?.[field]?.[0]
}

export {
  handleApiError,
  handleApiErrorWithMessage,
  isApiError,
  getErrorMessages,
  getFieldError,
  type ApiError,
}
