import { useEffect } from 'react'

/**
 * Per-page document title and meta tags.
 *
 * Hand-rolled rather than react-helmet-async: this is about thirty lines, adds
 * no dependency, and avoids that library's ongoing React 19 compatibility
 * friction.
 *
 * Note the limit honestly: these tags are applied by JavaScript after load, so
 * they serve browsers, link previews that execute JS, and crawlers that render
 * pages (Google does). A crawler reading only raw HTML sees the defaults in
 * index.html. Real per-page SEO for non-rendering crawlers needs server-side
 * rendering or prerendering, which is out of scope for a Vite SPA.
 */

interface SeoProps {
  title: string
  description?: string
  /** Absolute or root-relative image for link previews. */
  image?: string
  /** "website" for pages, "article" for a project case study. */
  type?: 'website' | 'article'
  /** Overrides the canonical URL; defaults to the current location. */
  canonical?: string
}

const SITE_NAME = 'Portfolio'

/** Creates the tag if missing, then sets its content. */
function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }
  tag.content = content
}

function setLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.rel = rel
    document.head.appendChild(tag)
  }
  tag.href = href
}

export function Seo({ title, description, image, type = 'website', canonical }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`
    const url = canonical ?? window.location.href

    document.title = fullTitle

    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description)
      setMeta('meta[property="og:description"]', 'property', 'og:description', description)
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    }

    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    setMeta('meta[property="og:type"]', 'property', 'og:type', type)
    setMeta('meta[property="og:url"]', 'property', 'og:url', url)
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
    setMeta(
      'meta[name="twitter:card"]',
      'name',
      'twitter:card',
      image ? 'summary_large_image' : 'summary'
    )

    if (image) {
      const absolute = image.startsWith('http') ? image : new URL(image, window.location.origin).href
      setMeta('meta[property="og:image"]', 'property', 'og:image', absolute)
      setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', absolute)
    }

    setLink('canonical', url)
  }, [title, description, image, type, canonical])

  return null
}
