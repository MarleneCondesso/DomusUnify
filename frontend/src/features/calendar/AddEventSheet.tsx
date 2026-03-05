import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { CalendarResponse, CreateCalendarEventRequest } from '../../api/domusApi'
import { DatePickerSheet } from '../../ui/DatePickerSheet'
import { TimePickerSheet } from '../../ui/TimePickerSheet'
import { useI18n } from '../../i18n/i18n'
import { MemberPickerSheet } from './MemberPickerSheet'

type FamilyMemberRow = {
  userId?: string
  name?: string | null
  email?: string | null
}

type Props = {
  initialDate: Date
  members: FamilyMemberRow[]
  currentUserId?: string | null
  defaultReminderMinutes?: number | null
  initialEvent?: CalendarResponse | null
  sheetTitle?: string
  isSaving?: boolean
  isMembersLoading?: boolean
  errorMessage?: string | null
  onClose: () => void
  onSave: (request: CreateCalendarEventRequest) => void
}

export function AddEventSheet({
  initialDate,
  members,
  currentUserId,
  defaultReminderMinutes = 30,
  initialEvent,
  sheetTitle,
  isSaving,
  isMembersLoading,
  errorMessage,
  onClose,
  onSave,
}: Props) {
  const { t } = useI18n()
  const titleRef = useRef<HTMLInputElement | null>(null)
  const hydratedFromEventKeyRef = useRef<string | null>(null)
  const hydratedFromEventMembersCountRef = useRef<number>(0)

  const colorOptions = useMemo(
    () => [
      { id: 'auto', label: t('calendar.color.auto'), value: null, swatch: 'bg-sand-dark' },
      { id: 'forest', label: t('calendar.color.forest'), value: '#2D4A3E', swatch: 'bg-forest' },
      { id: 'amber', label: t('calendar.color.amber'), value: '#d4a853', swatch: 'bg-amber' },
      { id: 'sage', label: t('calendar.color.sage'), value: '#7a9b86', swatch: 'bg-sage-dark' },
      { id: 'purple', label: t('calendar.color.purple'), value: '#7c3aed', swatch: 'bg-violet-600' },
      { id: 'blue', label: t('calendar.color.blue'), value: '#0ea5e9', swatch: 'bg-sky-500' },
      { id: 'red', label: t('calendar.color.red'), value: '#ef4444', swatch: 'bg-red-500' },
    ],
    [t],
  )

  const reminderOptions = useMemo(
    () => [
      { id: 'none', label: t('calendar.settings.reminder.none'), minutes: null },
      { id: '10', label: t('calendar.settings.reminder.10min'), minutes: 10 },
      { id: '30', label: t('calendar.settings.reminder.30min'), minutes: 30 },
      { id: '60', label: t('calendar.settings.reminder.1hour'), minutes: 60 },
      { id: '1440', label: t('calendar.settings.reminder.1day'), minutes: 1440 },
    ],
    [t],
  )

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
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end' | null>(null)
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null)
  const [participantsUserIds, setParticipantsUserIds] = useState<string[]>([])
  const [visibleToUserIds, setVisibleToUserIds] = useState<string[]>([])
  const [memberPickerTarget, setMemberPickerTarget] = useState<'participants' | 'visibleTo' | null>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!initialEvent) return

    const id = (initialEvent.id ?? '').trim()
    const fallbackKey = [
      (initialEvent.startUtc ?? '').trim(),
      (initialEvent.endUtc ?? '').trim(),
      (initialEvent.title ?? '').trim(),
    ]
      .filter(Boolean)
      .join('|')
    const hydrateKey = id ? `id:${id}` : `fallback:${fallbackKey}`

    const memberIds = members
      .map((m) => (m.userId ?? '').trim())
      .filter(Boolean)

    const keyChanged = hydratedFromEventKeyRef.current !== hydrateKey
    const membersBecameAvailable =
      hydratedFromEventKeyRef.current === hydrateKey &&
      hydratedFromEventMembersCountRef.current === 0 &&
      memberIds.length > 0

    if (!keyChanged && !membersBecameAvailable) return

    const participantIds = (initialEvent.participantUserIds ?? []).map((x) => (x ?? '').trim()).filter(Boolean)
    const visibleIds = (initialEvent.visibleToUserIds ?? []).map((x) => (x ?? '').trim()).filter(Boolean)

    const isAllMembersSelection = (ids: string[]) => {
      if (memberIds.length === 0) return false
      if (ids.length !== memberIds.length) return false
      const set = new Set(ids)
      return memberIds.every((mid) => set.has(mid))
    }

    if (keyChanged) {
      const title = (initialEvent.title ?? '').trim()
      setTitle(title)

      const isAllDay = Boolean(initialEvent.isAllDay)
      setIsAllDay(isAllDay)

      const start = safeUtcToLocalDate(initialEvent.startUtc) ?? defaults.start
      const end = safeUtcToLocalDate(initialEvent.endUtc) ?? defaults.end

      setStartDate(toDateInputValue(start))
      setStartTime(toTimeInputValue(start))
      setEndDate(toDateInputValue(end))
      setEndTime(toTimeInputValue(end))

      setLocation((initialEvent.location ?? '').toString())
      setNote((initialEvent.note ?? '').toString())
      setColorHex((initialEvent.colorHex ?? '').trim() ? (initialEvent.colorHex ?? '').trim() : null)

      const firstReminder = (initialEvent.reminderOffsetsMinutes ?? []).find((n) => typeof n === 'number') ?? null
      const allowed = new Set([10, 30, 60, 1440])
      setReminderMinutes(firstReminder !== null && allowed.has(firstReminder) ? firstReminder : null)
    }

    setParticipantsUserIds(isAllMembersSelection(participantIds) ? [] : participantIds)
    setVisibleToUserIds(isAllMembersSelection(visibleIds) ? [] : visibleIds)

    hydratedFromEventKeyRef.current = hydrateKey
    hydratedFromEventMembersCountRef.current = memberIds.length
  }, [defaults.end, defaults.start, initialEvent, members])

  const startLocal = useMemo(() => {
    const time = isAllDay ? '00:00' : startTime
    return fromLocalDateParts(startDate, time)
  }, [isAllDay, startDate, startTime])

  const endLocal = useMemo(() => {
    const time = isAllDay ? '23:59' : endTime
    return fromLocalDateParts(endDate, time)
  }, [endDate, endTime, isAllDay])

  const memberLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of members) {
      const id = (m.userId ?? '').trim()
      if (!id) continue
      const label = (m.name ?? m.email ?? id).trim()
      map.set(id, label || id)
    }
    return map
  }, [members])

  const participantsLabel = useMemo(() => {
    if (isMembersLoading) return t('common.loading')
    if (participantsUserIds.length === 0) return t('calendar.addEvent.participants.all')

    if (participantsUserIds.length === 1) {
      const id = participantsUserIds[0]!
      if (currentUserId && id === currentUserId) return t('calendar.addEvent.scope.onlyMe')
      return memberLabelById.get(id) ?? t('common.someone')
    }

    return t('calendar.addEvent.scope.count', { count: participantsUserIds.length })
  }, [currentUserId, isMembersLoading, memberLabelById, participantsUserIds, t])

  const visibleToLabel = useMemo(() => {
    if (isMembersLoading) return t('common.loading')
    if (visibleToUserIds.length === 0) return t('calendar.addEvent.visibleTo.allMembers')

    if (visibleToUserIds.length === 1) {
      const id = visibleToUserIds[0]!
      if (currentUserId && id === currentUserId) return t('calendar.addEvent.scope.onlyMe')
      return memberLabelById.get(id) ?? t('common.someone')
    }

    return t('calendar.addEvent.scope.count', { count: visibleToUserIds.length })
  }, [currentUserId, isMembersLoading, memberLabelById, t, visibleToUserIds])

  const rangeErrorMessage = useMemo(() => {
    if (!startLocal || !endLocal) return null
    if (endLocal.getTime() > startLocal.getTime()) return null

    const startDay = fromYmd(startDate)
    const endDay = fromYmd(endDate)
    if (startDay && endDay && endDay.getTime() < startDay.getTime()) return t('calendar.addEvent.validation.endDateBeforeStart')

    return t('calendar.addEvent.validation.endTimeBeforeStart')
  }, [endDate, endLocal, startDate, startLocal, t])

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

    const participantsAllMembers = participantsUserIds.length === 0
    const visibleAllMembers = visibleToUserIds.length === 0

    const request: CreateCalendarEventRequest = {
      title: trimmedTitle,
      isAllDay,
      startUtc: startLocal.toISOString(),
      endUtc: endLocal.toISOString(),
      participantsAllMembers,
      participantUserIds: participantsAllMembers ? [] : participantsUserIds,
      visibleToAllMembers: visibleAllMembers,
      visibleToUserIds: visibleAllMembers ? [] : visibleToUserIds,
      reminderOffsetsMinutes: reminderMinutes === null ? [] : [reminderMinutes],
      location: trimmedLocation,
      note: trimmedNote,
      colorHex: (colorHex ?? '').trim(),
      timezoneId: timeZoneId,
    }

    onSave(request)
  }

  return (
    <div className="fixed inset-0 z-80">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3 text-white">
            <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={onClose}
              disabled={isSaving}
              aria-label={t('common.cancel')}
              title={t('common.cancel')}
            >
              <i className="ri-close-line text-2xl leading-none text-sage-dark" />
            </button>

            <div className="text-base font-semibold">{sheetTitle ?? t('calendar.addEvent.sheetTitle')}</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50 text-sage-dark"
              onClick={submit}
              disabled={!canSave}
              aria-label={t('common.save')}
              title={t('common.save')}
            >
              <i className={isSaving ? 'ri-loader-4-line animate-spin text-2xl' : 'ri-check-line text-2xl'} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-56px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
          {rangeErrorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {rangeErrorMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {errorMessage}
            </div>
          ) : null}

          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold text-charcoal/60">{t('calendar.addEvent.field.title')}</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('calendar.addEvent.field.title.placeholder')}
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
              label={t('calendar.event.allDay')}
              right={
                <Switch checked={isAllDay} onToggle={toggleAllDay} disabled={isSaving} />
              }
            />

            <DateTimeRow
              icon="ri-arrow-right-line"
              label={t('calendar.addEvent.start')}
              date={startDate}
              time={startTime}
              onOpenDate={() => setDatePickerTarget('start')}
              onOpenTime={() => setTimePickerTarget('start')}
              disabled={isSaving}
              hideTime={isAllDay}
            />

            <DateTimeRow
              icon="ri-arrow-left-line"
              label={t('calendar.addEvent.end')}
              date={endDate}
              time={endTime}
              onOpenDate={() => setDatePickerTarget('end')}
              onOpenTime={() => setTimePickerTarget('end')}
              disabled={isSaving}
              hideTime={isAllDay}
            />

            <Row
              icon="ri-global-line"
              label={timeZoneId ? `${t('calendar.addEvent.timeZone')}: ${timeZoneId}` : t('calendar.addEvent.timeZone')}
              right={<span className="text-xs text-charcoal/40">—</span>}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <Row
              icon="ri-group-line"
              label={t('calendar.addEvent.participants')}
              right={
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-sage-dark">{participantsLabel}</span>
                  <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" aria-hidden="true" />
                </div>
              }
              onClick={() => setMemberPickerTarget('participants')}
              disabled={Boolean(isSaving) || Boolean(isMembersLoading) || members.length === 0}
            />

            <Row
              icon="ri-eye-line"
              label={t('calendar.addEvent.visibleTo')}
              right={
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-sage-dark">{visibleToLabel}</span>
                  <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" aria-hidden="true" />
                </div>
              }
              onClick={() => setMemberPickerTarget('visibleTo')}
              disabled={Boolean(isSaving) || Boolean(isMembersLoading) || members.length === 0}
            />

            <div className="flex items-center gap-3 px-4 py-3">
              <i className="ri-palette-line text-xl text-charcoal/45" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-charcoal">{t('calendar.addEvent.changeColor')}</div>
                <div className="mt-2 flex items-center gap-2">
                  {colorOptions.map((opt) => {
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
                <div className="text-sm font-semibold text-charcoal">{t('calendar.addEvent.reminder')}</div>
                <select
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
                  value={reminderMinutes === null ? 'none' : String(reminderMinutes)}
                  onChange={(e) => {
                    const v = e.target.value
                    setReminderMinutes(v === 'none' ? null : Number(v))
                  }}
                  disabled={isSaving}
                >
                  {reminderOptions.map((opt) => (
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
                <div className="text-sm font-semibold text-charcoal">{t('calendar.addEvent.location')}</div>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('calendar.addEvent.location.placeholder')}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 px-4 py-3">
              <i className="ri-sticky-note-line mt-0.5 text-xl text-charcoal/45" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-charcoal">{t('calendar.addEvent.note')}</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('calendar.addEvent.note.placeholder')}
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25"
                  rows={4}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {datePickerTarget ? (
        <DatePickerSheet
          title={t('calendar.addEvent.selectDate')}
          value={datePickerTarget === 'start' ? startDate : endDate}
          onClose={() => setDatePickerTarget(null)}
          onConfirm={(v) => {
            if (typeof v !== 'string' || !v) {
              setDatePickerTarget(null)
              return
            }

            if (datePickerTarget === 'start') {
              setStartDate(v)
              if (!initialEvent) setEndDate(v)
            } else {
              setEndDate(v)
            }

            setDatePickerTarget(null)
          }}
          isBusy={isSaving}
          zIndexClass="z-[120]"
        />
      ) : null}

      {timePickerTarget ? (
        <TimePickerSheet
          title={t('calendar.addEvent.selectTime')}
          value={timePickerTarget === 'start' ? startTime : endTime}
          onClose={() => setTimePickerTarget(null)}
          onConfirm={(v) => {
            if (typeof v !== 'string' || !v) {
              setTimePickerTarget(null)
              return
            }

            if (timePickerTarget === 'start') setStartTime(v)
            else setEndTime(v)

            setTimePickerTarget(null)
          }}
          isBusy={isSaving}
          zIndexClass="z-[120]"
        />
      ) : null}

      {memberPickerTarget ? (
        <MemberPickerSheet
          title={memberPickerTarget === 'participants' ? t('calendar.addEvent.participants') : t('calendar.addEvent.visibleTo')}
          members={members}
          currentUserId={currentUserId}
          initialSelectedUserIds={memberPickerTarget === 'participants' ? participantsUserIds : visibleToUserIds}
          onClose={() => setMemberPickerTarget(null)}
          onSave={(next) => {
            if (memberPickerTarget === 'participants') setParticipantsUserIds(next)
            else setVisibleToUserIds(next)
            setMemberPickerTarget(null)
          }}
        />
      ) : null}
    </div>
  )
}

type RowProps = {
  icon: string
  label: string
  right?: ReactNode
  onClick?: () => void
  disabled?: boolean
}

function Row({ icon, label, right, onClick, disabled }: RowProps) {
  const isButton = typeof onClick === 'function'
  const sharedClassName = `flex items-center gap-3 px-4 py-3 ${isButton ? 'w-full text-left hover:bg-sand-light disabled:opacity-60' : ''}`

  if (isButton) {
    return (
      <button type="button" className={sharedClassName} onClick={onClick} disabled={disabled}>
        <i className={`${icon} text-xl text-charcoal/45`} />
        <div className="flex-1 text-sm font-semibold text-charcoal">{label}</div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </button>
    )
  }

  return (
    <div className={sharedClassName}>
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
  const { t } = useI18n()

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
      aria-label={t('common.toggle')}
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
  onOpenDate: () => void
  onOpenTime: () => void
  disabled?: boolean
  hideTime?: boolean
}

function DateTimeRow({
  icon,
  label,
  date,
  time,
  onOpenDate,
  onOpenTime,
  disabled,
  hideTime,
}: DateTimeRowProps) {
  const { t, locale } = useI18n()
  const dateLabel = formatDateLabel(date, locale)
  const timeLabel = formatTimeLabel(time)

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <i className={`${icon} text-xl text-charcoal/45`} />
      <div className="w-14 text-xs font-semibold text-charcoal/55">{label}</div>
      <button
        type="button"
        className="flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25 hover:bg-sand-light disabled:opacity-60"
        onClick={onOpenDate}
        disabled={disabled}
        aria-label={t('calendar.addEvent.selectDate')}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="truncate">{dateLabel}</span>
          <i className="ri-calendar-line text-lg text-charcoal/40" aria-hidden="true" />
        </span>
      </button>
      {!hideTime ? (
        <button
          type="button"
          className="w-28 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-sage-dark/25 hover:bg-sand-light disabled:opacity-60"
          onClick={onOpenTime}
          disabled={disabled}
          aria-label={t('calendar.addEvent.selectTime')}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="truncate tabular-nums">{timeLabel}</span>
            <i className="ri-time-line text-lg text-charcoal/40" aria-hidden="true" />
          </span>
        </button>
      ) : (
        <div className="w-28 text-right text-sm font-semibold text-charcoal/40">{t('calendar.event.allDay')}</div>
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

function safeUtcToLocalDate(utcIso: string | null | undefined): Date | null {
  const raw = (utcIso ?? '').trim()
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
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

function formatDateLabel(isoDate: string, locale: string): string {
  const d = fromYmd(isoDate)
  if (!d) return (isoDate ?? '').trim() || '—'
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTimeLabel(hm: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec((hm ?? '').trim())
  if (!m) return (hm ?? '').trim() || '—'
  return `${m[1]}:${m[2]}`
}

function fromYmd(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((isoDate ?? '').trim())
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2]) - 1
  const day = Number(m[3])
  const d = new Date(year, month, day, 0, 0, 0, 0)
  return Number.isNaN(d.getTime()) ? null : d
}
