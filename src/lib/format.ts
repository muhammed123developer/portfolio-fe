/**
 * Display formatting helpers.
 *
 * Calendar dates arrive as "YYYY-MM-DD". They are parsed as UTC deliberately:
 * `new Date("2023-03-01")` is UTC midnight, and rendering that with a local
 * formatter west of UTC shows 28 February. Every function here reads the UTC
 * parts, so a job that began in March always displays as March.
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

function parts(dateOnly: string): { year: number; monthIndex: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOnly)
  if (!match) return null
  const [, year, month, day] = match
  if (!year || !month || !day) return null
  return { year: Number(year), monthIndex: Number(month) - 1, day: Number(day) }
}

/** "2023-03-01" → "March 2023". Used on both timelines. */
export function formatMonthYear(dateOnly: string | null | undefined): string {
  if (!dateOnly) return 'Present'
  const parsed = parts(dateOnly)
  if (!parsed) return dateOnly
  return `${MONTHS[parsed.monthIndex] ?? ''} ${parsed.year}`.trim()
}

/** "2023-03-01" → "1 March 2023". */
export function formatLongDate(dateOnly: string | null | undefined): string {
  if (!dateOnly) return '—'
  const parsed = parts(dateOnly)
  if (!parsed) return dateOnly
  return `${parsed.day} ${MONTHS[parsed.monthIndex] ?? ''} ${parsed.year}`
}

/** An ISO timestamp → "21 Sep 2026, 14:03" in the reader's local time. */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** "2 hours ago", "3 days ago" — for the message inbox. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  const thresholds: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]

  for (const [unit, unitSeconds] of thresholds) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit)
    }
  }
  return formatter.format(Math.round(seconds), 'second')
}

/**
 * "March 2023 — Present · 2 yrs 6 mos".
 *
 * The duration is what makes a timeline scannable; without it the reader has
 * to subtract dates in their head for every entry.
 */
export function formatDateRange(startDate: string, endDate: string | null): string {
  const start = formatMonthYear(startDate)
  const end = formatMonthYear(endDate)
  const duration = formatDuration(startDate, endDate)
  return duration ? `${start} — ${end} · ${duration}` : `${start} — ${end}`
}

/** Elapsed time between two calendar dates, as "2 yrs 6 mos". */
export function formatDuration(startDate: string, endDate: string | null): string {
  const start = parts(startDate)
  if (!start) return ''

  const end = endDate ? parts(endDate) : null
  const now = new Date()
  const endYear = end?.year ?? now.getUTCFullYear()
  const endMonth = end?.monthIndex ?? now.getUTCMonth()

  // +1 so a role spanning March to March of the same year reads as 1 month,
  // not 0 — an entry showing "0 mos" looks like a bug.
  const totalMonths = (endYear - start.year) * 12 + (endMonth - start.monthIndex) + 1
  if (totalMonths <= 0) return ''

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  const pieces: string[] = []
  if (years > 0) pieces.push(`${years} yr${years > 1 ? 's' : ''}`)
  if (months > 0) pieces.push(`${months} mo${months > 1 ? 's' : ''}`)
  return pieces.join(' ')
}

/** Initials for an avatar fallback: "Alex Morgan" → "AM". */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}
