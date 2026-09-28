import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

import type { PaginationMeta, Paged } from '@/types/api'

/**
 * The single Axios instance every service function goes through.
 *
 * Nothing in the application calls axios directly — components call service
 * functions, service functions call these helpers. That keeps the base URL,
 * credentials, CSRF handling and error normalisation in one place instead of
 * repeated at every call site.
 */

/** The envelope the API always returns on success. */
interface SuccessEnvelope<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

/** The envelope the API always returns on failure. */
interface ErrorEnvelope {
  success: false
  message: string
  errors?: Record<string, string>
}

/**
 * A normalised API failure.
 *
 * Every rejection from this module is an ApiError, so callers never have to
 * dig through `err.response?.data?.message` or guess at Axios internals.
 */
export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number

  /** Field-level messages from express-validator, for a 422. */
  readonly errors?: Record<string, string>

  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    if (errors) this.errors = errors
  }

  /** True when the user is not (or no longer) authenticated. */
  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** True when the server rejected the input — show it against the fields. */
  get isValidation(): boolean {
    return this.status === 422
  }

  /** True when the request never got a response (server down, offline). */
  get isNetworkError(): boolean {
    return this.status === 0
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  // Required for the httpOnly session cookie to be sent and stored. Without
  // it the browser silently drops the cookie and every admin request 401s.
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

/** Reads a cookie by name. Returns null when absent. */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

/**
 * Attaches the CSRF token to every state-changing request.
 *
 * The backend sets `csrfToken` as a readable cookie at login and compares it
 * against this header. An attacker's page can cause the cookie to be *sent*
 * but cannot *read* it, so it cannot set the matching header — which is what
 * makes the double-submit pattern work.
 */
client.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (method !== 'get' && method !== 'head' && method !== 'options') {
    const token = readCookie('csrfToken')
    if (token) config.headers.set('X-CSRF-Token', token)
  }
  return config
})

/**
 * Called when an authenticated request comes back 401 — the server ended the
 * session (idle timeout, absolute cap, logout elsewhere, restart). Registered
 * by AuthProvider so the UI drops back to the login screen instead of staying
 * "signed in" while every request fails.
 */
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

/** Endpoints where a 401 is an expected answer, not a lost session. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/me', '/auth/logout']

/** Turns any Axios failure into an ApiError. */
client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(new ApiError('An unexpected error occurred', 0))
    }

    const axiosError = error as AxiosError<ErrorEnvelope>

    // No response at all: server down, DNS failure, CORS rejection, timeout.
    if (!axiosError.response) {
      const message =
        axiosError.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : 'Could not reach the server. Check that the API is running.'
      return Promise.reject(new ApiError(message, 0))
    }

    const { status, data } = axiosError.response

    if (status === 401 && !AUTH_ENDPOINTS.includes(axiosError.config?.url ?? '')) {
      unauthorizedHandler?.()
    }

    return Promise.reject(
      new ApiError(data?.message ?? 'Something went wrong', status, data?.errors)
    )
  }
)

/* --------------------------------------------------------------- Helpers */

/** GET returning just the payload. */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await client.get<SuccessEnvelope<T>>(url, config)
  return response.data.data
}

/**
 * GET returning the payload *and* its pagination metadata.
 *
 * Separate from `get` because most endpoints are not paginated, and forcing
 * every caller to destructure `{ items, meta }` would be noise.
 */
export async function getPaged<T>(url: string, config?: AxiosRequestConfig): Promise<Paged<T>> {
  const response = await client.get<SuccessEnvelope<T[]>>(url, config)
  const { data, meta } = response.data

  return {
    items: data,
    meta: meta ?? {
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await client.post<SuccessEnvelope<T>>(url, body)
  return response.data.data
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const response = await client.put<SuccessEnvelope<T>>(url, body)
  return response.data.data
}

export async function del<T>(url: string): Promise<T> {
  const response = await client.delete<SuccessEnvelope<T>>(url)
  return response.data.data
}

export default client
