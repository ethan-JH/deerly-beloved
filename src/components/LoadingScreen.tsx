'use client'

import { useState, useEffect, useRef } from 'react'

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

import { PHOTOS } from '@/lib/photos'

function TvStatic() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null
    if (!ctx) return
    const safeCtx = ctx

    let animId: number
    const W = canvas.width
    const H = canvas.height

    function draw() {
      const imageData = safeCtx.createImageData(W, H)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.floor(Math.random() * 256)
        d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255
      }
      safeCtx.putImageData(imageData, 0, 0)
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={70}
      height={53}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  )
}

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [messageIdx, setMessageIdx] = useState(0)
  const [showStatic, setShowStatic] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)
  const completed = useRef(false)
  const photoQueue = useRef<number[]>([])
  const photoQueueIdx = useRef(0)
  const msgQueue = useRef<number[]>([])
  const msgQueueIdx = useRef(0)
  const tickRef = useRef(0)
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    photoQueue.current = shuffled(PHOTOS.length)
    photoQueueIdx.current = 0
    msgQueue.current = shuffled(MESSAGES.length)
    msgQueueIdx.current = 0

    function nextPhoto(): number {
      if (photoQueueIdx.current >= photoQueue.current.length) {
        photoQueue.current = shuffled(PHOTOS.length)
        photoQueueIdx.current = 0
      }
      return photoQueue.current[photoQueueIdx.current++]
    }

    function nextMsg(): number {
      if (msgQueueIdx.current >= msgQueue.current.length) {
        msgQueue.current = shuffled(MESSAGES.length)
        msgQueueIdx.current = 0
      }
      return msgQueue.current[msgQueueIdx.current++]
    }

    // 1% per 60ms = 100% in exactly 6s
    const progressTimer = setInterval(() => {
      setProgress(p => {
        const next = Math.min(100, p + 1)
        if (next >= 100 && !completed.current) {
          completed.current = true
          setTimeout(onComplete, 700)
        }
        return next
      })
    }, 60)

    const msgTimer = setInterval(() => {
      setMessageIdx(nextMsg())
    }, 700)

    // 250ms interval, 3-phase cycle: static → photo (new) → photo (hold)
    // 8 full cycles in 6s; cuts back to static at 100% for the fade-out
    tickRef.current = 0
    cycleTimer.current = setInterval(() => {
      tickRef.current++
      const phase = tickRef.current % 3
      if (phase === 0) {
        setShowStatic(true)
      } else if (phase === 1) {
        setShowStatic(false)
        setPhotoIdx(nextPhoto())
      }
    }, 250)

    return () => {
      clearInterval(progressTimer)
      clearInterval(msgTimer)
      if (cycleTimer.current) clearInterval(cycleTimer.current)
    }
  }, [onComplete])

  const pct = Math.floor(progress)
  const blocks = 20
  const filled = Math.floor((pct / 100) * blocks)
  const currentPhoto = PHOTOS[photoIdx] ?? PHOTOS[0]

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

          {/* Photo / static viewer */}
          <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
            {showStatic ? (
              <TvStatic />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={photoIdx}
                  src={currentPhoto.src}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'pixelated', objectPosition: currentPhoto.pos }}
                />
                {/* Scanline overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)',
                    backgroundSize: '100% 3px',
                  }}
                />
              </>
            )}
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
