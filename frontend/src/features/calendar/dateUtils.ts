import type { FirstDayOfWeek } from './calendarPreferences'

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function capitalizeFirst(s: string): string {
  const trimmed = (s ?? '').trim()
  if (!trimmed) return trimmed
  return trimmed[0]!.toLocaleUpperCase() + trimmed.slice(1)
}

export function startOfWeek(d: Date, firstDayOfWeek: FirstDayOfWeek = 'sunday'): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)

  const firstDayIdx = firstDayOfWeek === 'monday' ? 1 : 0
  const dow = out.getDay()
  const diff = (dow - firstDayIdx + 7) % 7
  out.setDate(out.getDate() - diff)
  return out
}

export function endOfWeek(d: Date, firstDayOfWeek: FirstDayOfWeek = 'sunday'): Date {
  const start = startOfWeek(d, firstDayOfWeek)
  const out = new Date(start)
  out.setDate(out.getDate() + 6)
  return out
}

export function dateToUtcIsoStartOfDay(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)).toISOString()
}

export function dateToUtcIsoEndOfDay(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)).toISOString()
}

export function clampDateToMonth(date: Date, year: number, monthIndex0: number): Date {
  const day = Math.max(1, date.getDate())
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate()
  const clampedDay = Math.min(day, lastDay)
  return new Date(year, monthIndex0, clampedDay)
}
