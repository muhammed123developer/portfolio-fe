import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shown while a lazily-loaded route chunk is downloading.
 *
 * Deliberately shaped like a real page — a heading, some prose, a grid —
 * rather than a centred spinner, so the layout does not visibly jump when the
 * content arrives.
 */
export function PageLoader() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
      aria-busy="true"
      aria-label="Loading page"
    >
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      <Skeleton className="mt-2 h-5 w-full max-w-md" />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border-border/70 space-y-4 rounded-xl border p-5">
            <Skeleton className="aspect-16/10 w-full rounded-lg" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
