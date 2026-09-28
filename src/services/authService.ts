import { get, post } from './api'
import type { Admin, DashboardStats, LoginValues } from '@/types/api'

/**
 * Authentication and admin dashboard statistics.
 *
 * The JWT never passes through this module: it lives in an httpOnly cookie the
 * browser manages automatically. `login` returns the admin and a CSRF token,
 * which the Axios interceptor picks up from its cookie on later writes — so
 * nothing here has to store or forward a credential.
 */

export interface LoginResponse {
  admin: Admin
  csrfToken: string
}

export function login(values: LoginValues): Promise<LoginResponse> {
  return post<LoginResponse>('/auth/login', values)
}

export function logout(): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/logout')
}

/**
 * Returns the signed-in admin, or rejects with a 401.
 *
 * Called once on app load to restore an existing session, which is why a
 * returning admin lands in the panel rather than on the login screen.
 */
export function getCurrentAdmin(signal?: AbortSignal): Promise<{ admin: Admin }> {
  return get<{ admin: Admin }>('/auth/me', { signal })
}

/** All seven dashboard cards in one request rather than seven. */
export function getDashboardStats(signal?: AbortSignal): Promise<DashboardStats> {
  return get<DashboardStats>('/admin/stats', { signal })
}
