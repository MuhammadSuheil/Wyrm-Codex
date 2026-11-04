import { useRef, type PointerEvent } from 'react'

export type TarotKind = 'classes' | 'spells' | 'races'

// Plate tint per card, matched to each illustration's palette
const ink: Record<TarotKind, string> = { classes: '#12304a', spells: '#2c1d52', races: '#4a0d14' }
// Glow and sparkle color per card
const glow: Record<TarotKind, string> = { classes: '#5aa6c8', spells: '#b29ae6', races: '#ff7a5a' }

const sparks = Array.from({ length: 14 }, (_, i) => ({ x: (i * 53) % 96 + 2, s: 6 + ((i * 7) % 4) * 3, d: (i * 37) % 120 }))

function Back() {
  return (
    <svg viewBox="0 0 220 415" preserveAspectRatio="none" className="block h-full w-full">
      <defs><linearGradient id="backGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff1c8" /><stop offset=".5" stopColor="#b8862f" /><stop offset="1" stopColor="#f0d08a" /></linearGradient></defs>
      <rect x="1" y="1" width="218" height="413" rx="14" fill="url(#backGold)" />
      <rect x="10" y="10" width="200" height="395" rx="7" fill="#0e1430" stroke="#6b4a16" strokeWidth="1.5" />
      <rect x="16" y="16" width="188" height="383" rx="5" fill="none" stroke="url(#backGold)" strokeOpacity=".6" />
      <g fill="none" stroke="url(#backGold)" strokeOpacity=".5">{[90, 70, 50].map((r) => <circle key={r} cx="110" cy="207" r={r} strokeDasharray={r === 70 ? '2 5' : undefined} />)}</g>
      <path d="M110 147 162 177v60l-52 30-52-30v-60Z" fill="#8a1119" stroke="url(#backGold)" strokeWidth="2" />
      <path d="M110 147 82 225h56ZM58 177l24 48 28 42 28-42 24-48" fill="none" stroke="#f0d08a" strokeOpacity=".7" />
      <text x="110" y="217" textAnchor="middle" fontFamily="Pirata One" fontSize="22" fill="#fff3e0">20</text>
      {[[110, 46], [110, 370], [34, 207], [186, 207]].map(([x, y]) => <path key={`${x}${y}`} d={`M${x} ${y - 8}l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5Z`} fill="#d6a85a" />)}
    </svg>
  )
}

const COLS = 8, ROWS = 16

function Front({ kind, title, desc }: { kind: TarotKind; title: string; desc: string }) {
  const src = `/cards/${kind}.webp`
  return (
    <div className="relative">
      <img src={src} alt={title} className="block w-full select-none" draggable={false} />
      {/* Grayscale mosaic veil: each tile is a slice of the same image */}
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const c = i % COLS, r = Math.floor(i / COLS)
          const jitter = ((c * 37 + r * 17) % 7) * 6
          return (
            <span key={i} className="mosaic-tile"
              style={{
                backgroundImage: `url(${src})`,
                backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                backgroundPosition: `${(c / (COLS - 1)) * 100}% ${(r / (ROWS - 1)) * 100}%`,
                ['--d' as string]: `${(ROWS - 1 - r) * 14 + jitter}ms`,
              }} />
          )
        })}
      </div>
      {/* Title ribbon + description plate laid over the lower art */}
      <div className="tarot-text absolute inset-x-[11%] top-[71%] flex flex-col items-center">
        <div className="relative w-full">
          <svg viewBox="0 0 240 44" className="w-full drop-shadow-[0_4px_6px_rgba(0,0,0,.5)]">
            <defs><linearGradient id={`rg-${kind}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff1c8" /><stop offset=".5" stopColor="#c4923f" /><stop offset="1" stopColor="#f0d08a" /></linearGradient></defs>
            <path d="M40 14H2l11 12-11 12h38Z M200 14h38l-11 12 11 12h-38Z" fill={ink[kind]} stroke={`url(#rg-${kind})`} strokeWidth="1.2" />
            <path d="M26 32 40 40V32Z M214 32 200 40V32Z" fill="#000" opacity=".5" />
            <path d="M26 6Q120 0 214 6V32Q120 26 26 32Z" fill={ink[kind]} stroke={`url(#rg-${kind})`} strokeWidth="1.8" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center pb-1.5 font-display text-[clamp(14px,1.6vw,20px)] tracking-[.12em] text-[#fff3e0]">{title}</span>
        </div>
        <p className="mt-1.5 w-[88%] rounded-md border border-[#e9c27a]/70 px-2.5 py-1.5 text-center text-[clamp(10px,1vw,12.5px)] italic leading-snug text-[#fff3e0] shadow-[inset_0_0_0_1px_rgba(0,0,0,.3)] backdrop-blur-[2px]" style={{ background: `${ink[kind]}d9` }}>{desc}</p>
      </div>
    </div>
  )
}

export function TarotCard({ kind, title, desc, flipped, delay }: { kind: TarotKind; numeral?: string; title: string; desc: string; flipped: boolean; delay: number }) {
  const tilt = useRef<HTMLDivElement>(null)
  // Cursor position drives rotation and the glare highlight via CSS variables
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = tilt.current; if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${(0.5 - y) * 18}deg`); el.style.setProperty('--ry', `${(x - 0.5) * 22}deg`)
    el.style.setProperty('--gx', `${x * 100}%`); el.style.setProperty('--gy', `${y * 100}%`)
  }
  const leave = () => { const el = tilt.current; if (!el) return; el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') }
  return (
    <div className="tarot relative isolate mx-auto w-full max-w-[250px] [perspective:1000px]" style={{ ['--glow' as string]: glow[kind] }} onPointerMove={move} onPointerLeave={leave}>
      <div className="tarot-aura pointer-events-none absolute -inset-10 rounded-full" />
      <div ref={tilt} className="tarot-tilt relative">
      <div className={`tarot-inner relative ${flipped ? 'is-flipped' : ''}`} style={{ animationDelay: `${delay}ms` }}>
        <div className="tarot-face tarot-back absolute inset-0"><Back /></div>
        {/* Solid rounded card stock behind the PNG acts as the outline */}
        <div className="tarot-face tarot-front relative overflow-hidden ">
          <div className="tarot-art"><Front kind={kind} title={title} desc={desc} /></div>
          {/* Light band + sparkles that ride up with the mosaic reveal */}
          <div className="tarot-band pointer-events-none absolute inset-x-0 h-1/3" />
          {sparks.map((p, i) => (
            <svg key={i} viewBox="0 0 10 10" className="spark pointer-events-none absolute" style={{ left: `${p.x}%`, width: p.s, height: p.s, animationDelay: `${p.d}ms` }}>
              <path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2Z" fill="#fff" />
            </svg>
          ))}
          <div className="tarot-sheen pointer-events-none absolute inset-0" style={{ animationDelay: `${delay + 700}ms`, WebkitMaskImage: `url(/cards/${kind}.webp)`, maskImage: `url(/cards/${kind}.webp)`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }} />
          <div className="tarot-glare pointer-events-none absolute inset-0" style={{ WebkitMaskImage: `url(/cards/${kind}.webp)`, maskImage: `url(/cards/${kind}.webp)`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }} />
        </div>
      </div>
      </div>
    </div>
  )
}
