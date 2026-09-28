import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

/**
 * A button ringed by a continuously sweeping gradient border.
 *
 * Adapted from the "Moving Gradient Button" Originkit component, matching its
 * default look: a solid base ring with a multi-stop conic gradient turning on
 * top of it, so the border reads as a band of colour travelling around a dark
 * face.
 *
 * Four layers, back to front:
 *   1. `baseColor` — a solid ring. Visible wherever the gradient above it is
 *      transparent, which is what produces the pale silver segments.
 *   2. The rotating conic gradient.
 *   3. `faceColor` — an opaque face inset by `thickness`, so only a ring of
 *      the two layers below remains visible.
 *   4. The child, which supplies the label and needs no background of its own.
 *
 * Layer 3 exists because relying on the child to be opaque is fragile: a
 * shadcn `outline` Button carries `dark:bg-input/30`, which is only 30%
 * opaque, so the gradient showed straight through the middle of the button.
 * Owning the face here means the component looks right whatever is passed in.
 * (All three sit at negative z-index, which CSS paints below in-flow content —
 * so the child always lands on top without needing a z-index of its own.)
 *
 * The integration differs from the original in four ways, each deliberate:
 *
 *  - **No framer-motion.** It was used only to tween two hover colours, which
 *    CSS transitions already do, for ~110 KB gzipped.
 *  - **No requestAnimationFrame loop.** The original spins from a rAF callback
 *    that runs forever per button, visible or not. This is a CSS transform
 *    animation: composited, and paused automatically in a hidden tab.
 *  - **Client-side routing preserved.** The original emits a raw `<a href>`,
 *    which in this single-page app forces a full document reload. `asChild`
 *    wraps a React Router `<Link>` instead.
 *  - **Respects `prefers-reduced-motion`** — the gradient stays, the rotation
 *    stops.
 *
 * On the rotation: an earlier attempt animated a registered custom property
 * (`@property --gradient-angle`). It smeared under compositing and needs
 * Firefox 128+. Rotating a transform inside an `overflow-hidden` wrapper is
 * better supported and physically cannot bleed outside the button.
 */

interface GradientButtonProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Render the child element instead of a wrapper — pass a Button or Link. */
  asChild?: boolean
  /** Thickness of the ring, in pixels. */
  thickness?: number
  /** How many times the gradient repeats around the border. */
  count?: 1 | 2 | 3
  /** Seconds for one full rotation. Lower is faster. */
  duration?: number
  /** Main sweep colour. */
  color?: string
  /** Second colour, at the end of each sweep. */
  headColor?: string
  /** Solid ring beneath the gradient — shows through the transparent part. */
  baseColor?: string
  /** The opaque face inside the ring. */
  faceColor?: string
  /**
   * How much of each repeat the colour occupies, 0–1.
   * 1 gives the continuous band of the reference design; lower values open up
   * transparent gaps and turn the sweeps into distinct comets.
   */
  trail?: number
  /** Corner radius. Defaults to a rounded rectangle, not a pill. */
  radius?: string
  children: React.ReactNode
}

interface GradientRingProps {
  thickness?: number
  count?: 1 | 2 | 3
  duration?: number
  color?: string
  headColor?: string
  baseColor?: string
  faceColor?: string
  trail?: number
  /** Defaults to inheriting the parent's radius. */
  radius?: string
}

/**
 * The ring layers on their own, to be dropped *inside* an existing control.
 *
 * `GradientButton` adds its ring by wrapping, which grows the element by
 * `2 × thickness`. Where that is unacceptable — a row of filter chips whose
 * size must not shift when one becomes active — render this inside the control
 * instead. It is absolutely positioned, so it costs no layout space at all.
 *
 * The host element needs `relative isolate overflow-hidden` and a
 * border-radius. All three layers sit at negative z-index, which CSS paints
 * above the host's own background but below its in-flow content — so the label
 * stays on top without needing a z-index.
 */
export function GradientRing({
  thickness = 1,
  count = 2,
  duration = 5,
  color = '#3600FF',
  headColor = '#00FF94',
  baseColor = '#FFFFFF',
  faceColor = 'var(--color-background)',
  trail = 1,
  radius = 'inherit',
}: GradientRingProps) {
  const period = 360 / count
  const tail = period * Math.min(1, Math.max(0.05, trail))
  const gradient = `repeating-conic-gradient(
    transparent 0deg,
    transparent ${(period - tail).toFixed(2)}deg,
    ${color} ${(period - tail * 0.35).toFixed(2)}deg,
    ${headColor} ${period.toFixed(2)}deg
  )`

  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-30"
        style={{ background: baseColor, borderRadius: radius }}
      />
      <span
        aria-hidden="true"
        className="gradient-border-rotate pointer-events-none absolute top-1/2 left-1/2 -z-20"
        style={{
          width: '200%',
          aspectRatio: '1',
          background: gradient,
          ['--gradient-duration' as string]: `${duration}s`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -z-10"
        style={{ inset: thickness, background: faceColor, borderRadius: radius }}
      />
    </>
  )
}

export function GradientButton({
  asChild = false,
  thickness = 3,
  count = 2,
  duration = 4,
  color = '#3600FF',
  headColor = '#00FF94',
  baseColor = '#FFFFFF',
  faceColor = 'var(--color-background)',
  trail = 1,
  radius = '0.9rem',
  className,
  children,
  style,
  ...rest
}: GradientButtonProps) {
  const Comp = asChild ? Slot.Root : 'span'

  // At trail = 1 there is no transparent gap: each repeat fades from the base
  // colour showing through, into `color`, then into `headColor`. That is what
  // makes the border a continuous travelling band rather than a comet.
  const period = 360 / count
  const tail = period * Math.min(1, Math.max(0.05, trail))
  const gradient = `repeating-conic-gradient(
    transparent 0deg,
    transparent ${(period - tail).toFixed(2)}deg,
    ${color} ${(period - tail * 0.35).toFixed(2)}deg,
    ${headColor} ${period.toFixed(2)}deg
  )`

  return (
    <span
      data-gradient-button=""
      className={cn('relative isolate inline-flex overflow-hidden', className)}
      // The padding is what leaves a ring of the layers below visible around
      // the child; overflow-hidden clips them to the rounded shape.
      style={{ padding: thickness, borderRadius: radius, ...style }}
      {...rest}
    >
      {/* 1. Solid base ring. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-30"
        style={{ background: baseColor }}
      />

      {/* 2. The rotating gradient. */}
      <span
        aria-hidden="true"
        className="gradient-border-rotate pointer-events-none absolute top-1/2 left-1/2 -z-20"
        style={{
          // Square, and wide enough that no corner is uncovered as it turns.
          // 200% of the width covers the diagonal of any button wider than it
          // is tall, which every button here is.
          width: '200%',
          aspectRatio: '1',
          background: gradient,
          ['--gradient-duration' as string]: `${duration}s`,
          // Matches the keyframes so the layer stays centred while rotating.
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* 3. The opaque face — this is what turns the gradient into a ring. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -z-10"
        style={{
          inset: thickness,
          background: faceColor,
          borderRadius: `calc(${radius} - ${thickness}px)`,
        }}
      />

      {/* 4. The child. Needs no background of its own. */}
      <Comp
        className={cn(!asChild && 'inline-flex w-full items-center justify-center')}
        style={{ borderRadius: `calc(${radius} - ${thickness}px)` }}
      >
        {children}
      </Comp>
    </span>
  )
}
