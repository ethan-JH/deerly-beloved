interface WindowProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function Window({ title, children, className = '' }: WindowProps) {
  return (
    <div
      className="border-2 border-[var(--color-chrome)] bg-[var(--color-chrome)] w-full rounded-lg overflow-hidden"
      style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.15)' }}
    >
      <div className="bg-[var(--color-chrome)] px-3 py-1 flex items-center justify-between select-none">
        <span className="font-[family-name:var(--font-vt323)] text-[var(--color-text)]/60 text-xl leading-none">
          × —
        </span>
        <span className="font-[family-name:var(--font-vt323)] text-[var(--color-text)] text-xl tracking-widest uppercase leading-none">
          {title}
        </span>
      </div>
      <div className="m-2 border border-[var(--color-text)]/20 rounded-md overflow-hidden">
        <div className={`bg-[var(--color-surface)] font-[family-name:var(--font-vt323)] ${className}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
