import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  createEducation,
  deleteEducation,
  listEducation,
  updateEducation,
} from '@/services/contentService'
import { formatDateRange } from '@/lib/format'
import type { Education } from '@/types/api'

interface FormValues {
  institution: string
  degree: string
  field: string
  location: string
  startDate: string
  endDate: string
  grade: string
  description: string
  displayOrder: number
}

const EMPTY: FormValues = {
  institution: '',
  degree: '',
  field: '',
  location: '',
  startDate: '',
  endDate: '',
  grade: '',
  description: '',
  displayOrder: 0,
}

/** Education management. Mirrors AdminExperience deliberately. */
export default function AdminEducation() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Education | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Education | null>(null)

  const entries = useApi<Education[]>((signal) => listEducation(signal), [])

  const saveMutation = useApiMutation(async (id: string | null, values: FormValues) => {
    const payload = {
      institution: values.institution,
      degree: values.degree,
      field: values.field || null,
      location: values.location || null,
      startDate: values.startDate,
      // Blank means still studying.
      endDate: values.endDate || null,
      grade: values.grade || null,
      description: values.description || null,
      displayOrder: Number(values.displayOrder) || 0,
    }
    return id ? updateEducation(id, payload) : createEducation(payload)
  })

  const deleteMutation = useApiMutation(deleteEducation)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: EMPTY })

  const openCreate = () => {
    setEditing(null)
    reset(EMPTY)
    setDialogOpen(true)
  }

  const openEdit = (entry: Education) => {
    setEditing(entry)
    reset({
      institution: entry.institution,
      degree: entry.degree,
      field: entry.field ?? '',
      location: entry.location ?? '',
      startDate: entry.startDate,
      endDate: entry.endDate ?? '',
      grade: entry.grade ?? '',
      description: entry.description ?? '',
      displayOrder: entry.displayOrder,
    })
    setDialogOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveMutation.mutate(editing?.id ?? null, values)

    if (result.ok) {
      toast.success(editing ? 'Education updated successfully' : 'Education created successfully')
      setDialogOpen(false)
      entries.refetch()
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
      toast.success('Education deleted successfully')
      entries.refetch()
    } else {
      toast.error('Could not delete', { description: result.error.message })
    }
    setDeleteTarget(null)
  }

  const columns: Column<Education>[] = [
    {
      key: 'degree',
      header: 'Qualification',
      cell: (entry) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{entry.degree}</span>
            {entry.endDate === null && (
              <Badge variant="secondary" className="h-5 text-[11px]">
                Ongoing
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{entry.institution}</p>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (entry) => (
        <span className="text-muted-foreground text-sm">
          {formatDateRange(entry.startDate, entry.endDate)}
        </span>
      ),
    },
    {
      key: 'field',
      header: 'Field',
      hideOnMobile: true,
      cell: (entry) => <span className="text-muted-foreground text-sm">{entry.field ?? '—'}</span>,
    },
  ]

  return (
    <>
      <Seo title="Education · Admin" />

      <PageHeader
        title="Education"
        description="Qualifications shown on the public timeline."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New entry
          </Button>
        }
      />

      <DataTable
        rows={entries.data ?? []}
        columns={columns}
        rowKey={(entry) => entry.id}
        loading={entries.loading}
        error={entries.error}
        onRetry={entries.refetch}
        emptyTitle="No education entries found"
        emptyMessage="Add a qualification to build out your timeline."
        emptyAction={
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4" aria-hidden="true" />
            New entry
          </Button>
        }
        actions={(entry) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => openEdit(entry)}
              aria-label={`Edit ${entry.degree}`}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-8"
              onClick={() => setDeleteTarget(entry)}
              aria-label={`Delete ${entry.degree}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit education' : 'New education'}</DialogTitle>
            <DialogDescription>
              Leave the end date blank if you are still studying.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <FormField id="degree" label="Degree" required error={errors.degree?.message}>
              {(props) => (
                <Input {...props} {...register('degree', { required: 'Degree is required' })} />
              )}
            </FormField>

            <FormField
              id="institution"
              label="Institution"
              required
              error={errors.institution?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  {...register('institution', { required: 'Institution is required' })}
                />
              )}
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="field" label="Field of study" error={errors.field?.message}>
                {(props) => <Input {...props} {...register('field')} />}
              </FormField>

              <FormField id="grade" label="Grade" error={errors.grade?.message}>
                {(props) => <Input {...props} {...register('grade')} />}
              </FormField>
            </div>

            <FormField id="location" label="Location" error={errors.location?.message}>
              {(props) => <Input {...props} {...register('location')} />}
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="startDate"
                label="Start date"
                required
                error={errors.startDate?.message}
              >
                {(props) => (
                  <Input
                    {...props}
                    type="date"
                    {...register('startDate', { required: 'Start date is required' })}
                  />
                )}
              </FormField>

              <FormField
                id="endDate"
                label="End date"
                hint="Blank = ongoing"
                error={errors.endDate?.message}
              >
                {(props) => <Input {...props} type="date" {...register('endDate')} />}
              </FormField>
            </div>

            <FormField id="description" label="Description" error={errors.description?.message}>
              {(props) => <Textarea {...props} rows={4} {...register('description')} />}
            </FormField>

            <FormField id="displayOrder" label="Display order" error={errors.displayOrder?.message}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={0}
                  {...register('displayOrder', { valueAsNumber: true })}
                />
              )}
            </FormField>

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
                  'Create entry'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.degree}
        title="Are you sure you want to delete this entry?"
        onConfirm={confirmDelete}
      />
    </>
  )
}
