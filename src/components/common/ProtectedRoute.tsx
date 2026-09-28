import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

/**
 * Gate for the admin area.
 *
 * Three states, and the middle one matters: while the initial /auth/me check
 * is still in flight we render a loader rather than redirecting. Redirecting
 * eagerly would bounce an already-signed-in admin to the login screen on every
 * page refresh, before the session had a chance to resolve.
 *
 * The attempted path is remembered in location state so that after logging in
 * the admin lands where they were going, not on the dashboard.
 *
 * This is a UX guard, not a security boundary — the API enforces authorisation
 * independently. Bypassing this in the browser reveals an empty shell whose
 * every request returns 401.
 */
export function ProtectedRoute() {
  const { isAuthenticated, initialising } = useAuth()
  const location = useLocation()

  if (initialising) {
    return (
      <div
        className="flex min-h-svh items-center justify-center"
        role="status"
        aria-label="Checking your session"
      >
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden="true" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
