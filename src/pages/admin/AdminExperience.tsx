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
  createExperience,
  deleteExperience,
  listExperience,
  updateExperience,
} from '@/services/contentService'
import { formatDateRange } from '@/lib/format'
import type { Experience } from '@/types/api'

interface FormValues {
  company: string
  position: string
  location: string
  startDate: string
  endDate: string
  description: string
  technologies: string
  companyUrl: string
  displayOrder: number
}

const EMPTY: FormValues = {
  company: '',
  position: '',
  location: '',
  startDate: '',
  endDate: '',
  description: '',
  technologies: '',
  companyUrl: '',
  displayOrder: 0,
}

/**
 * Experience management.
 *
 * Leaving the end date blank marks the entry as the current role — the server
 * stores that as null and the public timeline renders a "Current" badge.
 */
export default function AdminExperience() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Experience | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Experience | null>(null)

  const entries = useApi<Experience[]>((signal) => listExperience(signal), [])

  const saveMutation = useApiMutation(async (id: string | null, values: FormValues) => {
    const payload = {
      company: values.company,
      position: values.position,
      location: values.location || null,
      startDate: values.startDate,
      // Blank means "present", which the API models as null.
      endDate: values.endDate || null,
      description: values.description || null,
      technologies: values.technologies
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      companyUrl: values.companyUrl || null,
      displayOrder: Number(values.displayOrder) || 0,
    }
    return id ? updateExperience(id, payload) : createExperience(payload)
  })

  const deleteMutation = useApiMutation(deleteExperience)

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

  const openEdit = (entry: Experience) => {
    setEditing(entry)
    reset({
      company: entry.company,
      position: entry.position,
      location: entry.location ?? '',
      startDate: entry.startDate,
      endDate: entry.endDate ?? '',
      description: entry.description ?? '',
      technologies: entry.technologies.join(', '),
      companyUrl: entry.companyUrl ?? '',
      displayOrder: entry.displayOrder,
    })
    setDialogOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveMutation.mutate(editing?.id ?? null, values)

    if (result.ok) {
      toast.success(editing ? 'Experience updated successfully' : 'Experience created successfully')
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
      toast.success('Experience deleted successfully')
      entries.refetch()
    } else {
      toast.error('Could not delete', { description: result.error.message })
    }
    setDeleteTarget(null)
  }

  const columns: Column<Experience>[] = [
    {
      key: 'position',
      header: 'Role',
      cell: (entry) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{entry.position}</span>
            {entry.endDate === null && (
              <Badge variant="secondary" className="h-5 text-[11px]">
                Current
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{entry.company}</p>
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
      key: 'location',
      header: 'Location',
      hideOnMobile: true,
      cell: (entry) => <span className="text-muted-foreground text-sm">{entry.location ?? '—'}</span>,
    },
  ]

  return (
    <>
      <Seo title="Experience · Admin" />

      <PageHeader
        title="Experience"
        description="Roles shown on the public timeline."
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
        emptyTitle="No experience entries found"
        emptyMessage="Add a role to build out your timeline."
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
              aria-label={`Edit ${entry.position}`}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-8"
              onClick={() => setDeleteTarget(entry)}
              aria-label={`Delete ${entry.position}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit experience' : 'New experience'}</DialogTitle>
            <DialogDescription>
              Leave the end date blank if this is your current role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <FormField id="position" label="Position" required error={errors.position?.message}>
              {(props) => (
                <Input {...props} {...register('position', { required: 'Position is required' })} />
              )}
            </FormField>

            <FormField id="company" label="Company" required error={errors.company?.message}>
              {(props) => (
                <Input {...props} {...register('company', { required: 'Company is required' })} />
              )}
            </FormField>

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
                hint="Blank = current role"
                error={errors.endDate?.message}
              >
                {(props) => <Input {...props} type="date" {...register('endDate')} />}
              </FormField>
            </div>

            <FormField id="description" label="Description" error={errors.description?.message}>
              {(props) => <Textarea {...props} rows={4} {...register('description')} />}
            </FormField>

            <FormField
              id="technologies"
              label="Technologies"
              hint="Comma separated."
              error={errors.technologies?.message}
            >
              {(props) => <Input {...props} {...register('technologies')} />}
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="companyUrl" label="Company URL" error={errors.companyUrl?.message}>
                {(props) => <Input {...props} placeholder="https://…" {...register('companyUrl')} />}
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
        itemName={deleteTarget ? `${deleteTarget.position} at ${deleteTarget.company}` : undefined}
        title="Are you sure you want to delete this entry?"
        onConfirm={confirmDelete}
      />
    </>
  )
}
