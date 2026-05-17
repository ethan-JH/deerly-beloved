'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Window } from '@/components/Window'

export function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Window title="ADMIN ACCESS">
          <div className="p-8 text-center">
            <p className="font-[family-name:var(--font-vt323)] text-lg tracking-widest text-[var(--color-muted)] mb-8">
              Enter admin password to continue.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="_ _ _ _ _ _"
                required
                className="w-full border-2 border-[var(--color-primary)] bg-transparent px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-[var(--color-accent)] transition-colors text-[var(--color-text)] font-[family-name:var(--font-vt323)]"
              />
              {error && (
                <p className="font-[family-name:var(--font-vt323)] text-lg text-[var(--color-accent)]">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-3 text-xl tracking-widest disabled:opacity-50 cursor-pointer font-[family-name:var(--font-vt323)]"
                style={{ boxShadow: '3px 3px 0 var(--color-accent)' }}
              >
                {loading ? 'Checking…' : 'Enter'}
              </button>
            </form>
          </div>
        </Window>
      </div>
    </main>
  )
}
