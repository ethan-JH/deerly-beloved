import { redirect } from 'next/navigation'
import { Window } from '@/components/Window'

interface SearchParams {
  password?: string
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || params.password !== adminPassword) {
    redirect('/')
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <Window title="ADMIN — RSVP DASHBOARD">
        <div className="p-8">
          <h1 className="font-[family-name:var(--font-vt323)] text-5xl text-[var(--color-text)] mb-4">
            Admin
          </h1>
          <p className="font-[family-name:var(--font-vt323)] text-[var(--color-muted)]">
            RSVP dashboard coming soon.
          </p>
        </div>
      </Window>
    </main>
  )
}
