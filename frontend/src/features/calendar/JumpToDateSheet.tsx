import { useEffect, useMemo, useRef, useState } from 'react'
import type { FirstDayOfWeek } from './calendarPreferences'
import { capitalizeFirst, clampDateToMonth, dateKey } from './dateUtils'
import { useI18n } from '../../i18n/i18n'

type Props = {
  initialMonthStart: Date
  initialSelectedDate: Date
  firstDayOfWeek?: FirstDayOfWeek
  onClose: () => void
  onConfirm: (date: Date) => void
}

type PickerMode = 'calendar' | 'wheel'

type WheelOption<TValue extends number> = { value: TValue; label: string }

const WHEEL_ITEM_HEIGHT_PX = 44
const WHEEL_HEIGHT_PX = 196

export function JumpToDateSheet({
  initialMonthStart,
  initialSelectedDate,
  firstDayOfWeek = 'sunday',
  onClose,
  onConfirm,
}: Props) {
  const { t, locale } = useI18n()
  const initialYear = initialMonthStart.getFullYear()
  const initialMonth = initialMonthStart.getMonth()

  const [mode, setMode] = useState<PickerMode>('calendar')
  const [cursor, setCursor] = useState(() => new Date(initialYear, initialMonth, 1))
  const [selectedDate, setSelectedDate] = useState(() => clampDateToMonth(new Date(initialSelectedDate), initialYear, initialMonth))

  const [wheelMonth, setWheelMonth] = useState<number>(initialMonth)
  const [wheelYear, setWheelYear] = useState<number>(initialYear)

  const monthTitle = useMemo(() => {
    return capitalizeFirst(cursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' }))
  }, [cursor, locale])

  const wheelTitle = useMemo(() => {
    return capitalizeFirst(new Date(wheelYear, wheelMonth, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }))
  }, [locale, wheelMonth, wheelYear])

  const headerTitle = mode === 'wheel' ? wheelTitle : monthTitle
  const selectedKey = useMemo(() => dateKey(selectedDate), [selectedDate])
  const weekdayLabels = useMemo(() => {
    let labels: string[]
    try {
      const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
      const base = new Date(2021, 7, 1, 12, 0, 0) // Sunday
      labels = Array.from({ length: 7 }, (_, i) => fmt.format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)))
    } catch {
      labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    }

    if (firstDayOfWeek === 'monday') return [...labels.slice(1), labels[0]!]
    return labels
  }, [firstDayOfWeek, locale])

  const monthOptions = useMemo<Array<WheelOption<number>>>(() => {
    try {
      const fmt = new Intl.DateTimeFormat(locale, { month: 'long' })
      return Array.from({ length: 12 }, (_, idx) => ({ value: idx, label: fmt.format(new Date(2021, idx, 1)) }))
    } catch {
      return Array.from({ length: 12 }, (_, idx) => ({ value: idx, label: String(idx + 1) }))
    }
  }, [locale])

  const yearOptions = useMemo<Array<WheelOption<number>>>(() => {
    const nowYear = new Date().getFullYear()
    const start = nowYear - 25
    const end = nowYear + 25
    const out: Array<WheelOption<number>> = []
    for (let y = start; y <= end; y++) out.push({ value: y, label: String(y) })
    return out
  }, [])

  const monthCells = useMemo(() => {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const firstDow = new Date(y, m, 1).getDay()

    const firstDayIdx = firstDayOfWeek === 'monday' ? 1 : 0
    const blanksCount = (firstDow - firstDayIdx + 7) % 7
    const blanks = Array.from({ length: blanksCount }, () => null as Date | null)
    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(y, m, i + 1))
    return [...blanks, ...days]
  }, [cursor, firstDayOfWeek])

  const setMonthCursor = (year: number, monthIndex0: number) => {
    setCursor(new Date(year, monthIndex0, 1))
    setSelectedDate((prev) => clampDateToMonth(prev, year, monthIndex0))
  }

  const goPrev = () => {
    if (mode === 'wheel') {
      const d = new Date(wheelYear, wheelMonth - 1, 1)
      setWheelYear(d.getFullYear())
      setWheelMonth(d.getMonth())
      return
    }

    const d = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
    setMonthCursor(d.getFullYear(), d.getMonth())
  }

  const goNext = () => {
    if (mode === 'wheel') {
      const d = new Date(wheelYear, wheelMonth + 1, 1)
      setWheelYear(d.getFullYear())
      setWheelMonth(d.getMonth())
      return
    }

    const d = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    setMonthCursor(d.getFullYear(), d.getMonth())
  }

  const toggleMode = () => {
    if (mode === 'calendar') {
      setWheelYear(cursor.getFullYear())
      setWheelMonth(cursor.getMonth())
      setMode('wheel')
      return
    }

    setMonthCursor(wheelYear, wheelMonth)
    setMode('calendar')
  }

  const confirm = () => {
    const y = mode === 'wheel' ? wheelYear : cursor.getFullYear()
    const m = mode === 'wheel' ? wheelMonth : cursor.getMonth()
    onConfirm(clampDateToMonth(selectedDate, y, m))
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="flex min-w-0 items-center gap-1 rounded-2xl px-2 py-1 text-left text-lg font-semibold text-forest hover:bg-sand-light"
            onClick={toggleMode}
            aria-label={t('calendar.jumpToDate.aria')}
          >
            <span className="truncate">{headerTitle}</span>
            <i className={`ri-arrow-${mode === 'calendar' ? 'down' : 'up'}-s-line text-2xl`} />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light text-sage-dark"
              onClick={goPrev}
              aria-label={t('calendar.month.prev')}
            >
              <i className="ri-arrow-left-s-line text-2xl leading-none" />
            </button>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light text-sage-dark"
              onClick={goNext}
              aria-label={t('calendar.month.next')}
            >
              <i className="ri-arrow-right-s-line text-2xl leading-none" />
            </button>
          </div>
        </div>

        {mode === 'calendar' ? (
          <div className="mt-4">
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-charcoal/35">
              {weekdayLabels.map((w) => (
                <div key={w} className="py-2">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 pb-2">
              {monthCells.map((d, idx) => {
                if (!d) return <div key={`blank-${idx}`} />

                const k = dateKey(d)
                const isSelected = k === selectedKey

                return (
                  <button
                    key={k}
                    type="button"
                    className={[
                      'mx-auto grid h-10 w-10 place-items-center rounded-full text-base font-semibold transition',
                      isSelected ? 'bg-sage-light text-forest' : 'text-charcoal hover:bg-sand-light',
                    ].join(' ')}
                    onClick={() => setSelectedDate(d)}
                    aria-label={t('calendar.day.aria', { day: d.getDate() })}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-6 px-2 pb-2">
            <WheelPicker options={monthOptions} value={wheelMonth} onChange={setWheelMonth} ariaLabel={t('calendar.month.label')} />
            <WheelPicker options={yearOptions} value={wheelYear} onChange={setWheelYear} ariaLabel={t('calendar.year.label')} />
          </div>
        )}

        <div className="pb-[calc(env(safe-area-inset-bottom)+8px)] pt-3">
          <button
            type="button"
            className="w-full rounded-full bg-forest px-4 py-3 text-base font-semibold text-white hover:bg-forest/95"
            onClick={confirm}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

type WheelPickerProps<TValue extends number> = {
  options: Array<WheelOption<TValue>>
  value: TValue
  onChange: (value: TValue) => void
  ariaLabel: string
}

function WheelPicker<TValue extends number>({ options, value, onChange, ariaLabel }: WheelPickerProps<TValue>) {
  const ref = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const valueIndex = useMemo(() => Math.max(0, options.findIndex((o) => o.value === value)), [options, value])
  const padPx = Math.max(0, WHEEL_HEIGHT_PX / 2 - WHEEL_ITEM_HEIGHT_PX / 2)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const desiredTop = valueIndex * WHEEL_ITEM_HEIGHT_PX
    if (Math.abs(el.scrollTop - desiredTop) > WHEEL_ITEM_HEIGHT_PX / 2) {
      el.scrollTo({ top: desiredTop })
    }
  }, [valueIndex])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const onScroll = () => {
    const el = ref.current
    if (!el) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const idx = Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT_PX)
      const opt = options[Math.max(0, Math.min(options.length - 1, idx))]
      if (opt && opt.value !== value) onChange(opt.value)
    })
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-linear-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent" />

      <div
        ref={ref}
        className="h-49 overflow-y-auto px-2 snap-y snap-mandatory"
        style={{ paddingTop: padPx, paddingBottom: padPx }}
        onScroll={onScroll}
        role="listbox"
        aria-label={ariaLabel}
      >
        {options.map((opt) => {
          const isSelected = opt.value === value
          return (
            <button
              key={String(opt.value)}
              type="button"
              className={[
                'flex h-11 w-full snap-center items-center justify-center rounded-2xl text-2xl',
                isSelected ? 'font-semibold text-charcoal' : 'text-charcoal/40',
              ].join(' ')}
              onClick={() => onChange(opt.value)}
              aria-selected={isSelected}
              role="option"
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
