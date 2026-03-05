import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { domusApi, type CreateCalendarEventRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { useI18n } from '../../i18n/i18n'
import type { CalendarPreferences, FirstDayOfWeek } from './calendarPreferences'
import { parseIcs } from './ics'

type Props = {
  token: string
  prefs: CalendarPreferences
  visibleEventIds: string[]
  onClose: () => void
  onSave: (prefs: CalendarPreferences) => void
}

export function CalendarSettingsSheet({ token, prefs, visibleEventIds, onClose, onSave }: Props) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [draft, setDraft] = useState<CalendarPreferences>(prefs)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const timeZoneId = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
    } catch {
      return null
    }
  }, [])

  const uniqueEventIds = useMemo(() => {
    const ids = visibleEventIds.filter(Boolean)
    return Array.from(new Set(ids))
  }, [visibleEventIds])

  const canClose = !busy

  const reminderChoices = useMemo<Array<{ label: string; value: number | null }>>(
    () => [
      { label: t('calendar.settings.reminder.none'), value: null },
      { label: t('calendar.settings.reminder.10min'), value: 10 },
      { label: t('calendar.settings.reminder.30min'), value: 30 },
      { label: t('calendar.settings.reminder.1hour'), value: 60 },
      { label: t('calendar.settings.reminder.1day'), value: 1440 },
    ],
    [t],
  )

  const saveAndClose = () => {
    onSave(draft)
    onClose()
  }

  async function importIcsText(text: string, sourceLabel: string) {
    const events = parseIcs(text)
      .filter((e) => e.title.trim())
      .filter((e) => e.end.getTime() > e.start.getTime())

    if (events.length === 0) {
      setStatus(t('calendar.settings.import.empty'))
      return
    }

    const max = 250
    const total = Math.min(events.length, max)
    const ofTotal = events.length > max ? t('calendar.settings.import.confirm.ofTotal', { total: events.length }) : ''
    const ok = window.confirm(t('calendar.settings.import.confirm', { total, ofTotal, source: sourceLabel }))
    if (!ok) return

    const reminder = draft.defaultReminderMinutes
    const reminderOffsetsMinutes = reminder === null ? null : [reminder]

    setBusy(true)
    setStatus(t('calendar.settings.import.progress', { done: 0, total }))

    let created = 0
    let failed = 0

    for (let i = 0; i < total; i++) {
      const ev = events[i]!
      const req: CreateCalendarEventRequest = {
        title: ev.title,
        isAllDay: ev.isAllDay,
        startUtc: ev.start.toISOString(),
        endUtc: ev.end.toISOString(),
        participantsAllMembers: true,
        visibleToAllMembers: true,
        reminderOffsetsMinutes,
        location: ev.location ?? null,
        note: ev.description ?? null,
        colorHex: null,
        timezoneId: timeZoneId,
      }

      try {
        await domusApi.createCalendarEvent(token, req)
        created++
      } catch {
        failed++
      }

      setStatus(t('calendar.settings.import.progress', { done: created + failed, total }))
    }

    await queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    setBusy(false)

    const failedPart = failed ? t('calendar.settings.import.done.failedPart', { failed }) : ''
    setStatus(t('calendar.settings.import.done', { created, failedPart }))
  }

  const importFromFile = () => {
    setStatus(null)
    fileRef.current?.click()
  }

  const importFromUrl = async () => {
    setStatus(null)
    const url = window.prompt(t('calendar.settings.importUrl.prompt'))
    if (!url) return

    setBusy(true)
    try {
      const res = await fetch(url)
      const text = await res.text()
      await importIcsText(text, 'URL')
    } catch (err) {
      setStatus(formatError(err, t('calendar.settings.importUrl.error')))
    } finally {
      setBusy(false)
    }
  }

  const cleanupVisibleEvents = async () => {
    setStatus(null)
    if (uniqueEventIds.length === 0) {
      setStatus(t('calendar.settings.cleanup.none'))
      return
    }

    const ok = window.confirm(t('calendar.settings.cleanup.confirm', { count: uniqueEventIds.length }))
    if (!ok) return

    setBusy(true)
    setStatus(t('calendar.settings.cleanup.progress', { done: 0, total: uniqueEventIds.length }))

    let deleted = 0
    let failed = 0

    for (let i = 0; i < uniqueEventIds.length; i++) {
      const id = uniqueEventIds[i]!
      try {
        await domusApi.deleteCalendarEvent(token, id)
        deleted++
      } catch {
        failed++
      }
      setStatus(t('calendar.settings.cleanup.progress', { done: deleted + failed, total: uniqueEventIds.length }))
    }

    await queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    setBusy(false)

    const failedPart = failed ? t('calendar.settings.cleanup.done.failedPart', { failed }) : ''
    setStatus(t('calendar.settings.cleanup.done', { deleted, failedPart }))
  }

  return (
    <div className="fixed inset-0 z-80">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={canClose ? onClose : undefined} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 top-0 mx-auto w-full max-w-3xl bg-offwhite shadow-2xl">
        <header className="sticky top-0 z-10 bg-linear-to-b from-sage-light to-offwhite backdrop-blur px-4 py-3">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="grid h-12 w-12 items-center justify-center rounded-full bg-white/60 hover:bg-white py-3.5 text-sage-dark shadow-lg"
              aria-label={t('common.back')}
              onClick={saveAndClose}
              disabled={!canClose}
            >
              <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
            </button>

            <div className="text-lg font-bold text-forest">{t('settings.title')}</div>

            <div className="h-12 w-12" aria-hidden="true" />
          </div>
        </header>

        <main className="max-h-[calc(100vh-56px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
          {status ? (
            <div className="mb-4 rounded-2xl border border-sand-dark/60 bg-sand-light px-4 py-3 text-sm text-charcoal whitespace-pre-wrap">
              {status}
            </div>
          ) : null}

          <SectionTitle>{t('calendar.settings.section.otherCalendars')}</SectionTitle>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <RowButton
              icon="ri-calendar-download-line"
              title={t('calendar.settings.importIcs.title')}
              onClick={importFromFile}
              disabled={busy}
            />
            <RowButton
              icon="ri-link"
              title={t('calendar.settings.importUrl.title')}
              onClick={importFromUrl}
              disabled={busy}
            />
          </div>

          <SectionTitle className="mt-8">{t('calendar.settings.section.settings')}</SectionTitle>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <RowToggle
              icon="ri-hashtag"
              title={t('calendar.settings.weekNumber.title')}
              checked={draft.showWeekNumbers}
              onToggle={() => setDraft((p) => ({ ...p, showWeekNumbers: !p.showWeekNumbers }))}
              disabled={busy}
            />

            <RowSelect
              icon="ri-calendar-2-line"
              title={t('calendar.settings.firstDay.title')}
              value={draft.firstDayOfWeek}
              options={[
                { label: t('calendar.settings.firstDay.sunday'), value: 'sunday' as FirstDayOfWeek },
                { label: t('calendar.settings.firstDay.monday'), value: 'monday' as FirstDayOfWeek },
              ]}
              onChange={(v) => setDraft((p) => ({ ...p, firstDayOfWeek: v }))}
              disabled={busy}
            />

            <RowSelect
              icon="ri-notification-3-line"
              title={t('calendar.settings.reminder.title')}
              value={draft.defaultReminderMinutes}
              options={reminderChoices}
              onChange={(v) => setDraft((p) => ({ ...p, defaultReminderMinutes: v }))}
              disabled={busy}
            />

            <RowButton
              icon="ri-delete-bin-6-line"
              title={t('calendar.settings.cleanup.title')}
              subtitle={t('calendar.settings.cleanup.subtitle')}
              onClick={cleanupVisibleEvents}
              disabled={busy}
              tone="danger"
            />
          </div>

          {busy ? (
            <div className="mt-6 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : null}

          <input
            ref={fileRef}
            type="file"
            accept=".ics,text/calendar"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return

              setStatus(null)
              setBusy(true)
              try {
                const text = await f.text()
                await importIcsText(text, f.name)
              } catch (err) {
                setStatus(formatError(err, t('calendar.settings.importFile.error')))
              } finally {
                setBusy(false)
              }
            }}
          />
        </main>
      </div>
    </div>
  )
}

function SectionTitle({ children, className }: { children: string; className?: string }) {
  return (
    <div className={['mb-2 text-xs font-semibold tracking-wider text-forest', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

type RowButtonProps = {
  icon: string
  title: string
  subtitle?: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}

function RowButton({ icon, title, subtitle, onClick, disabled, tone = 'default' }: RowButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-red-700 hover:bg-red-50'
      : 'text-charcoal hover:bg-sand-light'

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 border-b border-gray-200 px-4 py-4 text-left last:border-b-0 disabled:opacity-50 ${toneClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={`${icon} text-xl`} />
      <div className="flex-1">
        <div className="text-base font-semibold">{title}</div>
        {subtitle ? <div className="text-xs text-charcoal/50">{subtitle}</div> : null}
      </div>
      <i className="ri-arrow-right-s-line text-2xl text-gray-300" />
    </button>
  )
}

type RowToggleProps = {
  icon: string
  title: string
  checked: boolean
  onToggle: () => void
  disabled?: boolean
}

function RowToggle({ icon, title, checked, onToggle, disabled }: RowToggleProps) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-gray-200 px-4 py-4 last:border-b-0">
      <i className={`${icon} text-xl text-charcoal/55`} />
      <div className="flex-1 text-base font-semibold text-charcoal">{title}</div>
      <button
        type="button"
        className={[
          'relative h-6 w-11 rounded-full transition disabled:opacity-50',
          checked ? 'bg-sage-dark' : 'bg-gray-300',
        ].join(' ')}
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        aria-label={title}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition',
            checked ? 'left-5' : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

type RowSelectProps<T> = {
  icon: string
  title: string
  value: T
  options: Array<{ label: string; value: T }>
  onChange: (value: T) => void
  disabled?: boolean
}

function RowSelect<T extends string | number | null>({ icon, title, value, options, onChange, disabled }: RowSelectProps<T>) {
  return (
    <div className="flex w-full items-center gap-3 border-b border-gray-200 px-4 py-4 last:border-b-0">
      <i className={`${icon} text-xl text-charcoal/55`} />
      <div className="flex-1">
        <div className="text-base font-semibold text-charcoal">{title}</div>
      </div>
      <select
        className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25 disabled:opacity-50"
        value={value === null ? 'null' : String(value)}
        onChange={(e) => {
          const raw = e.target.value
          const opt = options.find((o) => (o.value === null ? 'null' : String(o.value)) === raw)
          if (opt) onChange(opt.value)
        }}
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value === null ? 'null' : String(opt.value)} value={opt.value === null ? 'null' : String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function formatError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (typeof err.body === 'string' && err.body.trim()) return err.body
    try {
      return JSON.stringify(err.body, null, 2)
    } catch {
      return fallback
    }
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
