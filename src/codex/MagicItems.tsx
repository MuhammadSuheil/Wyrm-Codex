import { useMemo, useState } from 'react'
import { cap, qs, useDebounced, useInfinite, useResource } from '../api'
import Md from '../Md'
import { go, type Cat } from './routes'
import { Chips, Drawer, DrawerLoading, Empty, ErrorNote, Grid, PageHeader, ResultsMeta, Search, Select, Sentinel, Skeleton, Source, SourceSelect, Tag, Toggle, Toolbar } from './ui'

const C: Cat = 'magic-items'
type I = { slug: string; name: string; type: string; rarity: string; requires_attunement: string; document__title: string }

export const RARITY: [string, string, string][] = [
  ['common', 'Common', '#b9b2a8'], ['uncommon', 'Uncommon', '#5fd07a'], ['rare', 'Rare', '#5aa6e8'],
  ['very rare', 'Very Rare', '#b07ae8'], ['legendary', 'Legendary', '#f0a34a'], ['artifact', 'Artifact', '#ff5a3c'],
]
const rarityColor = (r: string) => { const x = r?.toLowerCase().trim() ?? ''; return (x.startsWith('very rare') ? RARITY[3] : RARITY.find(([k]) => x.startsWith(k)))?.[2] ?? '#d6a85a' }
const TYPES = ['Wondrous item', 'Weapon', 'Armor', 'Potion', 'Ring', 'Staff', 'Wand', 'Rod', 'Scroll', 'Ammunition']

const Gem = ({ color, className = 'size-6' }: { color: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}><path d="M6 3h12l4 6-10 12L2 9l4-6Z" fill={color} fillOpacity=".25" stroke={color} strokeWidth="1.3" /><path d="M2 9h20M8.5 3 6.5 9 12 21l5.5-12-2-6M6.5 9 12 3l5.5 6" fill="none" stroke={color} strokeWidth=".9" opacity=".8" /></svg>
)

export default function MagicItems({ slug }: { slug: string | null }) {
  const [q, setQ] = useState(''); const [rarity, setRarity] = useState(''); const [type, setType] = useState(''); const [att, setAtt] = useState(false); const [src, setSrc] = useState('')
  const dq = useDebounced(q)
  const url = useMemo(() => `/magicitems/?${qs({
    limit: 48, fields: 'slug,name,type,rarity,requires_attunement,document__title', ordering: 'name',
    search: dq, rarity__iexact: rarity, type__icontains: type, requires_attunement: att ? 'requires attunement' : '', document__slug: src,
  })}`, [dq, rarity, type, att, src])
  const { items, count, loading, error, hasMore, more } = useInfinite<I>(url)
  const dirty = !!(q || rarity || type || att || src)
  const reset = () => { setQ(''); setRarity(''); setType(''); setAtt(false); setSrc('') }

  return (
    <>
      <PageHeader c={C} count={count != null && !dirty ? count : undefined} />
      <Toolbar>
        <Search value={q} onChange={setQ} placeholder="Search the vault… bag of holding, vorpal" />
        <Select label="Type" value={type} onChange={setType} options={[['', 'All types'], ...TYPES.map((t) => [t, t] as [string, string])]} />
        <SourceSelect value={src} onChange={setSrc} />
        <Toggle on={att} onChange={setAtt}>Requires attunement</Toggle>
        <Chips className="w-full" value={rarity} onChange={setRarity} options={[['', 'Any rarity'], ...RARITY.map(([k, l, c]) => [k, <span key={k} className="flex items-center gap-1.5"><span className="size-2 rotate-45" style={{ background: c }} />{l}</span>] as [string, React.ReactNode])]} />
      </Toolbar>
      <ResultsMeta count={count} loading={loading} dirty={dirty} onReset={reset} />
      <Grid>
        {items.map((it, i) => {
          const c = rarityColor(it.rarity)
          return (
            <button key={it.slug} onClick={() => go(C, it.slug)} className="codex-card rise group relative flex h-[150px] flex-col overflow-hidden rounded-2xl p-5 text-left" style={{ animationDelay: `${(i % 12) * 30}ms` }}>
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
              <span className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-15 blur-2xl transition group-hover:opacity-35" style={{ background: c }} />
              <div className="relative flex items-start gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border bg-black/40" style={{ borderColor: `${c}55`, boxShadow: `0 0 18px -6px ${c}` }}><Gem color={c} /></span>
                <span className="min-w-0">
                  <span className="line-clamp-2 font-display text-xl leading-tight text-bone transition group-hover:text-flame">{it.name}</span>
                  <span className="mt-1 block truncate text-sm italic text-smoke">{it.type}</span>
                </span>
              </div>
              <div className="relative mt-auto flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider" style={{ color: c }}>{cap(it.rarity || 'Unknown').toUpperCase()}</span>
                {it.requires_attunement && <Tag>Attunement</Tag>}
                <span className="ml-auto max-w-[40%]"><Source title={it.document__title} /></span>
              </div>
            </button>
          )
        })}
        {loading && <Skeleton n={items.length ? 4 : 12} h="h-[150px]" />}
        {!loading && !error && !items.length && <Empty />}
        {error && <ErrorNote />}
      </Grid>
      <Sentinel onMore={more} active={hasMore && !loading} />
      <Drawer c={C} slug={slug}>{slug && <ItemDetail slug={slug} />}</Drawer>
    </>
  )
}

function ItemDetail({ slug }: { slug: string }) {
  const { data: it, loading, error } = useResource<any>(`/magicitems/${slug}/`)
  if (error) return <ErrorNote />
  if (loading || !it) return <DrawerLoading />
  const c = rarityColor(it.rarity)
  return (
    <article>
      <div className="relative grid place-items-center overflow-hidden rounded-2xl border border-white/5 bg-black/30 py-10">
        <span className="absolute size-48 rounded-full opacity-30 blur-3xl" style={{ background: c }} />
        <Gem color={c} className="relative size-20 drop-shadow-[0_0_20px_rgba(0,0,0,.6)]" />
        <span className="relative mt-4 font-display text-sm tracking-[.4em]" style={{ color: c }}>{cap(it.rarity).toUpperCase()}</span>
      </div>
      <h2 className="mt-7 font-display text-5xl leading-none text-bone">{it.name}</h2>
      <p className="mt-2 italic text-smoke">{it.type}{it.requires_attunement ? ` (${it.requires_attunement})` : ''}</p>
      <div className="mt-6 text-[16px]"><Md roll text={it.desc} /></div>
      <div className="mt-8 border-t border-white/5 pt-5 text-right"><Source title={it.document__title} /></div>
    </article>
  )
}
