import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { fmt, useResource, type Page } from '../api'
import { cat, Glyph, go, groupOf, href, type Cat } from './routes'

export function PageHeader({ c, count, children }: { c: Cat; count?: number | null; children?: ReactNode }) {
  const d = cat(c), g = groupOf(c)
  return (
    <header className="relative overflow-hidden pt-[104px] pb-8">
      {/* The section's artwork, heavily dimmed, so sub-pages feel like rooms in the same realm */}
      <img src={g?.img ?? '/hero-hall.webp'} alt="" className="realm-art pointer-events-none absolute inset-0 h-full w-full object-cover object-[50%_40%] opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,9,9,.95)_0%,rgba(11,9,9,.7)_45%,rgba(11,9,9,.35)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_75%_0%,rgba(29,48,99,.35),transparent_70%),radial-gradient(ellipse_50%_70%_at_15%_10%,rgba(138,17,25,.2),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-abyss via-abyss/70 to-transparent" />
      <Glyph c={c} className="pointer-events-none absolute -right-10 top-10 size-[22rem] text-ember/[.06] md:right-[8%]" />
      <div className="relative mx-auto max-w-7xl px-5">
        <p className="flex items-center gap-2 font-display text-xs tracking-[.45em] text-ember"><Glyph c={c} className="size-4" />{g ? <><a href={href(g.id)} className="transition hover:text-flame">{g.label.toUpperCase()}</a><span className="text-smoke/60">/</span>{g.kicker.toUpperCase()}</> : <>THE FORGE<span className="text-smoke/60">/</span>CHARACTER BUILDER</>}</p>
        <h1 className="mt-3 font-display text-5xl leading-none md:text-7xl">{d.label}</h1>
        <p className="mt-4 max-w-xl text-lg text-smoke">{d.blurb}.{count != null && <> <span className="text-bone">{fmt(count)}</span> entries in the codex.</>}</p>
        {children}
      </div>
    </header>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-[68px] z-20 border-y border-white/5 bg-abyss/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5 px-5 py-3">{children}</div>
    </div>
  )
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-full border border-white/10 bg-coal/80 px-4 py-2 transition focus-within:border-ember/70 focus-within:shadow-[0_0_0_3px_rgba(200,32,43,.15)]">
      <svg viewBox="0 0 24 24" className="size-4 text-smoke" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-[15px] outline-none placeholder:text-smoke/70" />
      {value && <button onClick={() => onChange('')} aria-label="Clear search" className="text-smoke hover:text-flame">&times;</button>}
    </label>
  )
}

export function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`appearance-none rounded-full border bg-coal/80 py-2 pl-4 pr-9 text-sm outline-none transition hover:border-gold/40 focus:border-ember/70 ${value !== options[0]?.[0] ? 'border-ember/60 text-bone' : 'border-white/10 text-smoke'}`}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-smoke" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
    </label>
  )
}

export function Chips<T extends string>({ value, onChange, options, className = '' }: { value: T; onChange: (v: T) => void; options: [T, ReactNode][]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} className={`rounded-full border px-3.5 py-1.5 text-sm transition ${value === v ? 'border-ember bg-ember/20 text-bone shadow-[0_0_18px_-6px_rgba(200,32,43,.8)]' : 'border-white/10 text-smoke hover:border-gold/40 hover:text-bone'}`}>{l}</button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on} className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${on ? 'border-gold/60 bg-gold/10 text-gold' : 'border-white/10 text-smoke hover:text-bone'}`}>
      <span className={`size-2 rounded-full transition ${on ? 'bg-gold shadow-[0_0_8px_#d6a85a]' : 'bg-white/20'}`} />{children}
    </button>
  )
}

// Source books from Open5e, so readers can stick to the core rules or explore third-party content
export function SourceSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = useResource<Page<{ slug: string; title: string }>>('/documents/?limit=50&fields=slug,title')
  const opts: [string, string][] = [['', 'All sources'], ...(data?.results ?? []).map((d) => [d.slug, d.title] as [string, string])]
  return <Select label="Source" value={value} onChange={onChange} options={opts} />
}

export function ResultsMeta({ count, loading, onReset, dirty }: { count: number | null; loading: boolean; onReset?: () => void; dirty?: boolean }) {
  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 pt-6 pb-4 text-sm text-smoke">
      <span>{count == null ? 'Consulting the archive…' : <><span className="text-bone">{fmt(count)}</span> {count === 1 ? 'result' : 'results'}</>}{loading && count != null && ' · loading'}</span>
      {dirty && onReset && <button onClick={onReset} className="font-display tracking-widest text-gold transition hover:text-flame">RESET FILTERS</button>}
    </div>
  )
}

/** Triggers onMore when scrolled near the bottom of the list */
export function Sentinel({ onMore, active }: { onMore: () => void; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null); const cb = useRef(onMore); cb.current = onMore
  useEffect(() => {
    if (!active) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && cb.current(), { rootMargin: '600px' })
    ref.current && io.observe(ref.current); return () => io.disconnect()
  }, [active])
  return <div ref={ref} className="h-px" />
}

export const Skeleton = ({ n = 12, h = 'h-40' }: { n?: number; h?: string }) => (
  <>{Array.from({ length: n }, (_, i) => <div key={i} className={`skeleton rounded-2xl ${h}`} style={{ animationDelay: `${(i % 6) * 90}ms` }} />)}</>
)

export const Empty = ({ children = 'Nothing stirs in the archive. Try a different search.' }: { children?: ReactNode }) => (
  <div className="col-span-full grid place-items-center py-24 text-center text-smoke">
    <svg viewBox="0 0 24 24" className="mb-4 size-10 text-ember/50" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" /><path d="M12 2 7.5 14h9L12 2Z" /></svg>
    <p className="max-w-xs">{children}</p>
  </div>
)

export const ErrorNote = () => <Empty>The archive could not be reached. Check your connection and try again.</Empty>

export const Tag = ({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'gold' | 'ember' }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] tracking-wide ${tone === 'gold' ? 'border-gold/40 bg-gold/10 text-gold' : tone === 'ember' ? 'border-ember/50 bg-ember/15 text-[#ff8a7a]' : 'border-white/10 bg-white/[.03] text-smoke'}`}>{children}</span>
)

export const Source = ({ title }: { title?: string }) => title ? <span className="truncate text-[11px] italic text-smoke/80">{title}</span> : null

// Stable page number per entry, so each one feels like a page in the codex
const folio = (s: string) => 12 + ([...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 997, 7) % 480)

/** Entry details open like a book page that slides in from the left and settles in the middle.
 *  Controlled by the slug in the URL; keeps the last page rendered while it closes. */
export function Drawer({ c, slug, children, wide }: { c: Cat; slug: string | null; children: ReactNode; wide?: boolean }) {
  const open = !!slug
  const [shown, setShown] = useState(open); const last = useRef<ReactNode>(children)
  if (open) last.current = children
  useEffect(() => {
    if (open) { setShown(true); return }
    const t = setTimeout(() => setShown(false), 420); return () => clearTimeout(t)
  }, [open])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && go(c)
    addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [open, c])
  if (!shown && !open) return null
  // Portaled to <body> so it always layers above the fixed nav
  return createPortal(
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={() => go(c)} className={`book-veil absolute inset-0 bg-black/70 backdrop-blur-sm ${open ? 'is-open' : ''}`} />
      <div className="absolute inset-0 grid place-items-center p-3 md:p-8" onClick={(e) => e.target === e.currentTarget && go(c)}>
        <aside role="dialog" aria-modal="true" key={slug ?? 'closing'} className={`book relative flex h-full max-h-[920px] w-full ${wide ? 'max-w-4xl' : 'max-w-3xl'} ${open ? 'is-open' : 'is-closing'}`}>
          {/* Leather cover peeking out behind the page block */}
          <span className="book-cover pointer-events-none absolute -inset-y-2.5 -left-3 -right-2.5 rounded-r-2xl rounded-l-lg" />
          <span className="book-edges pointer-events-none absolute -right-[7px] top-1.5 bottom-1.5 w-[7px] rounded-r-sm" />
          <div className="book-leaf relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-r-xl rounded-l-[3px]">
            <span className="book-spine pointer-events-none absolute inset-y-0 left-0 z-10 w-14" />
            {/* Running head */}
            <div className="relative z-10 flex items-center gap-4 py-4 pl-14 pr-5 md:pl-20">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/30" />
              <span className="flex items-center gap-2 font-display text-[11px] tracking-[.45em] text-gold/80"><Glyph c={c} className="size-3.5 text-ember" />{cat(c).label.toUpperCase()}</span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/30" />
              <button onClick={() => go(c)} aria-label="Close" className="grid size-8 place-items-center rounded-full text-smoke transition hover:bg-ember/15 hover:text-flame">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <div className="drawer book-text relative z-0 flex-1 overflow-y-auto pt-4 pb-10 pl-14 pr-6 md:pl-20 md:pr-14">{last.current}</div>
            {/* Folio */}
            <div className="relative z-10 py-3 text-center font-display text-sm tracking-[.3em] text-gold/50">❧ {folio(slug ?? '')} ❧</div>
          </div>
        </aside>
      </div>
    </div>,
    document.body,
  )
}

export const DrawerLoading = () => (
  <div className="space-y-4"><div className="skeleton h-10 w-2/3 rounded-lg" /><div className="skeleton h-4 w-1/3 rounded" /><div className="skeleton mt-8 h-40 rounded-xl" /><div className="skeleton h-4 rounded" /><div className="skeleton h-4 w-5/6 rounded" /><div className="skeleton h-4 w-4/6 rounded" /></div>
)

export const Grid = ({ children, className = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto grid max-w-7xl gap-4 px-5 pb-24 ${className}`}>{children}</div>
)

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="mb-3 flex items-center gap-3 font-display text-sm tracking-[.35em] text-gold">{title.toUpperCase()}<span className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" /></h3>
      {children}
    </section>
  )
}

export const Fact = ({ k, v }: { k: string; v?: ReactNode }) => v ? (
  <div className="rounded-xl border border-white/5 bg-white/[.025] px-4 py-3"><p className="text-[10px] uppercase tracking-[.2em] text-smoke">{k}</p><p className="mt-0.5 text-bone">{v}</p></div>
) : null
