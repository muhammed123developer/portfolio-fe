import { useForm } from 'react-hook-form'
import { CheckCircle2, Loader2, Mail, MapPin, Send } from 'lucide-react'

import { GithubIcon, LinkedinIcon } from '@/components/common/BrandIcons'
import { toast } from 'sonner'
import { useState } from 'react'

import { Seo } from '@/components/common/Seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useProfile } from '@/hooks/useProfile'
import { submitContact } from '@/services/contactService'
import type { ContactFormValues } from '@/types/api'
import { cn } from '@/lib/utils'

/**
 * The contact form.
 *
 * Validation happens twice on purpose. React Hook Form checks the obvious
 * things instantly for a responsive feel; express-validator re-checks
 * everything server-side because frontend validation is a convenience, not a
 * security control — anyone can POST directly to the API.
 *
 * When the server does reject something the frontend let through, its
 * field-level errors are mapped back onto the matching inputs rather than
 * shown as one opaque banner.
 */
export default function Contact() {
  const { profile } = useProfile()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactFormValues>({
    defaultValues: { name: '', email: '', subject: '', message: '' },
  })

  const { mutate, loading } = useApiMutation(submitContact)

  const onSubmit = handleSubmit(async (values) => {
    const result = await mutate(values)

    if (result.ok) {
      toast.success('Message sent', {
        description: 'Thanks for getting in touch — I will reply as soon as I can.',
      })
      reset()
      setSent(true)
      return
    }

    // Map the server's per-field messages onto the form.
    if (result.error.isValidation && result.error.errors) {
      for (const [field, message] of Object.entries(result.error.errors)) {
        if (field in values) {
          setError(field as keyof ContactFormValues, { type: 'server', message })
        }
      }
      toast.error('Please check the form', { description: 'Some fields need attention.' })
      return
    }

    // 429 from the contact rate limiter deserves its own wording — "something
    // went wrong" would be actively misleading here.
    toast.error(
      result.error.status === 429 ? 'Too many messages' : 'Could not send your message',
      { description: result.error.message }
    )
  })

  return (
    <>
      <Seo title="Contact" description="Get in touch about roles, freelance work or collaboration." />

      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-lg">
            Open to roles, freelance work and interesting problems. Send a message and I will get
            back to you.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Send a message</CardTitle>
            </CardHeader>

            <CardContent>
              {sent && (
                <div
                  className="border-primary/30 bg-primary/5 text-foreground mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm"
                  role="status"
                >
                  <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>Your message was sent. Feel free to send another if you need to.</p>
                </div>
              )}

              {/* noValidate hands validation to React Hook Form so the messages
                  are consistent rather than the browser's own wording. */}
              <form onSubmit={onSubmit} noValidate className="space-y-5">
                <Field id="name" label="Name" error={errors.name?.message}>
                  <Input
                    id="name"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={cn(errors.name && 'border-destructive')}
                    {...register('name', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      maxLength: { value: 100, message: 'Name must be 100 characters or fewer' },
                    })}
                  />
                </Field>

                <Field id="email" label="Email" error={errors.email?.message}>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={cn(errors.email && 'border-destructive')}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Must be a valid email address',
                      },
                    })}
                  />
                </Field>

                <Field id="subject" label="Subject" error={errors.subject?.message}>
                  <Input
                    id="subject"
                    aria-invalid={Boolean(errors.subject)}
                    aria-describedby={errors.subject ? 'subject-error' : undefined}
                    className={cn(errors.subject && 'border-destructive')}
                    {...register('subject', {
                      required: 'Subject is required',
                      minLength: { value: 3, message: 'Subject must be at least 3 characters' },
                      maxLength: { value: 200, message: 'Subject must be 200 characters or fewer' },
                    })}
                  />
                </Field>

                <Field
                  id="message"
                  label="Message"
                  error={errors.message?.message}
                  hint="At least 10 characters."
                >
                  <Textarea
                    id="message"
                    rows={6}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'message-error' : 'message-hint'}
                    className={cn('resize-y', errors.message && 'border-destructive')}
                    {...register('message', {
                      required: 'Message is required',
                      minLength: { value: 10, message: 'Message must be at least 10 characters' },
                      maxLength: {
                        value: 5000,
                        message: 'Message must be 5000 characters or fewer',
                      },
                    })}
                  />
                </Field>

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="size-4" aria-hidden="true" />
                      Send message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">Other ways to reach me</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {profile?.publicEmail && (
                  <ContactLink
                    icon={Mail}
                    href={`mailto:${profile.publicEmail}`}
                    label={profile.publicEmail}
                  />
                )}
                {profile?.githubUrl && (
                  <ContactLink icon={GithubIcon} href={profile.githubUrl} label="GitHub" external />
                )}
                {profile?.linkedinUrl && (
                  <ContactLink
                    icon={LinkedinIcon}
                    href={profile.linkedinUrl}
                    label="LinkedIn"
                    external
                  />
                )}
                {profile?.location && (
                  <p className="text-muted-foreground flex items-center gap-2.5">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    {profile.location}
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------- Internals */

/**
 * A labelled field with inline error text.
 *
 * Exists so every input is guaranteed a real <label htmlFor>, an
 * aria-describedby pointing at its error, and role="alert" on the message —
 * accessibility by construction rather than by remembering it four times.
 */
function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
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

function ContactLink({
  icon: Icon,
  href,
  label,
  external,
}: {
  icon: React.ElementType
  href: string
  label: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-2.5 rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </a>
  )
}
