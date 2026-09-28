import { useEffect, useMemo, useState } from 'react'

import { IconCloud } from '@/components/ui/icon-cloud'
import { useTheme } from '@/components/theme-provider'
import { useApi } from '@/hooks/useApi'
import { simpleIconSlug, simpleIconUrl } from '@/lib/simpleIcons'
import { listTechnologies } from '@/services/contentService'
import type { Technology } from '@/types/api'

/**
 * The technologies managed in the admin panel, as a rotating cloud of logos
 * from Simple Icons. Decorative: renders nothing until at least one logo has
 * loaded, and nothing at all if the request fails.
 */

/** Resolves to the URLs that actually loaded, in their original order. */
function preload(urls: string[]): Promise<string[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<string | null>((resolve) => {
          const image = new Image()
          image.crossOrigin = 'anonymous'
          image.onload = () => resolve(url)
          image.onerror = () => resolve(null)
          image.src = url
        })
    )
  ).then((results) => results.filter((url): url is string => url !== null))
}

export function TechIconCloud({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme()
  const technologies = useApi<Technology[]>((signal) => listTechnologies(signal), [])
  const [images, setImages] = useState<string[]>([])

  const urls = useMemo(() => {
    const slugs = [...new Set((technologies.data ?? []).map((t) => simpleIconSlug(t.name)))]
    return slugs.map((slug) => simpleIconUrl(slug, resolvedTheme))
  }, [technologies.data, resolvedTheme])

  // Only logos that exist go into the sphere, so a technology without one
  // ("REST API") leaves no blank slot.
  useEffect(() => {
    let active = true
    preload(urls).then((loaded) => {
      if (active) setImages(loaded)
    })
    return () => {
      active = false
    }
  }, [urls])

  if (images.length === 0) return null

  return <IconCloud images={images} className={className} />
}
