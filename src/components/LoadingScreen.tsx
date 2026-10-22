'use client'

import { useState, useEffect, useRef } from 'react'
import { PHOTOS } from '@/lib/photos'

function shuffled(length: number): number[] {
  const a = Array.from({ length }, (_, i) => i)
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const MESSAGES = [
  'Pouring the wine...',
  'Arranging the flowers...',
  'Hanging the disco ball...',
  'Ironing the tablecloths...',
  'Chilling the champagne...',
  'Polishing the dance floor...',
  'Herding the relatives...',
  'Practicing the first dance...',
  'Untangling the fairy lights...',
  'Bribing the DJ...',
  'Finding the ring bearer...',
  'Fluffing the bouquet...',
  'Seating the in-laws...',
  'Locating the corkscrew...',
  'Applying the confetti...',
  'Warming up the band...',
]

// Near-native buffer so the photos stay sharp; the dissolve granularity comes
// from BLOCK rather than from degrading the image itself
const CW = 400
const CH = 300
const BLOCK = 5
const COLS = CW / BLOCK
const ROWS = CH / BLOCK
const TOTAL_BLOCKS = COLS * ROWS

const HOLD_MS = 460
const DISSOLVE_MS = 420
const PRELOAD_COUNT = 10

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, pos: string) {
  const iw = img.naturalWidth, ih = img.naturalHeight
  if (!iw || !ih) return
  const targetAspect = CW / CH
  const imgAspect = iw / ih
  let sx, sy, sw, sh
  if (imgAspect > targetAspect) {
    sh = ih; sw = ih * targetAspect; sy = 0
    sx = pos === 'right' ? iw - sw : pos === 'left' ? 0 : (iw - sw) / 2
  } else {
    sw = iw; sh = iw / targetAspect; sx = 0
    sy = pos === 'top' ? 0 : pos === 'bottom' ? ih - sh : (ih - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CW, CH)
}

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [messageIdx, setMessageIdx] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const completed = useRef(false)

  // Progress bar + rotating messages
  useEffect(() => {
    const msgQueue = shuffled(MESSAGES.length)
    let msgIdx = 0

    // 1% per 40ms = 100% in 4s, then a short beat before the dissolve takes over
    const progressTimer = setInterval(() => {
      setProgress(p => {
        const next = Math.min(100, p + 1)
        if (next >= 100 && !completed.current) {
          completed.current = true
          setTimeout(onComplete, 220)
        }
        return next
      })
    }, 40)

    const msgTimer = setInterval(() => {
      if (msgIdx >= msgQueue.length) msgIdx = 0
      setMessageIdx(msgQueue[msgIdx++])
    }, 700)

    return () => {
      clearInterval(progressTimer)
      clearInterval(msgTimer)
    }
  }, [onComplete])

  // Pixel-dissolve slideshow — only ever advances to images that are already decoded
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const make = () => {
      const c = document.createElement('canvas')
      c.width = CW; c.height = CH
      return { el: c, ctx: c.getContext('2d')! }
    }
    const cur = make()
    const nxt = make()

    // Fill with palette navy so the very first frame is never black
    cur.ctx.fillStyle = '#0D1F3C'
    cur.ctx.fillRect(0, 0, CW, CH)
    ctx.drawImage(cur.el, 0, 0, canvas.width, canvas.height)

    const queue = shuffled(PHOTOS.length)
    let qi = 0
    const ready: { img: HTMLImageElement; pos: string }[] = []
    let cancelled = false

    function preloadOne() {
      if (cancelled) return
      if (qi >= queue.length) qi = 0
      const photo = PHOTOS[queue[qi++]]
      const img = new Image()
      img.onload = () => { if (!cancelled) ready.push({ img, pos: photo.pos }) }
      img.src = photo.src
    }
    for (let i = 0; i < PRELOAD_COUNT; i++) preloadOne()

    let phase: 'hold' | 'dissolve' = 'hold'
    let phaseStart = performance.now()
    let order: number[] = []
    let revealed = 0
    let hasFirst = false
    let raf = 0

    function beginDissolve() {
      const next = ready.shift()
      if (!next) return false
      nxt.ctx.fillStyle = '#0D1F3C'
      nxt.ctx.fillRect(0, 0, CW, CH)
      drawCover(nxt.ctx, next.img, next.pos)
      order = shuffled(TOTAL_BLOCKS)
      revealed = 0
      phase = 'dissolve'
      phaseStart = performance.now()
      preloadOne()
      return true
    }

    function paintBlocks(upTo: number) {
      for (let i = revealed; i < upTo && i < order.length; i++) {
        const b = order[i]
        const bx = (b % COLS) * BLOCK
        const by = Math.floor(b / COLS) * BLOCK
        cur.ctx.drawImage(nxt.el, bx, by, BLOCK, BLOCK, bx, by, BLOCK, BLOCK)
      }
      revealed = Math.min(upTo, order.length)
    }

    function loop(now: number) {
      if (cancelled) return

      if (phase === 'hold') {
        const elapsed = now - phaseStart
        const wait = hasFirst ? HOLD_MS : 0
        if (elapsed >= wait) {
          if (beginDissolve()) hasFirst = true
          else phaseStart = now // nothing decoded yet, keep holding current frame
        }
      }

      if (phase === 'dissolve') {
        const t = Math.min(1, (now - phaseStart) / DISSOLVE_MS)
        paintBlocks(Math.ceil(t * TOTAL_BLOCKS))
        if (t >= 1) {
          phase = 'hold'
          phaseStart = now
        }
      }

      ctx!.imageSmoothingEnabled = false
      ctx!.drawImage(cur.el, 0, 0, canvas!.width, canvas!.height)
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [])

  const pct = Math.floor(progress)
  const blocks = 20
  const filled = Math.floor((pct / 100) * blocks)

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-6"
      style={{
        backgroundColor: 'var(--color-bg)',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect x='0' y='0' width='2' height='2' fill='%230D1F3C' fill-opacity='0.1'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat',
        backgroundSize: '8px 8px',
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg border-2 border-[var(--color-chrome)] bg-[var(--color-chrome)] overflow-hidden"
        style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.15)' }}
      >
        {/* Title bar */}
        <div className="px-3 py-1 flex items-center justify-between">
          <span className="font-[family-name:var(--font-vt323)] text-xl text-[var(--color-text)] tracking-widest uppercase leading-none">
            BECHAN &amp; ETHAN
          </span>
          <span className="font-[family-name:var(--font-vt323)] text-[var(--color-text)]/40 text-xl leading-none">
            12.06.2027
          </span>
        </div>

        {/* Inner panel */}
        <div className="m-2 rounded-md border border-[var(--color-text)]/20 overflow-hidden bg-[var(--color-surface)]">

          {/* Photo viewer */}
          <div className="relative w-full overflow-hidden bg-[#0D1F3C]" style={{ aspectRatio: '4/3' }}>
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              className="w-full h-full block"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)',
                backgroundSize: '100% 3px',
              }}
            />
          </div>

          {/* Loading message + progress */}
          <div className="px-4 py-3 flex flex-col gap-2">
            <span className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-primary)] tracking-widest leading-none">
              {MESSAGES[messageIdx]}
            </span>

            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-vt323)] text-sm text-[var(--color-text)] tracking-widest leading-none shrink-0">
                {String(pct).padStart(3, ' ')}%
              </span>
              <div className="flex gap-px flex-1">
                {Array.from({ length: blocks }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-3"
                    style={{
                      background: i < filled ? 'var(--color-primary)' : 'var(--color-text)',
                      opacity: i < filled ? 1 : 0.12,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 pb-2 flex justify-center">
          <span className="font-[family-name:var(--font-vt323)] text-xs text-[var(--color-text)]/40 tracking-widest">
            DEER PARK COUNTRY HOUSE &middot; DEVON &middot; 2027
          </span>
        </div>
      </div>
    </div>
  )
}
