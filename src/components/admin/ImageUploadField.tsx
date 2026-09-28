import { useRef, useState } from 'react'
import { ImageUp, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api'
import { uploadImage, type ImageKind } from '@/services/uploadService'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ImageUploadFieldProps {
  /** Id and ARIA wiring from FormField, applied to the URL input. */
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
  kind: ImageKind
  value: string
  onChange: (url: string) => void
  /** Round preview for a profile picture, wide for a project thumbnail. */
  shape?: 'circle' | 'wide'
}

/**
 * An image URL field with an Upload button.
 *
 * Uploading sends the file to Cloudinary through the API and drops the
 * returned URL into the field — the form's own Save is what stores it. The
 * URL stays editable, so an image hosted elsewhere can still be pasted in.
 */
export function ImageUploadField({
  kind,
  value,
  onChange,
  shape = 'wide',
  ...inputProps
}: ImageUploadFieldProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG or WebP images can be uploaded')
      return
    }

    setUploading(true)
    try {
      onChange(await uploadImage(file, kind))
      toast.success('Image uploaded — save to keep it')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Upload failed'
      toast.error('Could not upload image', { description: message })
    } finally {
      setUploading(false)
      // Allows choosing the same file again after a failure.
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      {value && (
        <img
          src={value}
          alt=""
          className={cn(
            'bg-muted shrink-0 border object-cover',
            shape === 'circle' ? 'size-20 rounded-full' : 'aspect-video w-40 rounded-md'
          )}
        />
      )}

      <div className="min-w-0 flex-1 space-y-2">
        <Input
          {...inputProps}
          placeholder="https://res.cloudinary.com/…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              <>
                <ImageUp className="size-4" aria-hidden="true" />
                Upload image
              </>
            )}
          </Button>

          {value && !uploading && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
              <X className="size-4" aria-hidden="true" />
              Remove
            </Button>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </div>
    </div>
  )
}
