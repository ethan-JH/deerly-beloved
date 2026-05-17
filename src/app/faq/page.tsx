import { Window } from '@/components/Window'

export default function FaqPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Window title="FAQ">
        <div className="p-8">
          <h1 className="font-[family-name:var(--font-vt323)] text-5xl text-[var(--color-text)] mb-4">
            FAQ
          </h1>
          <p className="font-[family-name:var(--font-vt323)] text-[var(--color-muted)]">
            Frequently asked questions coming soon.
          </p>
        </div>
      </Window>
    </main>
  )
}
