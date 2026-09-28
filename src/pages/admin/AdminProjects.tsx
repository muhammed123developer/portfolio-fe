import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Seo } from '@/components/common/Seo'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog'
import { FormField, PageHeader } from '@/components/admin/FormField'
import { ImageUploadField } from '@/components/admin/ImageUploadField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '@/services/projectService'
import { listTechnologies } from '@/services/contentService'
import {
  PROJECT_STATUS_LABELS,
  type Paged,
  type Project,
  type ProjectStatus,
  type Technology,
} from '@/types/api'
import { cn } from '@/lib/utils'

/** Fields the dialog edits. Long-form case-study text is included. */
interface ProjectFormValues {
  title: string
  shortDescription: string
  description: string
  problem: string
  solution: string
  features: string
  architecture: string
  challenges: string
  lessonsLearned: string
  image: string
  githubUrl: string
  liveUrl: string
  status: ProjectStatus
  featured: boolean
  displayOrder: number
}

const EMPTY: ProjectFormValues = {
  title: '',
  shortDescription: '',
  description: '',
  problem: '',
  solution: '',
  features: '',
  architecture: '',
  challenges: '',
  lessonsLearned: '',
  image: '',
  githubUrl: '',
  liveUrl: '',
  status: 'completed',
  featured: false,
  displayOrder: 0,
}

/**
 * Project management.
 *
 * The richest of the admin screens: full CRUD plus technology selection and
 * the case-study fields that make a project page worth reading.
 */
export default function AdminProjects() {
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  const projects = useApi<Paged<Project>>(
    (signal) => listProjects({ page, limit: 10, sort: 'order' }, signal),
    [page]
  )
  const technologies = useApi<Technology[]>((signal) => listTechnologies(signal), [])

  const saveMutation = useApiMutation(
    async (id: string | null, values: ProjectFormValues, technologyIds: string[]) => {
      // Empty strings mean "not set" rather than "empty string" — the API
      // models those fields as nullable.
      const payload = {
        title: values.title,
        shortDescription: values.shortDescription,
        description: values.description,
        problem: values.problem || null,
        solution: values.solution || null,
        features: values.features
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        architecture: values.architecture || null,
        challenges: values.challenges || null,
        lessonsLearned: values.lessonsLearned || null,
        image: values.image || null,
        githubUrl: values.githubUrl || null,
        liveUrl: values.liveUrl || null,
        status: values.status,
        featured: values.featured,
        displayOrder: Number(values.displayOrder) || 0,
        technologyIds,
      }
      return id ? updateProject(id, payload) : createProject(payload)
    }
  )

  const deleteMutation = useApiMutation(deleteProject)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<ProjectFormValues>({ defaultValues: EMPTY })

  const openCreate = () => {
    setEditing(null)
    setSelectedTech([])
    reset(EMPTY)
    setDialogOpen(true)
  }

  const openEdit = (project: Project) => {
    setEditing(project)
    setSelectedTech(project.technologies.map((technology) => technology.id))
    reset({
      title: project.title,
      shortDescription: project.shortDescription,
      description: project.description,
      problem: project.problem ?? '',
      solution: project.solution ?? '',
      features: project.features.join('\n'),
      architecture: project.architecture ?? '',
      challenges: project.challenges ?? '',
      lessonsLearned: project.lessonsLearned ?? '',
      image: project.image ?? '',
      githubUrl: project.githubUrl ?? '',
      liveUrl: project.liveUrl ?? '',
      status: project.status,
      featured: project.featured,
      displayOrder: project.displayOrder,
    })
    setDialogOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveMutation.mutate(editing?.id ?? null, values, selectedTech)

    if (result.ok) {
      toast.success(editing ? 'Project updated successfully' : 'Project created successfully')
      setDialogOpen(false)
      projects.refetch()
      return
    }

    // Map the server's field errors back onto the form inputs.
    if (result.error.isValidation && result.error.errors) {
      for (const [field, message] of Object.entries(result.error.errors)) {
        if (field in EMPTY) setError(field as keyof ProjectFormValues, { message })
      }
      toast.error('Please check the form')
      return
    }

    toast.error('Could not save the project', { description: result.error.message })
  })

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteMutation.mutate(deleteTarget.id)

    if (result.ok) {
      toast.success('Project deleted successfully')
      // Stepping back a page avoids landing on an empty final page after
      // deleting its only row.
      if (projects.data?.items.length === 1 && page > 1) setPage(page - 1)
      else projects.refetch()
    } else {
      toast.error('Could not delete the project', { description: result.error.message })
    }
    setDeleteTarget(null)
  }

  const columns: Column<Project>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (project) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{project.title}</span>
            {project.featured && (
              <Badge variant="secondary" className="h-5 text-[11px]">
                Featured
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">/{project.slug}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (project) => (
        <Badge variant={project.status === 'completed' ? 'outline' : 'secondary'}>
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      ),
    },
    {
      key: 'technologies',
      header: 'Technologies',
      hideOnMobile: true,
      cell: (project) => (
        <span className="text-muted-foreground text-sm">
          {project.technologies.length === 0
            ? '—'
            : project.technologies
                .slice(0, 3)
                .map((technology) => technology.name)
                .join(', ') + (project.technologies.length > 3 ? `, +${project.technologies.length - 3}` : '')}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      hideOnMobile: true,
      cell: (project) => <span className="tabular-nums">{project.displayOrder}</span>,
    },
  ]

  const meta = projects.data?.meta

  return (
    <>
      <Seo title="Projects · Admin" />

      <PageHeader
        title="Projects"
        description="Create, edit and remove portfolio projects."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New project
          </Button>
        }
      />

      <DataTable
        rows={projects.data?.items ?? []}
        columns={columns}
        rowKey={(project) => project.id}
        loading={projects.loading}
        error={projects.error}
        onRetry={projects.refetch}
        emptyTitle="No projects found"
        emptyMessage="Create your first project to see it on the public site."
        emptyAction={
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4" aria-hidden="true" />
            New project
          </Button>
        }
        actions={(project) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" asChild className="size-8">
              <a
                href={`/projects/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${project.title} on the site`}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => openEdit(project)}
              aria-label={`Edit ${project.title}`}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-8"
              onClick={() => setDeleteTarget(project)}
              aria-label={`Delete ${project.title}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      />

      {meta && meta.totalPages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPreviousPage}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm tabular-nums">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNextPage}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </nav>
      )}

      {/* ------------------------------------------------ Create / edit --- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit project' : 'New project'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Changes appear on the public site immediately.'
                : 'Only the title and descriptions are required — the case study can be filled in later.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <FormField id="title" label="Title" required error={errors.title?.message}>
              {(props) => (
                <Input {...props} {...register('title', { required: 'Title is required' })} />
              )}
            </FormField>

            <FormField
              id="shortDescription"
              label="Short description"
              required
              hint="Shown on project cards. Keep it to a sentence or two."
              error={errors.shortDescription?.message}
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={2}
                  {...register('shortDescription', { required: 'Short description is required' })}
                />
              )}
            </FormField>

            <FormField
              id="description"
              label="Description"
              required
              error={errors.description?.message}
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={4}
                  {...register('description', { required: 'Description is required' })}
                />
              )}
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="problem" label="The problem" error={errors.problem?.message}>
                {(props) => <Textarea {...props} rows={3} {...register('problem')} />}
              </FormField>

              <FormField id="solution" label="The solution" error={errors.solution?.message}>
                {(props) => <Textarea {...props} rows={3} {...register('solution')} />}
              </FormField>
            </div>

            <FormField
              id="features"
              label="Key features"
              hint="One per line."
              error={errors.features?.message}
            >
              {(props) => <Textarea {...props} rows={4} {...register('features')} />}
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="architecture" label="Architecture" error={errors.architecture?.message}>
                {(props) => <Textarea {...props} rows={3} {...register('architecture')} />}
              </FormField>

              <FormField id="challenges" label="Challenges" error={errors.challenges?.message}>
                {(props) => <Textarea {...props} rows={3} {...register('challenges')} />}
              </FormField>
            </div>

            <FormField
              id="lessonsLearned"
              label="Lessons learned"
              error={errors.lessonsLearned?.message}
            >
              {(props) => <Textarea {...props} rows={3} {...register('lessonsLearned')} />}
            </FormField>

            {/* ------------------------------------- Technology picker --- */}
            <fieldset className="space-y-2">
              <legend className="text-sm leading-none font-medium">Technologies</legend>
              <p className="text-muted-foreground text-xs">
                {selectedTech.length} selected. Click to toggle.
              </p>
              <div className="border-border/60 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-md border p-3">
                {technologies.loading && (
                  <span className="text-muted-foreground text-sm">Loading…</span>
                )}
                {technologies.data?.map((technology) => {
                  const active = selectedTech.includes(technology.id)
                  return (
                    <button
                      key={technology.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setSelectedTech((current) =>
                          active
                            ? current.filter((id) => id !== technology.id)
                            : [...current, technology.id]
                        )
                      }
                      className={cn(
                        'focus-visible:ring-ring rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none',
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {technology.name}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="githubUrl" label="GitHub URL" error={errors.githubUrl?.message}>
                {(props) => (
                  <Input {...props} placeholder="https://github.com/…" {...register('githubUrl')} />
                )}
              </FormField>

              <FormField id="liveUrl" label="Live demo URL" error={errors.liveUrl?.message}>
                {(props) => (
                  <Input {...props} placeholder="https://…" {...register('liveUrl')} />
                )}
              </FormField>
            </div>

            <FormField
              id="image"
              label="Thumbnail"
              hint="Upload an image or paste a URL. Leave blank to use the generated placeholder."
              error={errors.image?.message}
            >
              {(props) => (
                <ImageUploadField
                  {...props}
                  kind="project"
                  value={watch('image') ?? ''}
                  onChange={(url) => setValue('image', url, { shouldDirty: true })}
                />
              )}
            </FormField>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as ProjectStatus)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                id="displayOrder"
                label="Display order"
                error={errors.displayOrder?.message}
              >
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={0}
                    {...register('displayOrder', { valueAsNumber: true })}
                  />
                )}
              </FormField>

              <div className="space-y-2">
                <Label htmlFor="featured">Featured</Label>
                <div className="flex h-9 items-center">
                  <Switch
                    id="featured"
                    checked={watch('featured')}
                    onCheckedChange={(checked) => setValue('featured', checked)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saveMutation.loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.loading}>
                {saveMutation.loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : editing ? (
                  'Save changes'
                ) : (
                  'Create project'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.title}
        title="Are you sure you want to delete this project?"
        onConfirm={confirmDelete}
      />
    </>
  )
}
