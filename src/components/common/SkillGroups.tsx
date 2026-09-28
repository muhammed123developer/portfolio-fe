import { useMemo, useState } from 'react'
import { Container, Database, Monitor, Server, Sparkles, Wrench, type LucideIcon } from 'lucide-react'

import { EmptyState } from '@/components/common/states'
import { useTheme } from '@/components/theme-provider'
import { ClippedCircle } from '@/components/ui/clipped-circle'
import { Skeleton } from '@/components/ui/skeleton'
import { Tilt } from '@/components/ui/tilt'
import { simpleIconSlug, simpleIconUrl } from '@/lib/simpleIcons'
import { SKILL_LEVELS, skillLevel } from '@/lib/skillLevels'
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS, type Skill, type SkillCategory } from '@/types/api'

/**
 * Skills grouped by category, then by level (Expert / Proficient / Familiar),
 * as logo chips on tilt cards.
 *
 * On hover a card tilts toward the cursor and a soft indigo/violet spotlight
 * follows the pointer behind the content, with the border and icon picking up
 * the same tint. The colours are the hero's tendril palette
 * (TendrilBackground.tsx), lighter indigo in light mode and deeper violet in
 * dark mode; text and logos never change colour.
 *
 * Levels replace the old percentage bars: the stored 0–100 proficiency only
 * decides which level a skill sits in (see lib/skillLevels.ts).
 *
 * Shared by the Home page and the About page, so the two cannot drift apart.
 * The API already returns skills in category-then-displayOrder sequence; this
 * only splits them into buckets rather than re-sorting.
 */

const CATEGORY_ICONS: Record<SkillCategory, LucideIcon> = {
  frontend: Monitor,
  backend: Server,
  database: Database,
  devops: Container,
  tools: Wrench,
  other: Sparkles,
}

interface SkillGroupsProps {
  skills: Skill[]
  loading?: boolean
}

/** Brand logo, or the skill's initial when Simple Icons has no logo for it. */
function SkillLogo({ name }: { name: string }) {
  const { resolvedTheme } = useTheme()
  const src = simpleIconUrl(simpleIconSlug(name), resolvedTheme)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (failedSrc === src) {
    return (
      <span
        aria-hidden="true"
        className="bg-muted text-muted-foreground flex size-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-semibold"
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={16}
      height={16}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className="size-4 shrink-0"
    />
  )
}

export function SkillGroups({ skills, loading }: SkillGroupsProps) {
  const grouped = useMemo(() => {
    const buckets = new Map<SkillCategory, Skill[]>()
    for (const skill of skills) {
      const existing = buckets.get(skill.category)
      if (existing) existing.push(skill)
      else buckets.set(skill.category, [skill])
    }
    // Iterate the canonical category order so empty categories are skipped but
    // the surviving ones keep a stable, intentional sequence.
    return SKILL_CATEGORIES.map((category) => {
      const items = buckets.get(category) ?? []
      return {
        category,
        levels: SKILL_LEVELS.map((level) => ({
          ...level,
          items: items.filter((skill) => skillLevel(skill.proficiency).key === level.key),
        })).filter((level) => level.items.length > 0),
      }
    }).filter((group) => group.levels.length > 0)
  }, [skills])

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border-border/70 space-y-4 rounded-xl border p-5">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 2 }).map((__, row) => (
              <div key={row} className="space-y-2.5">
                <Skeleton className="h-3 w-16" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((___, chip) => (
                    <Skeleton key={chip} className="h-7 w-20 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (grouped.length === 0) {
    return <EmptyState title="No skills available" message="Skills added in the admin panel will appear here." />
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {grouped.map(({ category, levels }) => {
        const Icon = CATEGORY_ICONS[category]
        const count = levels.reduce((total, level) => total + level.items.length, 0)
        return (
          <Tilt
            key={category}
            rotationFactor={6}
            className="group/tilt bg-card text-card-foreground relative overflow-hidden border-card-border rounded-xl border transition-[scale,box-shadow,border-color] duration-300 ease-out hover:scale-[1.02] hover:border-primary shadow-card hover:shadow-card-hover dark:hover:shadow-lg dark:hover:shadow-indigo-500/10 motion-reduce:hover:scale-100 dark:hover:border-violet-400/40"
          >
            {/* Spotlight first, content after (relative): the glow paints
                under the text and chips rather than over them. */}
            <ClippedCircle
              blend="normal"
              circleSize={520}
              circleClassName="bg-radial from-indigo-400/25 via-indigo-400/10 to-transparent to-70% dark:from-violet-400/20 dark:via-indigo-700/15"
            />

            <div className="relative flex flex-col gap-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                  <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md transition-colors duration-300 group-hover/tilt:bg-indigo-500/15 group-hover/tilt:text-indigo-500 dark:group-hover/tilt:text-violet-300">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {SKILL_CATEGORY_LABELS[category]}
                </h3>
                <span className="bg-secondary text-secondary-foreground shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {count} {count === 1 ? 'skill' : 'skills'}
                </span>
              </div>

              <div className="space-y-4">
                {levels.map((level) => (
                  <div key={level.key} className="space-y-2">
                    <h4 className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                      {level.label}
                      <span
                        className="bg-border h-px flex-1 transition-colors duration-300 group-hover/tilt:bg-indigo-400/30"
                        aria-hidden="true"
                      />
                    </h4>

                    <ul
                      className="flex flex-wrap gap-2"
                      aria-label={`${level.label} ${SKILL_CATEGORY_LABELS[category]} skills`}
                    >
                      {level.items.map((skill) => (
                        <li
                          key={skill.id}
                          className="bg-muted/60 border-border/70 dark:bg-background/60 dark:border-border flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-2 text-sm"
                        >
                          <SkillLogo name={skill.name} />
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </Tilt>
        )
      })}
    </div>
  )
}
