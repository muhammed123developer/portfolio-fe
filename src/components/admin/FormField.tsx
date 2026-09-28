import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * A labelled form control with hint and error text.
 *
 * Exists because shadcn's own `form` component is built on Zod, which this
 * project deliberately does not use. This gives the same guarantees — a real
 * `<label htmlFor>`, `aria-describedby` wired to the message, `role="alert"`
 * on errors — without the dependency.
 *
 * Accessibility is structural here rather than something each of the six admin
 * forms has to remember.
 */

interface FormFieldProps {
  id: string
  label: string
  /** Message from React Hook Form, or mapped back from a 422. */
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => React.ReactNode
}

export function FormField({
  id,
  label,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-destructive ml-0.5" aria-label="required">
            *
          </span>
        )}
      </Label>

      {/* Render-prop so the control keeps its own type while still receiving
          the id and ARIA wiring. */}
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
      })}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  )
}

/** Consistent heading + action row for each admin screen. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1.5 text-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}
