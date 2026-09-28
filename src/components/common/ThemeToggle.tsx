import { useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'

/**
 * Animated light / dark toggle, adapted from Magic UI's AnimatedThemeToggler.
 *
 * The new theme is revealed as a circle expanding from the button, using the
 * View Transitions API. Browsers without it (or users who prefer reduced
 * motion) just get an instant switch.
 *
 * The theme starts as "system" and follows the OS. Clicking picks the opposite
 * of what is showing; when that choice matches the OS preference we store
 * "system" again rather than a fixed value, so toggling back returns the user
 * to following their OS instead of pinning them to it.
 */

const DURATION_MS = 400

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isDark = resolvedTheme === 'dark'

  const toggleTheme = useCallback(async () => {
    const nextIsDark = !isDark
    const apply = () => {
      // The provider also sets this in an effect, but the view transition
      // snapshots the DOM as soon as this callback returns, so the class has
      // to be on <html> synchronously.
      document.documentElement.classList.toggle('dark', nextIsDark)
      document.documentElement.style.colorScheme = nextIsDark ? 'dark' : 'light'
      setTheme(nextIsDark === systemPrefersDark() ? 'system' : nextIsDark ? 'dark' : 'light')
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduceMotion || !buttonRef.current) {
      apply()
      return
    }

    await document.startViewTransition(() => flushSync(apply)).ready

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    // Far enough to cover the corner of the viewport furthest from the button.
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
      },
      {
        duration: DURATION_MS,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  }, [isDark, setTheme])

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  )
}
