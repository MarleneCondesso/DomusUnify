import type { CalendarViewMode } from './calendarPreferences'

type Props = {
  value: CalendarViewMode
  onChange: (value: CalendarViewMode) => void
  onClose: () => void
}

const ITEMS: Array<{ id: CalendarViewMode; label: string; icon: string }> = [
  { id: 'agenda', label: 'Diário', icon: 'ri-list-check-2' },
  { id: 'family', label: 'Visão da Família', icon: 'ri-group-line' },
  { id: 'day', label: 'Dia', icon: 'ri-calendar-event-line' },
  { id: 'threeDays', label: '3 Dias', icon: 'ri-calendar-schedule-line' },
  { id: 'week', label: 'Semana', icon: 'ri-calendar-2-line' },
  { id: 'month', label: 'Mês', icon: 'ri-layout-grid-line' },
]

export function CalendarViewMenu({ value, onChange, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[75]">
      <button className="absolute inset-0 bg-black/10" type="button" onClick={onClose} aria-label="Fechar" />

      <div className="absolute inset-x-0 top-[88px] mx-auto w-full max-w-5xl px-2">
        <div className="overflow-hidden rounded-2xl border border-sand-dark/60 bg-white shadow-2xl">
          {ITEMS.map((item) => {
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

