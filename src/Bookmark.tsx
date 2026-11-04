import { useEffect, useRef, useState } from 'react'

// Lanyard-style bookmark: the ribbon is tucked behind the codex page, folds over its top edge,
// and hangs in front at the top-right corner with the badge. Drag it, flick it, brush past it, click to flip.
const SEG = 8, ROPE = 64, BADGE_H = 118, BADGE_W = 84
const G = 0.55, DAMP = 0.982, ITER = 14

type P = { x: number; y: number; px: number; py: number }

export default function Bookmark() {
  const box = useRef<HTMLDivElement>(null), ribbon = useRef<SVGGElement>(null), stub = useRef<SVGGElement>(null), fold = useRef<SVGEllipseElement>(null), badge = useRef<HTMLDivElement>(null), inner = useRef<HTMLDivElement>(null)
  const sim = useRef<{ pts: P[]; anchor: { x: number; y: number }; drag: { ox: number; oy: number; x: number; y: number } | null; moved: number; ang: number; tilt: number }>(null!)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const el = box.current!
    const place = () => {
      const w = el.getBoundingClientRect().width
      const a = { x: w - (w < 640 ? 40 : 64), y: 0 }
      if (!sim.current) {
        const pts: P[] = []
        for (let i = 0; i <= SEG; i++) { const y = a.y + (ROPE / SEG) * i; pts.push({ x: a.x, y, px: a.x - (i / SEG) * 6, py: y }) }
        pts.push({ x: a.x, y: a.y + ROPE + BADGE_H, px: a.x - 9, py: a.y + ROPE + BADGE_H }) // badge bottom
        sim.current = { pts, anchor: a, drag: null, moved: 0, ang: 0, tilt: 0 }
      } else sim.current.anchor = a
    }
    place()
    const ro = new ResizeObserver(place); ro.observe(el)

    let raf = 0, last = performance.now(), acc = 0
    const step = () => {
      const s = sim.current, pts = s.pts, n = pts.length - 1
      for (let i = 1; i <= n; i++) {
        const p = pts[i], vx = (p.x - p.px) * DAMP, vy = (p.y - p.py) * DAMP
        p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + (i === n ? G * 1.6 : G)
      }
      for (let k = 0; k < ITER; k++) {
        pts[0].x = s.anchor.x; pts[0].y = s.anchor.y
        if (s.drag) { const c = pts[SEG]; c.x = s.drag.x; c.y = s.drag.y }
        for (let i = 0; i < n; i++) {
          const a = pts[i], b = pts[i + 1], rest = i === SEG ? BADGE_H : ROPE / SEG
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - rest) / d
          const wa = i === 0 || (s.drag && i === SEG) ? 0 : 0.5, wb = s.drag && i + 1 === SEG ? 0 : 1 - wa
          const t = wa + wb || 1
          a.x += dx * f * (wa / t); a.y += dy * f * (wa / t); b.x -= dx * f * (wb / t); b.y -= dy * f * (wb / t)
        }
      }
    }
    const draw = () => {
      const s = sim.current, pts = s.pts, clip = pts[SEG], bot = pts[SEG + 1]
      // Smooth the rope through segment midpoints
      let d = `M${pts[0].x} ${pts[0].y}`
      for (let i = 1; i < SEG; i++) { const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2; d += ` Q${pts[i].x} ${pts[i].y} ${mx} ${my}` }
      d += ` L${clip.x} ${clip.y}`
      ribbon.current!.querySelectorAll('path').forEach((p) => p.setAttribute('d', d))
      stub.current!.setAttribute('transform', `translate(${pts[0].x} 0)`)
      fold.current!.setAttribute('cx', `${pts[0].x}`)
      const ang = Math.atan2(bot.x - clip.x, bot.y - clip.y)
      const vx = bot.x - bot.px
      s.ang = ang; s.tilt += (Math.max(-50, Math.min(50, vx * 7)) - s.tilt) * 0.15
      badge.current!.style.transform = `translate(${clip.x}px, ${clip.y}px) rotate(${-ang}rad)`
      inner.current!.style.setProperty('--ty', `${s.tilt}deg`)
      inner.current!.style.setProperty('--sx', `${50 + s.tilt}%`)
    }
    const tick = (now: number) => {
      acc += Math.min(100, now - last); last = now
      while (acc >= 16.67) { step(); acc -= 16.67 }
      draw(); raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  const local = (e: React.PointerEvent) => { const r = box.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = local(e), c = sim.current.pts[SEG]
    sim.current.drag = { ox: p.x - c.x, oy: p.y - c.y, x: c.x, y: c.y }; sim.current.moved = 0
  }
  const move = (e: React.PointerEvent) => {
    const s = sim.current
    if (!s.drag) { if (e.pointerType === 'mouse') { const b = s.pts[SEG + 1]; b.px -= e.movementX * 0.35 } return } // brushing past nudges it
    const p = local(e), a = s.anchor
    let x = p.x - s.drag.ox, y = p.y - s.drag.oy
    const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy), max = ROPE * 2.4
    if (d > max) { x = a.x + (dx / d) * max; y = a.y + (dy / d) * max }
    s.drag.x = x; s.drag.y = y; s.moved += Math.abs(e.movementX) + Math.abs(e.movementY)
  }
  const up = () => {
    const s = sim.current; if (!s.drag) return
    s.drag = null
    if (s.moved < 4) { setFlipped((f) => !f); const b = s.pts[SEG + 1]; b.px += 6 }
  }

  return (
    <div ref={box} className="pointer-events-none absolute inset-0" aria-hidden>
      {/* Tucked end: peeks above the top edge from behind the page */}
      <svg className="absolute left-0 top-0 -z-10 overflow-visible" width="1" height="1">
        <g ref={stub} fill="none">
          <path d="M0 40V-5" stroke="#6e0d15" strokeWidth="17" />
          <path d="M0 40V-5" stroke="#d6a85a" strokeWidth="13" strokeDasharray="4 3" opacity=".85" />
          <path d="M0 40V-5" stroke="#7d111a" strokeWidth="11" />
          <ellipse cy="-5" rx="8.5" ry="3" fill="#8a1119" />
        </g>
      </svg>
      {/* Hanging part, in front of the page */}
      <svg className="absolute left-0 top-0 z-10 overflow-visible" width="1" height="1">
        <g ref={ribbon} fill="none" strokeLinecap="butt">
          <path stroke="rgba(0,0,0,.45)" strokeWidth="18" transform="translate(3 5)" />
          <path stroke="#6e0d15" strokeWidth="17" />
          <path stroke="#d6a85a" strokeWidth="13" strokeDasharray="4 3" opacity=".85" />
          <path stroke="#9c1520" strokeWidth="11" />
          <path stroke="#c42230" strokeWidth="3" opacity=".55" />
        </g>
        {/* Fold shadow where the ribbon rolls over the edge */}
        <ellipse ref={fold} rx="10" ry="2.5" fill="#3a060b" opacity=".9" />
      </svg>

      {/* Badge hangs in front */}
      <div ref={badge} className="absolute left-0 top-0 z-20" style={{ transformOrigin: '0 0' }}>
        <div className="pointer-events-auto absolute -translate-x-1/2 cursor-grab touch-none select-none active:cursor-grabbing" style={{ width: BADGE_W }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          {/* Metal clasp */}
          <div className="relative mx-auto h-3 w-7 rounded-t-sm bg-[linear-gradient(90deg,#7a5a2a,#f3d79a_45%,#a37a35)] shadow-[0_1px_0_rgba(0,0,0,.6)]" />
          <div className="mx-auto -mt-px h-4 w-3.5 rounded-b-full border-2 border-t-0 border-[#d6a85a]" />
          <div className="-mt-2 [perspective:700px]">
            <div ref={inner} className="badge-card relative" style={{ height: BADGE_H - 16, transform: `rotateY(calc(var(--ty, 0deg) + ${flipped ? 180 : 0}deg))` }}>
              <div className="badge-face absolute inset-0 flex flex-col items-center overflow-hidden rounded-[10px] px-2 pt-4 pb-2.5 [backface-visibility:hidden]">
                <span className="h-1.5 w-7 rounded-full bg-black/70 shadow-[inset_0_1px_2px_rgba(0,0,0,.9),0_1px_0_rgba(214,168,90,.3)]" />
                <img src="/dnd-logo.png" alt="" draggable={false} className="mt-3 w-14 drop-shadow-[0_0_10px_rgba(237,32,36,.5)]" />
                <span className="mt-2 font-display text-[11px] leading-none tracking-[.12em] text-bone">WYRMCODEX</span>
                <span className="mt-1 h-px w-10 bg-gold/40" />
                <span className="mt-auto font-display text-[7px] tracking-[.25em] text-gold/80">ADVENTURER · 001</span>
                <span className="badge-holo pointer-events-none absolute inset-0" />
              </div>
              <div className="badge-face absolute inset-0 flex flex-col items-center justify-center rounded-[10px] px-2.5 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="font-display text-[10px] tracking-[.2em] text-gold">CODEX PASS</span>
                <span className="mt-2 text-[8.5px] italic leading-snug text-bone/75">If found, return to the nearest tavern.</span>
                <span className="mt-2.5 h-3 w-12 bg-[repeating-linear-gradient(90deg,#d6a85a_0_1px,transparent_1px_3px,#d6a85a_3px_5px,transparent_5px_6px)] opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
