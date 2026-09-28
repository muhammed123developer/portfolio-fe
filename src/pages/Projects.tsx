import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FolderGit2, Search, X } from 'lucide-react'

import { Seo } from '@/components/common/Seo'
import { ProjectCard } from '@/components/common/ProjectCard'
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/common/states'
import { GradientRing } from '@/components/common/GradientButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { listProjects } from '@/services/projectService'
import { listTechnologies } from '@/services/contentService'
import type { Paged, Project, Technology } from '@/types/api'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 9

/**
 * The project index: searchable, filterable by technology, paginated.
 *
 * Filter state lives in the URL rather than in component state, so a filtered
 * view can be shared, bookmarked and restored by the back button.
 */
export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const technology = searchParams.get('technology') ?? ''
  const search = searchParams.get('search') ?? ''

  // Local mirror so typing feels instant while the URL and the request lag
  // behind by the debounce interval.
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput, 350)

  const technologies = useApi<Technology[]>((signal) => listTechnologies(signal), [])

  const projects = useApi<Paged<Project>>(
    (signal) =>
      listProjects(
        {
          page,
          limit: PAGE_SIZE,
          ...(technology ? { technology } : {}),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
        signal
      ),
    [page, technology, debouncedSearch]
  )

  /** Writes filter state to the URL; any filter change resets to page 1. */
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(updates)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          if (!('page' in updates)) next.delete('page')
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // Mirror the debounced term into the URL. This must be an effect rather than
  // a bare conditional in the render body — updating router state during render
  // is a side effect and React rejects it.
  useEffect(() => {
    if (debouncedSearch !== search) {
      updateParams({ search: debouncedSearch || null })
    }
  }, [debouncedSearch, search, updateParams])

  const meta = projects.data?.meta
  const items = projects.data?.items ?? []
  const hasFilters = Boolean(technology || search)

  return (
    <>
      <Seo
        title="Projects"
        description="Full-stack projects with architecture notes, technical challenges and lessons learned."
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Projects</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-lg">
            Things I have built, written up as case studies rather than screenshots — the problem,
            the approach, and what I would do differently.
          </p>
        </header>

        {/* ------------------------------------------------------ Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-sm">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
              className="pl-9"
            />
          </div>

          {technologies.data && technologies.data.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <FilterChip active={!technology} onClick={() => updateParams({ technology: null })}>
                All
              </FilterChip>

              {technologies.data.map((item) => (
                <FilterChip
                  key={item.id}
                  active={technology === item.slug}
                  onClick={() =>
                    updateParams({ technology: technology === item.slug ? null : item.slug })
                  }
                >
                  {item.name}
                </FilterChip>
              ))}
            </div>
          )}

          {hasFilters && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {meta ? `${meta.total} result${meta.total === 1 ? '' : 's'}` : 'Filtering…'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setSearchInput('')
                  setSearchParams({}, { replace: true })
                }}
              >
                <X className="size-3" aria-hidden="true" />
                Clear filters
              </Button>
            </div>
          )}
        </div>

        {/* -------------------------------------------------------- Grid */}
        {projects.error ? (
          <ErrorState message={projects.error.message} onRetry={projects.refetch} />
        ) : projects.loading ? (
          <CardGridSkeleton count={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FolderGit2 className="size-5" aria-hidden="true" />}
            title="No projects found"
            message={
              hasFilters
                ? 'No projects match those filters. Try clearing them.'
                : 'Projects added in the admin panel will appear here.'
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput('')
                    setSearchParams({}, { replace: true })
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* -------------------------------------------------- Pagination */}
        {meta && meta.totalPages > 1 && (
          <nav
            aria-label="Project pages"
            className="mt-12 flex items-center justify-center gap-3"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPreviousPage}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              Previous
            </Button>

            <Badge variant="secondary" className="tabular-nums">
              Page {meta.page} of {meta.totalPages}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNextPage}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              Next
            </Button>
          </nav>
        )}
      </div>
    </>
  )
}

/**
 * A technology filter chip.
 *
 * The active chip carries the animated gradient ring. It is drawn with
 * `GradientRing` rather than by wrapping in `GradientButton`, because a
 * wrapper adds `2 × thickness` to the element — which would make the whole row
 * of chips reflow every time the selection changed. This version is
 * absolutely positioned inside the button and costs no layout space.
 *
 * Both states use the same `outline` variant so the border box is identical;
 * the active chip only makes its own border transparent so the ring shows
 * through. Dimensions are therefore byte-identical between states.
 *
 * Only the active chip animates. Giving all two dozen chips a spinning border
 * would be visual noise, and two dozen simultaneously animating layers is work
 * for no benefit.
 */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative isolate h-7 overflow-hidden rounded-full px-3 text-xs',
        active ? 'text-foreground border-transparent font-medium' : 'text-muted-foreground'
      )}
    >
      {active && <GradientRing thickness={1} duration={5} />}
      {children}
    </Button>
  )
}
