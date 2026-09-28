import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * An interactive 3D sphere of icons — adapted from Magic UI's IconCloud.
 *
 * Changes from upstream:
 *   - Fills its parent at any size. Upstream is a fixed 400×400 canvas whose
 *     click detection breaks once CSS scales it; here the sphere is drawn in a
 *     fixed VIEW-unit space and pointer positions are mapped into it.
 *   - Image URLs only. The ReactNode path needed react-dom/server's
 *     renderToString, which would ship React's server renderer to the browser.
 *   - Pauses while scrolled out of view, as well as for reduced motion.
 *   - Animation state lives in refs, so moving the pointer does not re-render
 *     or restart the loop.
 */

/** Logical canvas size; everything below is in these units. */
const VIEW = 280
const RADIUS = 100
const ICON = 40

interface Point {
  x: number
  y: number
  z: number
}

interface Tween {
  x: number
  y: number
  startX: number
  startY: number
  startTime: number
  duration: number
}

interface IconCloudProps {
  images: string[]
  showControl?: boolean
  className?: string
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** Evenly spread points on a sphere (Fibonacci lattice). */
function spherePoints(count: number): Point[] {
  const n = Math.max(count, 1)
  const offset = 2 / n
  const increment = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: n }, (_, i) => {
    const y = i * offset - 1 + offset / 2
    const r = Math.sqrt(1 - y * y)
    const phi = i * increment
    return { x: Math.cos(phi) * r * RADIUS, y: y * RADIUS, z: Math.sin(phi) * r * RADIUS }
  })
}

/** Projects a sphere point through the current rotation. */
function project(point: Point, rotation: { x: number; y: number }) {
  const cosX = Math.cos(rotation.x)
  const sinX = Math.sin(rotation.x)
  const cosY = Math.cos(rotation.y)
  const sinY = Math.sin(rotation.y)
  const x = point.x * cosY - point.z * sinY
  const z = point.x * sinY + point.z * cosY
  const y = point.y * cosX + z * sinX
  return { x, y, z }
}

export function IconCloud({ images, showControl = false, className }: IconCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Reduced motion starts paused.
  const [paused, setPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const points = useMemo(() => spherePoints(images.length), [images.length])
  const pointsRef = useRef(points)
  const pausedRef = useRef(paused)

  const rotation = useRef({ x: 0, y: 0 })
  const mouse = useRef({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const tween = useRef<Tween | null>(null)
  const sprites = useRef<HTMLCanvasElement[]>([])
  const loaded = useRef<boolean[]>([])
  const wake = useRef<() => void>(() => {})

  // Follow the reduced-motion setting live.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setPaused(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // The render loop reads these through refs so it never has to restart.
  useEffect(() => {
    pointsRef.current = points
    pausedRef.current = paused
    wake.current()
  }, [points, paused])

  // One small offscreen canvas per icon, clipped to a circle.
  useEffect(() => {
    loaded.current = images.map(() => false)
    sprites.current = images.map((src, index) => {
      const sprite = document.createElement('canvas')
      sprite.width = ICON * 2
      sprite.height = ICON * 2
      const context = sprite.getContext('2d')
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        if (!context) return
        context.clearRect(0, 0, sprite.width, sprite.height)
        context.beginPath()
        context.arc(ICON, ICON, ICON, 0, Math.PI * 2)
        context.closePath()
        context.clip()
        context.drawImage(image, 0, 0, sprite.width, sprite.height)
        loaded.current[index] = true
        wake.current()
      }
      image.src = src
      return sprite
    })
  }, [images])

  // Sizing, visibility and the render loop.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return undefined

    let raf = 0
    let visible = true
    let scale = 1

    const draw = () => {
      raf = 0
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)

      const center = VIEW / 2
      const dx = mouse.current.x - center
      const dy = mouse.current.y - center
      const speed = 0.003 + (Math.hypot(dx, dy) / Math.hypot(center, center)) * 0.01

      const active = tween.current
      if (active) {
        const progress = Math.min(1, (performance.now() - active.startTime) / active.duration)
        const eased = easeOutCubic(progress)
        rotation.current = {
          x: active.startX + (active.x - active.startX) * eased,
          y: active.startY + (active.y - active.startY) * eased,
        }
        if (progress >= 1) tween.current = null
      } else if (!drag.current && !pausedRef.current) {
        rotation.current = {
          x: rotation.current.x + (dy / VIEW) * speed,
          y: rotation.current.y + (dx / VIEW) * speed,
        }
      }

      pointsRef.current.forEach((point, index) => {
        const sprite = sprites.current[index]
        if (!sprite || !loaded.current[index]) return
        const p = project(point, rotation.current)
        const size = (p.z + 200) / 300
        ctx.save()
        ctx.translate(center + p.x, center + p.y)
        ctx.scale(size, size)
        ctx.globalAlpha = Math.max(0.2, Math.min(1, (p.z + 150) / 200))
        ctx.drawImage(sprite, -ICON / 2, -ICON / 2, ICON, ICON)
        ctx.restore()
      })

      const pending = !loaded.current.every(Boolean)
      const moving = !pausedRef.current || drag.current !== null || tween.current !== null
      if (visible && (moving || pending)) raf = requestAnimationFrame(draw)
    }

    wake.current = () => {
      if (!raf && visible) raf = requestAnimationFrame(draw)
    }

    const resize = () => {
      const side = Math.max(1, Math.min(canvas.clientWidth, canvas.clientHeight))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(side * dpr)
      canvas.height = Math.round(side * dpr)
      scale = canvas.width / VIEW
      wake.current()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
      if (visible) wake.current()
    })
    intersectionObserver.observe(canvas)
    resize()

    return () => {
      cancelAnimationFrame(raf)
      wake.current = () => {}
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  /** Pointer position in VIEW units. */
  const toView = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW,
      y: ((event.clientY - rect.top) / rect.height) * VIEW,
    }
  }

  const onMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toView(event)
    const center = VIEW / 2

    // Clicking an icon rotates the sphere to bring it to the front.
    for (const point of points) {
      const p = project(point, rotation.current)
      const radius = (ICON / 2) * ((p.z + 200) / 300)
      if ((x - (center + p.x)) ** 2 + (y - (center + p.y)) ** 2 < radius * radius) {
        const targetX = -Math.atan2(point.y, Math.hypot(point.x, point.z))
        const targetY = Math.atan2(point.x, point.z)
        const distance = Math.hypot(targetX - rotation.current.x, targetY - rotation.current.y)
        tween.current = {
          x: targetX,
          y: targetY,
          startX: rotation.current.x,
          startY: rotation.current.y,
          startTime: performance.now(),
          duration: Math.min(2000, Math.max(800, distance * 1000)),
        }
        break
      }
    }

    drag.current = { x: event.clientX, y: event.clientY }
    wake.current()
  }

  const onMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    mouse.current = toView(event)
    const last = drag.current
    if (last) {
      rotation.current = {
        x: rotation.current.x + (event.clientY - last.y) * 0.002,
        y: rotation.current.y + (event.clientX - last.x) * 0.002,
      }
      drag.current = { x: event.clientX, y: event.clientY }
      wake.current()
    }
  }

  const onMouseUp = () => {
    drag.current = null
  }

  return (
    <div className={cn('relative size-full', className)}>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="block size-full"
        aria-hidden="true"
      />
      {showControl && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? 'Play animation' : 'Pause animation'}
          className="absolute top-2 right-2"
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </Button>
      )}
    </div>
  )
}
