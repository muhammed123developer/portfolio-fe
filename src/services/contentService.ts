import { del, get, post, put } from './api'
import type {
  Education,
  EducationInput,
  Experience,
  ExperienceInput,
  Profile,
  ProfileInput,
  Skill,
  SkillCategory,
  SkillInput,
  Technology,
  TechnologyInput,
} from '@/types/api'

/**
 * Experience, education, skills, technologies and the profile.
 *
 * Grouped into one module because each is a small, flat resource with an
 * identical CRUD shape — a file apiece would be five files of four lines.
 * Projects and contact messages get their own modules because they carry
 * pagination and filtering.
 */

/* ------------------------------------------------------------ Experience */

export function listExperience(signal?: AbortSignal): Promise<Experience[]> {
  return get<Experience[]>('/experience', { signal })
}

export function createExperience(input: ExperienceInput): Promise<Experience> {
  return post<Experience>('/experience', input)
}

export function updateExperience(id: string, input: ExperienceInput): Promise<Experience> {
  return put<Experience>(`/experience/${id}`, input)
}

export function deleteExperience(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/experience/${id}`)
}

/* ------------------------------------------------------------- Education */

export function listEducation(signal?: AbortSignal): Promise<Education[]> {
  return get<Education[]>('/education', { signal })
}

export function createEducation(input: EducationInput): Promise<Education> {
  return post<Education>('/education', input)
}

export function updateEducation(id: string, input: EducationInput): Promise<Education> {
  return put<Education>(`/education/${id}`, input)
}

export function deleteEducation(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/education/${id}`)
}

/* ----------------------------------------------------------------- Skills */

export function listSkills(category?: SkillCategory, signal?: AbortSignal): Promise<Skill[]> {
  return get<Skill[]>('/skills', { params: category ? { category } : undefined, signal })
}

export function createSkill(input: SkillInput): Promise<Skill> {
  return post<Skill>('/skills', input)
}

export function updateSkill(id: string, input: SkillInput): Promise<Skill> {
  return put<Skill>(`/skills/${id}`, input)
}

export function deleteSkill(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/skills/${id}`)
}

/* ----------------------------------------------------------- Technologies */

export function listTechnologies(signal?: AbortSignal): Promise<Technology[]> {
  return get<Technology[]>('/technologies', { signal })
}

export function createTechnology(input: TechnologyInput): Promise<Technology> {
  return post<Technology>('/technologies', input)
}

export function updateTechnology(id: string, input: TechnologyInput): Promise<Technology> {
  return put<Technology>(`/technologies/${id}`, input)
}

/** Also detaches the technology from every project — see the API docs. */
export function deleteTechnology(id: string): Promise<{ deleted: boolean; detachedFrom: number }> {
  return del<{ deleted: boolean; detachedFrom: number }>(`/technologies/${id}`)
}

/* ---------------------------------------------------------------- Profile */

export function getProfile(signal?: AbortSignal): Promise<Profile> {
  return get<Profile>('/profile', { signal })
}

export function updateProfile(input: ProfileInput): Promise<Profile> {
  return put<Profile>('/profile', input)
}
