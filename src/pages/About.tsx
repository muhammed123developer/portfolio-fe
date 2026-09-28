import { Compass, Heart, Sparkles, Target } from 'lucide-react'

import { Seo } from '@/components/common/Seo'
import { SkillGroups } from '@/components/common/SkillGroups'
import { ErrorState, TextSkeleton } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useApi } from '@/hooks/useApi'
import { useProfile } from '@/hooks/useProfile'
import { listSkills } from '@/services/contentService'
import type { Skill } from '@/types/api'

/**
 * The About page.
 *
 * Reads entirely from the profile record, so every word here is editable from
 * the admin Settings screen — which is what §7 of the brief required.
 */
export default function About() {
  const { profile, loading, error, refetch } = useProfile()
  const skills = useApi<Skill[]>((signal) => listSkills(undefined, signal), [])

  return (
    <>
      <Seo
        title="About"
        description={profile?.careerSummary ?? 'About me, my development philosophy and current focus.'}
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About</h1>
          {profile && (
            <p className="text-muted-foreground mt-3 text-lg">
              {profile.title}
              {profile.location && <> · {profile.location}</>}
            </p>
          )}
        </header>

        {error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : loading ? (
          <div className="space-y-10">
            <TextSkeleton lines={4} />
            <TextSkeleton lines={5} />
            <TextSkeleton lines={3} />
          </div>
        ) : profile ? (
          <div className="space-y-12">
            {profile.introduction && (
              <section>
                <h2 className="sr-only">Introduction</h2>
                <p className="text-lg leading-relaxed whitespace-pre-line text-pretty">
                  {profile.introduction}
                </p>
              </section>
            )}

            {profile.careerSummary && (
              <Prose icon={Compass} title="Career so far">
                {profile.careerSummary}
              </Prose>
            )}

            {profile.philosophy && (
              <Prose icon={Heart} title="Development philosophy">
                {profile.philosophy}
              </Prose>
            )}

            {profile.currentFocus && (
              <Prose icon={Target} title="Current focus">
                {profile.currentFocus}
              </Prose>
            )}

            {profile.technicalInterests.length > 0 && (
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="text-primary size-4" aria-hidden="true" />
                    Technical interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-2">
                    {profile.technicalInterests.map((interest) => (
                      <li key={interest}>
                        <Badge variant="secondary" className="font-normal">
                          {interest}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        <Separator className="my-14" />

        <section>
          <h2 className="text-2xl font-semibold tracking-tight">Skills</h2>
          <p className="text-muted-foreground mt-2 mb-8">
            Grouped by area, with a rough sense of where my strengths sit.
          </p>

          {skills.error ? (
            <ErrorState message={skills.error.message} onRetry={skills.refetch} />
          ) : (
            <SkillGroups skills={skills.data ?? []} loading={skills.loading} />
          )}
        </section>
      </div>
    </>
  )
}

function Prose({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: string
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Icon className="text-primary size-5" aria-hidden="true" />
        {title}
      </h2>
      <p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-line text-pretty">
        {children}
      </p>
    </section>
  )
}
