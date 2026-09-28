import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react'
import { Send } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatDateRange } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

/**
 * A zigzag timeline with a paper plane that flies down it as you scroll.
 *
 * Shared by Experience and Education, which is possible because both resources
 * were modelled the same way on the backend — same date fields, same "null end
 * date means ongoing" convention. One component, two pages, no drift.
 *
 * Rendered as an ordered list: the sequence is meaningful, so a screen reader
 * should announce it as "1 of 4" rather than as unrelated headings. The flight
 * path and the plane are decoration and are hidden from assistive tech.
 *
 * On `sm+` the cards alternate sides of a centre line; below that they stack
 * to the right of a left rail. Either way the path is built from the measured
 * marker positions, because card heights depend on the content.
 */

export interface TimelineEntry {
  id: string
  /** Job title, or degree. */
  title: string
  /** Employer, or institution. */
  subtitle: string
  /** Optional third line — field of study, grade. */
  detail?: string | null
  location?: string | null
  startDate: string
  endDate: string | null
  description?: string | null
  tags?: string[]
  url?: string | null
}

interface Point {
  x: number
  y: number
}

/** Lucide's `Send` glyph already points up-right, i.e. -45° from the x-axis. */
const PLANE_ICON_ANGLE = -45

/**
 * Joins the markers with S-curves that swing out into the empty column beside
 * each card, alternating sides — that is the zigzag.
 */
function buildPath(points: Point[], amplitude: number) {
  if (points.length === 0) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]
    const dir = i % 2 === 0 ? 1 : -1
    const dy = to.y - from.y
    d +=
      ` C ${from.x + dir * amplitude} ${from.y + dy * 0.2},` +
      ` ${to.x + dir * amplitude} ${to.y - dy * 0.2},` +
      ` ${to.x} ${to.y}`
  }
  return d
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const reduce = useReducedMotion()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [path, setPath] = useState('')

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start center', 'end center'],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 })

  const planeX = useMotionValue(0)
  const planeY = useMotionValue(0)
  const planeRotate = useMotionValue(90 - PLANE_ICON_ANGLE)

  // Re-measure whenever the list changes size (fonts loading, window resize,
  // crossing the sm breakpoint) so the path always runs through the markers.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const measure = () => {
      const origin = wrapper.getBoundingClientRect()
      const points = markerRefs.current
        .slice(0, entries.length)
        .filter((el): el is HTMLSpanElement => el !== null)
        .map((el) => {
          const rect = el.getBoundingClientRect()
          return {
            x: rect.left + rect.width / 2 - origin.left,
            y: rect.top + rect.height / 2 - origin.top,
          }
        })
      const wide = window.matchMedia('(min-width: 640px)').matches
      const amplitude = wide ? Math.min(origin.width * 0.3, 240) : 12
      setPath(buildPath(points, amplitude))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [entries.length])

  const placePlane = useCallback(
    (value: number) => {
      const el = pathRef.current
      if (!el) return
      const total = el.getTotalLength()
      if (total === 0) return
      const at = Math.min(Math.max(value, 0), 1) * total
      const point = el.getPointAtLength(at)
      // Heading comes from a point just ahead (or just behind, at the very end).
      const ahead = el.getPointAtLength(Math.min(at + 1, total))
      const behind = el.getPointAtLength(Math.max(at - 1, 0))
      const angle =
        (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI
      planeX.set(point.x)
      planeY.set(point.y)
      planeRotate.set(angle - PLANE_ICON_ANGLE)
    },
    [planeX, planeY, planeRotate]
  )

  useMotionValueEvent(progress, 'change', placePlane)
  useLayoutEffect(() => placePlane(progress.get()), [path, placePlane, progress])

  return (
    <div ref={wrapperRef} className="relative">
      {path && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          {/* The planned route, always fully visible. */}
          <path
            d={path}
            fill="none"
            className="stroke-border"
            strokeWidth={2}
            strokeDasharray="6 8"
            strokeLinecap="round"
          />
          {/* The route flown so far, drawn behind the plane. */}
          <motion.path
            ref={pathRef}
            d={path}
            fill="none"
            className="stroke-primary"
            strokeWidth={2}
            strokeLinecap="round"
            style={{ pathLength: reduce ? 1 : progress }}
          />
        </svg>
      )}

      {path && !reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 z-10"
          style={{ x: planeX, y: planeY }}
        >
          <motion.div
            className="-mt-3.5 -ml-3.5 flex size-7 items-center justify-center"
            style={{ rotate: planeRotate }}
          >
            <Send className="text-primary fill-primary/20 size-6 drop-shadow-sm" />
          </motion.div>
        </motion.div>
      )}

      <ol className="relative space-y-10 sm:space-y-6">
        {entries.map((entry, index) => {
          const isCurrent = entry.endDate === null
          const onLeft = index % 2 === 0

          return (
            <li key={entry.id} className="relative pl-8 sm:grid sm:grid-cols-2 sm:gap-x-20 sm:pl-0">
              <motion.span
                ref={(el) => {
                  markerRefs.current[index] = el
                }}
                aria-hidden="true"
                initial={reduce ? false : { scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: '0px 0px -40% 0px' }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className={cn(
                  'absolute top-6 left-0 z-5 size-3 rounded-full ring-4 sm:left-1/2 sm:-ml-1.5',
                  isCurrent
                    ? 'bg-primary ring-primary/15'
                    : 'bg-muted-foreground/40 ring-background'
                )}
              />

              <motion.div
                initial={reduce ? false : { opacity: 0, x: onLeft ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '0px 0px -40% 0px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  'bg-card rounded-xl border p-5 shadow-sm',
                  onLeft ? 'sm:col-start-1' : 'sm:col-start-2'
                )}
              >
                <TimelineCard entry={entry} isCurrent={isCurrent} />
              </motion.div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function TimelineCard({ entry, isCurrent }: { entry: TimelineEntry; isCurrent: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="font-semibold tracking-tight">{entry.title}</h3>
        {isCurrent && (
          <Badge variant="secondary" className="h-5 px-2 text-[11px]">
            Current
          </Badge>
        )}
      </div>

      <p className="text-primary text-sm font-medium">
        {entry.url ? (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {entry.subtitle}
          </a>
        ) : (
          entry.subtitle
        )}
        {entry.detail && (
          <span className="text-muted-foreground font-normal"> · {entry.detail}</span>
        )}
      </p>

      <p className="text-muted-foreground text-sm">
        {/* <time> gives the machine-readable start date alongside the
            human-readable range. */}
        <time dateTime={entry.startDate}>
          {formatDateRange(entry.startDate, entry.endDate)}
        </time>
        {entry.location && <span> · {entry.location}</span>}
      </p>

      {entry.description && (
        <p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-line text-pretty">
          {entry.description}
        </p>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="outline" className="text-xs font-normal">
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
