import { useMemo, useState } from 'react'

type FamilyMemberRow = {
  userId?: string
  name?: string | null
  email?: string | null
}

type Props = {
  members: FamilyMemberRow[]
  initialSelectedUserIds: string[] // empty => all
  onClose: () => void
  onSave: (selectedUserIds: string[]) => void
}

export function CalendarFilterSheet({ members, initialSelectedUserIds, onClose, onSave }: Props) {
  const memberIds = useMemo(
    () =>
      members
        .map((m) => m.userId ?? '')
        .filter(Boolean),
    [members],
  )

  const initialSet = useMemo(() => {
    if (initialSelectedUserIds.length === 0) return new Set(memberIds)
    return new Set(initialSelectedUserIds)
  }, [initialSelectedUserIds, memberIds])

  const [selected, setSelected] = useState(() => initialSet)

  const rows = useMemo(() => {
    return members
      .filter((m) => Boolean(m.userId))
      .slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt-PT', { sensitivity: 'base' }))
  }, [members])

  const allSelected = selected.size === memberIds.length && memberIds.length > 0
  const canSave = selected.size > 0

  return (
    <div className="fixed inset-0 z-[75]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <header className="mb-3 flex items-center justify-between">
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose} aria-label="Fechar">
            <i className="ri-close-line text-2xl text-gray-600" />
          </button>
          <div className="text-lg font-semibold text-charcoal">Filtrar</div>
          <button
            type="button"
            className="rounded-full p-2 hover:bg-sand-light text-sage-dark"
            onClick={() => window.alert('Selecione os membros para ver apenas eventos onde eles participam.')}
            aria-label="Ajuda"
          >
            <i className="ri-information-line text-2xl" />
          </button>
        </header>

        <div className="mb-3">
          <div className="text-base font-semibold text-charcoal">Membros</div>
          <div className="mt-1 text-sm text-charcoal/60">
            Selecione os membros para ver os eventos nos quais eles estão listados como participantes.
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {rows.map((m) => {
            const id = m.userId!
            const active = selected.has(id)
            return (
              <button
                key={id}
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 text-left last:border-b-0"
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
                  <i className={`${active ? 'ri-eye-line text-sage-dark' : 'ri-eye-off-line'} text-2xl`} />
                  <i className="ri-drag-move-2-line text-2xl opacity-30" />
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-forest hover:bg-sand-light"
            onClick={() => setSelected(new Set(memberIds))}
            disabled={allSelected}
          >
            Mostrar todos
          </button>

          <button
            type="button"
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-forest hover:bg-sand-light"
            onClick={() => setSelected(new Set())}
            disabled={selected.size === 0}
          >
            Limpar
          </button>
        </div>

        <div className="pb-[calc(env(safe-area-inset-bottom)+8px)] pt-4">
          <button
            type="button"
            className="w-full rounded-full bg-forest px-4 py-3 text-base font-semibold text-white hover:bg-forest/95 disabled:opacity-50"
            onClick={() => onSave(Array.from(selected))}
            disabled={!canSave}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function safeInitial(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}

