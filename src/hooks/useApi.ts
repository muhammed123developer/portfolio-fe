import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/services/api'

/**
 * Runs a read request and tracks its lifecycle.
 *
 * Together with `useApiMutation` this is the reuse backbone of the frontend:
 * loading and error handling live here once, so no page re-implements them and
 * no component can forget a loading state.
 *
 * Deliberately not TanStack Query — plain React state plus reusable service
 * functions, as the brief requires.
 */

export interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  /** Re-runs the request, e.g. from a "Try again" button. */
  refetch: () => void
  /** Patches local state after a mutation, avoiding a full refetch. */
  setData: (updater: T | ((previous: T | null) => T | null)) => void
}

export interface UseApiOptions {
  /** Set false to defer the request until some condition is met. */
  enabled?: boolean
}

export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { enabled = true } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<ApiError | null>(null)

  // Held in a ref so a caller can pass an inline arrow function without
  // causing an infinite loop: the effect re-runs on `deps`, never on the
  // identity of `fetcher`.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const [reloadToken, setReloadToken] = useState(0)
  const refetch = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    // Aborts the in-flight request when deps change or the component
    // unmounts. Without this, a fast filter change can let a slow earlier
    // response land last and overwrite the newer results.
    const controller = new AbortController()
    let active = true

    setLoading(true)
    setError(null)

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((caught: unknown) => {
        // An abort is an intentional cancellation, not a failure to report.
        if (controller.signal.aborted || !active) return
        setError(
          caught instanceof ApiError ? caught : new ApiError('An unexpected error occurred', 0)
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reloadToken, ...deps])

  const patch = useCallback((updater: T | ((previous: T | null) => T | null)) => {
    setData((previous) =>
      typeof updater === 'function' ? (updater as (p: T | null) => T | null)(previous) : updater
    )
  }, [])

  return { data, loading, error, refetch, setData: patch }
}
