import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * The three states every asynchronous view needs: loading, empty and error.
 *
 * Centralised so no screen can accidentally ship a blank white page while a
 * request is in flight, and so all three read consistently across the site.
 */

/* ----------------------------------------------------------------- Error */

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <Card className={cn('border-destructive/40', className)}>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-full">
          <AlertCircle className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="font-semibold">{title}</h2>
          {/* role="status" so screen readers announce it without stealing focus. */}
          <p className="text-muted-foreground max-w-md text-sm" role="status">
            {message}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/* ----------------------------------------------------------------- Empty */

interface EmptyStateProps {
  title: string
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, message, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border/70 flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center',
        className
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </div>
      <div className="space-y-1">
        <h2 className="font-medium">{title}</h2>
        {message && <p className="text-muted-foreground max-w-sm text-sm">{message}</p>}
      </div>
      {action}
    </div>
  )
}

/* --------------------------------------------------------------- Loading */

/** Card grid placeholder — matches the project card layout. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading content"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border-border/70 space-y-4 rounded-xl border p-5">
          <Skeleton className="aspect-16/10 w-full rounded-lg" />
          <Skeleton className="h-5 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Vertical timeline placeholder — experience and education. */
export function TimelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading timeline">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3 pl-8">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
      ))}
    </div>
  )
}

/** Table placeholder — admin lists. */
export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn('h-10', columnIndex === 0 ? 'flex-[2]' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Generic block placeholder — prose sections. */
export function TextSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-4', index === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  )
}
