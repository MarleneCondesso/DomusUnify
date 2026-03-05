import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n/i18n'

type FamilyMemberRow = {
  userId?: string
  name?: string | null
  email?: string | null
}

type Props = {
  title: string
  members: FamilyMemberRow[]
  initialSelectedUserIds: string[] // empty => all
  currentUserId?: string | null
  onClose: () => void
  onSave: (selectedUserIds: string[]) => void // empty => all
}

export function MemberPickerSheet({ title, members, initialSelectedUserIds, currentUserId, onClose, onSave }: Props) {
  const { t, locale } = useI18n()

  const memberIds = useMemo(
    () =>
      members
        .map((m) => m.userId ?? '')
        .filter(Boolean),
    [members],
  )

  const initialSet = useMemo(() => {
    if (initialSelectedUserIds.length === 0) return new Set(memberIds)
    const allowed = new Set(memberIds)
    return new Set(initialSelectedUserIds.filter((id) => allowed.has(id)))
  }, [initialSelectedUserIds, memberIds])

  const [selected, setSelected] = useState(() => initialSet)

  const rows = useMemo(() => {
    return members
      .filter((m) => Boolean(m.userId))
      .slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', locale, { sensitivity: 'base' }))
  }, [locale, members])

  const allSelected = selected.size === memberIds.length && memberIds.length > 0
  const onlyMeSelected = Boolean(currentUserId) && selected.size === 1 && selected.has(currentUserId!)

  const canSave = selected.size > 0

  const save = () => {
    const normalized = Array.from(selected).filter(Boolean)
    const isAll = memberIds.length > 0 && normalized.length === memberIds.length && memberIds.every((id) => normalized.includes(id))
    onSave(isAll ? [] : normalized)
  }

  const pickAll = () => setSelected(new Set(memberIds))
  const pickOnlyMe = () => {
    if (!currentUserId) return
    setSelected(new Set([currentUserId]))
  }

  return (
    <div className="fixed inset-0 z-[120]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-sand-light p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <header className="mb-3 flex items-center justify-between">
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose} aria-label={t('common.close')}>
            <i className="ri-close-line text-2xl text-gray-600" />
          </button>
          <div className="text-lg font-semibold text-charcoal">{title}</div>
          <div className="h-10 w-10" aria-hidden="true" />
        </header>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-charcoal/70 shadow-sm">
            {t('calendar.addEvent.members.empty')}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {rows.map((m) => {
                const id = m.userId!
                const active = selected.has(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 text-left last:border-b-0 hover:bg-sand-light"
                    onClick={() => {
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (next.has(id)) next.delete(id)
                        else next.add(id)
                        return next
                      })
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={[
                          'grid h-11 w-11 shrink-0 place-items-center rounded-full text-base font-semibold',
                          active ? 'bg-sage-light text-forest' : 'bg-sand-light text-charcoal/60',
                        ].join(' ')}
                      >
                        {safeInitial(m.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-charcoal">{m.name ?? '—'}</div>
                        {m.email ? <div className="truncate text-xs text-charcoal/50">{m.email}</div> : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-charcoal/45">
                      <i className={`${active ? 'ri-checkbox-circle-fill text-forest' : 'ri-checkbox-blank-circle-line'} text-2xl`} />
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-forest hover:bg-white"
                onClick={pickAll}
                disabled={allSelected}
              >
                {t('common.showAll')}
              </button>

              <button
                type="button"
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-forest hover:bg-white disabled:opacity-50"
                onClick={pickOnlyMe}
                disabled={!currentUserId || onlyMeSelected}
              >
                {t('calendar.addEvent.scope.onlyMe')}
              </button>
            </div>

            <div className="pb-[calc(env(safe-area-inset-bottom)+8px)] pt-4">
              <button
                type="button"
                className="w-full rounded-full bg-forest px-4 py-3 text-base font-semibold text-white hover:bg-forest/95 disabled:opacity-50"
                onClick={save}
                disabled={!canSave}
              >
                {t('common.save')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function safeInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

