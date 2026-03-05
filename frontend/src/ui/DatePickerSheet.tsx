import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/i18n'
import { capitalizeFirst, formatMonthYear } from '../utils/intl'

type FirstDayOfWeek = 'sunday' | 'monday'

type Props = {
  title: string
  value: string | null
  onClose: () => void
  onConfirm: (value: string | null) => void
  firstDayOfWeek?: FirstDayOfWeek
  min?: string | null
  max?: string | null
  isBusy?: boolean
  zIndexClass?: string
}

type PickerMode = 'calendar' | 'wheel'
type WheelOption<TValue extends number> = { value: TValue; label: string }

const WHEEL_ITEM_HEIGHT_PX = 44
const WHEEL_HEIGHT_PX = 196

export function DatePickerSheet({
  title,
  value,
  onClose,
  onConfirm,
  firstDayOfWeek = 'sunday',
  min,
  max,
  isBusy,
  zIndexClass,
}: Props) {
  const { t, locale } = useI18n()
  const now = useMemo(() => new Date(), [])
  const initialSelected = useMemo(() => parseIsoDate(value) ?? now, [now, value])

  const initialYear = initialSelected.getFullYear()
  const initialMonth = initialSelected.getMonth()

  const [mode, setMode] = useState<PickerMode>('calendar')
  const [cursor, setCursor] = useState(() => new Date(initialYear, initialMonth, 1))
  const [selectedDate, setSelectedDate] = useState(() => new Date(initialSelected))

  const [wheelMonth, setWheelMonth] = useState<number>(initialMonth)
  const [wheelYear, setWheelYear] = useState<number>(initialYear)

  const monthStart = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1), [cursor])
  const monthEnd = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0), [cursor])

  const gridStart = useMemo(() => startOfWeek(monthStart, firstDayOfWeek), [firstDayOfWeek, monthStart])
  const gridEnd = useMemo(() => endOfWeek(monthEnd, firstDayOfWeek), [firstDayOfWeek, monthEnd])

  const minDate = useMemo(() => parseIsoDate(min ?? null), [min])
  const maxDate = useMemo(() => parseIsoDate(max ?? null), [max])

  const monthTitle = useMemo(() => {
    return capitalizeFirst(formatMonthYear(monthStart, locale))
  }, [locale, monthStart])

  const wheelTitle = useMemo(() => {
    return capitalizeFirst(formatMonthYear(new Date(wheelYear, wheelMonth, 1), locale))
  }, [locale, wheelMonth, wheelYear])

  const headerTitle = mode === 'wheel' ? wheelTitle : monthTitle

  const weekdayLabels = useMemo(() => {
    const labels = (() => {
      try {
        const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
        return Array.from({ length: 7 }, (_, idx) => fmt.format(new Date(2024, 0, 7 + idx, 12, 0, 0, 0)))
      } catch {
        return ['S', 'M', 'T', 'W', 'T', 'F', 'S']
      }
    })()

    if (firstDayOfWeek === 'monday') return [...labels.slice(1), labels[0]]
    return labels
  }, [firstDayOfWeek, locale])

  const todayKey = useMemo(() => dateKey(new Date()), [])
  const selectedKey = useMemo(() => dateKey(selectedDate), [selectedDate])

  const days = useMemo(() => {
    const out: Date[] = []
    const d = new Date(gridStart)
    d.setHours(0, 0, 0, 0)

    const end = new Date(gridEnd)
    end.setHours(0, 0, 0, 0)

    while (d.getTime() <= end.getTime()) {
      out.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }

    return out
  }, [gridEnd, gridStart])

  const weeks = useMemo(() => chunkIntoWeeks(days, 7), [days])

  const monthOptions = useMemo<Array<WheelOption<number>>>(() => {
    try {
      const fmt = new Intl.DateTimeFormat(locale, { month: 'long' })
      return Array.from({ length: 12 }, (_, idx) => ({
        value: idx,
        label: fmt.format(new Date(2024, idx, 1, 12, 0, 0, 0)),
      }))
    } catch {
      return Array.from({ length: 12 }, (_, idx) => ({ value: idx, label: String(idx + 1) }))
    }
  }, [locale])

  const yearOptions = useMemo<Array<WheelOption<number>>>(() => {
    const nowYear = new Date().getFullYear()
    const start = nowYear - 120
    const end = nowYear + 20
    const out: Array<WheelOption<number>> = []
    for (let y = start; y <= end; y++) out.push({ value: y, label: String(y) })
    return out
  }, [])

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

  const canUseDate = (d: Date) => {
    const t = d.getTime()
    if (minDate && t < minDate.getTime()) return false
    if (maxDate && t > maxDate.getTime()) return false
    return true
  }

  const confirm = () => {
    const y = mode === 'wheel' ? wheelYear : cursor.getFullYear()
    const m = mode === 'wheel' ? wheelMonth : cursor.getMonth()
    const clamped = clampDateToMonth(selectedDate, y, m)
    onConfirm(dateKey(clamped))
  }

  const zIndex = zIndexClass ?? 'z-[110]'

  return (
    <div className={`fixed inset-0 ${zIndex}`}>
      <button className="absolute inset-0 bg-black/40" type="button" onClick={onClose} aria-label={t('common.close')} />

      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-3xl flex-col max-h-[92vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="p-4 pb-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />

          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={onClose}
              disabled={isBusy}
              aria-label={t('common.cancel')}
              title={t('common.cancel')}
            >
              <i className="ri-close-line text-2xl leading-none text-sage-dark" aria-hidden="true" />
            </button>

            <div className="text-base font-semibold text-forest">{title}</div>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light disabled:opacity-50"
              onClick={confirm}
              disabled={isBusy}
              aria-label={t('common.confirm')}
              title={t('common.confirm')}
            >
              <i className={isBusy ? 'ri-loader-4-line animate-spin text-2xl text-sage-dark' : 'ri-check-line text-2xl text-sage-dark'} aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pb-2">
            <button
              type="button"
              className="flex min-w-0 items-center gap-1 rounded-2xl px-2 py-1 text-left text-lg font-semibold text-forest hover:bg-sand-light disabled:opacity-50"
              onClick={toggleMode}
              disabled={isBusy}
              aria-label={t('datePicker.selectMonthYear')}
            >
              <span className="truncate">{headerTitle}</span>
              <i className={`ri-arrow-${mode === 'calendar' ? 'down' : 'up'}-s-line text-2xl`} aria-hidden="true" />
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light text-sage-dark disabled:opacity-50"
                onClick={goPrev}
                disabled={isBusy}
                aria-label={t('datePicker.previousMonth')}
              >
                <i className="ri-arrow-left-s-line text-2xl leading-none" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand-light text-sage-dark disabled:opacity-50"
                onClick={goNext}
                disabled={isBusy}
                aria-label={t('datePicker.nextMonth')}
              >
                <i className="ri-arrow-right-s-line text-2xl leading-none" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2">
          {mode === 'calendar' ? (
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-3">
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-charcoal/50">
                {weekdayLabels.map((w) => (
                  <div key={w} className="py-2">
                    {w}
                  </div>
                ))}
              </div>

              <div className="space-y-2 pb-2">
                {weeks.map((week, idx) => (
                  <div key={`week-${idx}`} className="grid grid-cols-7 gap-2">
                    {week.map((day) => {
                      const k = dateKey(day)
                      const inMonth = day.getMonth() === monthStart.getMonth() && day.getFullYear() === monthStart.getFullYear()
                      const isSelected = k === selectedKey
                      const isToday = k === todayKey
                      const disabled = isBusy || !canUseDate(day)

                      return (
                        <button
                          key={k}
                          type="button"
                          className={[
                            'h-11 w-11 rounded-2xl border transition',
                            inMonth ? 'border-gray-200 bg-white' : 'border-sand-dark/40 bg-sand-light/60',
                            isSelected ? 'bg-sage-light/35' : '',
                            disabled ? 'opacity-40' : 'hover:bg-sand-light',
                          ].join(' ')}
                          onClick={() => {
                            if (disabled) return
                            setSelectedDate(day)
                            if (day.getFullYear() !== cursor.getFullYear() || day.getMonth() !== cursor.getMonth()) {
                              setCursor(new Date(day.getFullYear(), day.getMonth(), 1))
                            }
                          }}
                          disabled={disabled}
                          aria-label={t('datePicker.dayLabel', { day: day.getDate() })}
                        >
                          <span
                            className={[
                              'mx-auto grid h-11 w-11 place-items-center rounded-2xl px-1 text-xs font-semibold leading-none',
                              inMonth ? 'text-charcoal/80' : 'text-charcoal/40',
                              isToday ? 'bg-forest text-white' : '',
                              isSelected && !isToday ? 'bg-sage-dark text-white' : '',
                            ].join(' ')}
                          >
                            {day.getDate()}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-6 px-2 pb-2">
              <WheelPicker
                options={monthOptions}
                value={wheelMonth}
                onChange={setWheelMonth}
                ariaLabel={t('common.month')}
                disabled={isBusy}
              />
              <WheelPicker options={yearOptions} value={wheelYear} onChange={setWheelYear} ariaLabel={t('common.year')} disabled={isBusy} />
            </div>
          )}
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
  disabled?: boolean
}

function WheelPicker<TValue extends number>({ options, value, onChange, ariaLabel, disabled }: WheelPickerProps<TValue>) {
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
    if (!el || disabled) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const idx = Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT_PX)
      const opt = options[Math.max(0, Math.min(options.length - 1, idx))]
      if (opt && opt.value !== value) onChange(opt.value)
    })
  }

  return (
    <div className={`relative ${disabled ? 'opacity-60' : ''}`}>
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
              onClick={() => {
                if (disabled) return
                onChange(opt.value)
              }}
              aria-selected={isSelected}
              role="option"
              disabled={disabled}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function parseIsoDate(iso: string | null | undefined): Date | null {
  const raw = (iso ?? '').trim()
  if (!raw) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (!m) return null

  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null

  const out = new Date(y, mo, d)
  out.setHours(0, 0, 0, 0)
  return Number.isNaN(out.getTime()) ? null : out
}

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(d: Date, firstDayOfWeek: FirstDayOfWeek = 'sunday'): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)

  const firstDayIdx = firstDayOfWeek === 'monday' ? 1 : 0
  const dow = out.getDay()
  const diff = (dow - firstDayIdx + 7) % 7
  out.setDate(out.getDate() - diff)
  return out
}

function endOfWeek(d: Date, firstDayOfWeek: FirstDayOfWeek = 'sunday'): Date {
  const start = startOfWeek(d, firstDayOfWeek)
  const out = new Date(start)
  out.setDate(out.getDate() + 6)
  return out
}

function clampDateToMonth(date: Date, year: number, monthIndex0: number): Date {
  const day = Math.max(1, date.getDate())
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate()
  const clampedDay = Math.min(day, lastDay)
  return new Date(year, monthIndex0, clampedDay)
}

function chunkIntoWeeks<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}
