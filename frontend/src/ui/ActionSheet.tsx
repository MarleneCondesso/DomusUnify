import type { ReactNode } from 'react'

export type ActionSheetItem = {
  id: string
  label: string
  icon?: string
  onPress: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
  right?: ReactNode
}

type Props = {
  title: string
  items: ActionSheetItem[]
  onClose: () => void
}

export function ActionSheet({ title, items, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold text-charcoal">{title}</div>
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose}>
            <i className="ri-close-line text-xl text-gray-600" />
          </button>
        </div>

        <div className="space-y-1">
          {items.map((item) => {
            const toneClass =
              item.tone === 'danger'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-charcoal hover:bg-sand-light'

            return (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
                disabled={item.disabled}
                onClick={item.onPress}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {item.icon ? <i className={`${item.icon} text-xl`} /> : <span className="h-5 w-5" />}
                  <span className="truncate text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-charcoal/70">
                  {item.right}
                  <i className="ri-arrow-right-s-line text-xl text-gray-300" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

