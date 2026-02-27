import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { domusApi, type CreateCalendarEventRequest } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import type { CalendarPreferences, FirstDayOfWeek } from './calendarPreferences'
import { parseIcs } from './ics'

type Props = {
  token: string
  prefs: CalendarPreferences
  visibleEventIds: string[]
  onClose: () => void
  onSave: (prefs: CalendarPreferences) => void
}

const REMINDER_CHOICES: Array<{ label: string; value: number | null }> = [
  { label: 'Nenhum', value: null },
  { label: '10 min antes', value: 10 },
  { label: '30 min antes', value: 30 },
  { label: '1 hora antes', value: 60 },
  { label: '1 dia antes', value: 1440 },
]

export function CalendarSettingsSheet({ token, prefs, visibleEventIds, onClose, onSave }: Props) {
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

  const saveAndClose = () => {
    onSave(draft)
    onClose()
  }

  async function importIcsText(text: string, sourceLabel: string) {
    const events = parseIcs(text)
      .filter((e) => e.title.trim())
      .filter((e) => e.end.getTime() > e.start.getTime())

    if (events.length === 0) {
      setStatus('Não encontrei eventos nesse ficheiro.')
      return
    }

    const max = 250
    const total = Math.min(events.length, max)
    const ok = window.confirm(
      `Importar ${total}${events.length > max ? ` (de ${events.length})` : ''} eventos de ${sourceLabel}?`,
    )
    if (!ok) return

    const reminder = draft.defaultReminderMinutes
    const reminderOffsetsMinutes = reminder === null ? null : [reminder]

    setBusy(true)
    setStatus(`A importar 0/${total}...`)

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

      setStatus(`A importar ${created + failed}/${total}...`)
    }

    await queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    setBusy(false)
    setStatus(`Importação concluída: ${created} criados${failed ? `, ${failed} falharam` : ''}.`)
  }

  const importFromFile = () => {
    setStatus(null)
    fileRef.current?.click()
  }

  const importFromUrl = async () => {
    setStatus(null)
    const url = window.prompt('URL do calendário (.ics):')
    if (!url) return

    setBusy(true)
    try {
      const res = await fetch(url)
      const text = await res.text()
      await importIcsText(text, 'URL')
    } catch (err) {
      setStatus(formatError(err, 'Não foi possível importar do URL.'))
    } finally {
      setBusy(false)
    }
  }

  const cleanupVisibleEvents = async () => {
    setStatus(null)
    if (uniqueEventIds.length === 0) {
      setStatus('Não há eventos para apagar na janela atual.')
      return
    }

    const ok = window.confirm(`Apagar ${uniqueEventIds.length} eventos (únicos) da janela atual?`)
    if (!ok) return

    setBusy(true)
    setStatus(`A apagar 0/${uniqueEventIds.length}...`)

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
      setStatus(`A apagar ${deleted + failed}/${uniqueEventIds.length}...`)
    }

    await queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    setBusy(false)
    setStatus(`Limpeza concluída: ${deleted} apagados${failed ? `, ${failed} falharam` : ''}.`)
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={canClose ? onClose : undefined} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 top-0 mx-auto w-full max-w-3xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur px-4 py-3">
          <div className="flex items-center justify-between">
            <button type="button" className="rounded-full px-3 py-2 text-sm font-semibold text-gray-400" disabled>
              {' '}
            </button>
            <div className="text-lg font-semibold text-charcoal">Configurações</div>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-base font-semibold text-sage-dark hover:bg-sand-light disabled:opacity-50"
              onClick={saveAndClose}
              disabled={!canClose}
            >
              Ok
            </button>
          </div>
        </header>

        <main className="max-h-[calc(100vh-56px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
          {status ? (
            <div className="mb-4 rounded-2xl border border-sand-dark/60 bg-sand-light px-4 py-3 text-sm text-charcoal whitespace-pre-wrap">
              {status}
            </div>
          ) : null}

          <SectionTitle>OUTROS CALENDÁRIOS</SectionTitle>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <RowButton
              icon="ri-calendar-download-line"
              title="Importar eventos do ICS"
              onClick={importFromFile}
              disabled={busy}
            />
            <RowButton
              icon="ri-link"
              title="Adicionar calendário do URL"
              onClick={importFromUrl}
              disabled={busy}
            />
          </div>

          <SectionTitle className="mt-8">CONFIGURAÇÕES</SectionTitle>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <RowToggle
              icon="ri-hashtag"
              title="Número da semana"
              checked={draft.showWeekNumbers}
              onToggle={() => setDraft((p) => ({ ...p, showWeekNumbers: !p.showWeekNumbers }))}
              disabled={busy}
            />

            <RowSelect
              icon="ri-calendar-2-line"
              title="1º dia da semana"
              value={draft.firstDayOfWeek}
              options={[
                { label: 'Domingo', value: 'sunday' as FirstDayOfWeek },
                { label: 'Segunda-feira', value: 'monday' as FirstDayOfWeek },
              ]}
              onChange={(v) => setDraft((p) => ({ ...p, firstDayOfWeek: v }))}
              disabled={busy}
            />

            <RowSelect
              icon="ri-notification-3-line"
              title="Lembrete padrão"
              value={draft.defaultReminderMinutes}
              options={REMINDER_CHOICES}
              onChange={(v) => setDraft((p) => ({ ...p, defaultReminderMinutes: v }))}
              disabled={busy}
            />

            <RowButton
              icon="ri-delete-bin-6-line"
              title="Limpeza do Calendário"
              subtitle="Apagar eventos da janela atual"
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
                setStatus(formatError(err, 'Não foi possível ler o ficheiro.'))
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
    <div className={['mb-2 text-xs font-semibold tracking-wider text-charcoal/35', className].filter(Boolean).join(' ')}>
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

