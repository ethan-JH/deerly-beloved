import { cookies } from 'next/headers'
import { Window } from '@/components/Window'
import { AdminLogin } from '@/components/AdminLogin'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || session !== adminPassword) {
    return <AdminLogin />
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
