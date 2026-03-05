import type { ListResponse } from '../../api/domusApi'
import { useI18n } from '../../i18n/i18n'

type Props = {
  lists: ListResponse[]
  onClose: () => void
  onSelectList: (listId: string) => void
  onCreateList?: () => void
}

export function AddItemButtonSheet({ lists, onClose, onSelectList, onCreateList }: Props) {
  const { t } = useI18n()
  const availableLists = lists.filter((l) => Boolean(l.id))

  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="bg-amber px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15"
              onClick={onClose}
              aria-label={t('common.cancel')}
              title={t('common.cancel')}
            >
              <i className="ri-close-line text-2xl leading-none" />
            </button>

            <div className="text-base font-semibold">{t('lists.addItemSheet.title')}</div>

            {onCreateList ? (
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15"
                onClick={onCreateList}
                aria-label={t('lists.addItemSheet.createList')}
                title={t('lists.addItemSheet.createList')}
              >
                <i className="ri-add-line text-2xl leading-none" />
              </button>
            ) : (
              <div className="h-10 w-10" />
            )}
          </div>
        </div>

        <div className="max-h-[calc(92vh-56px)] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
          {availableLists.length > 0 ? (
            <div className="space-y-2">
              {availableLists.map((l) => {
                const listId = l.id
                if (!listId) return null

                const name = (l.name ?? '').trim() || t('lists.untitled')
                const cover = l.coverImageUrl ?? null
                const itemsCount = l.itemsCount ?? 0

                return (
                  <button
                    key={listId}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left hover:bg-sand-light"
                    onClick={() => onSelectList(listId)}
                  >
                    {cover ? (
                      <img src={cover} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand-light text-forest font-semibold">
                        {safeInitial(name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-charcoal">{name}</div>
                      <div className="text-xs text-gray-500">{t('lists.itemsCount', { count: itemsCount })}</div>
                    </div>

                    <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-charcoal/70">
              {t('lists.empty')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function safeInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}
