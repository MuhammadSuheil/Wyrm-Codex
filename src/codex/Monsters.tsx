import { useMemo, useState } from 'react'
import { cap, qs, useDebounced, useInfinite, useResource } from '../api'
import Md from '../Md'
import { roll, rollable } from './dice'
import { go, type Cat } from './routes'
import { Chips, Drawer, DrawerLoading, Empty, ErrorNote, Grid, PageHeader, ResultsMeta, Search, Select, Sentinel, Skeleton, Source, SourceSelect, Tag, Toolbar } from './ui'

const C: Cat = 'monsters'
type M = { slug: string; name: string; size: string; type: string; subtype: string; alignment: string; armor_class: number; hit_points: number; challenge_rating: string; cr: number; img_main: string | null; document__title: string }

const TYPES = ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Swarm', 'Undead']
const SIZES = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const CR: [string, string, { cr__gte?: number; cr__lte?: number }][] = [
  ['', 'Any CR', {}], ['low', 'CR 0–1', { cr__lte: 1 }], ['mid', 'CR 2–4', { cr__gte: 2, cr__lte: 4 }], ['high', 'CR 5–10', { cr__gte: 5, cr__lte: 10 }],
  ['epic', 'CR 11–16', { cr__gte: 11, cr__lte: 16 }], ['myth', 'CR 17+', { cr__gte: 17 }],
]
const XP: Record<string, string> = { '0': '10', '1/8': '25', '1/4': '50', '1/2': '100', '1': '200', '2': '450', '3': '700', '4': '1,100', '5': '1,800', '6': '2,300', '7': '2,900', '8': '3,900', '9': '5,000', '10': '5,900', '11': '7,200', '12': '8,400', '13': '10,000', '14': '11,500', '15': '13,000', '16': '15,000', '17': '18,000', '18': '20,000', '19': '22,000', '20': '25,000', '21': '33,000', '22': '41,000', '23': '50,000', '24': '62,000', '25': '75,000', '26': '90,000', '27': '105,000', '28': '120,000', '29': '135,000', '30': '155,000' }
export const goodImg = (u?: string | null) => (u && /\.(png|jpe?g|webp)$/i.test(u) ? u.replace('http://', 'https://') : null)
const crTone = (cr: number) => (cr >= 17 ? 'from-[#f3d79a] to-[#8a6024] text-[#1a0f08]' : cr >= 11 ? 'from-[#ff5a3c] to-[#6b0d13] text-bone' : cr >= 5 ? 'from-[#c8202b] to-[#3a070b] text-bone' : 'from-[#3a3238] to-[#141011] text-bone')

export default function Monsters({ slug }: { slug: string | null }) {
  const [q, setQ] = useState(''); const [type, setType] = useState(''); const [size, setSize] = useState(''); const [cr, setCr] = useState('')
  const [src, setSrc] = useState(''); const [sort, setSort] = useState('name')
  const dq = useDebounced(q)
  const url = useMemo(() => `/monsters/?${qs({
    limit: 48, fields: 'slug,name,size,type,subtype,alignment,armor_class,hit_points,challenge_rating,cr,img_main,document__title',
    search: dq, type__iexact: type, size__iexact: size, document__slug: src, ordering: sort, ...CR.find((c) => c[0] === cr)![2],
  })}`, [dq, type, size, cr, src, sort])
  const { items, count, loading, error, hasMore, more } = useInfinite<M>(url)
  const dirty = !!(q || type || size || cr || src || sort !== 'name')
  const reset = () => { setQ(''); setType(''); setSize(''); setCr(''); setSrc(''); setSort('name') }

  return (
    <>
      <PageHeader c={C} count={count != null && !dirty ? count : undefined} />
      <Toolbar>
        <Search value={q} onChange={setQ} placeholder="Search the bestiary… aboleth, lich, owlbear" />
        <Select label="Type" value={type} onChange={setType} options={[['', 'All types'], ...TYPES.map((t) => [t, t] as [string, string])]} />
        <Select label="Size" value={size} onChange={setSize} options={[['', 'Any size'], ...SIZES.map((t) => [t, t] as [string, string])]} />
        <SourceSelect value={src} onChange={setSrc} />
        <Select label="Sort" value={sort} onChange={setSort} options={[['name', 'A to Z'], ['-cr', 'Deadliest first'], ['cr', 'Weakest first'], ['-hit_points', 'Most hit points']]} />
        <Chips className="w-full" value={cr} onChange={setCr} options={CR.map(([v, l]) => [v, l])} />
      </Toolbar>
      <ResultsMeta count={count} loading={loading} dirty={dirty} onReset={reset} />
      <Grid>
        {items.map((m, i) => <MonsterCard key={m.slug} m={m} i={i} />)}
        {loading && <Skeleton n={items.length ? 4 : 12} h="h-[178px]" />}
        {!loading && !error && !items.length && <Empty />}
        {error && <ErrorNote />}
      </Grid>
      <Sentinel onMore={more} active={hasMore && !loading} />
      <Drawer c={C} slug={slug}>{slug && <StatBlock slug={slug} />}</Drawer>
    </>
  )
}

function MonsterCard({ m, i }: { m: M; i: number }) {
  const img = goodImg(m.img_main)
  return (
    <button onClick={() => go(C, m.slug)} className="codex-card rise group relative flex h-[178px] flex-col overflow-hidden rounded-2xl p-5 text-left" style={{ animationDelay: `${(i % 12) * 30}ms` }}>
      {img && <img src={img} alt="" loading="lazy" className="pointer-events-none absolute -right-8 -bottom-6 h-[150%] w-auto max-w-none opacity-[.13] mix-blend-screen invert transition duration-500 group-hover:scale-105 group-hover:opacity-25" />}
      <div className="relative flex items-start gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-full border border-gold/50 bg-gradient-to-br shadow-[0_6px_14px_-4px_rgba(0,0,0,.8)] ${crTone(m.cr)}`}>
          <span className="text-center leading-none"><span className="block text-[8px] tracking-widest opacity-70">CR</span><span className="font-display text-[17px]">{m.challenge_rating}</span></span>
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 font-display text-xl leading-tight text-bone transition group-hover:text-flame">{m.name}</span>
          <span className="mt-1 block truncate text-sm italic text-smoke">{cap(m.size)} {m.type.toLowerCase()}{m.subtype ? ` (${m.subtype})` : ''}</span>
        </span>
      </div>
      <div className="relative mt-auto flex items-center gap-2">
        <Tag><svg viewBox="0 0 24 24" className="mr-1 size-3" fill="currentColor"><path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5l-8-3Z" /></svg>AC {m.armor_class}</Tag>
        <Tag><svg viewBox="0 0 24 24" className="mr-1 size-3" fill="currentColor"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11Z" /></svg>HP {m.hit_points}</Tag>
        <span className="ml-auto max-w-[45%]"><Source title={m.document__title} /></span>
      </div>
    </button>
  )
}

type Act = { name: string; desc: string }
const mod = (n: number) => { const m = Math.floor((n - 10) / 2); return `${m >= 0 ? '+' : ''}${m}` }
const ABIL = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const

function StatBlock({ slug }: { slug: string }) {
  const { data: m, loading, error } = useResource<any>(`/monsters/${slug}/`)
  if (error) return <ErrorNote />
  if (loading || !m) return <DrawerLoading />
  const img = goodImg(m.img_main)
  const speed = Object.entries(m.speed ?? {}).filter(([k]) => k !== 'hover').map(([k, v]) => (k === 'walk' ? `${v} ft.` : `${k} ${v} ft.`)).join(', ')
  const saves = ABIL.filter((a) => m[`${a}_save`] != null).map((a) => `${cap(a.slice(0, 3))} ${m[`${a}_save`] >= 0 ? '+' : ''}${m[`${a}_save`]}`).join(', ')
  const skills = Object.entries(m.skills ?? {}).map(([k, v]) => `${cap(k)} ${(v as number) >= 0 ? '+' : ''}${v}`).join(', ')
  const props: [string, string][] = [['Saving Throws', saves], ['Skills', skills], ['Damage Vulnerabilities', m.damage_vulnerabilities], ['Damage Resistances', m.damage_resistances], ['Damage Immunities', m.damage_immunities], ['Condition Immunities', m.condition_immunities], ['Senses', m.senses], ['Languages', m.languages || '—']]
  const blocks: [string, Act[] | null, string?][] = [['', m.special_abilities], ['Actions', m.actions], ['Bonus Actions', m.bonus_actions], ['Reactions', m.reactions], ['Legendary Actions', m.legendary_actions, m.legendary_desc]]
  return (
    <article>
      {img && <div className="statblock-art mb-7 overflow-hidden rounded-xl"><img src={img} alt={m.name} className="mx-auto max-h-72 w-auto mix-blend-multiply" /></div>}
      <h2 className="font-display text-5xl leading-none text-bone">{m.name}</h2>
      <p className="mt-2 italic text-smoke">{cap(m.size)} {m.type.toLowerCase()}{m.subtype ? ` (${m.subtype})` : ''}, {m.alignment}</p>
      <Rule />
      <div className="grid grid-cols-3 gap-3">
        {[['Armor Class', `${m.armor_class}`, m.armor_desc], ['Hit Points', `${m.hit_points}`, m.hit_dice], ['Speed', speed, '']].map(([k, v, s]) => (
          <div key={k} className="rounded-xl border border-white/5 bg-white/[.025] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[.2em] text-smoke">{k}</p>
            <p className="mt-0.5 font-display text-2xl leading-tight text-bone">{v}</p>
            {s && <p className="text-xs text-smoke">{k === 'Hit Points' ? rollable(s) : s}</p>}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-6 gap-2">
        {ABIL.map((a) => (
          <button key={a} onClick={() => roll(mod(m[a]), `${cap(a)} check`)} title={`Roll a ${cap(a)} check`}
            className="group rounded-xl border border-ember/20 bg-gradient-to-b from-ember/10 to-transparent py-2.5 text-center transition hover:border-ember/60">
            <span className="block font-display text-xs tracking-widest text-gold">{a.slice(0, 3).toUpperCase()}</span>
            <span className="block font-display text-2xl text-bone">{m[a]}</span>
            <span className="block text-xs text-[#ff8a7a] group-hover:text-flame">{mod(m[a])}</span>
          </button>
        ))}
      </div>
      <Rule />
      <dl className="space-y-1.5 text-[15px]">
        {props.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="inline font-semibold text-bone">{k} </dt><dd className="inline text-bone/75">{v}</dd></div>)}
        <div><dt className="inline font-semibold text-bone">Challenge </dt><dd className="inline text-bone/75">{m.challenge_rating} ({XP[m.challenge_rating] ?? '—'} XP)</dd></div>
      </dl>
      {blocks.map(([title, acts, intro]) => acts?.length ? (
        <section key={title || 'traits'} className="mt-7">
          {title && <h3 className="mb-3 border-b border-ember/40 pb-1.5 font-display text-2xl text-[#ff8a7a]">{title}</h3>}
          {intro && <p className="mb-3 text-bone/75">{intro}</p>}
          <div className="space-y-3">{acts.map((a) => <Md key={a.name} roll text={`***${a.name}.*** ${a.desc}`} className="!my-0 text-[15px]" />)}</div>
        </section>
      ) : null)}
      {m.desc && <section className="mt-8 border-t border-white/5 pt-6"><Md text={m.desc} /></section>}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/5 pt-5">
        {(m.environments ?? []).map((e: string) => <Tag key={e}>{e}</Tag>)}
        <span className="ml-auto"><Source title={m.document__title} /></span>
      </div>
    </article>
  )
}

const Rule = () => <svg viewBox="0 0 400 8" preserveAspectRatio="none" className="my-5 h-2 w-full text-ember"><path d="M0 4 L400 0 L400 8 Z" fill="currentColor" opacity=".8" /></svg>
