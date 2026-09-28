import { Briefcase } from 'lucide-react'

import { Seo } from '@/components/common/Seo'
import { TechIconCloud } from '@/components/common/TechIconCloud'
import { Timeline, type TimelineEntry } from '@/components/common/Timeline'
import { EmptyState, ErrorState, TimelineSkeleton } from '@/components/common/states'
import { useApi } from '@/hooks/useApi'
import { listExperience } from '@/services/contentService'
import type { Experience as ExperienceRecord } from '@/types/api'

/** The career timeline. */
export default function Experience() {
  const { data, loading, error, refetch } = useApi<ExperienceRecord[]>(
    (signal) => listExperience(signal),
    []
  )

  const entries: TimelineEntry[] = (data ?? []).map((item) => ({
    id: item.id,
    title: item.position,
    subtitle: item.company,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate,
    description: item.description,
    tags: item.technologies,
    url: item.companyUrl,
  }))

  return (
    <>
      <Seo
        title="Experience"
        description="Professional experience, roles and the technologies used in each."
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="mb-12 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Experience</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Where I have worked and what I actually did there.
            </p>
          </div>

          {/* Fixed box so the heading does not shift when the logos arrive. */}
          <div className="size-28 shrink-0 sm:size-44">
            <TechIconCloud />
          </div>
        </header>

        {error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : loading ? (
          <TimelineSkeleton count={3} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="size-5" aria-hidden="true" />}
            title="No experience entries found"
            message="Roles added in the admin panel will appear here."
          />
        ) : (
          <Timeline entries={entries} />
        )}
      </div>
    </>
  )
}
