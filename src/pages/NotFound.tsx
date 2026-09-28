import { Link } from 'react-router-dom'
import { ArrowLeft, FileQuestion } from 'lucide-react'

import { Seo } from '@/components/common/Seo'
import { Button } from '@/components/ui/button'

/** Catch-all for unmatched routes. */
export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" description="That page does not exist." />

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-28 text-center sm:px-6">
        <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
          <FileQuestion className="size-6" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium tracking-widest">404</p>
          <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground">
            That page does not exist, or it has moved somewhere else.
          </p>
        </div>

        <Button asChild>
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>
        </Button>
      </div>
    </>
  )
}
