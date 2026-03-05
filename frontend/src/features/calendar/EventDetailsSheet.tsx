import { useMemo } from 'react'
import type { CalendarResponse } from '../../api/domusApi'
import { useI18n } from '../../i18n/i18n'
import type { MessageKey } from '../../i18n/messages'

type FamilyMemberRow = {
  userId?: string
  name?: string | null
  email?: string | null
}

type Props = {
  event: CalendarResponse
  members: FamilyMemberRow[]
  currentUserId?: string | null
  onClose: () => void
  onEdit: () => void
}

export function EventDetailsSheet({ event, members, currentUserId, onClose, onEdit }: Props) {
  const { t, locale } = useI18n()

  const title = (event.title ?? '').trim() || t('calendar.event.untitled')
  const start = safeUtcToLocalDate(event.startUtc)
  const end = safeUtcToLocalDate(event.endUtc)
  const tz = (event.timezoneId ?? '').trim()

  const memberIds = useMemo(
    () =>
      members
        .map((m) => (m.userId ?? '').trim())
        .filter(Boolean),
    [members],
  )

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
    const ids = normalizeIds(event.participantUserIds)
    if (isAllMembersSelection(ids, memberIds)) return t('calendar.addEvent.participants.all')
    return scopeLabel(ids, { t, currentUserId, memberLabelById })
  }, [currentUserId, event.participantUserIds, memberIds, memberLabelById, t])

  const visibleToLabel = useMemo(() => {
    const ids = normalizeIds(event.visibleToUserIds)
    if (isAllMembersSelection(ids, memberIds)) return t('calendar.addEvent.visibleTo.allMembers')
    return scopeLabel(ids, { t, currentUserId, memberLabelById })
  }, [currentUserId, event.visibleToUserIds, memberIds, memberLabelById, t])

  const reminderLabel = useMemo(() => {
    const first = (event.reminderOffsetsMinutes ?? []).find((n) => typeof n === 'number') ?? null
    if (first === null) return t('calendar.settings.reminder.none')
    if (first === 10) return t('calendar.settings.reminder.10min')
    if (first === 30) return t('calendar.settings.reminder.30min')
    if (first === 60) return t('calendar.settings.reminder.1hour')
    if (first === 1440) return t('calendar.settings.reminder.1day')
    return `${first} ${t('common.minutes')}`
  }, [event.reminderOffsetsMinutes, t])

  const startLabel = useMemo(() => {
    if (!start) return '—'
    if (event.isAllDay) return start.toLocaleDateString(locale, { dateStyle: 'medium' })
    return start.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
  }, [event.isAllDay, locale, start])

  const endLabel = useMemo(() => {
    if (!end) return '—'
    if (event.isAllDay) return end.toLocaleDateString(locale, { dateStyle: 'medium' })
    return end.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
  }, [event.isAllDay, end, locale])

  const canEdit = Boolean((event.id ?? '').trim())

  return (
    <div className="fixed inset-0 z-[75]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="px-4 py-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              onClick={onClose}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              <i className="ri-close-line text-2xl text-gray-600" />
            </button>

            <div className="min-w-0 flex-1 px-2 text-center">
              <div className="truncate text-base font-semibold text-charcoal">{t('calendar.eventDetails.sheetTitle')}</div>
            </div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={onEdit}
              disabled={!canEdit}
              aria-label={t('common.edit')}
              title={t('common.edit')}
            >
              <i className="ri-pencil-line text-2xl leading-none text-sage-dark" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-64px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <div className="px-4 py-4">
              <div className="text-lg font-extrabold text-charcoal">{title}</div>
              {event.isAllDay ? <div className="mt-1 text-sm font-semibold text-charcoal/55">{t('calendar.event.allDay')}</div> : null}
            </div>

            <DetailRow icon="ri-arrow-right-line" label={t('calendar.addEvent.start')} value={startLabel} />
            <DetailRow icon="ri-arrow-left-line" label={t('calendar.addEvent.end')} value={endLabel} />
            <DetailRow
              icon="ri-global-line"
              label={t('calendar.addEvent.timeZone')}
              value={tz ? tz : Intl.DateTimeFormat().resolvedOptions().timeZone ?? '—'}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <DetailRow icon="ri-group-line" label={t('calendar.addEvent.participants')} value={participantsLabel} />
            <DetailRow icon="ri-eye-line" label={t('calendar.addEvent.visibleTo')} value={visibleToLabel} />
            <DetailRow icon="ri-notification-3-line" label={t('calendar.addEvent.reminder')} value={reminderLabel} />
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200">
            <DetailRow icon="ri-map-pin-line" label={t('calendar.addEvent.location')} value={(event.location ?? '').trim() || '—'} />
            <DetailRow icon="ri-sticky-note-line" label={t('calendar.addEvent.note')} value={(event.note ?? '').trim() || '—'} />
          </div>

          <div className="py-4">
            <button
              type="button"
              className="w-full rounded-full bg-forest px-4 py-3 text-base font-semibold text-white hover:bg-forest/95 disabled:opacity-50"
              onClick={onEdit}
              disabled={!canEdit}
            >
              {t('calendar.editEvent.sheetTitle')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <i className={`${icon} text-xl text-charcoal/45`} />
      <div className="flex-1 text-sm font-semibold text-charcoal">{label}</div>
      <div className="shrink-0 text-sm font-semibold text-sage-dark">{value}</div>
    </div>
  )
}

function safeUtcToLocalDate(utcIso: string | null | undefined): Date | null {
  const raw = (utcIso ?? '').trim()
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeIds(input: string[] | null | undefined): string[] {
  return (input ?? [])
    .map((x) => (x ?? '').trim())
    .filter(Boolean)
}

function isAllMembersSelection(ids: string[], memberIds: string[]): boolean {
  if (memberIds.length === 0) return false
  if (ids.length !== memberIds.length) return false
  const set = new Set(ids)
  return memberIds.every((mid) => set.has(mid))
}

function scopeLabel(
  ids: string[],
  {
    t,
    currentUserId,
    memberLabelById,
  }: {
    t: (key: MessageKey, vars?: Record<string, string | number>) => string
    currentUserId?: string | null
    memberLabelById: Map<string, string>
  },
): string {
  if (ids.length === 0) return '—'
  if (ids.length === 1) {
    const id = ids[0]!
    if (currentUserId && id === currentUserId) return t('calendar.addEvent.scope.onlyMe')
    return memberLabelById.get(id) ?? t('common.someone')
  }

  return t('calendar.addEvent.scope.count', { count: ids.length })
}
