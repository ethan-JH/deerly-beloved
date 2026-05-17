interface WindowProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function Window({ title, children, className = '' }: WindowProps) {
  return (
    <div
      className="border-2 border-[var(--color-primary)] w-full"
      style={{ boxShadow: '4px 4px 0 var(--color-primary)' }}
    >
      <div className="bg-[var(--color-primary)] px-3 py-2 flex items-center justify-between select-none">
        <span className="font-[family-name:var(--font-vt323)] text-[var(--color-bg)]/60 text-xl leading-none">
          × —
        </span>
        <span className="font-[family-name:var(--font-vt323)] text-[var(--color-bg)] text-xl tracking-widest uppercase leading-none">
          {title}
        </span>
      </div>
      <div className={`bg-[var(--color-surface)] font-[family-name:var(--font-vt323)] ${className}`}>
        {children}
      </div>
    </div>
  )
}
