import { useEffect, useRef } from 'react'

import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

/**
 * Animated flow-field background.
 *
 * Adapted from the "Infinite Tendrils" Originkit component. The field
 * simulation (value noise, angle field, pointer whirl) is unchanged; the
 * integration around it was reworked for this app:
 *
 *  1. **Pointer tracking moved to `window`.** The original listened on its own
 *     container, which forces the container to accept pointer events. Sitting
 *     behind the hero that would swallow hovers over the buttons and text, and
 *     the tendrils would freeze whenever the cursor crossed anything on top of
 *     them. Listening on `window` and converting to container coordinates lets
 *     the canvas be `pointer-events: none` and still follow the cursor.
 *
 *  2. **Respects `prefers-reduced-motion`.** A perpetual animation behind text
 *     is exactly what that setting exists to suppress, so the scene is never
 *     started for those users and a static gradient is shown instead.
 *
 *  3. **Pauses when off-screen.** `requestAnimationFrame` already stops in a
 *     hidden tab, but not when the element is merely scrolled out of view, so
 *     an IntersectionObserver stops the work once the hero is scrolled past.
 *
 *  4. **Decorative, not an image.** The original exposed `role="img"` with a
 *     description, which makes a screen reader announce the decoration on
 *     every page load. It is purely ornamental, so it is `aria-hidden`.
 */

interface Config {
  colorA: string
  colorB: string
  count: number
  scale: number
  size: number
  trail: number
  speed: number
  followPointer: boolean
  strength: number
}

const DEFAULTS: Config = {
  colorA: '#4338ca',
  colorB: '#a78bfa',
  count: 10,
  scale: 8,
  size: 4,
  trail: 20,
  speed: 6,
  followPointer: true,
  strength: 13,
}

/** Palettes tuned per theme so the field reads as depth, not decoration. */
const PALETTES = {
  dark: { colorA: '#4338ca', colorB: '#a78bfa' },
  light: { colorA: '#c7d2fe', colorB: '#818cf8' },
} as const

function clamp(value: number, lo: number, hi: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.max(lo, Math.min(hi, n))
}

function settingsFor(cfg: Config) {
  const trail = clamp(cfg.trail, 1, 20, DEFAULTS.trail)
  return {
    count: Math.round(90 + clamp(cfg.count, 1, 20, DEFAULTS.count) * 65),
    scale: 0.09 + clamp(cfg.scale, 1, 20, DEFAULTS.scale) * 0.055,
    size: 0.4 + clamp(cfg.size, 1, 20, DEFAULTS.size) * 0.16,
    fade: Math.max(0.02, 0.18 * Math.pow(0.8907, trail - 1)),
    speed: 12 + clamp(cfg.speed, 0, 20, DEFAULTS.speed) * 9,
    reach: 90 + clamp(cfg.strength, 1, 20, DEFAULTS.strength) * 26,
    whirl: 0.35 + clamp(cfg.strength, 1, 20, DEFAULTS.strength) * 0.032,
  }
}

type Rgb = [number, number, number]

function parseHex(hex: string): Rgb {
  const h = (hex || '').replace('#', '').trim()
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ]
  }
  if (h.length >= 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }
  return [128, 128, 128]
}

function mix(a: Rgb, b: Rgb, t: number, alpha: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgba(${r},${g},${bl},${alpha})`
}

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Value noise with smoothstep interpolation — drives the angle field. */
function noise2(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v
}

interface Mote {
  x: number
  y: number
  life: number
  span: number
  tint: number
  weight: number
  pace: number
}

class FlowScene {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private cfg: Config

  private motes: Mote[] = []
  private width = 0
  private height = 0
  private dpr = 1
  private time = 0
  private frameId = 0
  private lastT = 0
  private disposed = false
  private running = false

  /* Smoothed pointer position, in container coordinates. */
  private px = -1
  private py = -1
  private tx = -1
  private ty = -1
  private grip = 0
  private gripTarget = 0

  constructor(container: HTMLElement, cfg: Config) {
    this.container = container
    this.cfg = cfg

    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.inset = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    container.appendChild(this.canvas)

    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    this.ctx = ctx

    // On window, not the container — see note 1 in the file header.
    window.addEventListener('pointermove', this.onMove, { passive: true })
    window.addEventListener('pointerleave', this.onLeave)
  }

  private onLeave = () => {
    this.gripTarget = 0
  }

  private onMove = (event: PointerEvent) => {
    const rect = this.container.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Only pull the field while the cursor is actually over this region.
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height
    this.gripTarget = inside ? 1 : 0
    if (!inside) return

    this.tx = x
    this.ty = y
    if (this.px < 0) {
      this.px = x
      this.py = y
    }
  }

  private spawn(m: Mote) {
    m.x = Math.random() * this.width
    m.y = Math.random() * this.height
    m.span = 2 + Math.random() * 6
    m.life = m.span
    m.tint = Math.random()
    m.weight = 0.35 + Math.random() * Math.random() * 1.9
    m.pace = 0.6 + Math.random() * 0.8
  }

  private build() {
    const settings = settingsFor(this.cfg)
    this.motes = []
    for (let i = 0; i < settings.count; i += 1) {
      const m: Mote = { x: 0, y: 0, life: 0, span: 1, tint: 0, weight: 1, pace: 1 }
      this.spawn(m)
      // Stagger initial lifetimes so the field does not pulse in unison.
      m.life = Math.random() * m.span
      this.motes.push(m)
    }
  }

  start() {
    if (this.disposed || this.running) return
    this.running = true
    this.lastT = performance.now()
    const loop = () => {
      if (!this.running || this.disposed) return
      this.frameId = requestAnimationFrame(loop)
      this.step()
    }
    loop()
  }

  /** Halts the loop without tearing anything down — used when scrolled away. */
  stop() {
    this.running = false
    cancelAnimationFrame(this.frameId)
  }

  setSize(width: number, height: number) {
    if (this.disposed || width <= 0 || height <= 0) return
    // Capped at 2: beyond that the pixel cost outweighs any visible gain.
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    const first = this.width === 0
    this.width = width
    this.height = height
    this.canvas.width = Math.round(width * this.dpr)
    this.canvas.height = Math.round(height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    if (first || this.motes.length === 0) this.build()
  }

  updateConfig(cfg: Config) {
    if (this.disposed) return
    const previous = this.cfg
    this.cfg = cfg
    if (previous.count !== cfg.count) this.build()
  }

  private step() {
    if (this.disposed || this.width <= 0 || this.motes.length === 0) return

    const now = performance.now()
    let dt = (now - this.lastT) / 1000
    this.lastT = now
    if (!Number.isFinite(dt) || dt < 0) dt = 0

    // A long gap means the tab was backgrounded; clear rather than smearing a
    // single enormous step across the canvas.
    const stalled = dt > 0.4
    if (dt > 0.05) dt = 0.05

    const settings = settingsFor(this.cfg)
    const ctx = this.ctx
    this.time += dt

    if (stalled) ctx.clearRect(0, 0, this.width, this.height)

    if (this.px >= 0) {
      const k = 1 - Math.exp(-dt * 12)
      this.px += (this.tx - this.px) * k
      this.py += (this.ty - this.py) * k
    }

    const want = this.cfg.followPointer && this.px >= 0 ? this.gripTarget : 0
    this.grip += (want - this.grip) * (1 - Math.exp(-dt * 4))

    // Fade the previous frame instead of clearing it — this is what leaves
    // trails behind each mote.
    const fade = Math.min(0.6, settings.fade * dt * 60)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = `rgba(0,0,0,${fade})`
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.globalCompositeOperation = 'source-over'

    ctx.lineCap = 'round'
    const reach = settings.reach
    const reach2 = reach * reach
    const a = parseHex(this.cfg.colorA)
    const b = parseHex(this.cfg.colorB)

    for (let i = 0; i < this.motes.length; i += 1) {
      const m = this.motes[i]

      // Two octaves: a broad swell plus finer fraying.
      const swell = noise2(
        m.x * settings.scale * 0.01 + this.time * 0.12,
        m.y * settings.scale * 0.01 - this.time * 0.09
      )
      const fray = noise2(
        m.x * settings.scale * 0.031 - this.time * 0.2,
        m.y * settings.scale * 0.031 + this.time * 0.16
      )
      let ang = (swell * 0.78 + fray * 0.22) * Math.PI * 4
      const pace = settings.speed * m.pace

      if (this.grip > 0.01) {
        const dx = this.px - m.x
        const dy = this.py - m.y
        const d2 = dx * dx + dy * dy
        if (d2 < reach2 && d2 > 1) {
          const dist = Math.sqrt(d2)
          const f = (1 - dist / reach) * (1 - dist / reach) * this.grip

          // Aim slightly off the cursor so motes orbit rather than collapse in.
          const swing = Math.PI * (0.5 - 0.16 * (dist / reach))
          const target = Math.atan2(dy, dx) - swing
          let delta = target - ang
          while (delta > Math.PI) delta -= Math.PI * 2
          while (delta < -Math.PI) delta += Math.PI * 2
          ang += delta * Math.min(1, f * settings.whirl * 2.2)
        }
      }

      const px = m.x
      const py = m.y
      m.x += Math.cos(ang) * pace * dt
      m.y += Math.sin(ang) * pace * dt
      m.life -= dt

      if (
        m.life <= 0 ||
        m.x < -10 ||
        m.x > this.width + 10 ||
        m.y < -10 ||
        m.y > this.height + 10
      ) {
        this.spawn(m)
        continue
      }

      // Fade in and out at the ends of a mote's life so nothing pops.
      const t = m.life / m.span
      const ends = Math.min(1, Math.min(t, 1 - t) * 6)
      ctx.strokeStyle = mix(a, b, m.tint, 0.2 + ends * 0.55)
      ctx.lineWidth = settings.size * m.weight
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(m.x, m.y)
      ctx.stroke()
    }
  }

  dispose() {
    this.disposed = true
    this.stop()
    window.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('pointerleave', this.onLeave)
    if (this.canvas.parentNode === this.container) {
      this.container.removeChild(this.canvas)
    }
  }
}

/* ------------------------------------------------------------- Component */

export interface TendrilBackgroundProps {
  /** Overrides the theme palette. */
  colorA?: string
  colorB?: string
  count?: number
  scale?: number
  size?: number
  trail?: number
  speed?: number
  followPointer?: boolean
  strength?: number
  /** Overall opacity — kept low so foreground text stays readable. */
  opacity?: number
  className?: string
}

export function TendrilBackground({
  colorA,
  colorB,
  count = DEFAULTS.count,
  scale = DEFAULTS.scale,
  size = DEFAULTS.size,
  trail = DEFAULTS.trail,
  speed = DEFAULTS.speed,
  followPointer = DEFAULTS.followPointer,
  strength = DEFAULTS.strength,
  opacity = 0.55,
  className,
}: TendrilBackgroundProps) {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<FlowScene | null>(null)

  const palette = PALETTES[resolvedTheme]
  const config: Config = {
    colorA: colorA ?? palette.colorA,
    colorB: colorB ?? palette.colorB,
    count,
    scale,
    size,
    trail,
    speed,
    followPointer,
    strength,
  }

  // Held in a ref so the mount effect can read the latest config without
  // listing every prop as a dependency and tearing the scene down on each change.
  const configRef = useRef(config)
  useEffect(() => {
    configRef.current = config
    sceneRef.current?.updateConfig(config)
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Never start the animation for someone who asked for less motion.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    let scene: FlowScene
    try {
      scene = new FlowScene(container, configRef.current)
    } catch {
      // No 2D context (very old or locked-down browser) — the gradient
      // underneath is a perfectly good fallback.
      return
    }
    sceneRef.current = scene
    scene.setSize(container.clientWidth, container.clientHeight)

    const resizeObserver = new ResizeObserver(() => {
      scene.setSize(container.clientWidth, container.clientHeight)
    })
    resizeObserver.observe(container)

    // Only animate while actually on screen — see note 3 in the file header.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) scene.start()
        else scene.stop()
      },
      { threshold: 0 }
    )
    visibility.observe(container)

    return () => {
      resizeObserver.disconnect()
      visibility.disconnect()
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      // Decorative only: hidden from assistive technology, and transparent to
      // the pointer so it cannot intercept clicks on the content above it.
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ opacity }}
    />
  )
}
