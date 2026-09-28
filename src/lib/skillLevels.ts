/**
 * Proficiency levels shown on the public site instead of raw percentages.
 *
 * The admin still stores a 0–100 number; the site only ever shows the level
 * it falls into. "92%" invites the question of what the missing 8% is, and
 * neighbouring values (90% vs 93%) carry no real meaning to a visitor.
 */

export type SkillLevel = 'expert' | 'proficient' | 'familiar'

export const SKILL_LEVELS: { key: SkillLevel; label: string; min: number }[] = [
  { key: 'expert', label: 'Expert', min: 88 },
  { key: 'proficient', label: 'Proficient', min: 80 },
  { key: 'familiar', label: 'Familiar', min: 0 },
]

export function skillLevel(proficiency: number): (typeof SKILL_LEVELS)[number] {
  return SKILL_LEVELS.find((level) => proficiency >= level.min) ?? SKILL_LEVELS[SKILL_LEVELS.length - 1]!
}
