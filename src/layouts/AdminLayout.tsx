import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { toast } from 'sonner'

import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { initialsOf } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Admin chrome: a fixed sidebar on desktop, a drawer on mobile.
 *
 * The same nav list drives both, so an added screen appears in each without a
 * second edit.
 */

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/admin/experience', label: 'Experience', icon: Briefcase },
  { to: '/admin/education', label: 'Education', icon: GraduationCap },
  { to: '/admin/skills', label: 'Skills', icon: Sparkles },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close the drawer on navigation — otherwise it stays open over the page the
  // reader just asked for.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="bg-muted/20 min-h-svh">
      <a
        href="#admin-content"
        className="bg-primary text-primary-foreground sr-only rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
      >
        Skip to content
      </a>

      {/* --------------------------------------------- Desktop sidebar --- */}
      <aside className="border-border/60 bg-background fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r lg:flex">
        <SidebarContent onLogout={handleLogout} adminName={admin?.name} adminEmail={admin?.email} />
      </aside>

      <div className="lg:pl-60">
        {/* ------------------------------------------------- Top bar --- */}
        <header className="border-border/60 bg-background/80 sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <SidebarContent
                onLogout={handleLogout}
                adminName={admin?.name}
                adminEmail={admin?.email}
              />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" aria-hidden="true" />
              View site
            </Link>
          </Button>

          <ThemeToggle />

          <div className="bg-primary/10 text-primary hidden size-8 items-center justify-center rounded-full text-xs font-semibold sm:flex">
            {admin ? initialsOf(admin.name) : '—'}
          </div>
        </header>

        <main id="admin-content" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Internals */

/** Shared by the desktop sidebar and the mobile drawer. */
function SidebarContent({
  onLogout,
  adminName,
  adminEmail,
}: {
  onLogout: () => void
  adminName?: string
  adminEmail?: string
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
          <Terminal className="size-4" aria-hidden="true" />
        </span>
        <span className="font-semibold tracking-tight">Admin</span>
      </div>

      <Separator />

      <nav aria-label="Admin sections" className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'focus-visible:ring-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      <div className="space-y-3 p-3">
        {adminName && (
          <div className="px-2">
            <p className="truncate text-sm font-medium">{adminName}</p>
            <p className="text-muted-foreground truncate text-xs">{adminEmail}</p>
          </div>
        )}

        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-destructive w-full justify-start gap-3"
          onClick={onLogout}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </div>
  )
}
