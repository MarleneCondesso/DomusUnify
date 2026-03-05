export function formatCurrency(amount: number, currencyCode: string, locale?: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const code = (currencyCode || 'EUR').toUpperCase()

  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(safeAmount)
  } catch {
    return `${safeAmount.toFixed(2)} ${code}`
  }
}

export function capitalizeFirst(value: string): string {
  if (!value) return value
  const first = value[0]
  if (!first) return value
  return `${first.toLocaleUpperCase()}${value.slice(1)}`
}

export function formatMonthYear(date: Date, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date)
  } catch {
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  }
}

export function formatTimeAgo(isoUtc: string, locale?: string): string {
  const d = new Date(isoUtc)
  if (Number.isNaN(d.getTime())) return isoUtc

  const diffMs = d.getTime() - Date.now()
  const diffSeconds = Math.round(diffMs / 1000)
  const absSeconds = Math.abs(diffSeconds)

  let unit: Intl.RelativeTimeFormatUnit = 'second'
  let value = diffSeconds

  if (absSeconds < 10) {
    unit = 'second'
    value = 0
  } else if (absSeconds < 60) {
    unit = 'second'
    value = diffSeconds
  } else if (absSeconds < 60 * 60) {
    unit = 'minute'
    value = Math.round(diffSeconds / 60)
  } else if (absSeconds < 24 * 60 * 60) {
    unit = 'hour'
    value = Math.round(diffSeconds / (60 * 60))
  } else if (absSeconds < 7 * 24 * 60 * 60) {
    unit = 'day'
    value = Math.round(diffSeconds / (24 * 60 * 60))
  } else if (absSeconds < 30 * 24 * 60 * 60) {
    unit = 'week'
    value = Math.round(diffSeconds / (7 * 24 * 60 * 60))
  } else if (absSeconds < 365 * 24 * 60 * 60) {
    unit = 'month'
    value = Math.round(diffSeconds / (30 * 24 * 60 * 60))
  } else {
    unit = 'year'
    value = Math.round(diffSeconds / (365 * 24 * 60 * 60))
  }

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
    return rtf.format(value, unit)
  } catch {
    return isoUtc
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function formatUpcomingParts(
  startUtc: string,
  locale?: string,
): { dayLabel: string; timeLabel: string } | null {
  const start = new Date(startUtc)
  if (Number.isNaN(start.getTime())) return null

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  let dayLabel: string
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (isSameDay(start, now)) dayLabel = rtf.format(0, 'day')
    else if (isSameDay(start, tomorrow)) dayLabel = rtf.format(1, 'day')
    else {
      dayLabel = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(start)
    }
  } catch {
    dayLabel = start.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })
  }

  let timeLabel: string
  try {
    timeLabel = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(start)
  } catch {
    timeLabel = start.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  }

  return { dayLabel, timeLabel }
}

