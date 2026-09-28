import { GraduationCap } from 'lucide-react'

import { Seo } from '@/components/common/Seo'
import { Timeline, type TimelineEntry } from '@/components/common/Timeline'
import { EmptyState, ErrorState, TimelineSkeleton } from '@/components/common/states'
import { useApi } from '@/hooks/useApi'
import { listEducation } from '@/services/contentService'
import type { Education as EducationRecord } from '@/types/api'

/** The education timeline — same component as Experience, different source. */
export default function Education() {
  const { data, loading, error, refetch } = useApi<EducationRecord[]>(
    (signal) => listEducation(signal),
    []
  )

  const entries: TimelineEntry[] = (data ?? []).map((item) => ({
    id: item.id,
    title: item.degree,
    subtitle: item.institution,
    // Field of study and grade share the third line rather than each taking
    // their own, which would make short entries look sparse.
    detail: [item.field, item.grade].filter(Boolean).join(' · ') || null,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate,
    description: item.description,
  }))

  return (
    <>
      <Seo title="Education" description="Academic background, qualifications and ongoing study." />

      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Education</h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Formal qualifications and continuing study.
          </p>
        </header>

        {error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : loading ? (
          <TimelineSkeleton count={2} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="size-5" aria-hidden="true" />}
            title="No education entries found"
            message="Qualifications added in the admin panel will appear here."
          />
        ) : (
          <Timeline entries={entries} />
        )}
      </div>
    </>
  )
}
