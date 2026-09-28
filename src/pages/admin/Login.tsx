import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'

import { Seo } from '@/components/common/Seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import type { LoginValues } from '@/types/api'
import { cn } from '@/lib/utils'

/**
 * Admin sign-in.
 *
 * The server returns the same message for a wrong password and an unknown
 * email, and this screen shows it verbatim rather than trying to be more
 * helpful — being more specific would let anyone probe which addresses exist.
 */
export default function Login() {
  const { login, isAuthenticated, initialising } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Where the admin was heading before being redirected here.
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ defaultValues: { email: '', password: '' } })

  useEffect(() => {
    setFocus('email')
  }, [setFocus])

  // Someone already signed in has no reason to see this screen.
  if (!initialising && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await login(values)

    if (result.ok) {
      toast.success('Login successful')
      navigate(from, { replace: true })
      return
    }

    toast.error(
      result.error.status === 429 ? 'Too many attempts' : 'Invalid credentials',
      { description: result.error.message }
    )
  })

  return (
    <>
      <Seo title="Admin sign in" description="Sign in to manage portfolio content." />

      <div className="bg-muted/30 flex min-h-svh flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-3">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-xl">Admin sign in</CardTitle>
              <CardDescription>Manage projects, experience and messages.</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
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
                {errors.email && (
                  <p id="email-error" role="alert" className="text-destructive text-xs font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={cn(errors.password && 'border-destructive')}
                  {...register('password', { required: 'Password is required' })}
                />
                {errors.password && (
                  <p
                    id="password-error"
                    role="alert"
                    className="text-destructive text-xs font-medium"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Button asChild variant="ghost" size="sm" className="mt-6">
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to the site
          </Link>
        </Button>
      </div>
    </>
  )
}
