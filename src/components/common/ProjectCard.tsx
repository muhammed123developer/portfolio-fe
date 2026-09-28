import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink, RotateCw } from 'lucide-react'

import { GithubIcon } from '@/components/common/BrandIcons'
import { FlipCard } from '@/components/common/FlipCard'
import { ProjectThumbnail } from '@/components/common/ProjectThumbnail'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PROJECT_STATUS_LABELS, type Project } from '@/types/api'

/** Live-demo link, shown on both faces of the card. */
function DemoButton({ href, title, className }: { href: string; title: string; className?: string }) {
  return (
    <Button asChild variant="outline" size="sm" className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${title} live demo`}>
        <ExternalLink className="size-3.5" aria-hidden="true" />
        Demo
      </a>
    </Button>
  )
}

/**
 * A project in the grid, as a card that flips.
 *
 * Clicking (or tapping, dragging sideways, or Enter with the card focused)
 * turns it over. The back carries the details and the real navigation — the
 * full case study, source and demo — so the first click previews and the
 * second commits. Links on the back work without flipping the card; see
 * FlipCard.tsx.
 */
export function ProjectCard({ project }: { project: Project }) {
  const front = (
    <div className="flex h-full flex-col">
      <div className="bg-muted relative aspect-16/10 shrink-0 overflow-hidden">
        {/* Handles both "no image" and "image failed to load" — see the
            component for why those need to be distinguished. */}
        <ProjectThumbnail src={project.image} title={project.title} slug={project.slug} />

        {project.featured && <Badge className="absolute top-3 left-3 shadow-sm">Featured</Badge>}
        {project.status !== 'completed' && (
          <Badge variant="secondary" className="absolute top-3 right-3 shadow-sm">
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="leading-snug font-semibold tracking-tight">{project.title}</h3>

        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {project.shortDescription}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <RotateCw className="size-3.5" aria-hidden="true" />
            Click to see details
          </p>
          {/* Opens the demo without flipping — FlipCard ignores clicks on links. */}
          {project.liveUrl && <DemoButton href={project.liveUrl} title={project.title} />}
        </div>
      </div>
    </div>
  )

  const back = (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="space-y-2">
        <h3 className="leading-snug font-semibold tracking-tight">{project.title}</h3>
        <p className="text-muted-foreground line-clamp-6 text-sm leading-relaxed">
          {project.shortDescription}
        </p>
      </div>

      {project.technologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((technology) => (
            <Badge key={technology.id} variant="outline" className="text-xs font-normal">
              {technology.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto space-y-2">
        <Button asChild size="sm" className="w-full">
          <Link to={`/projects/${project.slug}`}>
            View full details
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>

        {(project.githubUrl || project.liveUrl) && (
          <div className="flex gap-2">
            {project.githubUrl && (
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${project.title} source code on GitHub`}
                >
                  <GithubIcon className="size-3.5" aria-hidden="true" />
                  Code
                </a>
              </Button>
            )}
            {project.liveUrl && (
              <DemoButton href={project.liveUrl} title={project.title} className="flex-1" />
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <FlipCard
      front={front}
      back={back}
      ariaLabel={project.title}
      width="100%"
      height={440}
      radius={14}
      tiltMax={8}
      glareOpacity={0.12}
      hoverScale={1.02}
      background="var(--card)"
      color="var(--card-foreground)"
      border="var(--card-border)"
      // Tint and strength come from index.css: a soft indigo lift in light
      // mode, transparent (no shadow) in dark.
      shadowColor="var(--card-shadow-tint)"
      shadowOpacity={0.22}
    />
  )
}
