import type { CalendarViewMode } from './calendarPreferences'
import { useI18n } from '../../i18n/i18n'

type Props = {
  value: CalendarViewMode
  onChange: (value: CalendarViewMode) => void
  onClose: () => void
}

export function CalendarViewMenu({ value, onChange, onClose }: Props) {
  const { t } = useI18n()
  const items: Array<{ id: CalendarViewMode; label: string; icon: string }> = [
    { id: 'agenda', label: t('calendar.viewMode.agenda'), icon: 'ri-list-check-2' },
    { id: 'family', label: t('calendar.viewMode.family'), icon: 'ri-group-line' },
    { id: 'day', label: t('calendar.viewMode.day'), icon: 'ri-calendar-event-line' },
    { id: 'threeDays', label: t('calendar.viewMode.threeDays'), icon: 'ri-calendar-schedule-line' },
    { id: 'week', label: t('calendar.viewMode.week'), icon: 'ri-calendar-2-line' },
    { id: 'month', label: t('calendar.viewMode.month'), icon: 'ri-layout-grid-line' },
  ]

  return (
    <div className="fixed inset-0 z-[75]">
      <button className="absolute inset-0 bg-black/10" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 top-[88px] mx-auto w-full max-w-5xl px-2">
        <div className="overflow-hidden rounded-2xl border border-sand-dark/60 bg-white shadow-2xl">
          {items.map((item) => {
            const active = item.id === value
            return (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 text-left last:border-b-0"
                onClick={() => {
                  onChange(item.id)
                  onClose()
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <i className={`${item.icon} text-xl ${active ? 'text-forest' : 'text-charcoal/55'}`} />
                  <span className={`truncate text-base font-semibold ${active ? 'text-forest' : 'text-charcoal'}`}>
                    {item.label}
                  </span>
                </div>

                {active ? <i className="ri-check-line text-2xl text-forest" /> : <span className="h-7 w-7" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
