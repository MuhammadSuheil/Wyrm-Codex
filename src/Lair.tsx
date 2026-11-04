import type React from 'react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { classes } from './data'
import { fmt, type Stats } from './api'
import { go as navigate } from './codex/routes'
import { ClassEmblem } from './ClassIcons'
import { TarotCard } from './Tarot'
import Glossary from './Glossary'


type Go = (p: 'classes' | 'spells' | 'races') => void

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    let r = 0
    const on = () => { cancelAnimationFrame(r); r = requestAnimationFrame(() => setY(scrollY)) }
    addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on)
  }, [])
  return y
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold: 0.2 })
    ref.current && io.observe(ref.current); return () => io.disconnect()
  }, [])
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition duration-1000 ease-out ${on ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-12 opacity-0 blur-sm'} ${className}`}>{children}</div>
}

/* Hand-drawn SVG assets */
const D20 = ({ className = '', n }: { className?: string; n?: number }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff5a3c" /><stop offset="1" stopColor="#6b0d13" /></linearGradient></defs>
    <path d="M50 4 92 28v44L50 96 8 72V28Z" fill="url(#dg)" stroke="#ffcf9a" strokeWidth="1.5" />
    <path d="M50 4 26 62h48ZM8 28l18 34L50 96l24-34 18-34M8 72l18-10M92 72 74 62" fill="none" stroke="#ffcf9a" strokeOpacity=".55" strokeWidth="1.2" />
    <text x="50" y="54" textAnchor="middle" fontFamily="Pirata One" fontSize="18" fill="#fff3e0">{n ?? 20}</text>
  </svg>
)
const Sigil = ({ path, className = '' }: { path: ReactNode; className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="32" cy="32" r="29" strokeDasharray="2 4" /><circle cx="32" cy="32" r="24" strokeOpacity=".4" />{path}
  </svg>
)
const sigils = {
  classes: <path d="M20 44 40 24M40 24l4-4 2 2-4 4M44 44 24 24M24 24l-4-4-2 2 4 4M18 40l6 6M46 40l-6 6" />,
  spells: <path d="M32 14l4 12 12 2-10 8 4 12-10-7-10 7 4-12-10-8 12-2Z" />,
  races: <path d="M32 16c-6 0-10 5-10 11s4 9 10 9 10-3 10-9-4-11-10-11ZM18 50c2-8 8-12 14-12s12 4 14 12M22 18l-4-6M42 18l4-6" />,
}

function FlyingDragon({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={style}>
      <svg viewBox="0 0 220 120" className="w-full" fill="currentColor">
        <g className="wing-back"><path d="M100 62 70 8c-6 18-20 28-38 30 14 4 22 10 26 18-10-2-20 0-28 6 16 0 30 4 40 10Z" opacity=".6" /></g>
        <path d="M14 70c18-4 34-4 50 2l40-8c16-4 30-2 44 6l26-4 14-12 4 10 10 2-12 8 12 8-16-2c-14 8-30 12-48 10-16 8-34 10-54 6-24-6-46-8-70-2 16-10 30-16 50-16-14-2-30 0-50 6 18-10 36-14 56-14" />
        <g className="wing-front"><path d="M120 66 100 2c-4 22-18 36-40 42 18 2 30 8 36 16-14-2-26 0-36 8 22-2 40 2 54 10Z" /></g>
      </svg>
    </div>
  )
}

function Dragons({ y }: { y: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ transform: `translate3d(0, ${y * 0.2}px, 0)` }}>
      <FlyingDragon className="dragon-fly absolute top-[14%] w-72 text-[#05070f] drop-shadow-[0_0_24px_rgba(140,170,255,.25)] md:w-[26rem]" />
      <FlyingDragon className="dragon-fly absolute top-[34%] w-32 text-[#0a0f20]/80 blur-[1px]" style={{ animationDuration: '34s', animationDelay: '-12s' }} />
      <FlyingDragon className="dragon-fly-rev absolute top-[8%] w-20 text-[#0a0f20]/60 blur-[1.5px]" style={{ animationDuration: '40s', animationDelay: '-6s' }} />
    </div>
  )
}

function CountUp({ to, on }: { to: number; on: boolean }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!on) return
    let f = 0; const start = performance.now()
    const tick = (t: number) => { const k = Math.min(1, (t - start) / 1400); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) f = requestAnimationFrame(tick) }
    f = requestAnimationFrame(tick); return () => cancelAnimationFrame(f)
  }, [on, to])
  return <>{v.toLocaleString('en-US')}</>
}

const roman = (n: number) => {
  let out = ''
  for (const [v, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']] as const) while (n >= v) { out += r; n -= v }
  return out
}

function Crest({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 230" className={className} fill="none">
      <defs>
        <linearGradient id="crestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a0f14" /><stop offset="1" stopColor="#0b0b14" /></linearGradient>
        <linearGradient id="crestGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0d08a" /><stop offset=".5" stopColor="#8a6024" /><stop offset="1" stopColor="#d6a85a" /></linearGradient>
      </defs>
      <path d="M100 10 180 34v70c0 58-36 94-80 116-44-22-80-58-80-116V34Z" fill="url(#crestFill)" stroke="url(#crestGold)" strokeWidth="3" />
      <path d="M100 22 168 42v62c0 50-30 82-68 101-38-19-68-51-68-101V42Z" stroke="#d6a85a" strokeOpacity=".35" strokeDasharray="3 5" />
      <path d="M100 0l6 10h-12ZM20 34l-10-6M180 34l10-6" stroke="#d6a85a" strokeWidth="2" />
    </svg>
  )
}

function CodexStats({ go, stats }: { go: Go; stats: Stats | null }) {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false)
  useEffect(() => { const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold: 0.35 }); ref.current && io.observe(ref.current); return () => io.disconnect() }, [])
  const rows = [
    { k: 'classes' as const, n: stats?.classes ?? 0, label: 'Classes', motto: 'Paths of Power', sub: stats && `with ${stats.subclasses} sub-classes` },
    { k: 'spells' as const, n: stats?.spells ?? 0, label: 'Spells', motto: 'Words of the Weave', sub: null },
    { k: 'races' as const, n: stats?.species ?? 0, label: 'Species', motto: 'Ancient Bloodlines', sub: stats && `with ${stats.subraces} sub-races` },
  ]
  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-5 py-12">
      <Reveal className="mb-10 flex items-center justify-center gap-4">
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/60 md:w-32" />
        <p className="font-display text-xs tracking-[.5em] text-gold">THE CODEX HOLDS</p>
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/60 md:w-32" />
      </Reveal>
      <div className="grid grid-cols-3 gap-4 md:gap-12">
        {rows.map((r, i) => (
          <button key={r.k} onClick={() => go(r.k)} className={`group relative flex flex-col items-center transition-all duration-1000 ${on ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`} style={{ transitionDelay: `${i * 180}ms` }}>
            <div className="relative w-full max-w-[200px] transition-transform duration-500 group-hover:-translate-y-2">
              <div className="absolute inset-[15%] rounded-full bg-ember/0 blur-2xl transition duration-500 group-hover:bg-ember/40" />
              <Crest className="relative w-full drop-shadow-[0_20px_30px_rgba(0,0,0,.7)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pb-6">
                <span className="font-display text-[10px] tracking-[.3em] text-gold/70 md:text-xs">{roman(r.n)}</span>
                <span className={`ember-text gold-stroke font-display font-black leading-none ${r.n >= 1000 ? 'text-3xl md:text-5xl' : 'text-5xl md:text-7xl'}`}><CountUp to={r.n} on={on && r.n > 0} /></span>
              </div>
            </div>
            <div className="relative -mt-4 md:-mt-6">
              <svg viewBox="0 0 240 48" className="w-40 md:w-60">
                {/* tails sit behind the band, swallowtail notches face outward */}
                <path d="M44 16H2l12 14-12 14h42Z M196 16h42l-12 14 12 14h-42Z" fill="#5c0b10" stroke="#d6a85a" strokeOpacity=".6" strokeWidth="1" />
                <path d="M30 36 44 44V36Z M210 36 196 44V36Z" fill="#2e0508" />
                <path d="M30 10Q120 2 210 10V36Q120 28 30 36Z" fill="#8a1119" stroke="#d6a85a" strokeWidth="1.5" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center pb-2 font-display text-xs font-bold tracking-[.25em] text-bone md:text-base">{r.label.toUpperCase()}</span>
            </div>
            <p className="mt-3 font-display text-[10px] italic tracking-widest text-smoke transition group-hover:text-gold md:text-xs">{r.motto}</p>
            <p className={`mt-1 font-display text-[10px] tracking-[.2em] text-gold/80 transition-opacity duration-700 md:text-xs ${r.sub ? 'opacity-100' : 'opacity-0'}`}>{r.sub ?? '\u00a0'}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

function Embers() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }, (_, i) => (
        <span key={i} className="ember" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.7) % 9}s`, animationDuration: `${7 + (i % 6)}s`, ['--x' as string]: `${(i % 2 ? 1 : -1) * (20 + (i % 5) * 12)}px` }} />
      ))}
    </div>
  )
}

export default function Lair({ stats }: { stats: Stats | null }) {
  const go: Go = (p) => navigate(p === 'races' ? 'species' : p)
  const y = useScrollY()
  const p = (f: number) => ({ transform: `translate3d(0, ${y * f}px, 0)` })

  return (
    <div className="bg-abyss">
      {/* HERO: video backdrop, copy left, class carousel right */}
      <section className="relative min-h-[88vh] overflow-hidden bg-[linear-gradient(180deg,#0a1630_0%,#101a38_45%,#0b0909_100%)]">
        {/* Animated hall, shifted right; left edge melts into the gradient */}
        <div className="pointer-events-none absolute inset-y-0 right-0 left-[18%] overflow-hidden" style={p(0.3)}>
          <img src="/hero-hall.webp" alt="" className="absolute inset-0 h-full w-full scale-105 object-cover object-center" />
          <div className="fog absolute inset-0" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070b18_0%,#0a1630_22%,rgba(10,22,48,.75)_38%,rgba(10,22,48,.15)_65%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,11,24,.6)_0%,transparent_25%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_60%,rgba(200,32,43,.25),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(0deg,#0b0909_0%,#0b0909_12%,rgba(11,9,9,.85)_35%,rgba(11,9,9,.4)_65%,transparent_100%)]" />
                <Embers />

        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl items-center px-6 pt-24 pb-16" style={{ opacity: Math.max(0, 1 - y / 700) }}>
          <div className="max-w-xl">
            <p className="hero-in mb-5 flex items-center gap-3 font-display text-xs tracking-[.5em] text-[#9fb6ff]" style={{ animationDelay: '.1s' }}>THE FIFTH EDITION CODEX</p>
            <h1 className="hero-in font-display text-5xl font-black leading-[.95] md:text-6xl" style={{ animationDelay: '.3s' }}>
              <span className="block text-bone drop-shadow-[0_4px_30px_rgba(0,0,0,.6)]">Here Be</span>
              <span className="ember-text block">Dragons</span>
            </h1>
            <p className="hero-in mt-6 max-w-md text-lg text-bone/75" style={{ animationDelay: '.5s' }}>Every rule, spell and saga, kept in one codex. Grab your dice. The tavern door is open.</p>
          </div>
        </div>
      </section>

      {/* CLASS CAROUSEL */}
      <section className="relative -mt-24 overflow-hidden pt-6 pb-10">
        <Reveal className="mb-8 text-center">
          <p className="font-display text-xs tracking-[.5em] text-ember">THE DECK OF HEROES</p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Draw Your Class</h2>
        </Reveal>
        <Reveal delay={150}><ClassCarousel go={go} /></Reveal>
      </section>

      {/* EXPRESS YOURSELF */}
      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-[1fr_1.3fr] md:items-center">
        <Reveal>
          <p className="font-display text-xs tracking-[.5em] text-ember">BE WHO YOU WISH TO BE</p>
          <h2 className="mt-3 font-display text-5xl leading-[1.05] md:text-6xl">A Hero of<br /><span className="ember-text">Your Own Making</span></h2>
        </Reveal>
        <Reveal delay={150} className="space-y-4 text-lg leading-relaxed text-bone/80">
          <p className="dropcap">No two adventurers walk the same road. Pair a stout dwarven body with a wizard's restless mind, or let a tiefling's infernal blood burn through a paladin's sacred oath. Every class is a calling, every race a heritage, and every spell a choice about the mark you'll leave on the world.</p>
          <p className="italic text-smoke">Be the silver-tongued bard who talks the dragon down, or the barbarian who doesn't bother asking. The rules are only the bones of the tale. The voice is yours.</p>
        </Reveal>
      </section>

      {/* CODEX STATS */}
      <CodexStats go={go} stats={stats} />

      {/* PATHS */}
      <PathsSection go={go} stats={stats} />

      {/* WORDS OF THE CODEX */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_55%,#1b2a52_0%,#0f1428_45%,#0b0909_80%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-abyss to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-abyss to-transparent" />
        <div className="relative px-5">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <p className="font-display text-xs tracking-[.5em] text-[#9fb6ff]">FOR THE NEWLY ARRIVED</p>
            <h2 className="mt-3 font-display text-4xl md:text-6xl">Words of <span className="ember-text">the Codex</span></h2>
            <p className="mx-auto mt-4 max-w-lg text-smoke">The table speaks its own tongue. Learn these words and you will never be lost when the dice start rolling.</p>
          </Reveal>
          <Reveal delay={150}><Glossary /></Reveal>
        </div>
      </section>

      {/* TAVERN QUOTE */}
      <section className="mx-auto max-w-3xl px-5 pt-10 pb-28 text-center md:pb-36">
        <Reveal>
          <svg viewBox="0 0 120 20" className="mx-auto mb-8 w-40 text-gold"><path d="M0 10h45M75 10h45M60 2l8 8-8 8-8-8Z" stroke="currentColor" fill="none" /></svg>
          <blockquote className="font-display text-3xl leading-snug md:text-4xl">“The dice decide what happens. <span className="text-ember">You</span> decide who you become.”</blockquote>
          <p className="mt-6 text-xs tracking-[.4em] text-smoke">OLD TAVERN PROVERB</p>
        </Reveal>
      </section>

      {/* COMMUNITY: GitHub + donate (placeholder links) */}
      <Community />
    </div>
  )
}

function ClassCarousel({ go }: { go: Go }) {
  const [i, setI] = useState(0); const [paused, setPaused] = useState(false)
  const n = classes.length
  useEffect(() => { if (paused) return; const t = setInterval(() => setI((v) => (v + 1) % n), 3800); return () => clearInterval(t) }, [paused, n])
  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative h-[480px] [perspective:1400px]">
        {[-3, -2, -1, 0, 1, 2, 3].map((o) => {
          const k = classes[(i + o + n) % n]; const a = Math.abs(o)
          return (
            <button key={k.name} onClick={() => (o === 0 ? go('classes') : setI((i + o + n) % n))} aria-label={k.name}
              className="tcg absolute left-1/2 top-2 transition-all duration-700 ease-out"
              style={{ transform: `translateX(calc(-50% + ${o * 210}px)) translateZ(${-a * 140}px) rotateY(${o * -14}deg) rotateZ(${o * 2}deg)`, opacity: a === 3 ? 0 : a === 2 ? 0.35 : a === 1 ? 0.7 : 1, zIndex: 10 - a, pointerEvents: a === 3 ? 'none' : 'auto' }}>
              <div className={`tcg-inner ${o === 0 ? 'is-active' : ''}`}>
                <div className="flex items-center justify-between px-3 pt-2.5">
                  <span className="font-display text-sm font-bold">{k.name}</span>
                  <span className="grid size-8 place-items-center rounded-full border border-gold/60 bg-gradient-to-br from-ember to-blood font-display text-[11px] font-black">d{k.die}</span>
                </div>
                <div className="tcg-art mx-3 mt-2 grid h-44 place-items-center">
                  <ClassEmblem name={k.name} className={`size-28 transition duration-700 ${o === 0 ? 'text-flame drop-shadow-[0_0_18px_rgba(255,90,60,.8)]' : 'text-bone/70'}`} />
                </div>
                <div className="mx-3 mt-2 rounded-sm border border-gold/30 bg-black/40 px-2 py-1 text-[10px] font-semibold tracking-[.2em] text-gold">{k.role.toUpperCase()} · {k.primary.toUpperCase()}</div>
                <div className="mx-3 mt-2 h-[108px] rounded-sm bg-[#efe3cc] p-2.5 text-left text-[11px] leading-snug text-[#2a1a12]">
                  <p className="font-semibold">{k.features[0][1]}</p>
                  <p className="mt-1 italic opacity-80">{k.blurb}</p>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-[9px] tracking-widest text-bone/50"><span>SAVES {k.saves}</span><span>{String(classes.indexOf(k) + 1).padStart(2, '0')}/{n}</span></div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-6 flex items-center justify-center gap-4">
        <button aria-label="Previous class" onClick={() => setI((i - 1 + n) % n)} className="grid size-10 place-items-center rounded-full border border-gold/30 text-gold transition hover:border-flame hover:text-flame">&larr;</button>
        <div className="flex gap-1.5">{classes.map((k, j) => <button key={k.name} aria-label={`Show ${k.name}`} onClick={() => setI(j)} className={`h-1.5 rounded-full transition-all ${j === i ? 'w-6 bg-flame' : 'w-1.5 bg-bone/25 hover:bg-bone/50'}`} />)}</div>
        <button aria-label="Next class" onClick={() => setI((i + 1) % n)} className="grid size-10 place-items-center rounded-full border border-gold/30 text-gold transition hover:border-flame hover:text-flame">&rarr;</button>
      </div>
    </div>
  )
}

// Matched to each card's art: steel-teal Armory, lavender Grimoire, crimson Bloodlines
const PATH_GLOW = ['rgba(80,150,185,.6)', 'rgba(160,130,215,.55)', 'rgba(220,50,50,.55)']

function PathsSection({ go, stats }: { go: Go; stats: Stats | null }) {
  const [hover, setHover] = useState<number | null>(null)
  return (
    <section className="relative overflow-hidden pt-24">
      <Reveal className="relative mx-auto max-w-6xl px-5 text-center">
        <p className="font-display text-xs tracking-[.5em] text-ember">CHAPTER THE FIRST</p>
        <h2 className="mt-3 font-display text-4xl font-bold md:text-6xl">Choose Your Path</h2>
        <p className="mx-auto mt-4 max-w-md text-smoke">Three cards lie before you. Which one calls?</p>
      </Reveal>
      {/* Fortune teller's table starts at the cards: velvet glow, faint fabric, candle flicker, a pool of color under each card */}
      <div className="relative mt-4 pt-12 pb-28">
        <div className="velvet pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {PATH_GLOW.map((c, i) => (
            <div key={i} className="absolute top-[48%] size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px] transition-opacity duration-500"
              style={{ left: `${30 + i * 20}%`, background: `radial-gradient(circle, ${c}, transparent 65%)`, opacity: hover === null ? 0.35 : hover === i ? 0.9 : 0.15 }} />
          ))}
        </div>
        <div className="candle-light pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-abyss via-abyss/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-abyss via-abyss/70 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5">
          <TarotRow go={go} stats={stats} onHover={setHover} />
        </div>
      </div>
    </section>
  )
}

function TarotRow({ go, stats, onHover }: { go: Go; stats: Stats | null; onHover: (i: number | null) => void }) {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false)
  useEffect(() => { const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold: 0.15 }); ref.current && io.observe(ref.current); return () => io.disconnect() }, [])
  const cards = [
    ['classes', 'The Armory', stats ? `${stats.classes} classes with ${stats.subclasses} sub-classes` : 'Counting the armory…', 'Steel, faith and fury. Learn what makes a hero.', ''],
    ['spells', 'The Grimoire', stats ? `${fmt(stats.spells)} spells` : 'Counting the grimoire…', 'Words that bend the weave of reality itself.', ''],
    ['races', 'The Bloodlines', stats ? `${stats.species} species with ${stats.subraces} sub-races` : 'Counting the bloodlines…', 'Every hero is born of somewhere. Find your roots.', ''],
  ] as const
  return (
    <div ref={ref} className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8 md:gap-5">
      {cards.map(([k, t, c, d, r], i) => (
        <button key={k} onClick={() => go(k)} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)} className={`tarot-btn group block w-full max-w-[250px] text-center ${r} ${on ? 'is-dealt' : ''}`}>
          <TarotCard kind={k} numeral={['I', 'II', 'III'][i]} title={t.replace('The ', '').toUpperCase()} desc={d} flipped={on} delay={150 + i * 150} />
          <p className="mt-5 font-display text-xs tracking-[.4em] text-ember">{c.toUpperCase()}</p>
          <span className="mt-3 inline-block font-display text-xs tracking-[.3em] text-gold transition group-hover:tracking-[.5em] group-hover:text-flame">ENTER</span>
        </button>
      ))}
    </div>
  )
}

const GitHubIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg>

const IssueIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.2v.3" strokeLinecap="round" /></svg>
const QuillIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 3C11 4 6 10 4.5 20M20 3c-1 6-5 10-11 11M14 9l-4 4" /></svg>
const CoffeeIcon = () => <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9ZM17 10.5h1.5a2.5 2.5 0 0 1 0 5H17M8 3.5c-.6.9.6 1.6 0 2.5M12 3.5c-.6.9.6 1.6 0 2.5" /></svg>

function Community() {
  // TODO: replace placeholder hrefs with the real GitHub repo and Ko-fi page
  const links: [ReactNode, string, string][] = [
    [<GitHubIcon />, 'Star the Repo', '#'],
    [<IssueIcon />, 'Report an Issue', '#'],
    [<QuillIcon />, 'Contribute', '#'],
    [<CoffeeIcon />, 'Treat Some Coffee', '#'],
  ]
  return (
    <section className="relative border-t border-[#8a1119]/25 bg-[linear-gradient(180deg,#140a0b_0%,#0b0909_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8a1119]/60 to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-xs tracking-[.5em] text-[#a8464c]">JOIN THE FELLOWSHIP</p>
          <p className="mt-2 text-bone/70">Free and open source, kept alive by its scribes. Lend a hand or keep the lanterns lit.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {links.map(([icon, t, href]) => (
            <a key={t} href={href} onClick={(e) => href === '#' && e.preventDefault()}
              className={`group inline-flex items-center gap-2.5 transition ${t === 'Treat Some Coffee'
                ? 'rounded-full border border-[#8a1119]/60 bg-[#8a1119]/15 px-4 py-2 text-bone/90 shadow-[0_0_24px_-8px_rgba(138,17,25,.6)] hover:border-[#b8333b]/70 hover:bg-[#8a1119]/25 hover:text-bone'
                : 'text-smoke hover:text-bone'}`}>
              <span className="text-[#8a1119] transition group-hover:text-[#b8333b]">{icon}</span>
              <span className="font-display tracking-wide">{t}</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
