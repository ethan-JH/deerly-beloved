'use client'

import { useRef } from 'react'

interface TaskbarItem {
  id: string
  label: string
  icon: string
  isOpen: boolean
}

interface TaskbarProps {
  items: TaskbarItem[]
  onToggle: (id: string) => void
}

// Bevel shadows use palette colours: golden highlight (#FAF4C6), Win95-blue shadow (#1760B0)
const RAISED   = 'inset -2px -2px 0 rgba(23,96,176,0.45), inset 2px 2px 0 rgb(250,244,198)'
const PRESSED  = 'inset 2px 2px 0 rgba(23,96,176,0.45), inset -2px -2px 0 rgb(250,244,198)'

const ARROW_BTN = {
  background: 'var(--color-surface)',
  boxShadow: RAISED,
} as const

export function Taskbar({ items, onToggle }: TaskbarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: number) {
    scrollRef.current?.scrollBy({ left: dir * 216, behavior: 'smooth' })
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 z-[9999] border-t-2 border-[var(--color-primary)] bg-[var(--color-bg)] flex items-center px-3 py-2 gap-1">

      {/* ◀ — mobile only */}
      <button
        onClick={() => scroll(-1)}
        className="md:hidden shrink-0 w-8 h-full flex items-center justify-center cursor-pointer select-none font-[family-name:var(--font-vt323)] text-[var(--color-text)]"
        style={ARROW_BTN}
        aria-label="Scroll taskbar left"
      >
        ◀
      </button>

      {/* Inner recessed panel
          mobile: flex-1 fills space between arrows
          desktop: flex-none + mx-auto → auto-width, horizontally centred */}
      <div
        className="flex-1 md:flex-none md:mx-auto h-full overflow-hidden"
      >
        <div
          ref={scrollRef}
          className="taskbar-items h-full flex items-center gap-1 overflow-x-auto snap-x snap-mandatory px-1 pb-[8px]"
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="flex flex-col items-center justify-center gap-1 px-3 py-1 min-w-[72px] h-full cursor-pointer select-none shrink-0 snap-start snap-always"
              style={{
                background: item.isOpen ? 'rgba(23,96,176,0.08)' : 'var(--color-surface)',
                boxShadow: item.isOpen ? PRESSED : RAISED,
              }}
            >
              <img
                src={item.icon}
                alt={item.label}
                width={32}
                height={32}
                className={`object-contain ${item.isOpen ? 'translate-x-px translate-y-px' : ''}`}
              />
              <span
                className={`font-[family-name:var(--font-vt323)] text-xs tracking-widest leading-none ${
                  item.isOpen
                    ? 'translate-x-px translate-y-px text-[var(--color-accent)]'
                    : 'text-[var(--color-text)]'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ▶ — mobile only */}
      <button
        onClick={() => scroll(1)}
        className="md:hidden shrink-0 w-8 h-full flex items-center justify-center cursor-pointer select-none font-[family-name:var(--font-vt323)] text-[var(--color-text)]"
        style={ARROW_BTN}
        aria-label="Scroll taskbar right"
      >
        ▶
      </button>
    </div>
  )
}
