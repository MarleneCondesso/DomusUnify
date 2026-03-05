import { useI18n } from '../../i18n/i18n'

type Props = {
  title?: string
  isCompleted: boolean
  name: string
  onNameChange: (value: string) => void

  canSave: boolean
  isSaving?: boolean
  onSave: () => void
  onClose: () => void

  categoryLabel?: string | null
  onCategoryPress: () => void

  assigneeLabel?: string | null
  onAssigneePress: () => void

  hasPhoto?: boolean
  onPhotoPress: () => void
  photoPreviewUrl?: string | null

  note: string
  isNoteOpen: boolean
  onNotePress: () => void
  onNoteChange: (value: string) => void
}

export function ItemDetails({
  title,
  isCompleted,
  name,
  onNameChange,
  canSave,
  isSaving,
  onSave,
  onClose,
  categoryLabel,
  onCategoryPress,
  assigneeLabel,
  onAssigneePress,
  hasPhoto,
  onPhotoPress,
  photoPreviewUrl,
  note,
  isNoteOpen,
  onNotePress,
  onNoteChange,
}: Props) {
  const { t } = useI18n()
  const resolvedTitle = title ?? t('lists.itemDetails.addTitle')

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 top-0 bg-white sm:inset-x-[10%] sm:bottom-8 sm:top-8 sm:rounded-3xl sm:shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" className="rounded-full p-2 hover:bg-sand-light" onClick={onClose} title={t('common.close')}>
            <i className="ri-close-line text-2xl text-gray-600" />
          </button>
          <div className="text-base font-semibold text-charcoal">{resolvedTitle}</div>
          <button
            type="button"
            className="rounded-full p-2 text-forest hover:bg-sand-light disabled:opacity-40"
            onClick={onSave}
            disabled={!canSave || isSaving}
            title={t('common.save')}
          >
            <i className="ri-check-line text-2xl" />
          </button>
        </div>

        <div className="px-4 pb-6">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-all ${isCompleted ? 'border-amber bg-amber text-white' : 'border-gray-300 text-forest hover:border-amber'
                }`}
              >
                {isCompleted ? (
                  <i className="ri-check-line text-lg" />
                ) : null}
              </span>
              <input
                className="w-full bg-transparent py-2 text-lg text-charcoal outline-none placeholder:text-gray-400"
                placeholder={t('lists.itemDetails.namePlaceholder')}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-sand-light"
              onClick={onCategoryPress}
            >
              <div className="flex items-center gap-3">
                <i className="ri-price-tag-3-line text-xl text-gray-600" />
                <span className="text-sm font-medium text-charcoal">{categoryLabel ?? t('common.uncategorized')}</span>
              </div>
              <i className="ri-arrow-right-s-line text-xl text-gray-400" />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between border-t border-gray-200 px-4 py-3 text-left hover:bg-sand-light"
              onClick={onAssigneePress}
            >
              <div className="flex items-center gap-3">
                <i className="ri-user-line text-xl text-gray-600" />
                <span className="text-sm font-medium text-charcoal">{assigneeLabel ?? t('common.assignTo')}</span>
              </div>
              <i className="ri-arrow-right-s-line text-xl text-gray-400" />
            </button>

            <div className="flex w-full items-center justify-between border-t border-gray-200 px-4 py-3 text-left text-gray-400">
              <div className="flex items-center gap-3">
                <i className="ri-time-line text-xl" />
                <span className="text-sm font-medium">{t('lists.itemDetails.setDateReminderSoon')}</span>
              </div>
            </div>

            <div className="flex w-full items-center justify-between border-t border-gray-200 px-4 py-3 text-left text-gray-400">
              <div className="flex items-center gap-3">
                <i className="ri-repeat-2-line text-xl" />
                <span className="text-sm font-medium">{t('lists.itemDetails.repeatSoon')}</span>
              </div>
            </div>

            <div className="flex w-full items-center justify-between border-t border-gray-200 px-4 py-3 text-left text-gray-400">
              <div className="flex items-center gap-3">
                <i className="ri-shopping-cart-2-line text-xl" />
                <span className="text-sm font-medium">{t('lists.itemDetails.currentList')}</span>
              </div>
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-between border-t border-gray-200 px-4 py-3 text-left hover:bg-sand-light"
              onClick={onPhotoPress}
            >
              <div className="flex items-center gap-3">
                <i className="ri-image-line text-xl text-gray-600" />
                <span className="text-sm font-medium text-charcoal">{hasPhoto ? t('lists.itemDetails.photo.added') : t('lists.itemDetails.photo.add')}</span>
              </div>
              <i className="ri-arrow-right-s-line text-xl text-gray-400" />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between border-t border-gray-200 px-4 py-3 text-left hover:bg-sand-light"
              onClick={onNotePress}
            >
              <div className="flex items-center gap-3">
                <i className="ri-file-text-line text-xl text-gray-600" />
                <span className="text-sm font-medium text-charcoal">{note.trim() ? t('lists.itemDetails.note.added') : t('lists.itemDetails.note.add')}</span>
              </div>
              <i className="ri-arrow-right-s-line text-xl text-gray-400" />
            </button>
          </div>

          {photoPreviewUrl ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
              <img alt={t('common.preview')} className="h-40 w-full object-cover" src={photoPreviewUrl} />
            </div>
          ) : null}

          {isNoteOpen ? (
            <div className="mt-4">
              <div className="mb-2 text-xs font-medium text-charcoal/70">{t('common.note')}</div>
              <textarea
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white/60 px-3 py-2 text-sm text-charcoal outline-none focus:ring-2 focus:ring-forest"
                rows={4}
                placeholder={t('lists.itemDetails.note.placeholder')}
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
