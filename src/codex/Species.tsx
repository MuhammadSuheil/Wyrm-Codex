import { useResource, type Page } from '../api'
import Md from '../Md'
import { go, type Cat } from './routes'
import { Drawer, DrawerLoading, ErrorNote, Fact, Grid, PageHeader, Section, Skeleton, Source, Tag } from './ui'

const C: Cat = 'species'
type Sub = { name: string; slug: string; asi_desc: string; traits: string; desc: string; document__title: string }
type R = { slug: string; name: string; asi: { attributes: string[]; value: number }[]; size_raw: string; speed: Record<string, number>; subraces: Sub[]; document__title: string }

const ab = (a: string) => (a === 'Other' ? 'Any' : a.slice(0, 3).toUpperCase())
const asiText = (asi: R['asi']) => asi.map((x) => `${x.attributes.map(ab).join('/')} +${x.value}`)
// Open5e prefixes each trait with its own bold title, e.g. "***Age.*** ..."
const strip = (s?: string) => s?.replace(/^\*\*\*[^*]+\*\*\*\s*/, '')

export default function Species({ slug }: { slug: string | null }) {
  const { data, loading, error } = useResource<Page<R>>('/races/?limit=50&fields=slug,name,asi,size_raw,speed,subraces,document__title')
  const list = data?.results ?? []
  const subs = list.reduce((a, r) => a + r.subraces.length, 0)
  return (
    <>
      <PageHeader c={C} count={data?.count}>
        {!!subs && <p className="mt-2 font-display tracking-[.3em] text-gold">WITH {subs} SUBRACES</p>}
      </PageHeader>
      <Grid className="pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((r, i) => (
          <button key={r.slug} onClick={() => go(C, r.slug)} className="codex-card rise group relative flex h-[200px] flex-col overflow-hidden rounded-2xl p-6 text-left" style={{ animationDelay: `${i * 35}ms` }}>
            <span className="pointer-events-none absolute -bottom-6 -right-2 font-display text-[9rem] leading-none text-white/[.03] transition duration-500 group-hover:text-ember/10">{r.name[0]}</span>
            <h3 className="relative font-display text-3xl leading-none text-bone transition group-hover:text-flame">{r.name}</h3>
            <p className="relative mt-2 text-sm text-smoke">{r.size_raw} · {r.speed?.walk ?? 30} ft.</p>
            <div className="relative mt-3 flex flex-wrap gap-1.5">{asiText(r.asi).map((t) => <Tag key={t} tone="ember">{t}</Tag>)}</div>
            <div className="relative mt-auto flex items-center justify-between border-t border-white/5 pt-3">
              <span className="font-display text-sm tracking-wide text-gold">{r.subraces.length ? `${r.subraces.length} ${r.subraces.length === 1 ? 'subrace' : 'subraces'}` : 'No subraces'}</span>
              <Source title={r.document__title} />
            </div>
          </button>
        ))}
        {loading && <Skeleton n={12} h="h-[200px]" />}
        {error && <ErrorNote />}
      </Grid>
      <Drawer c={C} slug={slug}>{slug && <SpeciesDetail slug={slug} />}</Drawer>
    </>
  )
}

function SpeciesDetail({ slug }: { slug: string }) {
  const { data: r, loading, error } = useResource<any>(`/races/${slug}/`)
  if (error) return <ErrorNote />
  if (loading || !r) return <DrawerLoading />
  return (
    <article>
      <h2 className="font-display text-6xl leading-none text-bone">{r.name}</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">{asiText(r.asi).map((t) => <Tag key={t} tone="ember">{t}</Tag>)}</div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Fact k="Size" v={r.size_raw} /><Fact k="Speed" v={`${r.speed?.walk ?? 30} ft.`} /><Fact k="Subraces" v={`${r.subraces.length}`} />
      </div>
      <div className="mt-7 space-y-1 text-[15.5px]">
        <Md text={r.desc?.replace(/^##[^\n]*\n/, '')} />
        <Md roll text={r.traits} />
      </div>
      <Section title="Lore">
        <div className="grid gap-3 md:grid-cols-2">
          {[['Age', r.age], ['Alignment', r.alignment], ['Size', r.size], ['Speed', r.speed_desc], ['Languages', r.languages], ['Vision', r.vision]].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/5 bg-white/[.025] p-4"><p className="mb-1 font-display tracking-wide text-gold">{k}</p><Md text={strip(v)} className="text-sm" /></div>
          ))}
        </div>
      </Section>
      {!!r.subraces.length && (
        <Section title={`Subraces · ${r.subraces.length}`}>
          <div className="space-y-3">
            {r.subraces.map((s: Sub) => (
              <div key={s.slug} className="rounded-xl border border-ember/25 bg-ember/[.04] p-5">
                <div className="flex items-baseline justify-between gap-3"><h4 className="font-display text-2xl text-bone">{s.name}</h4><Source title={s.document__title} /></div>
                <Md text={s.desc} className="mt-2 text-sm" /><Md text={s.asi_desc} className="text-sm" /><Md roll text={s.traits} className="text-sm" />
              </div>
            ))}
          </div>
        </Section>
      )}
      <div className="mt-8 border-t border-white/5 pt-5 text-right"><Source title={r.document__title} /></div>
    </article>
  )
}
