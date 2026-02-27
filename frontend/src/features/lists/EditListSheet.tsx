type Props = {
  name: string
  onNameChange: (value: string) => void

  typeLabel: string
  onTypePress: () => void

  colorHex: string
  onColorHexChange: (value: string) => void

  canSave: boolean
  isSaving?: boolean
  onSave: () => void
  onClose: () => void
}

export function EditListSheet({
  name,
  onNameChange,
  typeLabel,
  onTypePress,
  colorHex,
  onColorHexChange,
  canSave,
  isSaving,
  onSave,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 bottom-0 top-0 bg-white sm:inset-x-[10%] sm:bottom-8 sm:top-8 sm:rounded-3xl sm:shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose} title="Fechar">
            <i className="ri-close-line text-2xl text-gray-600" />
          </button>
          <div className="text-base font-semibold text-charcoal">Editar lista</div>
          <button
            type="button"
            className="rounded-full p-2 text-forest hover:bg-sand-light disabled:opacity-40"
            onClick={onSave}
            disabled={!canSave || isSaving}
            title="Guardar"
          >
            <i className="ri-check-line text-2xl" />
          </button>
        </div>

        <div className="px-4 pb-6">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <i className="ri-list-check-2 text-xl text-gray-600" />
              <input
                className="w-full bg-transparent py-2 text-lg text-charcoal outline-none placeholder:text-gray-400"
                placeholder="Nome da lista"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-sand-light"
              onClick={onTypePress}
            >
              <div className="flex items-center gap-3">
                <i className="ri-shapes-line text-xl text-gray-600" />
                <span className="text-sm font-medium text-charcoal">{typeLabel}</span>
              </div>
              <i className="ri-arrow-right-s-line text-xl text-gray-400" />
            </button>

            <div className="flex w-full items-center justify-between border-t border-gray-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <i className="ri-palette-line text-xl text-gray-600" />
                <span className="text-sm font-medium text-charcoal">Cor</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="h-5 w-5 rounded-md border border-gray-200" style={{ backgroundColor: colorHex }} />
                <input
                  aria-label="Cor"
                  type="color"
                  className="h-8 w-10 cursor-pointer bg-transparent"
                  value={colorHex}
                  onChange={(e) => onColorHexChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

