import { useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * A project's image, with a designed fallback.
 *
 * Two cases need covering, and they are not the same:
 *   - no image set at all
 *   - an image URL that is set but fails to load (moved, typo'd, offline host)
 *
 * Hiding a broken <img> leaves an empty grey box, which reads as a rendering
 * bug. Tracking the error in state and swapping to the placeholder instead
 * means a missing image looks deliberate.
 *
 * The placeholder is a gradient derived from the project slug, so each project
 * gets a stable, distinct colour rather than every card looking identical —
 * and it needs no image assets at all.
 */

interface ProjectThumbnailProps {
  src: string | null
  title: string
  /** Stable seed for the fallback colour. */
  slug: string
  className?: string
  /** Larger type for the detail page hero. */
  size?: 'card' | 'hero'
}

/** Hue derived from the slug — deterministic, so a project keeps its colour. */
function hueFor(slug: string): number {
  let hash = 0
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) % 360
  }
  return hash
}

/** "Realtime Collaboration Board" → "RC" */
function initialsFor(title: string): string {
  return title
    .split(/\s+/)
    .filter((word) => /^[a-z0-9]/i.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProjectThumbnail({
  src,
  title,
  slug,
  className,
  size = 'card',
}: ProjectThumbnailProps) {
  const [failed, setFailed] = useState(false)

  const showImage = Boolean(src) && !failed

  if (showImage) {
    return (
      <img
        src={src as string}
        alt=""
        // Decorative: the title is always rendered alongside, so announcing
        // the image too would repeat it.
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('size-full object-cover', className)}
      />
    )
  }

  const hue = hueFor(slug)

  return (
    <div
      aria-hidden="true"
      className={cn('relative flex size-full items-center justify-center overflow-hidden', className)}
      style={{
        backgroundImage: `linear-gradient(135deg,
          oklch(0.55 0.13 ${hue}) 0%,
          oklch(0.42 0.10 ${(hue + 45) % 360}) 100%)`,
      }}
    >
      {/* Subtle grid, so the tile reads as a designed surface rather than a
          flat colour fill. */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <span
        className={cn(
          'relative font-bold tracking-tight text-white/90',
          size === 'hero' ? 'text-6xl' : 'text-3xl'
        )}
      >
        {initialsFor(title)}
      </span>
    </div>
  )
}
