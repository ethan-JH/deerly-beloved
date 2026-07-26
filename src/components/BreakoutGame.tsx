'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PHOTOS } from '@/lib/photos'

// ── Canvas / layout constants ────────────────────────────────────────────────
const W = 400
const H = 480
const BRICK_AREA_H = 240
const COLS = 10
const ROWS = 8
const GAP = 3
const BRICK_W = (W - (COLS + 1) * GAP) / COLS
const BRICK_H = (BRICK_AREA_H - (ROWS + 1) * GAP) / ROWS
const BALL_R = 7
const PADDLE_W = 70
const PADDLE_H = 10
const PADDLE_Y = H - 18
const INIT_SPEED = 5

const ROW_COLORS = ['#0D1F3C', '#0D1F3C', '#1760B0', '#1760B0', '#E07B5A', '#E07B5A', '#9A8898', '#9A8898']
const RAISED = 'inset -2px -2px 0 rgba(23,96,176,0.45), inset 2px 2px 0 rgb(250,244,198)'
const FIREWORK_COLORS = ['#E07B5A', '#1760B0', '#FAF4C6', '#9A8898', '#0D1F3C']

// ── Types ────────────────────────────────────────────────────────────────────
interface GuestMember {
  id: string
  first_name: string
  last_name: string
  rsvp_submitted_at: string | null
  attending_saturday: boolean | null
  attending_friday: boolean | null
  dietary: string | null
  song_request: string | null
  message: string | null
}

interface InviteData {
  id: string
  display_name: string
  email: string | null
  has_deer_park_room: boolean
  friday_invited: boolean
  guests: GuestMember[]
}

interface GameState {
  bx: number; by: number; bvx: number; bvy: number
  px: number
  bricks: boolean[][]
  lives: number
  score: number
  broken: number
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string; size: number
  life: number; maxLife: number
}

interface LeaderboardEntry { display_name: string; score: number; time_seconds: number | null }
interface LeaderboardData {
  top: LeaderboardEntry[]
  myRank: number | null
  myScore: number | null
  totalPlayers: number
}

type Phase = 'idle' | 'playing' | 'won' | 'lost'

// ── Pure helpers ─────────────────────────────────────────────────────────────
function randomPhoto(exclude?: string): string {
  const pool = PHOTOS.filter(p => p.src !== exclude)
  return pool[Math.floor(Math.random() * pool.length)].src
}

function initState(): GameState {
  const angle = (Math.random() * 60 - 30) * (Math.PI / 180)
  return {
    bx: W / 2, by: PADDLE_Y - 30,
    bvx: Math.sin(angle) * INIT_SPEED,
    bvy: -Math.cos(angle) * INIT_SPEED,
    px: (W - PADDLE_W) / 2,
    bricks: Array.from({ length: ROWS }, () => Array(COLS).fill(true)),
    lives: 3, score: 0, broken: 0,
  }
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function brickLeft(col: number)  { return GAP + col * (BRICK_W + GAP) }
function brickTop(row: number)   { return GAP + row * (BRICK_H + GAP) }
function allCleared(bricks: boolean[][]) { return bricks.every(r => r.every(b => !b)) }
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function drawPhotoCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const iw = img.naturalWidth, ih = img.naturalHeight
  const targetAspect = W / H
  const imgAspect = iw / ih
  let sx, sy, sw, sh
  if (imgAspect > targetAspect) {
    sh = ih; sw = ih * targetAspect; sx = (iw - sw) / 2; sy = 0
  } else {
    sw = iw; sh = iw / targetAspect; sx = 0; sy = (ih - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
}

function drawBrick(ctx: CanvasRenderingContext2D, col: number, row: number) {
  const bL = brickLeft(col), bT = brickTop(row)
  ctx.fillStyle = ROW_COLORS[row]
  ctx.fillRect(bL, bT, BRICK_W, BRICK_H)
  ctx.fillStyle = 'rgba(255,255,255,0.38)'
  ctx.fillRect(bL, bT, BRICK_W, 2)
  ctx.fillRect(bL, bT + 2, 2, BRICK_H - 2)
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(bL, bT + BRICK_H - 2, BRICK_W, 2)
  ctx.fillRect(bL + BRICK_W - 2, bT, 2, BRICK_H)
}

function spawnBrickParticles(particles: Particle[], cx: number, cy: number, color: string) {
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.8
    const speed = 1.5 + Math.random() * 2.5
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      color, size: 2 + Math.floor(Math.random() * 3),
      life: 18 + Math.floor(Math.random() * 10), maxLife: 28,
    })
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life--
    if (p.life <= 0) { particles.splice(i, 1); continue }
    ctx.globalAlpha = p.life / p.maxLife
    ctx.fillStyle = p.color
    ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size)
  }
  ctx.globalAlpha = 1
}

// ── Component ────────────────────────────────────────────────────────────────
export function BreakoutGame({ invite }: { invite: InviteData | null }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const stateRef     = useRef<GameState>(initState())
  const rafRef       = useRef(0)
  const imgRef       = useRef<HTMLImageElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const startTimeRef = useRef<number>(0)
  const pausedRef    = useRef(false)

  const [phase, setPhase]       = useState<Phase>('idle')
  const [lives, setLives]       = useState(3)
  const [score, setScore]       = useState(0)
  const [hiScore, setHiScore]   = useState(0)
  const [photoSrc, setPhotoSrc] = useState(() => randomPhoto())
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [isNewHiScore, setIsNewHiScore] = useState(false)
  const [endRank, setEndRank]   = useState<{ rank: number; total: number } | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Load local hi score
  useEffect(() => {
    const saved = localStorage.getItem('breakout-hi')
    if (saved) setHiScore(parseInt(saved, 10))
  }, [])

  // Fetch leaderboard on mount
  useEffect(() => { fetchLeaderboard() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pause when tab is hidden
  useEffect(() => {
    if (phase !== 'playing') return
    const handler = () => {
      if (document.hidden) { pausedRef.current = true; setIsPaused(true) }
      else { pausedRef.current = false; setIsPaused(false) }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [phase])

  async function fetchLeaderboard() {
    const res = await fetch('/api/breakout-scores')
    if (res.ok) setLeaderboard(await res.json())
  }

  async function submitScore(finalScore: number, isPerfect: boolean, timeSec: number) {
    if (!invite) { fetchLeaderboard(); return }
    const body: { score: number; time_seconds?: number } = { score: finalScore }
    if (isPerfect) body.time_seconds = Math.round(timeSec)
    const res = await fetch('/api/breakout-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { fetchLeaderboard(); return }
    const data = await res.json() as { isNewHiScore: boolean; rank: number; totalPlayers: number }
    setIsNewHiScore(data.isNewHiScore)
    setEndRank({ rank: data.rank, total: data.totalPlayers })
    fetchLeaderboard()
  }

  // ── Idle / lost canvas draw ────────────────────────────────────────────────
  const drawStatic = useCallback((ctx: CanvasRenderingContext2D, st: GameState) => {
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, W, H)
    if (imgRef.current?.complete) drawPhotoCover(ctx, imgRef.current)
    for (let row = 0; row < ROWS; row++)
      for (let col = 0; col < COLS; col++)
        if (st.bricks[row][col]) drawBrick(ctx, col, row)
    ctx.fillStyle = '#FAF4C6'
    ctx.fillRect(st.px, PADDLE_Y, PADDLE_W, PADDLE_H)
    ctx.beginPath()
    ctx.arc(st.bx, st.by, BALL_R, 0, Math.PI * 2)
    ctx.fillStyle = '#1760B0'; ctx.fill()
    ctx.strokeStyle = '#FAF4C6'; ctx.lineWidth = 1.5; ctx.stroke()
  }, [])

  useEffect(() => {
    if (phase === 'playing' || phase === 'won') return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const img = new Image(); img.src = photoSrc; imgRef.current = img
    const draw = () => drawStatic(ctx, stateRef.current)
    img.onload = draw
    if (img.complete) draw()
  }, [phase, photoSrc, drawStatic])

  // ── Game loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return

    if (!imgRef.current || imgRef.current.src !== window.location.origin + photoSrc) {
      const img = new Image(); img.src = photoSrc; imgRef.current = img
    }

    function loop() {
      if (!ctx) return
      if (pausedRef.current) { rafRef.current = requestAnimationFrame(loop); return }
      const s = stateRef.current

      // Physics
      s.bx += s.bvx; s.by += s.bvy
      if (s.bx - BALL_R < 0)  { s.bx = BALL_R;      s.bvx =  Math.abs(s.bvx) }
      if (s.bx + BALL_R > W)  { s.bx = W - BALL_R;  s.bvx = -Math.abs(s.bvx) }
      if (s.by - BALL_R < 0)  { s.by = BALL_R;      s.bvy =  Math.abs(s.bvy) }

      // Paddle
      if (s.bvy > 0 && s.by + BALL_R >= PADDLE_Y && s.by - BALL_R <= PADDLE_Y + PADDLE_H &&
          s.bx + BALL_R >= s.px && s.bx - BALL_R <= s.px + PADDLE_W) {
        s.by = PADDLE_Y - BALL_R
        const rel = (s.bx - (s.px + PADDLE_W / 2)) / (PADDLE_W / 2)
        const speed = Math.hypot(s.bvx, s.bvy)
        s.bvx = rel * speed * 0.8
        s.bvy = -Math.sqrt(Math.max(0, speed * speed - s.bvx * s.bvx))
      }

      // Bricks
      outerLoop:
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (!s.bricks[row][col]) continue
          const bL = brickLeft(col), bT = brickTop(row)
          const bR = bL + BRICK_W, bB = bT + BRICK_H
          if (s.bx + BALL_R < bL || s.bx - BALL_R > bR ||
              s.by + BALL_R < bT || s.by - BALL_R > bB) continue
          s.bricks[row][col] = false
          s.score += 10
          s.broken++
          spawnBrickParticles(particlesRef.current, bL + BRICK_W / 2, bT + BRICK_H / 2, ROW_COLORS[row])
          const ov = { left: s.bx + BALL_R - bL, right: bR - (s.bx - BALL_R), top: s.by + BALL_R - bT, bottom: bB - (s.by - BALL_R) }
          const minH = Math.min(ov.left, ov.right), minV = Math.min(ov.top, ov.bottom)
          if (minV < minH) s.bvy = -s.bvy; else s.bvx = -s.bvx
          if (s.broken % 10 === 0) {
            const spd = Math.hypot(s.bvx, s.bvy)
            const newSpd = Math.min(spd * 1.07, INIT_SPEED * 1.6)
            s.bvx = (s.bvx / spd) * newSpd; s.bvy = (s.bvy / spd) * newSpd
          }
          break outerLoop
        }
      }

      // Render
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, W, H)
      if (imgRef.current?.complete) drawPhotoCover(ctx, imgRef.current)
      for (let row = 0; row < ROWS; row++)
        for (let col = 0; col < COLS; col++)
          if (s.bricks[row][col]) drawBrick(ctx, col, row)
      ctx.fillStyle = '#FAF4C6'; ctx.fillRect(s.px, PADDLE_Y, PADDLE_W, PADDLE_H)
      ctx.beginPath(); ctx.arc(s.bx, s.by, BALL_R, 0, Math.PI * 2)
      ctx.fillStyle = '#1760B0'; ctx.fill()
      ctx.strokeStyle = '#FAF4C6'; ctx.lineWidth = 1.5; ctx.stroke()
      drawParticles(ctx, particlesRef.current)

      // Win / lose checks
      if (allCleared(s.bricks)) {
        const timeSec = (performance.now() - startTimeRef.current) / 1000
        const isPerfect = s.lives === 3
        setScore(s.score); setLives(s.lives)
        setHiScore(prev => {
          const next = Math.max(prev, s.score)
          localStorage.setItem('breakout-hi', String(next))
          return next
        })
        setPhase('won')
        submitScore(s.score, isPerfect, timeSec)
        return
      }

      if (s.by - BALL_R > H) {
        s.lives--
        s.score -= 100  // life penalty — can go negative
        if (s.lives <= 0) {
          setScore(s.score); setLives(0)
          setHiScore(prev => {
            const next = Math.max(prev, s.score)
            localStorage.setItem('breakout-hi', String(next))
            return next
          })
          setPhase('lost')
          submitScore(s.score, false, 0)
          return
        }
        setLives(s.lives)
        const angle = (Math.random() * 40 - 20) * (Math.PI / 180)
        s.bx = W / 2; s.by = PADDLE_Y - 30
        s.bvx = Math.sin(angle) * INIT_SPEED
        s.bvy = -Math.cos(angle) * INIT_SPEED
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, photoSrc]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fireworks on win ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'won') return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const particles: Particle[] = []
    let tick = 0, raf = 0
    function loop() {
      ctx!.imageSmoothingEnabled = false
      ctx!.clearRect(0, 0, W, H)
      ctx!.fillStyle = '#111827'; ctx!.fillRect(0, 0, W, H)
      if (imgRef.current?.complete) drawPhotoCover(ctx!, imgRef.current)
      ctx!.fillStyle = 'rgba(13,31,60,0.45)'; ctx!.fillRect(0, 0, W, H)
      if (tick % 28 === 0) {
        const x = 40 + Math.random() * (W - 80)
        const y = 30 + Math.random() * (H * 0.6)
        const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]
        for (let i = 0; i < 16; i++) {
          const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3
          const speed = 1.5 + Math.random() * 3
          particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, size: 2 + Math.floor(Math.random() * 3), life: 35 + Math.floor(Math.random() * 25), maxLife: 60 })
        }
      }
      drawParticles(ctx!, particles)
      tick++
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // ── Input ──────────────────────────────────────────────────────────────────
  function movePaddle(clientX: number) {
    if (phase !== 'playing') return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = (clientX - rect.left) * (W / rect.width)
    stateRef.current.px = clamp(x - PADDLE_W / 2, 0, W - PADDLE_W)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) { movePaddle(e.clientX) }
  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault(); movePaddle(e.touches[0].clientX)
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  function startGame() {
    pausedRef.current = false
    stateRef.current = initState()
    particlesRef.current = []
    startTimeRef.current = performance.now()
    setIsNewHiScore(false)
    setEndRank(null)
    setLives(3); setScore(0)
    setIsPaused(false)
    setPhotoSrc(prev => randomPhoto(prev))
    setPhase('playing')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-[var(--color-surface)] select-none">

      {/* Canvas + overlay */}
      <div
        className="relative"
        onMouseLeave={() => { if (phase === 'playing') { pausedRef.current = true; setIsPaused(true) } }}
        onMouseEnter={() => { pausedRef.current = false; setIsPaused(false) }}
      >
        <canvas
          ref={canvasRef}
          width={W} height={H}
          className="block w-full"
          style={{ maxWidth: W, imageRendering: 'pixelated', cursor: phase === 'playing' ? 'none' : 'default' }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={e => e.preventDefault()}
        />

        {/* Paused overlay */}
        {isPaused && phase === 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ background: 'rgba(13,31,60,0.65)' }}>
            <span className="font-[family-name:var(--font-vt323)] text-5xl tracking-widest leading-none text-[#FAF4C6]">PAUSED</span>
            <span className="font-[family-name:var(--font-vt323)] text-sm tracking-widest text-[var(--color-muted)]">MOVE MOUSE OVER GAME TO RESUME</span>
          </div>
        )}

        {/* Game over overlay */}
        {phase === 'lost' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none px-6"
            style={{ background: 'rgba(13,31,60,0.55)' }}>
            <span className="font-[family-name:var(--font-vt323)] text-5xl tracking-widest leading-none text-[#E07B5A]">GAME OVER</span>
            <span className="font-[family-name:var(--font-vt323)] text-2xl tracking-widest text-[var(--color-accent)]">SCORE: {score}</span>
            {isNewHiScore && (
              <span className="font-[family-name:var(--font-vt323)] text-xl tracking-widest text-[#E07B5A]">NEW PERSONAL BEST!</span>
            )}
            {endRank && (
              <span className="font-[family-name:var(--font-vt323)] text-lg tracking-widest text-[#FAF4C6]/80">
                YOUR RANK: #{endRank.rank} OF {endRank.total} PLAYERS
              </span>
            )}
            {leaderboard && leaderboard.top.length > 0 && (
              <div className="mt-1 w-full max-w-[220px]">
                <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)] mb-1 text-center">TOP SCORES</div>
                {leaderboard.top.map((entry, i) => (
                  <div key={i} className="flex items-baseline gap-2 font-[family-name:var(--font-vt323)] text-xs tracking-widest leading-none mb-0.5">
                    <span className="text-[var(--color-muted)] w-3">{i + 1}</span>
                    <span className="text-[#FAF4C6] flex-1 truncate">{entry.display_name}</span>
                    <span className="text-[var(--color-primary)]">{entry.score}</span>
                    {entry.time_seconds != null && <span className="text-[#E07B5A]">✦ {fmtTime(entry.time_seconds)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Win overlay */}
        {phase === 'won' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none px-6 text-center">
            <span className="font-[family-name:var(--font-vt323)] text-5xl tracking-widest leading-none text-[#FAF4C6]"
              style={{ textShadow: '0 0 12px rgba(224,123,90,0.8)' }}>YOU WIN!</span>
            <p className="font-[family-name:var(--font-playfair)] italic text-sm text-[#FAF4C6] leading-relaxed"
              style={{ textShadow: '0 1px 4px rgba(13,31,60,0.9)' }}>
              You saved one of our precious memories<br />from the evil coloured bricks.
            </p>
            <span className="font-[family-name:var(--font-vt323)] text-xl tracking-widest text-[#E07B5A]"
              style={{ textShadow: '0 0 8px rgba(224,123,90,0.7)' }}>THE WEDDING IS SAVED!</span>
            <span className="font-[family-name:var(--font-vt323)] text-xl tracking-widest text-[var(--color-accent)]">SCORE: {score}</span>
            {isNewHiScore && (
              <span className="font-[family-name:var(--font-vt323)] text-xl tracking-widest text-[#E07B5A]"
                style={{ textShadow: '0 0 8px rgba(224,123,90,0.7)' }}>NEW PERSONAL BEST!</span>
            )}
            {endRank && (
              <span className="font-[family-name:var(--font-vt323)] text-lg tracking-widest text-[#FAF4C6]/80">
                YOUR RANK: #{endRank.rank} OF {endRank.total} PLAYERS
              </span>
            )}
            {leaderboard && leaderboard.top.length > 0 && (
              <div className="mt-1 w-full max-w-[220px] text-left">
                <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)] mb-1 text-center">TOP SCORES</div>
                {leaderboard.top.map((entry, i) => (
                  <div key={i} className="flex items-baseline gap-2 font-[family-name:var(--font-vt323)] text-xs tracking-widest leading-none mb-0.5">
                    <span className="text-[var(--color-muted)] w-3">{i + 1}</span>
                    <span className="text-[#FAF4C6] flex-1 truncate">{entry.display_name}</span>
                    <span className="text-[var(--color-primary)]">{entry.score}</span>
                    {entry.time_seconds != null && <span className="text-[#E07B5A]">✦ {fmtTime(entry.time_seconds)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--color-text)]/10">
        <div className="font-[family-name:var(--font-vt323)] text-sm tracking-widest text-[var(--color-text)] flex gap-3 leading-none">
          {phase === 'playing' && (
            <span className="text-[#E07B5A]">{Array.from({ length: lives }, () => '♥').join(' ')}</span>
          )}
          <span>SCORE: {phase === 'playing' ? stateRef.current.score : score}</span>
          {hiScore > 0 && <span className="text-[var(--color-muted)]">HI: {hiScore}</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={startGame}
            className="font-[family-name:var(--font-vt323)] text-sm px-3 py-1 tracking-widest text-[var(--color-primary)] cursor-pointer"
            style={{ background: 'var(--color-surface)', boxShadow: RAISED }}>
            {phase === 'idle' ? 'PLAY ▶' : phase === 'playing' ? 'RESTART' : 'PLAY AGAIN ▶'}
          </button>
        </div>
      </div>

      {/* Leaderboard panel */}
      {leaderboard && (
        <div className="border-t border-[var(--color-text)]/10 px-3 py-2">
          <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)] mb-1">LEADERBOARD</div>
          {leaderboard.top.length === 0 ? (
            <div className="font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">BE THE FIRST TO PLAY!</div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {leaderboard.top.map((entry, i) => (
                <div key={i} className="flex items-baseline gap-2 font-[family-name:var(--font-vt323)] text-xs tracking-widest leading-none">
                  <span className="text-[var(--color-muted)] w-3">{i + 1}</span>
                  <span className="text-[var(--color-text)] flex-1 truncate">{entry.display_name}</span>
                  <span className="text-[var(--color-primary)]">{entry.score}</span>
                  {entry.time_seconds != null && (
                    <span className="text-[#E07B5A]">✦ {fmtTime(entry.time_seconds)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {invite && leaderboard.myRank != null && (
            <div className="mt-1.5 pt-1.5 border-t border-[var(--color-text)]/10 font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">
              YOUR RANK: #{leaderboard.myRank} OF {leaderboard.totalPlayers} PLAYERS
            </div>
          )}
          {invite && leaderboard.myRank == null && leaderboard.top.length > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-[var(--color-text)]/10 font-[family-name:var(--font-vt323)] text-xs tracking-widest text-[var(--color-muted)]">
              PLAY TO JOIN THE LEADERBOARD
            </div>
          )}
        </div>
      )}
    </div>
  )
}

