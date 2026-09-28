import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Download, Mail, Menu, Terminal } from 'lucide-react'

import { GithubIcon, LinkedinIcon } from '@/components/common/BrandIcons'

import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useProfile } from '@/hooks/useProfile'
import { toResumeDownloadUrl } from '@/lib/resume'
import { cn } from '@/lib/utils'

/**
 * Chrome shared by every public page: header, navigation, footer.
 *
 * Profile details (name, social links) come from the API rather than being
 * hardcoded, so changing them in the admin panel updates the header and footer
 * without a redeploy.
 */

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/experience', label: 'Experience' },
  { to: '/education', label: 'Education' },
  { to: '/architecture', label: 'Architecture' },
  { to: '/contact', label: 'Contact' },
]

export default function PublicLayout() {
  const { profile } = useProfile()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Navigating within a single-page app does not reset scroll, so without this
  // a reader who was halfway down a project lands halfway down the next page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setMobileOpen(false)
  }, [location.pathname])

  const displayName = profile?.fullName ?? 'Portfolio'

  return (
    <div className="bg-background flex min-h-svh flex-col">
      {/* Keyboard users land here first and can jump the navigation entirely. */}
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground focus:ring-ring sr-only rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:ring-2"
      >
        Skip to content
      </a>

      <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="focus-visible:ring-ring group flex items-center gap-2.5 rounded-md font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105">
              <Terminal className="size-4" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">{displayName}</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'focus-visible:ring-ring relative rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <span className="bg-primary absolute inset-x-3 -bottom-px h-0.5 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            {/* Only shown once a resume link is set in admin Settings. */}
            {profile?.resumeUrl && (
              <Button size="sm" className="mr-1" asChild>
                <a
                  href={toResumeDownloadUrl(profile.resumeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download resume"
                >
                  <Download className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Download Resume</span>
                </a>
              </Button>
            )}

            <ThemeToggle />

            {/* On mobile the navigation becomes a drawer. */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="px-4 pt-4 text-base">Navigation</SheetTitle>
                <nav aria-label="Mobile" className="mt-4 flex flex-col gap-1 px-2">
                  {NAV_LINKS.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        cn(
                          'rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-border/60 border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {displayName}. Built with React, Express and TypeScript.
          </p>

          <div className="flex items-center gap-1">
            {profile?.githubUrl && (
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  // noreferrer also implies noopener, but both are stated so the
                  // intent survives someone editing one of them out.
                  rel="noopener noreferrer"
                  aria-label="GitHub profile"
                >
                  <GithubIcon className="size-4" aria-hidden="true" />
                </a>
              </Button>
            )}
            {profile?.linkedinUrl && (
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn profile"
                >
                  <LinkedinIcon className="size-4" aria-hidden="true" />
                </a>
              </Button>
            )}
            {profile?.publicEmail && (
              <Button variant="ghost" size="icon" asChild>
                <a href={`mailto:${profile.publicEmail}`} aria-label="Send an email">
                  <Mail className="size-4" aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
