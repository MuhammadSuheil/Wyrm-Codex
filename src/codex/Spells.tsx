import { useMemo, useState } from 'react'
import { cap, qs, useDebounced, useInfinite, useResource } from '../api'
import Md from '../Md'
import { go, type Cat } from './routes'
import { Chips, Drawer, DrawerLoading, Empty, ErrorNote, Fact, Grid, PageHeader, ResultsMeta, Search, Section, Select, Sentinel, Skeleton, Source, SourceSelect, Tag, Toggle, Toolbar } from './ui'

const C: Cat = 'spells'
type S = { slug: string; name: string; level_int: number; school: string; casting_time: string; range: string; duration: string; requires_concentration: boolean; ritual: string; components: string; dnd_class: string; document__title: string }

// Each school of magic gets its own hue
export const SCHOOL: Record<string, string> = {
  abjuration: '#5aa6e8', conjuration: '#e8a54a', divination: '#a8d8e8', enchantment: '#e87ab8',
  evocation: '#ff5a3c', illusion: '#a58ae8', necromancy: '#7fd18b', transmutation: '#d6c35a',
}
const hue = (s: string) => SCHOOL[s?.toLowerCase()] ?? '#d6a85a'
const CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']
export const lvl = (n: number) => (n === 0 ? 'Cantrip' : `${n}${['st', 'nd', 'rd'][n - 1] ?? 'th'}-level`)

export default function Spells({ slug }: { slug: string | null }) {
  const [q, setQ] = useState(''); const [level, setLevel] = useState(''); const [school, setSchool] = useState(''); const [klass, setKlass] = useState('')
  const [conc, setConc] = useState(false); const [src, setSrc] = useState(''); const [sort, setSort] = useState('name')
  const dq = useDebounced(q)
  const url = useMemo(() => `/spells/?${qs({
    limit: 48, fields: 'slug,name,level_int,school,casting_time,range,duration,requires_concentration,ritual,components,dnd_class,document__title',
    search: dq, level_int: level, school__iexact: school, dnd_class__icontains: klass, requires_concentration: conc, document__slug: src, ordering: sort,
  })}`, [dq, level, school, klass, conc, src, sort])
  const { items, count, loading, error, hasMore, more } = useInfinite<S>(url)
  const dirty = !!(q || level || school || klass || conc || src || sort !== 'name')
  const reset = () => { setQ(''); setLevel(''); setSchool(''); setKlass(''); setConc(false); setSrc(''); setSort('name') }

  return (
    <>
      <PageHeader c={C} count={count != null && !dirty ? count : undefined} />
      <Toolbar>
        <Search value={q} onChange={setQ} placeholder="Search the weave… fireball, shield, wish" />
        <Select label="School" value={school} onChange={setSchool} options={[['', 'All schools'], ...Object.keys(SCHOOL).map((s) => [s, cap(s)] as [string, string])]} />
        <Select label="Class" value={klass} onChange={setKlass} options={[['', 'All classes'], ...CLASSES.map((c) => [c, c] as [string, string])]} />
        <SourceSelect value={src} onChange={setSrc} />
        <Select label="Sort" value={sort} onChange={setSort} options={[['name', 'A to Z'], ['spell_level', 'Lowest level'], ['-spell_level', 'Highest level']]} />
        <Toggle on={conc} onChange={setConc}>Concentration</Toggle>
        <Chips className="w-full" value={level} onChange={setLevel} options={[['', 'All levels'], ['0', 'Cantrip'], ...Array.from({ length: 9 }, (_, i) => [`${i + 1}`, `${i + 1}`] as [string, string])]} />
      </Toolbar>
      <ResultsMeta count={count} loading={loading} dirty={dirty} onReset={reset} />
      <Grid>
        {items.map((s, i) => <SpellCard key={s.slug} s={s} i={i} />)}
        {loading && <Skeleton n={items.length ? 4 : 12} h="h-[168px]" />}
        {!loading && !error && !items.length && <Empty />}
        {error && <ErrorNote />}
      </Grid>
      <Sentinel onMore={more} active={hasMore && !loading} />
      <Drawer c={C} slug={slug}>{slug && <SpellDetail slug={slug} />}</Drawer>
    </>
  )
}

function SpellCard({ s, i }: { s: S; i: number }) {
  const h = hue(s.school)
  return (
    <button onClick={() => go(C, s.slug)} className="codex-card rise group relative flex h-[168px] flex-col overflow-hidden rounded-2xl p-5 text-left" style={{ animationDelay: `${(i % 12) * 30}ms`, ['--hue' as string]: h }}>
      <span className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40" style={{ background: h }} />
      <div className="relative flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 bg-black/40 font-display text-xl" style={{ borderColor: `${h}aa`, color: h, boxShadow: `0 0 16px -4px ${h}` }}>{s.level_int === 0 ? 'C' : s.level_int}</span>
        <span className="min-w-0">
          <span className="line-clamp-2 font-display text-xl leading-tight text-bone transition group-hover:text-flame">{s.name}</span>
          <span className="mt-1 block truncate text-sm italic" style={{ color: `${h}cc` }}>{lvl(s.level_int)} {s.school.toLowerCase()}</span>
        </span>
      </div>
      <div className="relative mt-auto space-y-2.5">
        <p className="flex gap-3 truncate text-xs text-smoke"><span>{s.casting_time}</span><span className="text-white/15">|</span><span className="truncate">{s.range}</span></p>
        <div className="flex items-center gap-1.5">
          {s.requires_concentration && <Tag tone="gold">Concentration</Tag>}
          {s.ritual === 'yes' && <Tag tone="gold">Ritual</Tag>}
          <Tag>{s.components}</Tag>
          <span className="ml-auto max-w-[40%]"><Source title={s.document__title} /></span>
        </div>
      </div>
    </button>
  )
}

function SpellDetail({ slug }: { slug: string }) {
  const { data: s, loading, error } = useResource<any>(`/spells/${slug}/`)
  if (error) return <ErrorNote />
  if (loading || !s) return <DrawerLoading />
  const h = hue(s.school)
  return (
    <article>
      <div className="relative">
        <span className="pointer-events-none absolute -left-10 -top-16 size-60 rounded-full opacity-25 blur-3xl" style={{ background: h }} />
        <p className="relative font-display text-sm tracking-[.35em]" style={{ color: h }}>{lvl(+s.level_int).toUpperCase()} {s.school.toUpperCase()}</p>
        <h2 className="relative mt-2 font-display text-5xl leading-none text-bone">{s.name}</h2>
        <div className="relative mt-3 flex flex-wrap gap-1.5">
          {s.requires_concentration && <Tag tone="gold">Concentration</Tag>}
          {s.can_be_cast_as_ritual && <Tag tone="gold">Ritual</Tag>}
        </div>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <Fact k="Casting Time" v={s.casting_time} /><Fact k="Range" v={s.range} />
        <Fact k="Components" v={s.components} /><Fact k="Duration" v={s.duration} />
      </div>
      {s.material && <p className="mt-3 text-sm italic text-smoke">Material: {s.material}</p>}
      <div className="mt-7 text-[16px]"><Md roll text={s.desc} /></div>
      {s.higher_level && <Section title="At Higher Levels"><Md roll text={s.higher_level} /></Section>}
      <Section title="Spell Lists">
        <div className="flex flex-wrap gap-1.5">{(s.dnd_class || '').split(',').filter(Boolean).map((c: string) => <Tag key={c} tone="ember">{c.trim()}</Tag>)}</div>
      </Section>
      <div className="mt-8 border-t border-white/5 pt-5 text-right"><Source title={s.document__title} /></div>
    </article>
  )
}
