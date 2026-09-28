import { Link } from 'react-router-dom'
import {
  Briefcase,
  FolderGit2,
  GraduationCap,
  Mail,
  MailOpen,
  Sparkles,
  Star,
} from 'lucide-react'

import { Seo } from '@/components/common/Seo'
import { ErrorState } from '@/components/common/states'
import { PageHeader } from '@/components/admin/FormField'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/hooks/useAuth'
import { getDashboardStats } from '@/services/authService'
import type { DashboardStats } from '@/types/api'
import { cn } from '@/lib/utils'

/**
 * Admin landing screen.
 *
 * All seven figures come from a single request — the backend counts them
 * server-side rather than the frontend fetching seven collections and
 * measuring their lengths.
 */
export default function Dashboard() {
  const { admin } = useAuth()
  const { data, loading, error, refetch } = useApi<DashboardStats>(
    (signal) => getDashboardStats(signal),
    []
  )

  const cards = [
    {
      label: 'Total Projects',
      value: data?.totalProjects,
      icon: FolderGit2,
      to: '/admin/projects',
    },
    {
      label: 'Featured Projects',
      value: data?.featuredProjects,
      icon: Star,
      to: '/admin/projects',
    },
    { label: 'Total Skills', value: data?.totalSkills, icon: Sparkles, to: '/admin/skills' },
    {
      label: 'Experience Entries',
      value: data?.totalExperience,
      icon: Briefcase,
      to: '/admin/experience',
    },
    {
      label: 'Education Entries',
      value: data?.totalEducation,
      icon: GraduationCap,
      to: '/admin/education',
    },
    {
      label: 'Unread Messages',
      value: data?.unreadMessages,
      icon: Mail,
      to: '/admin/messages',
      // The one figure that means "you have something to do".
      highlight: (data?.unreadMessages ?? 0) > 0,
    },
    { label: 'Total Messages', value: data?.totalMessages, icon: MailOpen, to: '/admin/messages' },
  ]

  return (
    <>
      <Seo title="Dashboard" />

      <PageHeader
        title={admin ? `Welcome back, ${admin.name.split(' ')[0]}` : 'Dashboard'}
        description="An overview of everything on the site."
      />

      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card
                className={cn(
                  'h-full transition-colors',
                  card.highlight ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'
                )}
              >
                <CardContent className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg',
                      card.highlight
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <card.icon className="size-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-muted-foreground truncate text-xs font-medium">
                      {card.label}
                    </p>
                    {loading ? (
                      <Skeleton className="mt-1 h-7 w-10" />
                    ) : (
                      <p className="text-2xl font-bold tabular-nums">{card.value ?? 0}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
