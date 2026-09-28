import { useCallback, useRef, useState } from 'react'

import { ApiError } from '@/services/api'

/**
 * Runs a write request and tracks its lifecycle.
 *
 * `mutate` resolves with the result and never throws, so a form handler reads
 * as a plain `if (result.ok)` rather than a try/catch around every submit.
 * Anything that genuinely needs to throw can use `mutateOrThrow`.
 *
 * `fieldErrors` is populated from a 422 so a form can mark individual inputs —
 * this is what connects express-validator's response to React Hook Form.
 */

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export interface UseApiMutationResult<TArgs extends unknown[], TResult> {
  mutate: (...args: TArgs) => Promise<MutationResult<TResult>>
  /** Same call, but rejects on failure. */
  mutateOrThrow: (...args: TArgs) => Promise<TResult>
  loading: boolean
  error: ApiError | null
  /** Field name → message, from a 422 response. */
  fieldErrors: Record<string, string>
  reset: () => void
}

export function useApiMutation<TArgs extends unknown[], TResult>(
  mutationFn: (...args: TArgs) => Promise<TResult>
): UseApiMutationResult<TArgs, TResult> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Ref so callers can pass an inline arrow without a useCallback dance.
  const fnRef = useRef(mutationFn)
  fnRef.current = mutationFn

  // Guards against setting state after the component has gone away, which
  // happens routinely when a dialog closes on success.
  const mountedRef = useRef(true)
  const safeSet = <S,>(setter: (value: S) => void, value: S) => {
    if (mountedRef.current) setter(value)
  }

  const reset = useCallback(() => {
    setError(null)
    setFieldErrors({})
  }, [])

  const mutate = useCallback(async (...args: TArgs): Promise<MutationResult<TResult>> => {
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const data = await fnRef.current(...args)
      safeSet(setLoading, false)
      return { ok: true, data }
    } catch (caught) {
      const apiError =
        caught instanceof ApiError ? caught : new ApiError('An unexpected error occurred', 0)

      safeSet(setError, apiError)
      safeSet(setFieldErrors, apiError.errors ?? {})
      safeSet(setLoading, false)

      return { ok: false, error: apiError }
    }
  }, [])

  const mutateOrThrow = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      const result = await mutate(...args)
      if (!result.ok) throw result.error
      return result.data
    },
    [mutate]
  )

  return { mutate, mutateOrThrow, loading, error, fieldErrors, reset }
}
