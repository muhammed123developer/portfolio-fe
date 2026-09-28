import { useEffect, useRef, useState } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'motion/react'

import { cn } from '@/lib/utils'

/**
 * A circle that grows from the cursor over its parent — from unlumen-ui's
 * ClippedCircle primitive. With `mix-blend-mode: difference` and a white fill
 * it inverts whatever sits beneath it, which follows the page theme on its
 * own: a light surface turns dark, a dark one turns light.
 *
 * Changes from upstream: the cursor position lives in motion values instead of
 * React state, so moving the mouse does not re-render; only entering and
 * leaving do.
 *
 * Place it as the last child of a `relative overflow-hidden` element. Content
 * that should NOT be inverted needs a positive z-index (e.g. z-20), which
 * paints it above this layer.
 *
 * This layer must NOT get a z-index (or anything else that creates a stacking
 * context): the circle can only blend with what shares its stacking context,
 * so an isolated wrapper leaves it blending with nothing and it paints plain
 * white over the whole card.
 */

interface ClippedCircleProps {
  className?: string
  circleClassName?: string
  circleSize?: number
  /**
   * 'difference' (upstream) inverts what is beneath; 'normal' makes the circle
   * a plain translucent layer — e.g. a glow rendered behind the content.
   */
  blend?: 'difference' | 'normal'
}

export function ClippedCircle({
  className,
  circleClassName = 'bg-white/20',
  circleSize = 400,
  blend = 'difference',
}: ClippedCircleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const x = useMotionValue(50)
  const y = useMotionValue(50)
  const left = useMotionTemplate`${x}%`
  const top = useMotionTemplate`${y}%`

  useEffect(() => {
    const parent = containerRef.current?.parentElement
    if (!parent) return undefined

    const track = (event: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      x.set(((event.clientX - rect.left) / rect.width) * 100)
      y.set(((event.clientY - rect.top) / rect.height) * 100)
    }
    const onEnter = (event: MouseEvent) => {
      track(event)
      setHovered(true)
    }
    const onLeave = () => setHovered(false)

    parent.addEventListener('mouseenter', onEnter)
    parent.addEventListener('mousemove', track)
    parent.addEventListener('mouseleave', onLeave)
    return () => {
      parent.removeEventListener('mouseenter', onEnter)
      parent.removeEventListener('mousemove', track)
      parent.removeEventListener('mouseleave', onLeave)
    }
  }, [x, y])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <motion.div
        className={cn('pointer-events-none absolute rounded-full', circleClassName)}
        style={{ left, top, width: circleSize, height: circleSize, mixBlendMode: blend }}
        initial={{ scale: 0, x: '-50%', y: '-50%' }}
        animate={{ scale: hovered ? 1 : 0, x: '-50%', y: '-50%' }}
        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      />
    </div>
  )
}
