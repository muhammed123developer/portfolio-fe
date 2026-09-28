import { createContext, useCallback, useContext, useMemo } from 'react'

import { useApi } from '@/hooks/useApi'
import { getProfile } from '@/services/contentService'
import type { ApiError } from '@/services/api'
import type { Profile } from '@/types/api'

/**
 * Shares the profile across the whole public site.
 *
 * The header, footer, Home hero, About page and Contact page all need it. As a
 * plain hook that would be five identical requests on first paint; as a
 * provider it is one, which is the "avoid duplicate API calls" requirement
 * made structural rather than a thing to remember.
 */

interface ProfileContextValue {
  profile: Profile | null
  loading: boolean
  error: ApiError | null
  refetch: () => void
  /** Lets the admin Settings screen push an update without a refetch. */
  setProfile: (profile: Profile) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error, refetch, setData } = useApi<Profile>(
    (signal) => getProfile(signal),
    []
  )

  const setProfile = useCallback((profile: Profile) => setData(profile), [setData])

  const value = useMemo(
    () => ({ profile: data, loading, error, refetch, setProfile }),
    [data, loading, error, refetch, setProfile]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

/**
 * Returns the shared profile.
 *
 * Falls back to an inert value outside a provider rather than throwing, so the
 * admin area — which has its own layout and does not mount ProfileProvider —
 * can reuse components that happen to read it.
 */
export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext)

  if (!context) {
    return {
      profile: null,
      loading: false,
      error: null,
      refetch: () => undefined,
      setProfile: () => undefined,
    }
  }

  return context
}
