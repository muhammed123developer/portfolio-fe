/**
 * The API contract, as the frontend sees it.
 *
 * Mirrors backend/src/types/domain.ts. Kept as a separate hand-written file
 * rather than imported across the monorepo boundary, because the frontend
 * should depend on the *published API shape*, not on backend internals — the
 * backend is free to restructure as long as these responses stay the same.
 *
 * All dates arrive as strings: ISO timestamps for createdAt/updatedAt,
 * "YYYY-MM-DD" for calendar dates like a job's start date.
 */

export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived'

export type SkillCategory = 'frontend' | 'backend' | 'database' | 'devops' | 'tools' | 'other'

export type MessageStatus = 'unread' | 'read' | 'archived'

export const SKILL_CATEGORIES: SkillCategory[] = [
  'frontend',
  'backend',
  'database',
  'devops',
  'tools',
  'other',
]

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  devops: 'DevOps',
  tools: 'Tools',
  other: 'Other',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
}

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface Admin extends BaseEntity {
  name: string
  email: string
  lastLoginAt: string | null
}

export interface Technology extends BaseEntity {
  name: string
  slug: string
  category: SkillCategory
  icon: string | null
}

export interface Project extends BaseEntity {
  title: string
  slug: string
  shortDescription: string
  description: string
  problem: string | null
  solution: string | null
  features: string[]
  architecture: string | null
  challenges: string | null
  lessonsLearned: string | null
  image: string | null
  screenshots: string[]
  githubUrl: string | null
  liveUrl: string | null
  featured: boolean
  status: ProjectStatus
  displayOrder: number
  /** Always resolved by the API — never raw ids. */
  technologies: Technology[]
}

export interface Experience extends BaseEntity {
  company: string
  position: string
  location: string | null
  startDate: string
  /** null means this is the current role. */
  endDate: string | null
  description: string | null
  technologies: string[]
  companyUrl: string | null
  displayOrder: number
}

export interface Education extends BaseEntity {
  institution: string
  degree: string
  field: string | null
  location: string | null
  startDate: string
  /** null means still studying. */
  endDate: string | null
  grade: string | null
  description: string | null
  displayOrder: number
}

export interface Skill extends BaseEntity {
  name: string
  category: SkillCategory
  icon: string | null
  proficiency: number
  displayOrder: number
}

export interface ContactMessage extends BaseEntity {
  name: string
  email: string
  subject: string
  message: string
  status: MessageStatus
  readAt: string | null
}

export interface Profile extends BaseEntity {
  fullName: string
  title: string
  tagline: string | null
  introduction: string | null
  philosophy: string | null
  currentFocus: string | null
  technicalInterests: string[]
  careerSummary: string | null
  publicEmail: string | null
  location: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  websiteUrl: string | null
  avatarUrl: string | null
  resumeUrl: string | null
  availableForWork: boolean
}

export interface DashboardStats {
  totalProjects: number
  featuredProjects: number
  totalSkills: number
  totalExperience: number
  totalEducation: number
  unreadMessages: number
  totalMessages: number
}

/* ------------------------------------------------------------- Transport */

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** A list response together with its pagination metadata. */
export interface Paged<T> {
  items: T[]
  meta: PaginationMeta
}

/* ------------------------------------------------------- Request payloads */

export interface ContactFormValues {
  name: string
  email: string
  subject: string
  message: string
}

export interface LoginValues {
  email: string
  password: string
}

export interface ProjectFilters {
  page?: number
  limit?: number
  featured?: boolean
  status?: ProjectStatus
  technology?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'order'
}

export interface MessageFilters {
  page?: number
  limit?: number
  status?: MessageStatus
  search?: string
}

export type ProjectInput = Partial<
  Omit<Project, keyof BaseEntity | 'technologies'> & { technologyIds: string[] }
>

export type ExperienceInput = Partial<Omit<Experience, keyof BaseEntity>>
export type EducationInput = Partial<Omit<Education, keyof BaseEntity>>
export type SkillInput = Partial<Omit<Skill, keyof BaseEntity>>
export type TechnologyInput = Partial<Omit<Technology, keyof BaseEntity | 'slug'>>
export type ProfileInput = Partial<Omit<Profile, keyof BaseEntity>>
