const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/
const MIN_YEAR = 1900

/**
 * Validates a local calendar date in `YYYY-MM-DD` format (years 1900–9999).
 * Uses UTC arithmetic only to check day/month overflow; no timezone is involved.
 */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_PATTERN.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < MIN_YEAR) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

/** Validates a month in `YYYY-MM` format (years 1900–9999). */
export function isValidYearMonth(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = YEAR_MONTH_PATTERN.exec(value)
  return match !== null && Number(match[1]) >= MIN_YEAR
}

/** Returns the `YYYY-MM` of a valid `YYYY-MM-DD` date. */
export function yearMonthOf(date: string): string {
  return date.slice(0, 7)
}

/** Current instant as ISO 8601 (used for `createdAt` / `updatedAt`). */
export function nowISO(): string {
  return new Date().toISOString()
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

/** Today's date in the user's LOCAL timezone as `YYYY-MM-DD` (never via `toISOString`, which is UTC). */
export function todayLocal(now: Date = new Date()): string {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** First and last day (inclusive) of a valid `YYYY-MM`. */
export function monthRange(yearMonth: string): { from: string; to: string } {
  const year = Number(yearMonth.slice(0, 4))
  const month = Number(yearMonth.slice(5, 7))
  const lastDay = new Date(year, month, 0).getDate()
  return { from: `${yearMonth}-01`, to: `${yearMonth}-${pad(lastDay)}` }
}

/** The month before a valid `YYYY-MM` (January rolls back to December of the previous year). */
export function previousYearMonth(yearMonth: string): string {
  const year = Number(yearMonth.slice(0, 4))
  const month = Number(yearMonth.slice(5, 7))
  return month === 1 ? `${pad(year - 1, 4)}-12` : `${pad(year, 4)}-${pad(month - 1)}`
}

const displayFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Formats a valid `YYYY-MM-DD` for display, e.g. `15 de mar de 2025`, with no timezone shift. */
export function formatDisplayDate(date: string): string {
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))
  // UTC midnight formatted in the UTC zone: the calendar day cannot move in any local timezone.
  return displayFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}
