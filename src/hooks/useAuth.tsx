import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ApiError, setUnauthorizedHandler } from '@/services/api'
import { getCurrentAdmin, login as loginRequest, logout as logoutRequest } from '@/services/authService'
import type { Admin, LoginValues } from '@/types/api'

/**
 * Authentication state for the admin area.
 *
 * The session itself lives in an httpOnly cookie the browser manages — this
 * context holds no token and could not read one if it tried. It tracks only
 * *who* is signed in, which is what the UI needs.
 *
 * On mount it calls /auth/me once to restore an existing session, so a
 * returning admin lands in the panel instead of being bounced to the login
 * screen by a page refresh.
 */

interface AuthContextValue {
  admin: Admin | null
  /** True until the initial session check finishes. */
  initialising: boolean
  isAuthenticated: boolean
  login: (values: LoginValues) => Promise<{ ok: true } | { ok: false; error: ApiError }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [initialising, setInitialising] = useState(true)

  // Restore an existing session once, on mount.
  useEffect(() => {
    const controller = new AbortController()
    let active = true

    getCurrentAdmin(controller.signal)
      .then((result) => {
        if (active) setAdmin(result.admin)
      })
      .catch(() => {
        // A 401 here is the normal "not logged in" case, not an error worth
        // surfacing — the login screen is the correct outcome.
        if (active) setAdmin(null)
      })
      .finally(() => {
        if (active) setInitialising(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  // The server can end a session at any time (idle timeout, absolute cap,
  // restart). When an admin request comes back 401, sign out locally so
  // ProtectedRoute sends the admin to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAdmin(null)
      // Fixed id: several requests failing at once show one toast, not five.
      toast.error('Your session has expired', {
        id: 'session-expired',
        description: 'Please sign in again.',
      })
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (values: LoginValues) => {
    try {
      const result = await loginRequest(values)
      setAdmin(result.admin)
      return { ok: true } as const
    } catch (caught) {
      const error = caught instanceof ApiError ? caught : new ApiError('Login failed', 0)
      return { ok: false, error } as const
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Even if the request fails — offline, expired session — the local state
      // must still clear, or the UI claims the user is signed in when they are
      // not. The cookie is invalid either way.
    } finally {
      setAdmin(null)
    }
  }, [])

  const value = useMemo(
    () => ({ admin, initialising, isAuthenticated: admin !== null, login, logout }),
    [admin, initialising, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
