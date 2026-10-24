import React from 'react'

const GITHUB_URL = 'https://github.com/ethan-JH/deerly-beloved'

// Splits on the little editor-friendly conventions used in copy.ts:
//   *stars*      -> darker emphasised text
//   [itinerary]  -> button that opens the Itinerary window
//   [github]     -> link to the repo
const TOKEN = /(\*[^*]+\*|\[itinerary\]|\[github\])/g

// Prose in copy.ts is wrapped across several indented lines so it's editable
// without horizontal scrolling. Those breaks are formatting, not content, so
// squash every whitespace run back down to a single space.
export function flow(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function renderCopy(text: string, onOpenItinerary?: () => void): React.ReactNode {
  const parts = flow(text).split(TOKEN)
  return parts.map((part, i) => {
    if (!part) return null

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <span key={i} className="text-[var(--color-text)]">
          {part.slice(1, -1)}
        </span>
      )
    }

    if (part === '[itinerary]') {
      return (
        <button
          key={i}
          type="button"
          onClick={onOpenItinerary}
          className="text-[var(--color-primary)] underline underline-offset-2 cursor-pointer"
        >
          itinerary
        </button>
      )
    }

    if (part === '[github]') {
      return (
        <a
          key={i}
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-primary)] underline underline-offset-2"
        >
          github.com/ethan-JH/deerly-beloved
        </a>
      )
    }

    return part
  })
}
