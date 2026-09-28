import { del, get, getPaged, post, put } from './api'
import type {
  ContactFormValues,
  ContactMessage,
  MessageFilters,
  MessageStatus,
  Paged,
} from '@/types/api'

/**
 * Contact form and the admin inbox.
 *
 * Note the asymmetry: `submitContact` is public, everything else requires
 * authentication. That mirrors the backend — the collection is an inbox, not
 * public content.
 */

/** Public. The response carries only a confirmation, never the stored record. */
export function submitContact(values: ContactFormValues): Promise<{ message: string }> {
  return post<{ message: string }>('/contact', values)
}

/** Admin only. */
export function listMessages(
  filters: MessageFilters = {},
  signal?: AbortSignal
): Promise<Paged<ContactMessage>> {
  const params: Record<string, string | number> = {}
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit
  if (filters.status) params.status = filters.status
  if (filters.search) params.search = filters.search

  return getPaged<ContactMessage>('/contact', { params, signal })
}

/** Admin only. Opening a message marks it read server-side. */
export function getMessage(id: string, signal?: AbortSignal): Promise<ContactMessage> {
  return get<ContactMessage>(`/contact/${id}`, { signal })
}

export function setMessageStatus(id: string, status: MessageStatus): Promise<ContactMessage> {
  return put<ContactMessage>(`/contact/${id}`, { status })
}

export function deleteMessage(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/contact/${id}`)
}
