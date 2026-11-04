import { useState } from 'react'
import { useResource, type Page } from '../api'
import { ClassEmblem } from '../ClassIcons'
import Md from '../Md'
import { go, type Cat } from './routes'
import { Chips, Drawer, DrawerLoading, ErrorNote, Fact, Grid, PageHeader, Skeleton, Source } from './ui'

const C: Cat = 'classes'
type Arch = { name: string; slug: string; desc: string; document__title: string }
type K = { slug: string; name: string; hit_dice: string; prof_saving_throws: string; spellcasting_ability: string; subtypes_name: string; archetypes: Arch[]; prof_armor: string; document__title: string }

const FIELDS = 'slug,name,hit_dice,prof_saving_throws,spellcasting_ability,subtypes_name,archetypes,prof_armor,document__title'

export default function Classes({ slug }: { slug: string | null }) {
  const { data, loading, error } = useResource<Page<K>>(`/classes/?limit=50&fields=${FIELDS}`)
  const list = data?.results ?? []
  const subs = list.reduce((a, k) => a + k.archetypes.length, 0)
  return (
    <>
      <PageHeader c={C} count={data?.count}>
        {!!subs && <p className="mt-2 font-display tracking-[.3em] text-gold">WITH {subs} SUBCLASSES</p>}
      </PageHeader>
      <Grid className="pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((k, i) => (
          <button key={k.slug} onClick={() => go(C, k.slug)} className="codex-card rise group relative flex flex-col overflow-hidden rounded-2xl p-6 text-left" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="pointer-events-none absolute -right-6 -top-6 size-40 rounded-full bg-ember/0 blur-3xl transition duration-500 group-hover:bg-ember/25" />
            <div className="relative flex items-start justify-between">
              <ClassEmblem name={k.name} className="size-16 text-bone/70 transition duration-500 group-hover:scale-110 group-hover:text-flame group-hover:drop-shadow-[0_0_16px_rgba(255,90,60,.7)]" />
              <span className="grid size-12 place-items-center rounded-full border border-gold/50 bg-gradient-to-br from-ember to-blood font-display text-sm">{k.hit_dice.replace(/^1/, '')}</span>
            </div>
            <h3 className="relative mt-5 font-display text-3xl leading-none text-bone transition group-hover:text-flame">{k.name}</h3>
            <p className="relative mt-2 text-sm text-smoke">Saves: {k.prof_saving_throws}</p>
            {k.spellcasting_ability && <p className="relative text-sm text-smoke">Casts with {k.spellcasting_ability}</p>}
            <div className="relative mt-5 flex items-center justify-between border-t border-white/5 pt-4">
              <span className="font-display text-sm tracking-wide text-gold">{k.archetypes.length} {k.subtypes_name}</span>
              <span className="font-display text-xs tracking-[.3em] text-smoke transition group-hover:text-flame">OPEN &rarr;</span>
            </div>
          </button>
        ))}
        {loading && <Skeleton n={12} h="h-[250px]" />}
        {error && <ErrorNote />}
      </Grid>
      <Drawer c={C} slug={slug} wide>{slug && <ClassDetail slug={slug} />}</Drawer>
    </>
  )
}

type Tab = 'features' | 'table' | 'subclasses' | 'gear'
function ClassDetail({ slug }: { slug: string }) {
  const { data: k, loading, error } = useResource<any>(`/classes/${slug}/`)
  const [tab, setTab] = useState<Tab>('features'); const [open, setOpen] = useState<string | null>(null)
  if (error) return <ErrorNote />
  if (loading || !k) return <DrawerLoading />
  return (
    <article>
      <div className="flex items-center gap-6">
        <ClassEmblem name={k.name} className="size-24 shrink-0 text-flame drop-shadow-[0_0_24px_rgba(255,90,60,.5)]" />
        <div>
          <h2 className="font-display text-6xl leading-none text-bone">{k.name}</h2>
          <p className="mt-2 font-display tracking-[.25em] text-gold">{k.archetypes.length} {k.subtypes_name.toUpperCase()}</p>
        </div>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Fact k="Hit Die" v={k.hit_dice} /><Fact k="Saving Throws" v={k.prof_saving_throws} /><Fact k="Spellcasting" v={k.spellcasting_ability || 'None'} />
        <Fact k="Armor" v={k.prof_armor} /><Fact k="Weapons" v={k.prof_weapons} /><Fact k="Tools" v={k.prof_tools} />
      </div>
      <p className="mt-3 text-sm text-smoke">{k.prof_skills}</p>
      <div className="sticky -top-4 z-10 -ml-14 -mr-6 mt-8 bg-[#17120f]/95 py-3 pl-14 pr-6 backdrop-blur md:-ml-20 md:-mr-14 md:pl-20 md:pr-14">
        <Chips value={tab} onChange={setTab} options={[['features', 'Features'], ['table', 'Progression'], ['subclasses', k.subtypes_name], ['gear', 'Starting Gear']]} />
      </div>
      <div className="mt-4 text-[15.5px]">
        {tab === 'features' && <Md roll text={k.desc} />}
        {tab === 'table' && <Md text={k.table} />}
        {tab === 'gear' && <><p className="mb-2 text-bone/80">HP at 1st level: {k.hp_at_1st_level}</p><p className="mb-4 text-bone/80">HP at higher levels: {k.hp_at_higher_levels}</p><Md text={k.equipment} /></>}
        {tab === 'subclasses' && (
          <div className="space-y-2.5">
            {k.archetypes.map((a: Arch) => (
              <div key={a.slug} className={`overflow-hidden rounded-xl border transition ${open === a.slug ? 'border-ember/40 bg-ember/[.04]' : 'border-white/8 bg-white/[.02]'}`}>
                <button onClick={() => setOpen(open === a.slug ? null : a.slug)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                  <span className="flex-1 font-display text-xl text-bone">{a.name}</span>
                  <Source title={a.document__title} />
                  <svg viewBox="0 0 24 24" className={`size-4 text-gold transition ${open === a.slug ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {open === a.slug && <div className="rise border-t border-white/5 px-5 py-4"><Md roll text={a.desc} /></div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8 border-t border-white/5 pt-5 text-right"><Source title={k.document__title} /></div>
    </article>
  )
}

