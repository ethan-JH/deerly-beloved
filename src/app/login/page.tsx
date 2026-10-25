'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Window } from '@/components/Window'

// Passcodes are hand-written on each invitation, so guests are copying a string
// they can't see. Masking it just makes that harder, and there's nothing to
// shoulder-surf that isn't already printed on the card in their hand. Shown by
// default, with a HIDE toggle for anyone who wants it.
export default function LoginPage() {
  const [passcode, setPasscode] = useState('')
  const [masked, setMasked] = useState(false)
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
              {/* Sunken Win95 field, terminal prompt, accent-coloured caret */}
              <div
                className="flex items-center gap-2 border border-[var(--color-primary)]/60 bg-[var(--color-bg)] px-3 py-2.5 focus-within:border-[var(--color-accent)] transition-colors"
                style={{ boxShadow: 'inset 1px 1px 0 rgba(0,0,0,0.4), inset -1px -1px 0 rgba(250,244,198,0.3)' }}
              >
                <span
                  aria-hidden="true"
                  className="font-[family-name:var(--font-vt323)] text-xl leading-none text-[var(--color-accent)] select-none"
                >
                  &gt;
                </span>
                <input
                  type={masked ? 'password' : 'text'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="passcode"
                  aria-label="Passcode from your invitation"
                  required
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none text-left text-xl tracking-[0.35em] text-[var(--color-text)] caret-[var(--color-accent)] placeholder:text-[var(--color-muted)]/50 placeholder:tracking-widest font-[family-name:var(--font-vt323)]"
                />
                <button
                  type="button"
                  onClick={() => setMasked(m => !m)}
                  aria-pressed={masked}
                  className="shrink-0 font-[family-name:var(--font-vt323)] text-sm tracking-widest leading-none text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors cursor-pointer select-none"
                >
                  [{masked ? 'SHOW' : 'HIDE'}]
                </button>
              </div>
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
