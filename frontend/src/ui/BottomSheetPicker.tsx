export type BottomSheetOption = {
  id: string
  label: string
  description?: string
}

type Props = {
  title: string
  options: BottomSheetOption[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onClose: () => void
  clearLabel?: string
  isLoading?: boolean
  zIndexClass?: string
}

export function BottomSheetPicker({
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  clearLabel,
  isLoading,
  zIndexClass,
}: Props) {
  const zIndex = zIndexClass ?? 'z-[60]'

  return (
    <div className={`fixed inset-0 ${zIndex}`}>
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold text-charcoal">{title}</div>
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose}>
            <i className="ri-close-line text-xl text-gray-600" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-charcoal/70">
            <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-forest" />
            A carregar...
          </div>
        ) : (
          <div className="space-y-2">
            {clearLabel ? (
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                  selectedId === null ? 'border-forest bg-forest/5' : 'border-gray-200 hover:bg-sand-light'
                }`}
                onClick={() => {
                  onSelect(null)
                  onClose()
                }}
              >
                <span className="text-sm font-medium text-charcoal">{clearLabel}</span>
                {selectedId === null ? <i className="ri-check-line text-xl text-forest" /> : null}
              </button>
            ) : null}

            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                  opt.id === selectedId ? 'border-forest bg-forest/5' : 'border-gray-200 hover:bg-sand-light'
                }`}
                onClick={() => {
                  onSelect(opt.id)
                  onClose()
                }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-charcoal">{opt.label}</div>
                  {opt.description ? <div className="truncate text-xs text-charcoal/60">{opt.description}</div> : null}
                </div>
                {opt.id === selectedId ? <i className="ri-check-line text-xl text-forest" /> : null}
              </button>
            ))}

            {!clearLabel && options.length === 0 ? (
              <div className="py-6 text-center text-sm text-charcoal/70">Sem opções.</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
