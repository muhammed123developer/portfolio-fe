import client from './api'

/** The two things images are uploaded for — mirrors the backend's IMAGE_KINDS. */
export type ImageKind = 'profile' | 'project'

/**
 * Uploads an image through the API, which forwards it to Cloudinary.
 *
 * Resolves to the public Cloudinary URL. Nothing is saved yet: the caller puts
 * the URL into its form and it is stored by the normal profile/project save.
 */
export async function uploadImage(file: File, kind: ImageKind): Promise<string> {
  const body = new FormData()
  body.append('image', file)

  // The shared client defaults to JSON, which would make Axios serialise the
  // FormData into a JSON object. Declaring multipart keeps it as a real upload;
  // the browser then fills in the boundary itself.
  const response = await client.post<{ data: { url: string } }>(`/uploads/${kind}`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  })
  return response.data.data.url
}
