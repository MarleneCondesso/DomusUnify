import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  disabled?: boolean
  threshold?: number
  leftAction?: ReactNode
  rightAction?: ReactNode
  onSwipedRight?: () => void
  onSwipedLeft?: () => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function SwipeableRow({
  children,
  className,
  disabled,
  threshold = 72,
  leftAction,
  rightAction,
  onSwipedRight,
  onSwipedLeft,
}: Props) {
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const pointerIdRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const suppressClickRef = useRef(false)

  const [offsetX, setOffsetX] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!animating) return
    const t = window.setTimeout(() => setAnimating(false), 180)
    return () => window.clearTimeout(t)
  }, [animating])

  const canSwipeRight = Boolean(onSwipedRight)
  const canSwipeLeft = Boolean(onSwipedLeft)

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (disabled) return
    if (pointerIdRef.current !== null) return

    pointerIdRef.current = e.pointerId
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    isDraggingRef.current = false
    suppressClickRef.current = false
    setAnimating(false)
  }

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerIdRef.current !== e.pointerId) return

    const dx = e.clientX - startXRef.current
    const dy = e.clientY - startYRef.current

    if (!isDraggingRef.current) {
      if (Math.abs(dx) < 8) return
      if (Math.abs(dx) <= Math.abs(dy)) return
      isDraggingRef.current = true

      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // best-effort
      }
    }

    suppressClickRef.current = true

    const max = 120
    let next = clamp(dx, -max, max)
    if (next > 0 && !canSwipeRight) next = 0
    if (next < 0 && !canSwipeLeft) next = 0
    setOffsetX(next)
  }

  const settle = () => {
    const dx = offsetX
    const didSwipeRight = dx >= threshold && canSwipeRight
    const didSwipeLeft = dx <= -threshold && canSwipeLeft

    if (didSwipeRight) onSwipedRight?.()
    if (didSwipeLeft) onSwipedLeft?.()

    setAnimating(true)
    setOffsetX(0)
  }

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerIdRef.current !== e.pointerId) return
    pointerIdRef.current = null
    settle()
  }

  const handlePointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (pointerIdRef.current !== e.pointerId) return
    pointerIdRef.current = null
    setAnimating(true)
    setOffsetX(0)
  }

  const handleClickCapture: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
    >
      <div className="absolute inset-0 flex items-center justify-between">
        <div className={`flex h-full items-center pl-4 ${offsetX > 0 ? 'opacity-100' : 'opacity-0'}`}>
          {leftAction}
        </div>
        <div className={`flex h-full items-center pr-4 ${offsetX < 0 ? 'opacity-100' : 'opacity-0'}`}>
          {rightAction}
        </div>
      </div>

      <div
        className={`relative ${animating ? 'transition-transform duration-150 ease-out' : ''}`}
        style={{ transform: `translateX(${offsetX}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
