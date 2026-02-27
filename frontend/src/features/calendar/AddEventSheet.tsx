import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { CreateCalendarEventRequest } from '../../api/domusApi'

type Props = {
  initialDate: Date
  defaultReminderMinutes?: number | null
  isSaving?: boolean
  errorMessage?: string | null
  onClose: () => void
  onSave: (request: CreateCalendarEventRequest) => void
}

const COLOR_OPTIONS: Array<{ id: string; label: string; value: string | null; swatch: string }> = [
  { id: 'auto', label: 'Auto', value: null, swatch: 'bg-sand-dark' },
  { id: 'forest', label: 'Forest', value: '#2D4A3E', swatch: 'bg-forest' },
  { id: 'amber', label: 'Amber', value: '#d4a853', swatch: 'bg-amber' },
  { id: 'sage', label: 'Sage', value: '#7a9b86', swatch: 'bg-sage-dark' },
  { id: 'purple', label: 'Purple', value: '#7c3aed', swatch: 'bg-violet-600' },
  { id: 'blue', label: 'Blue', value: '#0ea5e9', swatch: 'bg-sky-500' },
  { id: 'red', label: 'Red', value: '#ef4444', swatch: 'bg-red-500' },
]

const REMINDER_OPTIONS: Array<{ id: string; label: string; minutes: number | null }> = [
  { id: 'none', label: 'Nenhum', minutes: null },
  { id: '10', label: '10 minutos antes', minutes: 10 },
  { id: '30', label: '30 minutos antes', minutes: 30 },
  { id: '60', label: '1 hora antes', minutes: 60 },
  { id: '1440', label: '1 dia antes', minutes: 1440 },
]

export function AddEventSheet({
  initialDate,
  defaultReminderMinutes = 30,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: Props) {
  const titleRef = useRef<HTMLInputElement | null>(null)

  const timeZoneId = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
    } catch {
      return null
    }
  }, [])

  const defaults = useMemo(() => {
    const now = new Date()
    const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

    const base = new Date(initialDate)
    base.setHours(9, 0, 0, 0)

    if (sameDay(initialDate, now)) {
      const rounded = new Date(now)
      const m = rounded.getMinutes()
      const next15 = Math.ceil(m / 15) * 15
      rounded.setMinutes(next15, 0, 0)
      if (!Number.isNaN(rounded.getTime())) base.setHours(rounded.getHours(), rounded.getMinutes(), 0, 0)
    }

    const end = new Date(base.getTime() + 60 * 60 * 1000)
    return { start: base, end }
  }, [initialDate])

  const [title, setTitle] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [startDate, setStartDate] = useState(() => toDateInputValue(defaults.start))
  const [startTime, setStartTime] = useState(() => toTimeInputValue(defaults.start))
  const [endDate, setEndDate] = useState(() => toDateInputValue(defaults.end))
  const [endTime, setEndTime] = useState(() => toTimeInputValue(defaults.end))
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')
  const [colorHex, setColorHex] = useState<string | null>(null)
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(defaultReminderMinutes)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const startLocal = useMemo(() => {
    const time = isAllDay ? '00:00' : startTime
    return fromLocalDateParts(startDate, time)
  }, [isAllDay, startDate, startTime])

  const endLocal = useMemo(() => {
    const time = isAllDay ? '23:59' : endTime
    return fromLocalDateParts(endDate, time)
  }, [endDate, endTime, isAllDay])

  const canSave = useMemo(() => {
    if (isSaving) return false
    if (!title.trim()) return false
    if (!startLocal || !endLocal) return false
    if (endLocal.getTime() <= startLocal.getTime()) return false
    return true
  }, [endLocal, isSaving, startLocal, title])

  const toggleAllDay = () => {
    setIsAllDay((v) => {
      const next = !v
      if (next) {
        setStartTime('00:00')
        setEndTime('23:59')
        setEndDate(startDate)
      } else {
        const start = fromLocalDateParts(startDate, startTime) ?? defaults.start
        const end = new Date(start.getTime() + 60 * 60 * 1000)
        setStartTime(toTimeInputValue(start))
        setEndTime(toTimeInputValue(end))
        setEndDate(toDateInputValue(end))
      }
      return next
    })
  }

  const submit = () => {
    if (!canSave || !startLocal || !endLocal) return

    const trimmedTitle = title.trim()
    const trimmedLocation = location.trim()
    const trimmedNote = note.trim()

    const request: CreateCalendarEventRequest = {
      title: trimmedTitle,
      isAllDay,
      startUtc: startLocal.toISOString(),
      endUtc: endLocal.toISOString(),
      participantsAllMembers: true,
      visibleToAllMembers: true,
      reminderOffsetsMinutes: reminderMinutes === null ? null : [reminderMinutes],
      location: trimmedLocation ? trimmedLocation : null,
      note: trimmedNote ? trimmedNote : null,
      colorHex: colorHex ? colorHex : null,
      timezoneId: timeZoneId,
    }

    onSave(request)
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="bg-forest px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Cancelar"
              title="Cancelar"
            >
              <i className="ri-close-line text-2xl leading-none" />
            </button>

            <div className="text-base font-semibold">Adicionar um evento</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-50"
              onClick={submit}
              disabled={!canSave}
              aria-label="Guardar"
              title="Guardar"
            >
              <i className={isSaving ? 'ri-loader-4-line animate-spin text-2xl' : 'ri-check-line text-2xl'} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-56px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {errorMessage}
            </div>
          ) : null}

          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold text-charcoal/60">Título</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Adicionar título"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                submit()
              }}
              disabled={isSaving}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <Row
              icon="ri-24-hours-line"
              label="Dia inteiro"
              right={
                <Switch checked={isAllDay} onToggle={toggleAllDay} disabled={isSaving} />
              }
            />

            <DateTimeRow
              icon="ri-arrow-right-line"
              label="Início"
              date={startDate}
              time={startTime}
              onDateChange={setStartDate}
              onTimeChange={setStartTime}
              disabled={isSaving}
              hideTime={isAllDay}
            />

            <DateTimeRow
              icon="ri-arrow-left-line"
              label="Fim"
              date={endDate}
              time={endTime}
              onDateChange={setEndDate}
              onTimeChange={setEndTime}
              disabled={isSaving}
              hideTime={isAllDay}
            />

            <Row
              icon="ri-global-line"
              label={timeZoneId ? `Fuso horário: ${timeZoneId}` : 'Fuso horário'}
              right={<span className="text-xs text-charcoal/40">—</span>}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <Row
              icon="ri-group-line"
              label="Participantes"
              right={<span className="text-sm font-semibold text-sage-dark">Todos</span>}
            />

            <Row
              icon="ri-eye-line"
              label="Visível por"
              right={<span className="text-sm font-semibold text-sage-dark">Todos os membros</span>}
            />

            <div className="flex items-center gap-3 px-4 py-3">
              <i className="ri-palette-line text-xl text-charcoal/45" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-charcoal">Alterar cor</div>
                <div className="mt-2 flex items-center gap-2">
                  {COLOR_OPTIONS.map((opt) => {
                    const active = opt.value === colorHex
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={[
                          'grid h-9 w-9 place-items-center rounded-full ring-offset-2 transition',
                          opt.swatch,
                          active ? 'ring-2 ring-forest' : 'ring-1 ring-black/10 hover:ring-2 hover:ring-sage-dark/40',
                        ].join(' ')}
                        onClick={() => setColorHex(opt.value)}
                        disabled={isSaving}
                        title={opt.label}
                        aria-label={opt.label}
                      >
                        {opt.value === null ? <i className="ri-close-line text-lg text-white/90" /> : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <i className="ri-notification-3-line text-xl text-charcoal/45" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-charcoal">Lembrete</div>
                <select
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
                  value={reminderMinutes === null ? 'none' : String(reminderMinutes)}
                  onChange={(e) => {
                    const v = e.target.value
                    setReminderMinutes(v === 'none' ? null : Number(v))
                  }}
                  disabled={isSaving}
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.minutes === null ? 'none' : String(opt.minutes)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <i className="ri-map-pin-line text-xl text-charcoal/45" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-charcoal">Localização</div>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Adicionar localização"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 px-4 py-3">
              <i className="ri-sticky-note-line mt-0.5 text-xl text-charcoal/45" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-charcoal">Nota</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Adicionar uma nota"
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
                  rows={4}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="w-full rounded-full bg-forest px-4 py-3 text-base font-semibold text-white hover:bg-forest/95 disabled:opacity-50"
              onClick={submit}
              disabled={!canSave}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type RowProps = {
  icon: string
  label: string
  right?: ReactNode
}

function Row({ icon, label, right }: RowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <i className={`${icon} text-xl text-charcoal/45`} />
      <div className="flex-1 text-sm font-semibold text-charcoal">{label}</div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

type SwitchProps = {
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}

function Switch({ checked, disabled, onToggle }: SwitchProps) {
  return (
    <button
      type="button"
      className={[
        'relative h-6 w-11 rounded-full transition disabled:opacity-50',
        checked ? 'bg-sage-dark' : 'bg-gray-300',
      ].join(' ')}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={checked}
      aria-label="Alternar"
    >
      <span
        className={[
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition',
          checked ? 'left-5' : 'left-0.5',
        ].join(' ')}
      />
    </button>
  )
}

type DateTimeRowProps = {
  icon: string
  label: string
  date: string
  time: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
  disabled?: boolean
  hideTime?: boolean
}

function DateTimeRow({
  icon,
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  disabled,
  hideTime,
}: DateTimeRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <i className={`${icon} text-xl text-charcoal/45`} />
      <div className="w-14 text-xs font-semibold text-charcoal/55">{label}</div>
      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
        disabled={disabled}
      />
      {!hideTime ? (
        <input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-28 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
          disabled={disabled}
        />
      ) : (
        <div className="w-28 text-right text-sm font-semibold text-charcoal/40">Dia inteiro</div>
      )}
    </div>
  )
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toTimeInputValue(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function fromLocalDateParts(date: string, time: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const t = /^(\d{2}):(\d{2})$/.exec(time)
  if (!m || !t) return null

  const year = Number(m[1])
  const month = Number(m[2]) - 1
  const day = Number(m[3])
  const hour = Number(t[1])
  const minute = Number(t[2])

  const d = new Date(year, month, day, hour, minute, 0, 0)
  return Number.isNaN(d.getTime()) ? null : d
}
