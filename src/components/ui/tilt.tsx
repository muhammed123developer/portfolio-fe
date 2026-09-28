import { useRef } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
  type SpringOptions,
} from 'motion/react'

/**
 * Tilts its content toward the cursor — from unlumen-ui's Tilt primitive.
 * Change from upstream: no tilt at all when the visitor prefers reduced motion.
 * Mouse only, so touch devices simply see the flat element.
 */

export interface TiltProps {
  children: React.ReactNode
  className?: string
  style?: MotionStyle
  /** Maximum rotation angle in degrees. */
  rotationFactor?: number
  /** Reverse the tilt direction. */
  isReverse?: boolean
  springOptions?: SpringOptions
}

export function Tilt({
  children,
  className,
  style,
  rotationFactor = 15,
  isReverse = false,
  springOptions,
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const factor = reduce ? 0 : rotationFactor

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const xSpring = useSpring(x, springOptions)
  const ySpring = useSpring(y, springOptions)

  const rotateX = useTransform(ySpring, [-0.5, 0.5], isReverse ? [factor, -factor] : [-factor, factor])
  const rotateY = useTransform(xSpring, [-0.5, 0.5], isReverse ? [-factor, factor] : [factor, -factor])
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((event.clientX - rect.left) / rect.width - 0.5)
    y.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ transformStyle: 'preserve-3d', ...style, transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}
