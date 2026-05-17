'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface Position { x: number; y: number }

interface DraggableWindowProps {
  id: string
  title: string
  children: ReactNode
  initialPosition: Position
  zIndex: number
  onClose: () => void
  onFocus: () => void
  width: number
}

export function DraggableWindow({
  title,
  children,
  initialPosition,
  zIndex,
  onClose,
  onFocus,
  width,
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
      className="desktop-window absolute border-2 border-[var(--color-primary)] flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width,
        zIndex,
        boxShadow: '4px 4px 0 var(--color-primary)',
      }}
      onMouseDown={onFocus}
      onTouchStart={() => onFocus()}
    >
      <div
        className="bg-[var(--color-primary)] px-3 py-2 flex items-center justify-between select-none cursor-move shrink-0"
        onMouseDown={startDrag}
        onTouchStart={startDragTouch}
      >
        <button
          className="font-[family-name:var(--font-vt323)] text-[var(--color-bg)]/60 text-xl leading-none cursor-pointer hover:text-[var(--color-bg)] transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label="Close window"
        >
          ×
        </button>
        <span className="font-[family-name:var(--font-vt323)] text-[var(--color-bg)] text-xl tracking-widest uppercase leading-none">
          {title}
        </span>
      </div>
      <div className="bg-[var(--color-surface)] font-[family-name:var(--font-vt323)] flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
