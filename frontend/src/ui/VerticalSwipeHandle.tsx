import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/i18n'

type Props = {
  className?: string
  disabled?: boolean
  threshold?: number
  onSwipedUp?: () => void
  onSwipedDown?: () => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function VerticalSwipeHandle({
  className,
  disabled,
  threshold = 44,
  onSwipedUp,
  onSwipedDown,
}: Props) {
  const { t } = useI18n()
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const pointerIdRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const suppressClickRef = useRef(false)

  const [offsetY, setOffsetY] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!animating) return
    const t = window.setTimeout(() => setAnimating(false), 180)
    return () => window.clearTimeout(t)
  }, [animating])

  const canSwipeUp = Boolean(onSwipedUp)
  const canSwipeDown = Boolean(onSwipedDown)

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return
    if (pointerIdRef.current !== null) return

    e.stopPropagation()

    pointerIdRef.current = e.pointerId
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    isDraggingRef.current = false
    suppressClickRef.current = false
    setAnimating(false)
  }

  const handlePointerMove: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (pointerIdRef.current !== e.pointerId) return

    const dx = e.clientX - startXRef.current
    const dy = e.clientY - startYRef.current

    if (!isDraggingRef.current) {
      if (Math.abs(dy) < 8) return
      if (Math.abs(dy) <= Math.abs(dx)) return
      isDraggingRef.current = true

      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // best-effort
      }
    }

    suppressClickRef.current = true

    const max = 56
    let next = clamp(dy, -max, max)
    if (next < 0 && !canSwipeUp) next = 0
    if (next > 0 && !canSwipeDown) next = 0
    setOffsetY(next)
  }

  const settle = () => {
    const dy = offsetY
    const didSwipeUp = dy <= -threshold && canSwipeUp
    const didSwipeDown = dy >= threshold && canSwipeDown

    if (didSwipeUp) onSwipedUp?.()
    if (didSwipeDown) onSwipedDown?.()

    setAnimating(true)
    setOffsetY(0)
  }

  const handlePointerUp: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (pointerIdRef.current !== e.pointerId) return
    pointerIdRef.current = null
    settle()
  }

  const handlePointerCancel: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (pointerIdRef.current !== e.pointerId) return
    pointerIdRef.current = null
    setAnimating(true)
    setOffsetY(0)
  }

  const handleClickCapture: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={t('common.changeCategory')}
      title={t('common.changeCategory.hint')}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      style={{ touchAction: 'pan-x' }}
    >
      <div
        className={`grid h-8 w-8 place-items-center rounded-full bg-sand-light text-charcoal/70 ${
          animating ? 'transition-transform duration-150 ease-out' : ''
        }`}
        style={{ transform: `translateY(${offsetY}px)` }}
      >
        <i className="ri-arrow-up-down-line text-lg leading-none" aria-hidden="true" />
      </div>
    </button>
  )
}
