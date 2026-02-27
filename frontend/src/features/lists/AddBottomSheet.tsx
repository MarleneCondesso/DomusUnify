import type { ReactNode, RefObject } from 'react'

export type AddBottomSheetSummary = {
  categoryLabel?: string | null
  assigneeLabel?: string | null
  hasPhoto?: boolean
  hasNote?: boolean
}

type Props = {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  canSubmit: boolean
  isSubmitting?: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  placeholder?: string

  onCategoryPress: () => void
  onAssigneePress: () => void
  onImagePress: () => void
  onNotePress: () => void
  onMorePress: () => void

  summary?: AddBottomSheetSummary
  expandedContent?: ReactNode
}

export function AddBottomSheet({
  value,
  onValueChange,
  onSubmit,
  canSubmit,
  isSubmitting,
  inputRef,
  placeholder = 'Adicionar',
  onCategoryPress,
  onAssigneePress,
  onImagePress,
  onNotePress,
  onMorePress,
  summary,
  expandedContent,
}: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="px-4 pt-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-200" />

          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              className="w-full bg-transparent py-2 text-lg text-charcoal outline-none placeholder:text-gray-400"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (canSubmit && !isSubmitting) onSubmit()
              }}
            />

            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest text-white disabled:opacity-50"
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              title="Adicionar item"
            >
              <i className="ri-arrow-up-line text-xl" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 pb-3 pt-1 text-gray-600">
          <div className="flex items-center gap-1">
            <button
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              type="button"
              title="Categoria"
              onClick={onCategoryPress}
            >
              <i className="ri-price-tag-3-line text-xl" />
            </button>

            <button
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              type="button"
              title="Atribuir"
              onClick={onAssigneePress}
            >
              <i className="ri-user-line text-xl" />
            </button>

            <button
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              type="button"
              title="Imagem"
              onClick={onImagePress}
            >
              <i className="ri-image-line text-xl" />
            </button>

            <button
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              type="button"
              title="Notas"
              onClick={onNotePress}
            >
              <i className="ri-file-text-line text-xl" />
            </button>

            <button
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light"
              type="button"
              title="Mais opções"
              onClick={onMorePress}
            >
              <i className="ri-more-2-fill text-xl" />
            </button>
          </div>

          <div className="flex items-center gap-2 pr-1 text-xs text-gray-500">
            {summary?.categoryLabel && (
              <span className="rounded-full bg-sand-light px-2 py-1">{summary.categoryLabel}</span>
            )}
            {summary?.assigneeLabel && (
              <span className="rounded-full bg-sand-light px-2 py-1">{summary.assigneeLabel}</span>
            )}
            {summary?.hasPhoto && <span className="rounded-full bg-sand-light px-2 py-1">1 foto</span>}
            {summary?.hasNote && <span className="rounded-full bg-sand-light px-2 py-1">Nota</span>}
          </div>
        </div>

        {expandedContent ? (
          <div className="border-t border-gray-200 bg-white px-4 py-3">{expandedContent}</div>
        ) : null}
      </div>
    </div>
  )
}
