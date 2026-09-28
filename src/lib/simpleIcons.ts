/**
 * Brand logos from the Simple Icons CDN, looked up by technology name.
 * Shared by the Experience page's icon cloud and the skill chips.
 */

/** Names whose Simple Icons slug is not their slugified name. */
const SLUG_ALIASES: Record<string, string> = {
  jwt: 'jsonwebtokens',
  css3: 'css',
  html: 'html5',
  expressdotjs: 'express',
}

/** Brand colours too dark to see on the dark theme; drawn light there instead. */
const DARK_BRANDS = new Set([
  'express',
  'nextdotjs',
  'vercel',
  'github',
  'shadcnui',
  'socketdotio',
  'jsonwebtokens',
  'prisma',
])

/** "Node.js" → "nodedotjs", "shadcn/ui" → "shadcnui" — Simple Icons' slug rules. */
export function simpleIconSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/\./g, 'dot')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
  return SLUG_ALIASES[slug] ?? slug
}

/** True when the brand colour is near-black, so it needs a light variant on dark surfaces. */
export function isDarkBrand(slug: string): boolean {
  return DARK_BRANDS.has(slug)
}

/**
 * Logo URL for a slug. `theme` is the colour of the surface it sits on: on a
 * dark surface, near-black brands are requested in light grey instead.
 */
export function simpleIconUrl(slug: string, theme: 'light' | 'dark'): string {
  return theme === 'dark' && DARK_BRANDS.has(slug)
    ? `https://cdn.simpleicons.org/${slug}/fafafa`
    : `https://cdn.simpleicons.org/${slug}`
}
