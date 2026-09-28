import { useState } from 'react'
import { Archive, Inbox, Mail, MailOpen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Seo } from '@/components/common/Seo'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog'
import { PageHeader } from '@/components/admin/FormField'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  deleteMessage,
  getMessage,
  listMessages,
  setMessageStatus,
} from '@/services/contactService'
import { formatRelative, formatTimestamp } from '@/lib/format'
import type { ContactMessage, MessageStatus, Paged } from '@/types/api'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const STATUS_LABEL: Record<MessageStatus, string> = {
  unread: 'Unread',
  read: 'Read',
  archived: 'Archived',
}

/**
 * The contact inbox.
 *
 * Opening a message marks it read server-side, so the unread count on the
 * dashboard cannot drift from what has actually been seen.
 */
export default function AdminMessages() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<MessageStatus | 'all'>('all')
  const [reading, setReading] = useState<ContactMessage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null)

  const messages = useApi<Paged<ContactMessage>>(
    (signal) =>
      listMessages(
        { page, limit: PAGE_SIZE, ...(filter === 'all' ? {} : { status: filter }) },
        signal
      ),
    [page, filter]
  )

  const statusMutation = useApiMutation(setMessageStatus)
  const deleteMutation = useApiMutation(deleteMessage)

  const openMessage = async (message: ContactMessage) => {
    // Show immediately from the list data, then refresh from the server — the
    // GET is what marks it read.
    setReading(message)
    try {
      const fresh = await getMessage(message.id)
      setReading(fresh)
      if (message.status === 'unread') messages.refetch()
    } catch {
      // The dialog already shows the list copy, which is enough to read it.
    }
  }

  const changeStatus = async (message: ContactMessage, status: MessageStatus) => {
    const result = await statusMutation.mutate(message.id, status)
    if (result.ok) {
      toast.success(status === 'archived' ? 'Message archived' : `Message marked as ${status}`)
      setReading(null)
      messages.refetch()
    } else {
      toast.error('Could not update the message', { description: result.error.message })
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteMutation.mutate(deleteTarget.id)
    if (result.ok) {
      toast.success('Message deleted successfully')
      setReading(null)
      if (messages.data?.items.length === 1 && page > 1) setPage(page - 1)
      else messages.refetch()
    } else {
      toast.error('Could not delete the message', { description: result.error.message })
    }
    setDeleteTarget(null)
  }

  const columns: Column<ContactMessage>[] = [
    {
      key: 'from',
      header: 'From',
      cell: (message) => (
        <button
          type="button"
          onClick={() => openMessage(message)}
          className="focus-visible:ring-ring rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className={cn('block', message.status === 'unread' && 'font-semibold')}>
            {message.name}
          </span>
          <span className="text-muted-foreground text-xs">{message.email}</span>
        </button>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      cell: (message) => (
        <button
          type="button"
          onClick={() => openMessage(message)}
          className="focus-visible:ring-ring max-w-xs truncate rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className={cn(message.status === 'unread' && 'font-medium')}>
            {message.subject}
          </span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (message) => (
        <Badge
          variant={
            message.status === 'unread'
              ? 'default'
              : message.status === 'archived'
                ? 'outline'
                : 'secondary'
          }
        >
          {STATUS_LABEL[message.status]}
        </Badge>
      ),
    },
    {
      key: 'received',
      header: 'Received',
      hideOnMobile: true,
      cell: (message) => (
        <span className="text-muted-foreground text-sm" title={formatTimestamp(message.createdAt)}>
          {formatRelative(message.createdAt)}
        </span>
      ),
    },
  ]

  const meta = messages.data?.meta

  return (
    <>
      <Seo title="Messages · Admin" />

      <PageHeader title="Messages" description="Enquiries sent through the contact form." />

      <Tabs
        value={filter}
        onValueChange={(value) => {
          setFilter(value as MessageStatus | 'all')
          // A filter change invalidates the current page number.
          setPage(1)
        }}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        rows={messages.data?.items ?? []}
        columns={columns}
        rowKey={(message) => message.id}
        loading={messages.loading}
        error={messages.error}
        onRetry={messages.refetch}
        emptyTitle={filter === 'all' ? 'No messages yet' : `No ${filter} messages`}
        emptyMessage={
          filter === 'all'
            ? 'Messages sent through the contact form will appear here.'
            : 'Try a different filter.'
        }
        actions={(message) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => openMessage(message)}
              aria-label={`Read message from ${message.name}`}
            >
              <MailOpen className="size-4" aria-hidden="true" />
            </Button>
            {message.status !== 'archived' && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => changeStatus(message, 'archived')}
                aria-label={`Archive message from ${message.name}`}
              >
                <Archive className="size-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive size-8"
              onClick={() => setDeleteTarget(message)}
              aria-label={`Delete message from ${message.name}`}
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
            Page {meta.page} of {meta.totalPages} · {meta.total} total
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

      {/* --------------------------------------------------- Read dialog --- */}
      <Dialog open={reading !== null} onOpenChange={(open) => !open && setReading(null)}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
          {reading && (
            <>
              <DialogHeader>
                <DialogTitle>{reading.subject}</DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-0.5">
                    <span className="block">
                      {reading.name} ·{' '}
                      <a href={`mailto:${reading.email}`} className="hover:underline">
                        {reading.email}
                      </a>
                    </span>
                    <span className="block text-xs">{formatTimestamp(reading.createdAt)}</span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="bg-muted/40 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-line">{reading.message}</p>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(reading)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>

                <div className="flex gap-2">
                  {reading.status !== 'unread' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeStatus(reading, 'unread')}
                      disabled={statusMutation.loading}
                    >
                      <Mail className="size-4" aria-hidden="true" />
                      Mark unread
                    </Button>
                  )}
                  {reading.status !== 'archived' && (
                    <Button
                      size="sm"
                      onClick={() => changeStatus(reading, 'archived')}
                      disabled={statusMutation.loading}
                    >
                      <Archive className="size-4" aria-hidden="true" />
                      Archive
                    </Button>
                  )}
                  {reading.status === 'archived' && (
                    <Button
                      size="sm"
                      onClick={() => changeStatus(reading, 'read')}
                      disabled={statusMutation.loading}
                    >
                      <Inbox className="size-4" aria-hidden="true" />
                      Restore
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget ? `the message from ${deleteTarget.name}` : undefined}
        title="Are you sure you want to delete this message?"
        onConfirm={confirmDelete}
      />
    </>
  )
}
