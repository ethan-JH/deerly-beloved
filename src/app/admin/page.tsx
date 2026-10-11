import { cookies } from 'next/headers'
import { Window } from '@/components/Window'
import { AdminLogin } from '@/components/AdminLogin'
import { AdminDashboard } from '@/components/AdminDashboard'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword || session !== adminPassword) {
    return <AdminLogin />
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Window title="ADMIN — GUEST MANAGEMENT">
        <AdminDashboard />
      </Window>
    </main>
  )
}
