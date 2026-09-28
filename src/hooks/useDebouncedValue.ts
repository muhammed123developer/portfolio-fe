import { useEffect, useState } from 'react'

/**
 * Returns `value` after it has stopped changing for `delay` milliseconds.
 *
 * Used for search inputs so typing "realtime" fires one request rather than
 * eight. The input itself stays fully controlled and instant — only the value
 * that drives the request lags behind.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    // Clearing on every change is what makes this a debounce rather than a
    // series of staggered updates.
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
