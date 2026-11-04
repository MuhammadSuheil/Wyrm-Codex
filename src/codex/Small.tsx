import { useEffect, useMemo, useState } from 'react'
import { useResource, type Page } from '../api'
import Md from '../Md'
import { rollable } from './dice'
import { go, href, type Cat } from './routes'
import { Chips, Drawer, DrawerLoading, Empty, ErrorNote, Fact, Grid, PageHeader, ResultsMeta, Search, Section, Select, Skeleton, Source, Tag, Toolbar } from './ui'

type Doc = { document__title: string }
const match = (q: string, ...xs: (string | undefined)[]) => !q || xs.some((x) => x?.toLowerCase().includes(q.toLowerCase()))
const sourceOpts = (items: Doc[]): [string, string][] => [['', 'All sources'], ...[...new Set(items.map((i) => i.document__title))].sort().map((t) => [t, t] as [string, string])]

/* ---------- Backgrounds ---------- */
type B = Doc & { slug: string; name: string; skill_proficiencies: string; feature: string; languages: string; tool_proficiencies: string }
export function Backgrounds({ slug }: { slug: string | null }) {
  const c: Cat = 'backgrounds'
  const { data, loading, error } = useResource<Page<B>>('/backgrounds/?limit=100&fields=slug,name,skill_proficiencies,feature,languages,tool_proficiencies,document__title')
  const [q, setQ] = useState(''); const [src, setSrc] = useState('')
  const all = data?.results ?? []
  const list = all.filter((b) => match(q, b.name, b.skill_proficiencies, b.feature) && (!src || b.document__title === src))
  return (
    <>
      <PageHeader c={c} count={data?.count} />
      <Toolbar>
        <Search value={q} onChange={setQ} placeholder="Search backgrounds… acolyte, sage, a skill" />
        <Select label="Source" value={src} onChange={setSrc} options={sourceOpts(all)} />
      </Toolbar>
      <ResultsMeta count={data ? list.length : null} loading={loading} dirty={!!(q || src)} onReset={() => { setQ(''); setSrc('') }} />
      <Grid>
        {list.map((b, i) => (
          <button key={b.slug} onClick={() => go(c, b.slug)} className="codex-card rise group relative flex h-[190px] flex-col overflow-hidden rounded-2xl p-6 text-left" style={{ animationDelay: `${(i % 12) * 30}ms` }}>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute -right-4 -top-4 size-28 text-white/[.03] transition group-hover:text-ember/10" fill="currentColor"><path d="M5 3h11l3 3v15H5V3Zm3 5v1.5h8V8H8Zm0 4v1.5h8V12H8Zm0 4v1.5h5V16H8Z" /></svg>
            <h3 className="relative font-display text-2xl leading-tight text-bone transition group-hover:text-flame">{b.name}</h3>
            {b.feature && <p className="relative mt-1.5 text-sm italic text-gold/90">Feature: {b.feature}</p>}
            <p className="relative mt-3 line-clamp-2 text-sm text-smoke">{b.skill_proficiencies}</p>
            <div className="relative mt-auto text-right"><Source title={b.document__title} /></div>
          </button>
        ))}
        {loading && <Skeleton n={12} h="h-[190px]" />}
        {data && !list.length && <Empty />}
        {error && <ErrorNote />}
      </Grid>
      <Drawer c={c} slug={slug}>{slug && <BackgroundDetail slug={slug} />}</Drawer>
    </>
  )
}
function BackgroundDetail({ slug }: { slug: string }) {
  const { data: b, loading, error } = useResource<any>(`/backgrounds/${slug}/`)
  if (error) return <ErrorNote />
  if (loading || !b) return <DrawerLoading />
  return (
    <article>
      <h2 className="font-display text-6xl leading-none text-bone">{b.name}</h2>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Fact k="Skills" v={b.skill_proficiencies} /><Fact k="Tools" v={b.tool_proficiencies !== 'None' && b.tool_proficiencies} />
        <Fact k="Languages" v={b.languages !== 'None' && b.languages} /><Fact k="Equipment" v={b.equipment} />
      </div>
      <div className="mt-7"><Md text={b.desc} /></div>
      {b.feature && <Section title={`Feature · ${b.feature}`}><div className="rounded-xl border border-gold/25 bg-gold/[.04] p-5"><Md text={b.feature_desc} /></div></Section>}
      {b.suggested_characteristics && <Section title="Suggested Characteristics"><Md roll text={b.suggested_characteristics} /></Section>}
      <div className="mt-8 border-t border-white/5 pt-5 text-right"><Source title={b.document__title} /></div>
    </article>
  )
}

/* ---------- Feats ---------- */
type F = Doc & { slug: string; name: string; prerequisite: string; desc: string; effects_desc: string[] }
export function Feats({ slug }: { slug: string | null }) {
  const c: Cat = 'feats'
  const { data, loading, error } = useResource<Page<F>>('/feats/?limit=200')
  const [q, setQ] = useState(''); const [src, setSrc] = useState(''); const [pre, setPre] = useState<'' | 'none' | 'some'>('')
  const all = data?.results ?? []
  const list = all.filter((f) => match(q, f.name, f.desc, f.prerequisite) && (!src || f.document__title === src) && (!pre || (pre === 'none' ? !f.prerequisite : !!f.prerequisite)))
  const sel = slug ? all.find((f) => f.slug === slug) : null
  return (
    <>
      <PageHeader c={c} count={data?.count} />
      <Toolbar>
        <Search value={q} onChange={setQ} placeholder="Search feats… grappler, alert, a keyword" />
        <Select label="Source" value={src} onChange={setSrc} options={sourceOpts(all)} />
        <Chips value={pre} onChange={setPre} options={[['', 'All'], ['none', 'No prerequisite'], ['some', 'Has prerequisite']]} />
      </Toolbar>
      <ResultsMeta count={data ? list.length : null} loading={loading} dirty={!!(q || src || pre)} onReset={() => { setQ(''); setSrc(''); setPre('') }} />
      <Grid>
        {list.map((f, i) => (
          <button key={f.slug} onClick={() => go(c, f.slug)} className="codex-card rise group relative flex h-[180px] flex-col overflow-hidden rounded-2xl p-6 text-left" style={{ animationDelay: `${(i % 12) * 30}ms` }}>
            <h3 className="font-display text-2xl leading-tight text-bone transition group-hover:text-flame">{f.name}</h3>
            <p className="mt-1.5 truncate text-xs tracking-wide text-gold/90">{f.prerequisite ? f.prerequisite.replace(/^Prerequisite:\s*/i, 'Requires ') : 'No prerequisite'}</p>
            <p className="mt-3 line-clamp-2 text-sm text-smoke">{f.desc}</p>
            <div className="mt-auto flex items-center justify-between pt-2"><Tag>{f.effects_desc?.length ?? 0} benefits</Tag><Source title={f.document__title} /></div>
          </button>
        ))}
        {loading && <Skeleton n={12} h="h-[180px]" />}
        {data && !list.length && <Empty />}
        {error && <ErrorNote />}
      </Grid>
      <Drawer c={c} slug={slug}>
        {slug && (sel ? (
          <article>
            <h2 className="font-display text-5xl leading-none text-bone">{sel.name}</h2>
            {sel.prerequisite && <p className="mt-3"><Tag tone="gold">{sel.prerequisite.replace(/^Prerequisite:\s*/i, '')}</Tag></p>}
            <div className="mt-6"><Md roll text={sel.desc} /></div>
            {!!sel.effects_desc?.length && (
              <Section title="Benefits">
                <ol className="space-y-3">
                  {sel.effects_desc.map((e, i) => (
                    <li key={i} className="flex gap-4 rounded-xl border border-white/5 bg-white/[.025] p-4">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-ember/50 font-display text-sm text-flame">{i + 1}</span>
                      <span className="text-bone/85">{rollable(e)}</span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}
            <div className="mt-8 border-t border-white/5 pt-5 text-right"><Source title={sel.document__title} /></div>
          </article>
        ) : <DrawerLoading />)}
      </Drawer>
    </>
  )
}

/* ---------- Equipment ---------- */
type W = Doc & { slug: string; name: string; category: string; cost: string; damage_dice: string; damage_type: string; weight: string; properties: string[] }
type A = Doc & { slug: string; name: string; category: string; ac_string: string; strength_requirement: number | null; stealth_disadvantage: boolean; cost: string; weight: string }
export function Equipment() {
  const c: Cat = 'equipment'
  const w = useResource<Page<W>>('/weapons/?limit=200'), a = useResource<Page<A>>('/armor/?limit=200')
  const [tab, setTab] = useState<'weapons' | 'armor'>('weapons'); const [q, setQ] = useState(''); const [kind, setKind] = useState(''); const [src, setSrc] = useState('')
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: 'name', dir: 1 })
  useEffect(() => { setKind(''); setSort({ k: 'name', dir: 1 }) }, [tab])
  const rows = (tab === 'weapons' ? w.data?.results : a.data?.results) ?? []
  const kinds = [...new Set(rows.map((r) => r.category))].sort()
  const list = useMemo(() => rows
    .filter((r) => match(q, r.name, (r as W).properties?.join(' ')) && (!kind || r.category === kind) && (!src || r.document__title === src))
    .sort((x, y) => { const vx = (x as any)[sort.k] ?? '', vy = (y as any)[sort.k] ?? ''; return (typeof vx === 'number' ? vx - vy : String(vx).localeCompare(String(vy), undefined, { numeric: true })) * sort.dir }), [rows, q, kind, src, sort])
  const Th = ({ k, children, className = '' }: { k: string; children: React.ReactNode; className?: string }) => (
    <th className={`whitespace-nowrap px-4 py-3 font-normal ${className}`}>
      <button onClick={() => setSort((s) => ({ k, dir: s.k === k ? (-s.dir as 1 | -1) : 1 }))} className={`inline-flex items-center gap-1 transition hover:text-bone ${sort.k === k ? 'text-bone' : ''}`}>
        {children}{sort.k === k && <span className="text-flame">{sort.dir === 1 ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
  const loading = w.loading || a.loading
  return (
    <>
      <PageHeader c={c} count={w.data && a.data ? w.data.count + a.data.count : undefined}>
        <Chips className="mt-6" value={tab} onChange={setTab} options={[['weapons', `Weapons${w.data ? ` · ${w.data.count}` : ''}`], ['armor', `Armor${a.data ? ` · ${a.data.count}` : ''}`]]} />
      </PageHeader>
      <Toolbar>
        <Search value={q} onChange={setQ} placeholder={tab === 'weapons' ? 'Search weapons… longsword, finesse, thrown' : 'Search armor… plate, shield'} />
        <Select label="Category" value={kind} onChange={setKind} options={[['', 'All categories'], ...kinds.map((k) => [k, k] as [string, string])]} />
        <Select label="Source" value={src} onChange={setSrc} options={sourceOpts(rows)} />
      </Toolbar>
      <ResultsMeta count={loading ? null : list.length} loading={loading} dirty={!!(q || kind || src)} onReset={() => { setQ(''); setKind(''); setSrc('') }} />
      <div className="mx-auto max-w-7xl px-5 pb-24">
        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-coal/40">
          <table className="w-full min-w-[760px] text-left text-[15px]">
            <thead className="border-b border-ember/30 bg-ember/[.07] font-display tracking-wide text-gold">
              {tab === 'weapons'
                ? <tr><Th k="name">Weapon</Th><Th k="category">Category</Th><Th k="damage_dice">Damage</Th><th className="px-4 py-3 font-normal">Properties</th><Th k="cost">Cost</Th><Th k="weight">Weight</Th></tr>
                : <tr><Th k="name">Armor</Th><Th k="category">Category</Th><Th k="ac_string">Armor Class</Th><Th k="strength_requirement">Strength</Th><th className="px-4 py-3 font-normal">Stealth</th><Th k="cost">Cost</Th><Th k="weight">Weight</Th></tr>}
            </thead>
            <tbody>
              {loading && Array.from({ length: 10 }, (_, i) => <tr key={i}><td colSpan={7} className="px-4 py-2"><div className="skeleton h-6 rounded" /></td></tr>)}
              {list.map((r) => tab === 'weapons' ? (() => { const x = r as W; return (
                <tr key={x.slug} className="border-t border-white/5 transition hover:bg-ember/[.05]">
                  <td className="px-4 py-3 font-display text-lg text-bone">{x.name}<span className="block font-sans text-[11px] italic text-smoke/70">{x.document__title}</span></td>
                  <td className="px-4 py-3 text-sm text-smoke">{x.category.replace(' Weapons', '')}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{x.damage_dice ? rollable(x.damage_dice) : '—'} <span className="text-sm text-smoke">{x.damage_type}</span></td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(x.properties ?? []).map((p) => <Tag key={p}>{p}</Tag>)}</div></td>
                  <td className="px-4 py-3 whitespace-nowrap text-gold">{x.cost}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-smoke">{x.weight || '—'}</td>
                </tr>) })() : (() => { const x = r as A; return (
                <tr key={x.slug} className="border-t border-white/5 transition hover:bg-ember/[.05]">
                  <td className="px-4 py-3 font-display text-lg text-bone">{x.name}<span className="block font-sans text-[11px] italic text-smoke/70">{x.document__title}</span></td>
                  <td className="px-4 py-3 text-sm text-smoke">{x.category}</td>
                  <td className="px-4 py-3">{x.ac_string}</td>
                  <td className="px-4 py-3 text-sm text-smoke">{x.strength_requirement ? `Str ${x.strength_requirement}` : '—'}</td>
                  <td className="px-4 py-3">{x.stealth_disadvantage ? <Tag tone="ember">Disadvantage</Tag> : <span className="text-smoke">—</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gold">{x.cost || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-smoke">{x.weight || '—'}</td>
                </tr>) })())}
            </tbody>
          </table>
          {!loading && !list.length && <Empty />}
          {(w.error || a.error) && <ErrorNote />}
        </div>
      </div>
    </>
  )
}

/* ---------- Rules ---------- */
type Sec = { slug: string; name: string; parent: string }
const ORDER = ['Characters', 'Character Advancement', 'Equipment', 'Gameplay Mechanics', 'Combat', 'Rules', 'Legal Information']
export function Rules({ slug }: { slug: string | null }) {
  const c: Cat = 'rules'
  const { data, loading, error } = useResource<Page<Sec>>('/sections/?limit=100&fields=slug,name,parent')
  const [q, setQ] = useState('')
  const all = data?.results ?? []
  const groups = ORDER.map((p) => [p, all.filter((s) => s.parent === p && match(q, s.name)).sort((a, b) => a.name.localeCompare(b.name))] as const).filter(([, s]) => s.length)
  const active = slug ?? groups[0]?.[1][0]?.slug ?? null
  const doc = useResource<any>(active ? `/sections/${active}/` : null)
  useEffect(() => { if (slug) scrollTo({ top: 0, behavior: 'smooth' }) }, [slug])
  return (
    <>
      <PageHeader c={c} count={data?.count} />
      <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-24 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
          <Search value={q} onChange={setQ} placeholder="Find a rule…" />
          {loading && <div className="mt-5 space-y-2"><Skeleton n={8} h="h-7" /></div>}
          {error && <ErrorNote />}
          <nav className="mt-5 space-y-5">
            {groups.map(([p, secs]) => (
              <div key={p}>
                <p className="mb-1.5 font-display text-xs tracking-[.35em] text-ember">{p.toUpperCase()}</p>
                <ul className="border-l border-white/8">
                  {secs.map((s) => (
                    <li key={s.slug}><a href={href(c, s.slug)} className={`-ml-px block border-l-2 py-1.5 pl-4 text-[15px] transition ${s.slug === active ? 'border-flame text-bone' : 'border-transparent text-smoke hover:border-gold/40 hover:text-bone'}`}>{s.name}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
        <article className="min-w-0 rounded-2xl border border-white/5 bg-coal/40 p-6 md:p-10">
          {doc.loading || !doc.data ? <DrawerLoading /> : (
            <>
              <p className="font-display text-xs tracking-[.4em] text-gold">{doc.data.parent?.toUpperCase()}</p>
              <h2 className="mt-2 mb-6 font-display text-5xl leading-none text-bone">{doc.data.name}</h2>
              <div className="rules-prose text-[16.5px]"><Md roll text={doc.data.desc.replace(/^#\s[^\n]*\n/, '')} /></div>
            </>
          )}
        </article>
      </div>
    </>
  )
}

/* ---------- Conditions ---------- */
type Cd = { slug: string; name: string; desc: string }
export function Conditions({ slug }: { slug: string | null }) {
  const c: Cat = 'conditions'
  const { data, loading, error } = useResource<Page<Cd>>('/conditions/?limit=50')
  const [q, setQ] = useState('')
  const list = (data?.results ?? []).filter((x) => match(q, x.name, x.desc))
  useEffect(() => { if (slug && data) document.getElementById(`cond-${slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [slug, data])
  return (
    <>
      <PageHeader c={c} count={data?.count} />
      <Toolbar><Search value={q} onChange={setQ} placeholder="Search conditions… prone, stunned, advantage" /></Toolbar>
      <div className="mx-auto max-w-7xl columns-1 gap-4 px-5 pt-6 pb-24 md:columns-2 xl:columns-3">
        {list.map((x, i) => (
          <a id={`cond-${x.slug}`} key={x.slug} href={href(c, x.slug)} className={`codex-card rise mb-4 block break-inside-avoid rounded-2xl p-6 ${slug === x.slug ? '!border-ember/70 shadow-[0_0_40px_-12px_rgba(200,32,43,.7)]' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>
            <h3 className="mb-2 flex items-center gap-3 font-display text-2xl text-bone">
              <span className="grid size-9 place-items-center rounded-full border border-ember/40 bg-ember/10 font-display text-base text-flame">{x.name[0]}</span>{x.name}
            </h3>
            <Md text={x.desc} className="text-[15px]" />
          </a>
        ))}
        {loading && <Grid><Skeleton n={6} h="h-48" /></Grid>}
        {data && !list.length && <Empty />}
        {error && <ErrorNote />}
      </div>
    </>
  )
}
