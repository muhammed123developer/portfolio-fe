import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Confirmation before a destructive action.
 *
 * An AlertDialog rather than a Dialog on purpose: it takes focus, traps it,
 * and cannot be dismissed by clicking outside — appropriate when the action
 * cannot be undone.
 *
 * The confirm button stays disabled while the request is in flight, so a
 * double-click cannot fire two deletes.
 */

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What is being deleted, e.g. a project title. */
  itemName?: string
  title?: string
  description?: string
  /** Extra warning, e.g. that a delete cascades. */
  consequence?: string
  onConfirm: () => Promise<void>
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  itemName,
  title,
  description,
  consequence,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async (event: React.MouseEvent) => {
    // Keep the dialog open until the request settles, so a failure can be
    // reported against it rather than behind an already-closed dialog.
    event.preventDefault()
    setDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? 'Are you sure?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? (
              <>
                This will permanently delete{' '}
                {itemName ? <strong className="text-foreground">{itemName}</strong> : 'this item'}.
                This action cannot be undone.
              </>
            )}
            {consequence && <span className="text-foreground mt-2 block">{consequence}</span>}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleting}
            className={cn(buttonVariants({ variant: 'destructive' }))}
          >
            {deleting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
