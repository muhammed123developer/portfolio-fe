import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Seo } from '@/components/common/Seo'
import { ErrorState, TextSkeleton } from '@/components/common/states'
import { FormField, PageHeader } from '@/components/admin/FormField'
import { ImageUploadField } from '@/components/admin/ImageUploadField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApiMutation'
import { getProfile, updateProfile } from '@/services/contentService'
import type { Profile } from '@/types/api'

interface FormValues {
  fullName: string
  title: string
  avatarUrl: string
  tagline: string
  introduction: string
  philosophy: string
  currentFocus: string
  careerSummary: string
  technicalInterests: string
  publicEmail: string
  location: string
  githubUrl: string
  linkedinUrl: string
  websiteUrl: string
  resumeUrl: string
  availableForWork: boolean
}

/**
 * Site settings — the profile record.
 *
 * This is what makes the hero, the About page and the footer editable without
 * a redeploy. Every field here is rendered somewhere on the public site.
 */
export default function AdminSettings() {
  const profile = useApi<Profile>((signal) => getProfile(signal), [])
  const saveMutation = useApiMutation(updateProfile)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>()

  // Populate once the profile arrives. `reset` rather than defaultValues,
  // because the data is not available on first render.
  useEffect(() => {
    if (!profile.data) return
    reset({
      fullName: profile.data.fullName,
      title: profile.data.title,
      avatarUrl: profile.data.avatarUrl ?? '',
      tagline: profile.data.tagline ?? '',
      introduction: profile.data.introduction ?? '',
      philosophy: profile.data.philosophy ?? '',
      currentFocus: profile.data.currentFocus ?? '',
      careerSummary: profile.data.careerSummary ?? '',
      technicalInterests: profile.data.technicalInterests.join('\n'),
      publicEmail: profile.data.publicEmail ?? '',
      location: profile.data.location ?? '',
      githubUrl: profile.data.githubUrl ?? '',
      linkedinUrl: profile.data.linkedinUrl ?? '',
      websiteUrl: profile.data.websiteUrl ?? '',
      resumeUrl: profile.data.resumeUrl ?? '',
      availableForWork: profile.data.availableForWork,
    })
  }, [profile.data, reset])

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveMutation.mutate({
      fullName: values.fullName,
      title: values.title,
      avatarUrl: values.avatarUrl || null,
      tagline: values.tagline || null,
      introduction: values.introduction || null,
      philosophy: values.philosophy || null,
      currentFocus: values.currentFocus || null,
      careerSummary: values.careerSummary || null,
      technicalInterests: values.technicalInterests
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      publicEmail: values.publicEmail || null,
      location: values.location || null,
      githubUrl: values.githubUrl || null,
      linkedinUrl: values.linkedinUrl || null,
      websiteUrl: values.websiteUrl || null,
      resumeUrl: values.resumeUrl.trim() || null,
      availableForWork: values.availableForWork,
    })

    if (result.ok) {
      toast.success('Settings saved successfully')
      // Re-sync so `isDirty` resets and the form matches what was stored.
      profile.setData(result.data)
      reset(values)
      return
    }

    if (result.error.isValidation && result.error.errors) {
      for (const [field, message] of Object.entries(result.error.errors)) {
        setError(field as keyof FormValues, { message })
      }
      toast.error('Please check the form')
      return
    }

    toast.error('Could not save settings', { description: result.error.message })
  })

  if (profile.error) {
    return (
      <>
        <PageHeader title="Settings" />
        <ErrorState message={profile.error.message} onRetry={profile.refetch} />
      </>
    )
  }

  if (profile.loading) {
    return (
      <>
        <PageHeader title="Settings" />
        <div className="space-y-6">
          <TextSkeleton lines={5} />
          <TextSkeleton lines={5} />
        </div>
      </>
    )
  }

  return (
    <>
      <Seo title="Settings · Admin" />

      <PageHeader
        title="Settings"
        description="Your details, as shown on the public site."
        action={
          <Button onClick={onSubmit} disabled={saveMutation.loading || !isDirty}>
            {saveMutation.loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden="true" />
                Save changes
              </>
            )}
          </Button>
        }
      />

      <form onSubmit={onSubmit} noValidate className="space-y-6 pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="fullName" label="Full name" required error={errors.fullName?.message}>
                {(props) => (
                  <Input {...props} {...register('fullName', { required: 'Full name is required' })} />
                )}
              </FormField>

              <FormField
                id="title"
                label="Professional title"
                required
                error={errors.title?.message}
              >
                {(props) => (
                  <Input {...props} {...register('title', { required: 'Title is required' })} />
                )}
              </FormField>
            </div>

            <FormField
              id="avatarUrl"
              label="Profile picture"
              hint="Shown in the home page hero. Upload an image or paste a URL."
              error={errors.avatarUrl?.message}
            >
              {(props) => (
                <ImageUploadField
                  {...props}
                  kind="profile"
                  shape="circle"
                  value={watch('avatarUrl') ?? ''}
                  onChange={(url) => setValue('avatarUrl', url, { shouldDirty: true })}
                />
              )}
            </FormField>

            <FormField
              id="tagline"
              label="Tagline"
              hint="The one-line pitch under your title."
              error={errors.tagline?.message}
            >
              {(props) => <Textarea {...props} rows={2} {...register('tagline')} />}
            </FormField>

            <FormField
              id="introduction"
              label="Introduction"
              hint="Shown on the home page and at the top of About."
              error={errors.introduction?.message}
            >
              {(props) => <Textarea {...props} rows={4} {...register('introduction')} />}
            </FormField>

            <div className="flex items-center gap-3">
              <Switch
                id="availableForWork"
                checked={watch('availableForWork') ?? false}
                onCheckedChange={(checked) =>
                  setValue('availableForWork', checked, { shouldDirty: true })
                }
              />
              <Label htmlFor="availableForWork">
                Show the &ldquo;Available for work&rdquo; badge
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">About page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField id="careerSummary" label="Career summary" error={errors.careerSummary?.message}>
              {(props) => <Textarea {...props} rows={3} {...register('careerSummary')} />}
            </FormField>

            <FormField id="philosophy" label="Development philosophy" error={errors.philosophy?.message}>
              {(props) => <Textarea {...props} rows={4} {...register('philosophy')} />}
            </FormField>

            <FormField id="currentFocus" label="Current focus" error={errors.currentFocus?.message}>
              {(props) => <Textarea {...props} rows={3} {...register('currentFocus')} />}
            </FormField>

            <FormField
              id="technicalInterests"
              label="Technical interests"
              hint="One per line."
              error={errors.technicalInterests?.message}
            >
              {(props) => <Textarea {...props} rows={4} {...register('technicalInterests')} />}
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact and links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="publicEmail" label="Public email" error={errors.publicEmail?.message}>
                {(props) => <Input {...props} type="email" {...register('publicEmail')} />}
              </FormField>

              <FormField id="location" label="Location" error={errors.location?.message}>
                {(props) => <Input {...props} {...register('location')} />}
              </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="githubUrl" label="GitHub URL" error={errors.githubUrl?.message}>
                {(props) => (
                  <Input {...props} placeholder="https://github.com/…" {...register('githubUrl')} />
                )}
              </FormField>

              <FormField id="linkedinUrl" label="LinkedIn URL" error={errors.linkedinUrl?.message}>
                {(props) => (
                  <Input
                    {...props}
                    placeholder="https://linkedin.com/in/…"
                    {...register('linkedinUrl')}
                  />
                )}
              </FormField>
            </div>

            <FormField id="websiteUrl" label="Website URL" error={errors.websiteUrl?.message}>
              {(props) => <Input {...props} placeholder="https://…" {...register('websiteUrl')} />}
            </FormField>

            <FormField
              id="resumeUrl"
              label="Resume link"
              hint="Paste a Google Drive share link, with sharing set to “Anyone with the link”. Visitors get a Download resume button in the header. Leave it empty to hide the button."
              error={errors.resumeUrl?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  placeholder="https://drive.google.com/file/d/…/view?usp=sharing"
                  {...register('resumeUrl')}
                />
              )}
            </FormField>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.loading || !isDirty}>
            {saveMutation.loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden="true" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  )
}
