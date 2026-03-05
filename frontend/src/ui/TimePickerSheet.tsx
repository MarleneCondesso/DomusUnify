import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/i18n'

type Props = {
  title: string
  value: string
  onClose: () => void
  onConfirm: (value: string) => void
  minuteStep?: number
  isBusy?: boolean
  zIndexClass?: string
}

type WheelOption<TValue extends number> = { value: TValue; label: string }

const WHEEL_ITEM_HEIGHT_PX = 44
const WHEEL_HEIGHT_PX = 196

export function TimePickerSheet({
  title,
  value,
  onClose,
  onConfirm,
  minuteStep = 1,
  isBusy,
  zIndexClass,
}: Props) {
  const { t } = useI18n()
  const initial = useMemo(() => {
    const parsed = parseHm(value) ?? { hours: 0, minutes: 0 }
    return {
      hours: clamp(parsed.hours, 0, 23),
      minutes: clamp(roundToStep(parsed.minutes, minuteStep), 0, 59),
    }
  }, [minuteStep, value])

  const [hours, setHours] = useState<number>(initial.hours)
  const [minutes, setMinutes] = useState<number>(initial.minutes)

  useEffect(() => {
    setMinutes((m) => clamp(roundToStep(m, minuteStep), 0, 59))
  }, [minuteStep])

  const hourOptions = useMemo<Array<WheelOption<number>>>(() => {
    return Array.from({ length: 24 }, (_, h) => ({ value: h, label: String(h).padStart(2, '0') }))
  }, [])

  const minuteOptions = useMemo<Array<WheelOption<number>>>(() => {
    const step = clamp(Math.floor(minuteStep), 1, 30)
    const values = new Set<number>()
    for (let m = 0; m <= 59; m += step) values.add(m)

    values.add(clamp(roundToStep(minutes, step), 0, 59))

    return Array.from(values)
      .sort((a, b) => a - b)
      .map((m) => ({ value: m, label: String(m).padStart(2, '0') }))
  }, [minuteStep, minutes])

  const timeLabel = useMemo(() => `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, [hours, minutes])

  const confirm = () => {
    onConfirm(timeLabel)
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
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">{t('timePicker.timeLabel')}</div>
              <div className="text-2xl font-extrabold text-charcoal tabular-nums">{timeLabel}</div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <WheelPicker options={hourOptions} value={hours} onChange={setHours} ariaLabel={t('common.hours')} disabled={isBusy} />
              <div className="text-3xl font-extrabold text-charcoal/60 pb-1">:</div>
              <WheelPicker
                options={minuteOptions}
                value={minutes}
                onChange={(m) => setMinutes(clamp(roundToStep(m, minuteStep), 0, 59))}
                ariaLabel={t('common.minutes')}
                disabled={isBusy}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-full bg-sand-light px-4 py-2 text-sm font-semibold text-sage-dark hover:bg-sand-dark/25 disabled:opacity-50"
                onClick={() => {
                  if (isBusy) return
                  const now = new Date()
                  setHours(now.getHours())
                  setMinutes(clamp(roundToStep(now.getMinutes(), minuteStep), 0, 59))
                }}
                disabled={isBusy}
              >
                {t('common.now')}
              </button>
            </div>
          </div>
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
  const padPx = useMemo(() => Math.max(0, WHEEL_HEIGHT_PX / 2 - WHEEL_ITEM_HEIGHT_PX / 2), [])

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
                'flex h-11 w-full snap-center items-center justify-center rounded-2xl text-3xl tabular-nums',
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

function parseHm(raw: string): { hours: number; minutes: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec((raw ?? '').trim())
  if (!m) return null
  const hours = Number(m[1])
  const minutes = Number(m[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23) return null
  if (minutes < 0 || minutes > 59) return null
  return { hours, minutes }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function roundToStep(value: number, step: number): number {
  const safe = clamp(Math.floor(step), 1, 30)
  return Math.max(0, Math.min(59, Math.round(value / safe) * safe))
}
