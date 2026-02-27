export type IcsEvent = {
  title: string
  start: Date
  end: Date
  isAllDay: boolean
  location?: string | null
  description?: string | null
  rrule?: string | null
}

export function parseIcs(text: string): IcsEvent[] {
  const lines = unfoldIcsLines(text)
  const out: IcsEvent[] = []

  let current: Partial<IcsEvent> | null = null
  let rawDtStart: { value: string; params: Record<string, string> } | null = null
  let rawDtEnd: { value: string; params: Record<string, string> } | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
      rawDtStart = null
      rawDtEnd = null
      continue
    }

    if (line === 'END:VEVENT') {
      if (!current || !rawDtStart) {
        current = null
        continue
      }

      const title = (current.title ?? '').trim()
      if (!title) {
        current = null
        continue
      }

      const startParsed = parseIcsDate(rawDtStart.value, rawDtStart.params)
      const endParsed = rawDtEnd ? parseIcsDate(rawDtEnd.value, rawDtEnd.params) : null
      if (!startParsed) {
        current = null
        continue
      }

      const isAllDay = startParsed.isAllDay
      const start = startParsed.date
      const end =
        endParsed?.date ??
        (isAllDay ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) : new Date(start.getTime() + 60 * 60 * 1000))

      out.push({
        title,
        start,
        end,
        isAllDay,
        location: current.location ?? null,
        description: current.description ?? null,
        rrule: current.rrule ?? null,
      })

      current = null
      continue
    }

    if (!current) continue

    const { name, params, value } = splitIcsLine(line)
    if (!name) continue

    if (name === 'SUMMARY') current.title = decodeText(value)
    if (name === 'LOCATION') current.location = decodeText(value)
    if (name === 'DESCRIPTION') current.description = decodeText(value)
    if (name === 'RRULE') current.rrule = value.trim() || null

    if (name === 'DTSTART') rawDtStart = { value, params }
    if (name === 'DTEND') rawDtEnd = { value, params }
  }

  return out.filter((e) => !Number.isNaN(e.start.getTime()) && !Number.isNaN(e.end.getTime()))
}

function unfoldIcsLines(text: string): string[] {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const out: string[] = []

  for (const line of raw) {
    if (!line) continue
    if (line.startsWith(' ') || line.startsWith('\t')) {
      const prev = out[out.length - 1] ?? ''
      out[out.length - 1] = prev + line.slice(1)
    } else {
      out.push(line.trimEnd())
    }
  }

  return out
}

function splitIcsLine(line: string): { name: string | null; params: Record<string, string>; value: string } {
  const idx = line.indexOf(':')
  if (idx === -1) return { name: null, params: {}, value: '' }

  const left = line.slice(0, idx)
  const value = line.slice(idx + 1)
  const parts = left.split(';')
  const name = parts[0]?.trim().toUpperCase() ?? null

  const params: Record<string, string> = {}
  for (const p of parts.slice(1)) {
    const eq = p.indexOf('=')
    if (eq === -1) continue
    const k = p.slice(0, eq).trim().toUpperCase()
    const v = p.slice(eq + 1).trim()
    if (k) params[k] = v
  }

  return { name, params, value }
}

function parseIcsDate(value: string, params: Record<string, string>): { date: Date; isAllDay: boolean } | null {
  const v = value.trim()
  if (!v) return null

  const forcedDate = params.VALUE?.toUpperCase() === 'DATE'
  if (forcedDate || /^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4))
    const m = Number(v.slice(4, 6)) - 1
    const d = Number(v.slice(6, 8))
    const date = new Date(y, m, d, 0, 0, 0, 0)
    return Number.isNaN(date.getTime()) ? null : { date, isAllDay: true }
  }

  // Basic date-time: YYYYMMDDTHHMMSS(Z)
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v)
  if (!m) return null

  const year = Number(m[1])
  const month = Number(m[2]) - 1
  const day = Number(m[3])
  const hour = Number(m[4])
  const minute = Number(m[5])
  const second = m[6] ? Number(m[6]) : 0
  const isUtc = Boolean(m[7])

  const date = isUtc
    ? new Date(Date.UTC(year, month, day, hour, minute, second, 0))
    : new Date(year, month, day, hour, minute, second, 0)

  return Number.isNaN(date.getTime()) ? null : { date, isAllDay: false }
}

function decodeText(value: string): string {
  return value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}
