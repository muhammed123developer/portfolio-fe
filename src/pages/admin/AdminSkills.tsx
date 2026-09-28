import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Seo } from '@/components/common/Seo'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog'
import { FormField, PageHeader } from '@/components/admin/FormField'
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
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApiMutation'
import { skillLevel } from '@/lib/skillLevels'
import { createSkill, deleteSkill, listSkills, updateSkill } from '@/services/contentService'
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS, type Skill, type SkillCategory } from '@/types/api'

interface FormValues {
  name: string
  category: SkillCategory
  icon: string
  proficiency: number
  displayOrder: number
}

const EMPTY: FormValues = {
  name: '',
  category: 'frontend',
  icon: '',
  proficiency: 70,
  displayOrder: 0,
}

/**
 * Skill management.
 *
 * Reordering is done with up/down buttons that swap `displayOrder` values,
 * rather than drag-and-drop. That keeps a reorder a plain PUT — testable,
 * keyboard-accessible, and usable on a touch screen where dragging inside a
 * scrolling list is awkward.
 */
export default function AdminSkills() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Skill | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const skills = useApi<Skill[]>((signal) => listSkills(undefined, signal), [])

  const saveMutation = useApiMutation(async (id: string | null, values: FormValues) => {
    const payload = {
      name: values.name,
      category: values.category,
      icon: values.icon || null,
      proficiency: Number(values.proficiency),
      displayOrder: Number(values.displayOrder) || 0,
    }
    return id ? updateSkill(id, payload) : createSkill(payload)
  })

  const deleteMutation = useApiMutation(deleteSkill)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: EMPTY })

  const openCreate = () => {
    setEditing(null)
    reset(EMPTY)
    setDialogOpen(true)
  }

  const openEdit = (skill: Skill) => {
    setEditing(skill)
    reset({
      name: skill.name,
      category: skill.category,
      icon: skill.icon ?? '',
      proficiency: skill.proficiency,
      displayOrder: skill.displayOrder,
    })
    setDialogOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveMutation.mutate(editing?.id ?? null, values)

    if (result.ok) {
      toast.success(editing ? 'Skill updated successfully' : 'Skill created successfully')
      setDialogOpen(false)
      skills.refetch()
      return
    }

    // A duplicate {name, category} pair comes back as a 409, not a 422, so it
    // needs its own branch — it is a conflict, not malformed input.
    if (result.error.status === 409) {
      setError('name', { message: result.error.message })
      toast.error('Duplicate skill', { description: result.error.message })
      return
    }

    if (result.error.isValidation && result.error.errors) {
      for (const [field, message] of Object.entries(result.error.errors)) {
        if (field in EMPTY) setError(field as keyof FormValues, { message })
      }
      toast.error('Please check the form')
      return
    }

    toast.error('Could not save', { description: result.error.message })
  })

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteMutation.mutate(deleteTarget.id)
    if (result.ok) {
      toast.success('Skill deleted successfully')
      skills.refetch()
    } else {
      toast.error('Could not delete', { description: result.error.message })
    }
    setDeleteTarget(null)
  }

  /**
   * Swaps a skill's displayOrder with its neighbour in the same category.
   *
   * Two PUTs rather than one bulk endpoint: the ordering is per-category, and
   * a swap is the only operation the UI offers, so a dedicated reorder API
   * would be more surface area for no extra capability.
   */
  const move = async (skill: Skill, direction: -1 | 1) => {
    const all = skills.data ?? []
    const siblings = all
      .filter((item) => item.category === skill.category)
      .sort((a, b) => a.displayOrder - b.displayOrder)

    const index = siblings.findIndex((item) => item.id === skill.id)
    const neighbour = siblings[index + direction]
    if (!neighbour) return

    setReorderingId(skill.id)
    try {
      await Promise.all([
        updateSkill(skill.id, { displayOrder: neighbour.displayOrder }),
        updateSkill(neighbour.id, { displayOrder: skill.displayOrder }),
      ])
      skills.refetch()
    } catch {
      toast.error('Could not reorder')
    } finally {
      setReorderingId(null)
    }
  }

  const columns: Column<Skill>[] = [
    {
      key: 'name',
      header: 'Skill',
      cell: (skill) => <span className="font-medium">{skill.name}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      cell: (skill) => <Badge variant="outline">{SKILL_CATEGORY_LABELS[skill.category]}</Badge>,
    },
    {
      key: 'proficiency',
      header: 'Proficiency',
      cell: (skill) => (
        <div className="flex items-center gap-2">
          <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
            <div className="bg-primary h-full" style={{ width: `${skill.proficiency}%` }} />
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {skill.proficiency}% · {skillLevel(skill.proficiency).label}
          </span>
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      hideOnMobile: true,
      cell: (skill) => <span className="tabular-nums">{skill.displayOrder}</span>,
    },
  ]

  return (
    <>
      <Seo title="Skills · Admin" />

      <PageHeader
        title="Skills"
        description="Shown grouped by category on the public site."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New skill
          </Button>
        }
      />

      <DataTable
        rows={skills.data ?? []}
        columns={columns}
        rowKey={(skill) => skill.id}
        loading={skills.loading}
        error={skills.error}
        onRetry={skills.refetch}
        emptyTitle="No skills available"
        emptyMessage="Add skills to populate the public skills section."
        emptyAction={
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4" aria-hidden="true" />
            New skill
          </Button>
        }
        actions={(skill) => (
          <div className="flex justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={reorderingId !== null}
              onClick={() => move(skill, -1)}
              aria-label={`Move ${skill.name} up`}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={reorderingId !== null}
              onClick={() => move(skill, 1)}
              aria-label={`Move ${skill.name} down`}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => openEdit(skill)}
              aria-label={`Edit ${skill.name}`}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-8"
              onClick={() => setDeleteTarget(skill)}
              aria-label={`Delete ${skill.name}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit skill' : 'New skill'}</DialogTitle>
            <DialogDescription>
              The same name may appear in two different categories.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <FormField id="name" label="Name" required error={errors.name?.message}>
              {(props) => (
                <Input {...props} {...register('name', { required: 'Name is required' })} />
              )}
            </FormField>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value as SkillCategory)}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {SKILL_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              id="proficiency"
              label={`Proficiency — ${watch('proficiency')}% · ${skillLevel(watch('proficiency')).label}`}
              hint="The site shows the level, not the number: 88+ Expert, 80–87 Proficient, below 80 Familiar."
              error={errors.proficiency?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  className="accent-primary cursor-pointer"
                  {...register('proficiency', { valueAsNumber: true })}
                />
              )}
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="icon"
                label="Icon"
                hint="A lucide icon name."
                error={errors.icon?.message}
              >
                {(props) => <Input {...props} {...register('icon')} />}
              </FormField>

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
                  'Create skill'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        title="Are you sure you want to delete this skill?"
        onConfirm={confirmDelete}
      />
    </>
  )
}
