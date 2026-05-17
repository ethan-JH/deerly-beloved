'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Window } from '@/components/Window'

export default function LoginPage() {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Incorrect passcode. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Window title="YOU'RE INVITED">
          <div className="p-8 text-center">
            <p className="text-sm tracking-[0.3em] text-[var(--color-accent)] mb-6">
              Bechan &amp; Ethan &middot; 12 June 2027
            </p>
            <p className="text-lg text-[var(--color-muted)] mb-8">
              Enter the passcode from your invitation to continue.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="_ _ _ _ _ _"
                required
                className="w-full border-2 border-[var(--color-primary)] bg-transparent px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-[var(--color-accent)] transition-colors text-[var(--color-text)] font-[family-name:var(--font-vt323)]"
              />
              {error && (
                <p className="text-lg text-[var(--color-accent)]">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] px-4 py-3 text-xl tracking-widest disabled:opacity-50 transition-opacity cursor-pointer font-[family-name:var(--font-vt323)]"
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
