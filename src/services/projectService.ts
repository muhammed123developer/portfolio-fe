import { del, get, getPaged, post, put } from './api'
import type { Paged, Project, ProjectFilters, ProjectInput } from '@/types/api'

/**
 * Project endpoints.
 *
 * Components never build a URL or a query string — they call these. That keeps
 * the API surface discoverable in one file and means an endpoint change is a
 * single edit.
 */

/** Drops undefined/empty values so the URL stays clean and cacheable. */
function toParams(filters: ProjectFilters): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {}
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit
  if (filters.featured !== undefined) params.featured = filters.featured
  if (filters.status) params.status = filters.status
  if (filters.technology) params.technology = filters.technology
  if (filters.search) params.search = filters.search
  if (filters.sort) params.sort = filters.sort
  return params
}

export function listProjects(
  filters: ProjectFilters = {},
  signal?: AbortSignal
): Promise<Paged<Project>> {
  return getPaged<Project>('/projects', { params: toParams(filters), signal })
}

/** Public lookup is by slug, not id — that is what the URL carries. */
export function getProject(slug: string, signal?: AbortSignal): Promise<Project> {
  return get<Project>(`/projects/${slug}`, { signal })
}

export function createProject(input: ProjectInput): Promise<Project> {
  return post<Project>('/projects', input)
}

export function updateProject(id: string, input: ProjectInput): Promise<Project> {
  return put<Project>(`/projects/${id}`, input)
}

export function deleteProject(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/projects/${id}`)
}
