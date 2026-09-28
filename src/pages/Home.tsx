import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Sparkles } from 'lucide-react'

import { GithubIcon, LinkedinIcon } from '@/components/common/BrandIcons'

import { Seo } from '@/components/common/Seo'
import { TendrilBackground } from '@/components/common/TendrilBackground'
import { GradientButton } from '@/components/common/GradientButton'
import { CardGridSkeleton, ErrorState, TextSkeleton } from '@/components/common/states'
import { ProjectCard } from '@/components/common/ProjectCard'
import { SkillGroups } from '@/components/common/SkillGroups'
import { TechText } from '@/components/common/TechText'
import { useTheme } from '@/components/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/useApi'
import { useProfile } from '@/hooks/useProfile'
import { listProjects } from '@/services/projectService'
import { listSkills } from '@/services/contentService'
import type { Paged, Project, Skill } from '@/types/api'

/**
 * The landing page.
 *
 * Every piece of content here is fetched — the hero copy from the profile, the
 * featured work from the projects endpoint, the skills from the skills
 * endpoint. Nothing is hardcoded, which is what makes the admin panel
 * meaningful rather than decorative.
 */
export default function Home() {
  const { profile, loading: profileLoading, error: profileError, refetch } = useProfile()
  const { resolvedTheme } = useTheme()

  const featured = useApi<Paged<Project>>(
    (signal) => listProjects({ featured: true, limit: 3 }, signal),
    []
  )

  const skills = useApi<Skill[]>((signal) => listSkills(undefined, signal), [])

  return (
    <>
      <Seo
        title={profile ? `${profile.fullName} · ${profile.title}` : 'Portfolio'}
        description={
          profile?.tagline ??
          'Full-stack developer building scalable, production-ready web applications.'
        }
      />

      {/* ------------------------------------------------------------ Hero */}
      <section className="relative isolate overflow-hidden">
        {/* Animated flow field. Also the fallback layer: it renders nothing
            when the visitor prefers reduced motion, leaving the gradient. */}
        <TendrilBackground className="-z-20" opacity={resolvedTheme === 'dark' ? 0.55 : 0.35} />

        {/* Gradient wash, layered above the canvas so the text sits on a
            calmer ground near the top of the page. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_50%_-20%,var(--color-accent),transparent)] opacity-60"
        />

        {/* Fades the field out at the bottom edge so it does not collide with
            the "Featured work" section below. */}
        <div
          aria-hidden="true"
          className="from-background pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t to-transparent"
        />

        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          {profileError ? (
            <ErrorState message={profileError.message} onRetry={refetch} />
          ) : profileLoading ? (
            <div className="max-w-2xl space-y-6">
              <TextSkeleton lines={1} />
              <TextSkeleton lines={2} />
              <TextSkeleton lines={3} />
            </div>
          ) : profile ? (
            <div className="max-w-3xl">
              {profile.avatarUrl && (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="animate-in fade-in ring-border mb-6 size-24 rounded-full object-cover ring-2 duration-700 sm:size-28"
                />
              )}

              {profile.availableForWork && (
                <Badge
                  variant="secondary"
                  className="animate-in fade-in slide-in-from-bottom-2 bg-card border-border shadow-card dark:bg-secondary mb-6 gap-1.5 duration-700 dark:border-transparent"
                >
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping bg-emerald-500 dark:bg-primary rounded-full opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500 dark:bg-primary" />
                  </span>
                  Available for work
                </Badge>
              )}

              {/* The real heading, for search engines and screen readers. The
                  visible name is drawn below: an interactive canvas wordmark
                  from sm up, plain text on phones where there is no hover. */}
              <h1 className="sr-only">{profile.fullName}</h1>

              <div
                aria-hidden="true"
                className="animate-in fade-in slide-in-from-bottom-3 -ml-2 hidden h-24 duration-700 sm:block lg:h-28"
              >
                <TechText
                  text={profile.fullName}
                  ariaHidden
                  align="left"
                  fontSize={64}
                  fontWeight={700}
                  letterSpacing={-0.03}
                  reveal="letter"
                  // Plays on its own when the pointer is elsewhere; pauses when
                  // scrolled out of view or when the visitor prefers reduced motion.
                  sweep
                  specks={10}
                  // The dimension labels read as a rendering glitch at rest.
                  labels={false}
                  // Canvas colours cannot read CSS variables; these match
                  // --foreground in each theme (index.css).
                  color={resolvedTheme === 'dark' ? '#fafafa' : '#171724'}
                  accentColor={resolvedTheme === 'dark' ? '#d4d4d4' : '#4f46e5'}
                />
              </div>

              <p
                aria-hidden="true"
                className="animate-in fade-in slide-in-from-bottom-3 text-4xl font-bold tracking-tight text-balance duration-700 sm:hidden"
              >
                {profile.fullName}
              </p>

              <p className="text-primary animate-in fade-in slide-in-from-bottom-3 mt-3 text-xl font-medium duration-700 sm:text-2xl">
                {profile.title}
              </p>

              {profile.tagline && (
                <p className="text-muted-foreground animate-in fade-in slide-in-from-bottom-3 mt-6 max-w-2xl text-lg leading-relaxed text-pretty duration-1000">
                  {profile.tagline}
                </p>
              )}

              {profile.introduction && (
                <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed text-pretty">
                  {profile.introduction}
                </p>
              )}

              <div className="mt-9 flex flex-wrap items-center gap-3">
                {/* asChild so the ring wraps the Button itself — a raw anchor
                    here would trigger a full page reload rather than a
                    client-side route change.

                    The Buttons are `ghost` and transparent: GradientButton
                    paints the opaque face itself, so the ring stays a ring. */}
                {resolvedTheme === 'dark' ? (
                  <GradientButton asChild duration={3.5} thickness={2} radius="0.65rem">
                    <Button asChild size="lg" variant="ghost" className="bg-transparent">
                      <Link to="/projects">
                        View Projects
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </GradientButton>
                ) : (
                  // Light mode: one solid primary action beside the ringed
                  // secondary, instead of two competing rings.
                  <Button asChild size="lg" className="shadow-card h-10 rounded-[0.65rem] px-4">
                    <Link to="/projects">
                      View Projects
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                )}

                <GradientButton
                  asChild
                  duration={6}
                  thickness={2}
                  radius="0.65rem"
                  {...(resolvedTheme === 'dark'
                    ? { color: '#7C3AED', headColor: '#22D3EE' }
                    : { color: '#4F46E5', headColor: '#A5B4FC', baseColor: 'var(--color-border)' })}
                >
                  <Button asChild size="lg" variant="ghost" className="bg-transparent">
                    <Link to="/contact">Contact Me</Link>
                  </Button>
                </GradientButton>

                {profile.githubUrl && (
                  <Button asChild size="icon" variant="ghost" className="size-10">
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub profile"
                    >
                      <GithubIcon className="size-5" aria-hidden="true" />
                    </a>
                  </Button>
                )}

                {profile.linkedinUrl && (
                  <Button asChild size="icon" variant="ghost" className="size-10">
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn profile"
                    >
                      <LinkedinIcon className="size-5" aria-hidden="true" />
                    </a>
                  </Button>
                )}
              </div>

              {profile.location && (
                <p className="text-muted-foreground mt-8 flex items-center gap-1.5 text-sm">
                  <MapPin className="size-4" aria-hidden="true" />
                  {profile.location}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* -------------------------------------------------- Featured work */}
      <section className="border-border/60 border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Featured work</h2>
              <p className="text-muted-foreground mt-2">
                A few projects that show how I approach building software.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/projects">
                All projects
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {featured.error ? (
            <ErrorState message={featured.error.message} onRetry={featured.refetch} />
          ) : featured.loading ? (
            <CardGridSkeleton count={3} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.data?.items.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------- Skills */}
      <section className="dark:bg-muted/30 border-border/60 border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              <Sparkles className="text-primary size-6" aria-hidden="true" />
              Technical skills
            </h2>
            <p className="text-muted-foreground mt-2">
              Tools and technologies I work with day to day.
            </p>
          </div>

          {skills.error ? (
            <ErrorState message={skills.error.message} onRetry={skills.refetch} />
          ) : (
            <SkillGroups skills={skills.data ?? []} loading={skills.loading} />
          )}
        </div>
      </section>
    </>
  )
}
