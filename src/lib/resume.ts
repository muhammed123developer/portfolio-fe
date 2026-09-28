/**
 * Turns a resume link into one that downloads the file.
 *
 * A Google Drive share link ("…/file/d/<id>/view?usp=sharing") opens Drive's
 * preview page. The `uc?export=download` form of the same file makes Drive
 * send it as an attachment, so the browser downloads it instead. The file must
 * be shared as "Anyone with the link", otherwise Drive asks visitors to sign in.
 *
 * Any other URL (a PDF hosted elsewhere) is returned unchanged.
 */
export function toResumeDownloadUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  if (!/(^|\.)drive\.google\.com$/i.test(parsed.hostname)) return url

  // Share links: /file/d/<id>/view. Older links: /open?id=<id> or /uc?id=<id>.
  const id =
    parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? parsed.searchParams.get('id')

  return id ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}` : url
}
