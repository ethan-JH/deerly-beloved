'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface Position { x: number; y: number }

interface DraggableWindowProps {
  id: string
  title: string
  icon?: string
  children: ReactNode
  initialPosition: Position
  zIndex: number
  onClose: () => void
  onFocus: () => void
  width: number
  noScroll?: boolean
}

export function DraggableWindow({
  title,
  icon,
  children,
  initialPosition,
  zIndex,
  onClose,
  onFocus,
  width,
  noScroll = false,
}: DraggableWindowProps) {
  const [pos, setPos] = useState<Position>(initialPosition)
  const drag = useRef({ isDragging: false, ox: 0, oy: 0 })

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!drag.current.isDragging) return
      setPos({ x: e.clientX - drag.current.ox, y: e.clientY - drag.current.oy })
    }
    function onMouseUp() {
      drag.current.isDragging = false
    }
    function onTouchMove(e: TouchEvent) {
      if (!drag.current.isDragging) return
      e.preventDefault()
      const t = e.touches[0]
      setPos({ x: t.clientX - drag.current.ox, y: t.clientY - drag.current.oy })
    }
    function onTouchEnd() {
      drag.current.isDragging = false
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  function startDrag(e: React.MouseEvent) {
    e.preventDefault()
    onFocus()
    drag.current = { isDragging: true, ox: e.clientX - pos.x, oy: e.clientY - pos.y }
  }

  function startDragTouch(e: React.TouchEvent) {
    onFocus()
    const t = e.touches[0]
    drag.current = { isDragging: true, ox: t.clientX - pos.x, oy: t.clientY - pos.y }
  }

  return (
    <div
      className="desktop-window absolute border-2 border-[var(--color-chrome)] bg-[var(--color-chrome)] grid rounded-lg overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width,
        zIndex,
        maxHeight: `calc(100dvh - ${Math.max(pos.y, 0)}px - 96px)`,
        gridTemplateRows: 'auto minmax(0, 1fr)',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.15)',
      }}
      onMouseDown={onFocus}
      onTouchStart={() => onFocus()}
    >
      <div
        className="bg-[var(--color-chrome)] px-3 py-1 flex items-center justify-between select-none cursor-move shrink-0"
        onMouseDown={startDrag}
        onTouchStart={startDragTouch}
      >
        <button
          className="font-[family-name:var(--font-vt323)] text-[var(--color-text)]/60 text-xl leading-none cursor-pointer hover:text-[var(--color-text)] transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label="Close window"
        >
          ×
        </button>
        <span className="flex items-center gap-1.5">
          {icon && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={icon} alt="" width={18} height={18} className="shrink-0 block" style={{ imageRendering: 'pixelated' }} />
          )}
          <span className="font-[family-name:var(--font-vt323)] text-[var(--color-text)] text-xl tracking-widest uppercase leading-none">
            {title}
          </span>
        </span>
      </div>
      <div className="min-h-0 overflow-hidden m-2 border border-[var(--color-text)]/20 rounded-md">
        <div
          className={`bg-[var(--color-surface)] font-[family-name:var(--font-vt323)] h-full ${
            noScroll ? 'overflow-hidden' : 'window-scroll overflow-y-auto'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
