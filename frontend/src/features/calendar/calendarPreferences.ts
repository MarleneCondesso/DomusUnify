export type CalendarViewMode = 'agenda' | 'family' | 'day' | 'threeDays' | 'week' | 'month'
export type FirstDayOfWeek = 'sunday' | 'monday'

export type CalendarPreferences = {
  viewMode: CalendarViewMode
  firstDayOfWeek: FirstDayOfWeek
  showWeekNumbers: boolean
  defaultReminderMinutes: number | null
}

const STORAGE_KEY = 'domus.calendar.prefs.v1'

const DEFAULT_PREFS: CalendarPreferences = {
  viewMode: 'month',
  firstDayOfWeek: 'sunday',
  showWeekNumbers: false,
  defaultReminderMinutes: 30,
}

export function loadCalendarPreferences(): CalendarPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS

    const parsed = JSON.parse(raw) as Partial<CalendarPreferences> | null
    if (!parsed || typeof parsed !== 'object') return DEFAULT_PREFS

    const viewMode = normalizeViewMode(parsed.viewMode)
    const firstDayOfWeek = normalizeFirstDay(parsed.firstDayOfWeek)
    const showWeekNumbers = Boolean(parsed.showWeekNumbers)
    const defaultReminderMinutes =
      parsed.defaultReminderMinutes === null
        ? null
        : typeof parsed.defaultReminderMinutes === 'number' && Number.isFinite(parsed.defaultReminderMinutes)
          ? Math.max(0, Math.round(parsed.defaultReminderMinutes))
          : DEFAULT_PREFS.defaultReminderMinutes

    return { viewMode, firstDayOfWeek, showWeekNumbers, defaultReminderMinutes }
  } catch {
    return DEFAULT_PREFS
  }
}

export function saveCalendarPreferences(prefs: CalendarPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
}

function normalizeViewMode(v: unknown): CalendarViewMode {
  return v === 'agenda' || v === 'family' || v === 'day' || v === 'threeDays' || v === 'week' || v === 'month'
    ? v
    : DEFAULT_PREFS.viewMode
}

function normalizeFirstDay(v: unknown): FirstDayOfWeek {
  return v === 'monday' || v === 'sunday' ? v : DEFAULT_PREFS.firstDayOfWeek
}

