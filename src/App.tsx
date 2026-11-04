import { useEffect, useRef, useState } from 'react'
import { fmt, useStats, type Stats } from './api'
import Lair from './Lair'
import CharacterSheet from './codex/CharacterSheet'
import Classes from './codex/Classes'
import { RollToast } from './codex/dice'
import MagicItems from './codex/MagicItems'
import Monsters from './codex/Monsters'
import { cat, GROUPS, Glyph, groupOf, href, parseHash, type Cat, type GroupId, type Route } from './codex/routes'
import Realm from './codex/Realm'
import { Backgrounds, Conditions, Equipment, Feats, Rules } from './codex/Small'
import Species from './codex/Species'
import Spells from './codex/Spells'

const I = {
  d20: <><path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" /><path d="M12 2 7.5 14h9L12 2ZM3 7l4.5 7L12 22l4.5-8L21 7M3 17l4.5-3M21 17l-4.5-3" /></>,
}
const Icon = ({ n, s = 20, c = '' }: { n: keyof typeof I; s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={c}>{I[n]}</svg>
)

function useRoute() {
  const [r, setR] = useState<Route>(parseHash)
  useEffect(() => { const on = () => setR(parseHash()); addEventListener('hashchange', on); return () => removeEventListener('hashchange', on) }, [])
  return r
}

export default function App() {
  const { cat: page, slug, group } = useRoute()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [page, group])
  const [scrolled, setScrolled] = useState(false)
  // Hide nav while scrolling down, reveal it as soon as the user scrolls up
  useEffect(() => {
    let last = scrollY
    const on = () => { const y = scrollY; if (Math.abs(y - last) < 6) return; setScrolled(y > 80 && y > last); last = y }
    addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on)
  }, [])
  const stats = useStats()
  return (
    <div className="bg-runes min-h-screen">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[110px]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-transparent" />
        {/* Full nav: slides up and away on scroll */}
        <div className={`pointer-events-auto relative mx-auto flex h-[72px] max-w-7xl items-center justify-center px-6 transition-all duration-500 ease-[cubic-bezier(.65,0,.25,1)] ${scrolled ? 'pointer-events-none -translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <a href="#/" aria-label="Home" className="absolute left-6 hidden transition hover:scale-105 sm:block"><img src="/dnd-logo.png" alt="D&D" className="h-9 w-auto drop-shadow-[0_0_12px_rgba(237,32,36,.4)]" /></a>
          <Nav page={page} group={group} stats={stats} hidden={scrolled} />
        </div>
        {/* Minimized: lone white logo drops in from above */}
        <button onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"
          className={`absolute left-1/2 top-4 -translate-x-1/2 transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${scrolled ? 'pointer-events-auto translate-y-0 opacity-100 delay-200' : 'pointer-events-none -translate-y-6 opacity-0'}`}>
          <img src="/dnd-logo.png" alt="D&D" className="h-8 w-auto brightness-0 invert drop-shadow-[0_2px_10px_rgba(0,0,0,.8)] transition hover:scale-110" />
        </button>
      </header>
      <main key={page ?? group ?? 'home'} className={page ? 'rise' : ''}>
        {!page && !group && <Lair stats={stats} />}
        {group && <Realm id={group} stats={stats} />}
        {page === 'forge' && <CharacterSheet />}
        {page === 'monsters' && <Monsters slug={slug} />}
        {page === 'magic-items' && <MagicItems slug={slug} />}
        {page === 'classes' && <Classes slug={slug} />}
        {page === 'species' && <Species slug={slug} />}
        {page === 'spells' && <Spells slug={slug} />}
        {page === 'backgrounds' && <Backgrounds slug={slug} />}
        {page === 'feats' && <Feats slug={slug} />}
        {page === 'equipment' && <Equipment />}
        {page === 'rules' && <Rules slug={slug} />}
        {page === 'conditions' && <Conditions slug={slug} />}
      </main>
      <Dice />
      <RollToast />
      <footer className="border-t border-white/5 py-8 text-center text-xs text-smoke">Data from the <a href="https://open5e.com" target="_blank" rel="noreferrer" className="text-gold/80 underline-offset-4 hover:underline">Open5e API</a>, including the 5e SRD and open-licensed third-party content. Unofficial fan project.</footer>
    </div>
  )
}

/* Top navigation: Lair plus three sections, each with a dropdown of its codex pages */
function Nav({ page, group, stats, hidden }: { page: Cat | null; group: GroupId | null; stats: Stats | null; hidden: boolean }) {
  const [open, setOpen] = useState<GroupId | null>(null)
  const ref = useRef<HTMLElement>(null); const t = useRef(0)
  const active: GroupId | 'forge' | null = page === 'forge' ? 'forge' : page ? groupOf(page)?.id ?? null : group
  useEffect(() => { setOpen(null) }, [page, group, hidden])
  useEffect(() => {
    const off = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(null)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    addEventListener('pointerdown', off); addEventListener('keydown', esc)
    return () => { removeEventListener('pointerdown', off); removeEventListener('keydown', esc) }
  }, [])
  const enter = (g: GroupId) => { clearTimeout(t.current); setOpen(g) }
  const leave = () => { t.current = window.setTimeout(() => setOpen(null), 160) }
  return (
    <nav ref={ref} className="flex h-full items-stretch" onMouseLeave={leave}>
      <a href="#/" onMouseEnter={() => setOpen(null)} className={`nav-link relative flex items-center px-2 font-display text-sm tracking-[.08em] sm:tracking-[.12em] transition sm:px-5 sm:text-base ${!active ? 'is-active text-bone' : 'text-bone/60 hover:text-bone'}`}>Lair</a>
      {GROUPS.map((g) => (
        <div key={g.id} className="relative flex" onPointerEnter={(e) => e.pointerType !== "touch" && enter(g.id)}>
          {/* The label opens the section's landing page; the chevron (or hover) opens its menu */}
          <a href={href(g.id)} className={`nav-link relative flex items-center pl-2 pr-0.5 font-display text-sm tracking-[.08em] sm:tracking-[.12em] transition sm:pl-5 sm:text-base ${active === g.id ? 'is-active text-bone' : open === g.id ? 'text-bone' : 'text-bone/60 hover:text-bone'}`}>{g.label}</a>
          <button onClick={() => setOpen(open === g.id ? null : g.id)} aria-expanded={open === g.id} aria-label={`${g.label} menu`} className="flex items-center pr-2 pl-0.5 text-bone/60 transition hover:text-flame sm:pr-5">
            <svg viewBox="0 0 24 24" className={`size-3 transition ${open === g.id ? 'rotate-180 text-flame' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>
      ))}
      <a href={href('forge')} onMouseEnter={() => setOpen(null)} className={`nav-link relative flex items-center gap-1.5 px-2 font-display text-sm tracking-[.08em] sm:tracking-[.12em] transition sm:px-5 sm:text-base ${active === 'forge' ? 'is-active text-bone' : 'text-bone/60 hover:text-bone'}`}>
        <Glyph c="forge" className="hidden size-3.5 text-ember sm:block" />Forge
      </a>
      {GROUPS.map((g) => (
        <div key={g.id} onMouseEnter={() => enter(g.id)}
          className={`mega fixed inset-x-3 top-[64px] mx-auto rounded-2xl border border-gold/15 bg-[#0e0b0c]/95 p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,.95),0_0_0_1px_rgba(0,0,0,.6)] backdrop-blur-xl transition duration-300 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 ${g.items.length > 2 ? 'sm:w-[680px]' : 'sm:w-[460px]'} ${open === g.id ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'}`}>
          <div className="flex items-center justify-between px-3 pt-2 pb-3">
            <p className="font-display text-[11px] tracking-[.45em] text-ember">{g.kicker.toUpperCase()}</p>
            <a href={href(g.id)} className="font-display text-[11px] tracking-[.3em] text-gold/80 transition hover:text-flame">EXPLORE {g.label.toUpperCase()} &rarr;</a>
          </div>
          <div className={`grid gap-1 ${g.items.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {g.items.map((c) => {
              const d = cat(c), n = d.stat ? stats?.[d.stat] : undefined, sub = d.sub && stats ? stats[d.sub[0]] : null
              return (
                <a key={c} href={href(c)} className={`group flex items-start gap-3.5 rounded-xl p-3 transition hover:bg-ember/10 ${page === c ? 'bg-white/[.04]' : ''}`}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-ember/25 bg-gradient-to-b from-ember/15 to-transparent text-ember transition group-hover:border-ember/60 group-hover:text-flame group-hover:shadow-[0_0_20px_-4px_rgba(255,90,60,.6)]"><Glyph c={c} className="size-6" /></span>
                  <span className="min-w-0">
                    <span className="block font-display text-lg leading-tight text-bone">{d.label}</span>
                    <span className="block text-[13px] leading-snug text-smoke">{d.blurb}</span>
                    <span className="mt-1 block text-[11px] tracking-wider text-gold/80">{!d.stat ? 'Fill in · Export PDF' : n != null ? `${fmt(n)}${sub != null ? ` · ${sub} ${d.sub![1]}` : ''}` : <span className="inline-block h-2.5 w-12 animate-pulse rounded bg-white/10 align-middle" />}</span>
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

function Dice() {
  const [open, setOpen] = useState(false); const [res, setRes] = useState<{ d: number; v: number; k: number } | null>(null)
  const roll = (d: number) => setRes({ d, v: 1 + Math.floor(Math.random() * d), k: Date.now() })
  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">
      {open && (
        <div className="rise w-64 rounded-2xl border border-ember/30 bg-coal/95 p-4 shadow-2xl backdrop-blur">
          <p className="mb-3 font-display text-sm font-bold tracking-widest text-gold">DICE TRAY</p>
          <div className="mb-4 grid h-20 place-items-center rounded-xl bg-black/40">
            {res ? <span key={res.k} className={`rolling font-display text-4xl font-black ${res.v === res.d ? 'text-gold' : res.v === 1 ? 'text-smoke' : 'text-flame'}`}>{res.v}</span> : <span className="text-xs text-smoke">Pick a die</span>}
          </div>
          {res && <p className="-mt-2 mb-3 text-center text-xs text-smoke">d{res.d}{res.d === 20 && res.v === 20 ? ' · Critical hit!' : res.d === 20 && res.v === 1 ? ' · Critical fail' : ''}</p>}
          <div className="grid grid-cols-4 gap-1.5">
            {[4, 6, 8, 10, 12, 20, 100].map((d) => <button key={d} onClick={() => roll(d)} className={`rounded-lg border border-white/10 py-2 text-xs font-semibold hover:border-ember hover:bg-ember/15 ${d === 20 ? 'col-span-2 text-flame' : ''}`}>d{d}</button>)}
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} aria-label="Dice roller" className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-ember to-blood text-bone shadow-[0_0_30px_rgba(200,32,43,.6)] transition hover:scale-110 hover:rotate-12"><Icon n="d20" s={28} /></button>
    </div>
  )
}
