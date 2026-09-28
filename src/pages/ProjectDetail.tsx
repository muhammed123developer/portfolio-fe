import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Lightbulb,
  Layers,
  Target,
  TriangleAlert,
  Wrench,
} from 'lucide-react'

import { GithubIcon } from '@/components/common/BrandIcons'
import { ProjectThumbnail } from '@/components/common/ProjectThumbnail'

import { Seo } from '@/components/common/Seo'
import { ErrorState, TextSkeleton } from '@/components/common/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/useApi'
import { getProject } from '@/services/projectService'
import { PROJECT_STATUS_LABELS, type Project } from '@/types/api'

/**
 * The project case study.
 *
 * Structured as problem → solution → features → architecture → challenges →
 * lessons, because that sequence is what an interviewer actually asks about.
 * Every section is optional and simply omitted when empty, so a half-written
 * project still renders cleanly instead of showing empty headings.
 */
export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()

  const { data: project, loading, error, refetch } = useApi<Project>(
    (signal) => getProject(slug ?? '', signal),
    [slug],
    { enabled: Boolean(slug) }
  )

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <Skeleton className="mb-6 h-9 w-32" />
        <Skeleton className="mb-4 h-10 w-3/4" />
        <TextSkeleton lines={3} />
        <Skeleton className="mt-8 aspect-video w-full rounded-xl" />
        <div className="mt-10 space-y-8">
          <TextSkeleton lines={4} />
          <TextSkeleton lines={4} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6">
        <ErrorState
          title={error.status === 404 ? 'Project not found' : 'Could not load this project'}
          message={
            error.status === 404
              ? 'That project does not exist, or its link has changed.'
              : error.message
          }
          onRetry={error.status === 404 ? undefined : refetch}
        />
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline">
            <Link to="/projects">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to projects
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <>
      <Seo
        title={project.title}
        description={project.shortDescription}
        image={project.image ?? undefined}
        type="article"
      />

      <article className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <Button asChild variant="ghost" size="sm" className="mb-8 -ml-2">
          <Link to="/projects">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All projects
          </Link>
        </Button>

        <header>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {project.featured && <Badge>Featured</Badge>}
            <Badge variant="secondary">{PROJECT_STATUS_LABELS[project.status]}</Badge>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {project.title}
          </h1>

          <p className="text-muted-foreground mt-4 text-lg leading-relaxed text-pretty">
            {project.shortDescription}
          </p>

          {project.technologies.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {project.technologies.map((technology) => (
                <Badge key={technology.id} variant="outline" className="font-normal">
                  {technology.name}
                </Badge>
              ))}
            </div>
          )}

          {(project.githubUrl || project.liveUrl) && (
            <div className="mt-7 flex flex-wrap gap-3">
              {project.githubUrl && (
                <Button asChild variant="outline">
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <GithubIcon className="size-4" aria-hidden="true" />
                    View source
                  </a>
                </Button>
              )}
              {project.liveUrl && (
                <Button asChild>
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Live demo
                  </a>
                </Button>
              )}
            </div>
          )}
        </header>

        <div className="bg-muted mt-10 aspect-video overflow-hidden rounded-xl border">
          <ProjectThumbnail
            src={project.image}
            title={project.title}
            slug={project.slug}
            size="hero"
          />
        </div>

        <Separator className="my-12" />

        <div className="space-y-12">
          <Section title="Overview">{project.description}</Section>

          <Section title="The problem" icon={Target}>
            {project.problem}
          </Section>

          <Section title="The solution" icon={Lightbulb}>
            {project.solution}
          </Section>

          {project.features.length > 0 && (
            <section>
              <SectionHeading icon={CheckCircle2}>Key features</SectionHeading>
              <ul className="mt-4 space-y-2.5">
                {project.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <CheckCircle2
                      className="text-primary mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Section title="Architecture" icon={Layers}>
            {project.architecture}
          </Section>

          <Section title="Challenges" icon={TriangleAlert}>
            {project.challenges}
          </Section>

          <Section title="Lessons learned" icon={Wrench}>
            {project.lessonsLearned}
          </Section>

          {project.screenshots.length > 0 && (
            <section>
              <SectionHeading icon={ImageIcon}>Screenshots</SectionHeading>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {project.screenshots.map((screenshot, index) => (
                  <img
                    key={screenshot}
                    src={screenshot}
                    alt={`${project.title} screenshot ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-lg border"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  )
}

/* ------------------------------------------------------------- Internals */

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType
  children: React.ReactNode
}) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
      {Icon && <Icon className="text-primary size-5" aria-hidden="true" />}
      {children}
    </h2>
  )
}

/** Renders nothing when the field is empty, so no orphan headings appear. */
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ElementType
  children: string | null | undefined
}) {
  if (!children?.trim()) return null

  return (
    <section>
      <SectionHeading icon={icon}>{title}</SectionHeading>
      {/* whitespace-pre-line preserves paragraph breaks typed in the admin
          textarea without needing a Markdown renderer. */}
      <p className="text-muted-foreground mt-4 leading-relaxed whitespace-pre-line text-pretty">
        {children}
      </p>
    </section>
  )
}
