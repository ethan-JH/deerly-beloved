'use client'

import { useState } from 'react'

// Sunken Win95 field with a terminal prompt and an accent-coloured caret, used
// by both the guest passcode gate and the admin login.
//
// Shown in plain text by default. For guests that is the point: the passcode is
// hand-written on their invitation, so masking hides a string they are copying
// rather than recalling, and there is nothing to shoulder-surf that is not
// already on the card in their hand. Either way the [HIDE] toggle is there.
//
// The autoComplete/autoCapitalize/autoCorrect/spellCheck attributes are load
// bearing, not boilerplate. Mobile Safari and Chrome capitalise the first letter
// of a plain text field by default and exempt masked ones, so unmasking without
// these turns `otterale` into `Otterale` and the login fails.
export function PasscodeField({
  value,
  onChange,
  label,
  placeholder = 'passcode',
  autoFocus = false,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  autoFocus?: boolean
}) {
  const [masked, setMasked] = useState(false)

  return (
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        required
        autoFocus={autoFocus}
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
  )
}
