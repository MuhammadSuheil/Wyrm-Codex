import { useEffect, useState, type ReactNode } from 'react'
import { fmt, type Stats } from '../api'
import { cat, Glyph, GROUPS, href, type Cat, type GroupId } from './routes'

function useScroll() {
  const [y, setY] = useState(0)
  useEffect(() => { let r = 0; const on = () => { cancelAnimationFrame(r); r = requestAnimationFrame(() => setY(scrollY)) }; addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on) }, [])
  return y
}

export default function Realm({ id, stats }: { id: GroupId; stats: Stats | null }) {
  const g = GROUPS.find((x) => x.id === id)!
  const y = useScroll()
  return (
    <div className="bg-abyss">
      {/* Hero: dimmed artwork that melts into the page below */}
      <section className="relative flex min-h-[78svh] items-end overflow-hidden">
        <div className="absolute inset-0" style={{ transform: `translate3d(0, ${y * 0.35}px, 0)` }}>
          <img src={g.img} alt="" className="realm-art absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,6,8,.92)_0%,rgba(7,6,8,.6)_35%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,.55)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(0deg,#0b0909_0%,#0b0909_10%,rgba(11,9,9,.8)_40%,transparent_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-28" style={{ opacity: Math.max(0, 1 - y / 650) }}>
          <p className="hero-in flex items-center gap-3 font-display text-xs tracking-[.5em] text-ember" style={{ animationDelay: '.15s' }}><span className="h-px w-10 bg-ember/70" />{g.kicker.toUpperCase()}</p>
          <h1 className="hero-in mt-4 font-display text-7xl leading-[.9] text-bone drop-shadow-[0_6px_30px_rgba(0,0,0,.8)] md:text-[9rem]" style={{ animationDelay: '.3s' }}>{g.label}</h1>
          <p className="hero-in mt-4 font-display text-2xl text-gold md:text-3xl" style={{ animationDelay: '.45s' }}>{g.title}</p>
          <p className="hero-in mt-4 max-w-xl text-lg text-bone/80" style={{ animationDelay: '.6s' }}>{g.lede}</p>
        </div>
      </section>

      {/* Page selection */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20">
        <div className={`grid gap-5 ${g.items.length > 2 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
          {g.items.map((c, i) => <PageCard key={c} c={c} i={i} n={g.items.length} img={g.img} stats={stats} />)}
        </div>
      </section>

      {/* One written section to read before diving in */}
      <section className="relative border-t border-white/5 bg-[linear-gradient(180deg,#100c0d,#0b0909)]">
        <div className="mx-auto max-w-7xl px-6 py-20">{GUIDE[id]}</div>
      </section>
    </div>
  )
}

function PageCard({ c, i, n, img, stats }: { c: Cat; i: number; n: number; img: string; stats: Stats | null }) {
  const d = cat(c), count = d.stat ? stats?.[d.stat] : undefined, sub = d.sub && stats ? stats[d.sub[0]] : null
  return (
    <a href={href(c)} className="page-card rise group relative flex flex-col overflow-hidden rounded-2xl" style={{ animationDelay: `${i * 70}ms` }}>
      {/* A slice of the realm art, a different crop for every card */}
      <div className="relative h-36 overflow-hidden">
        <img src={img} alt="" className="page-card-art absolute inset-0 h-full w-full object-cover opacity-60" style={{ transformOrigin: `${n > 1 ? 10 + (i / (n - 1)) * 80 : 50}% ${35 + (i % 2) * 25}%` }} />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#120e0f_0%,rgba(18,14,15,.4)_60%,rgba(18,14,15,.15))]" />
        <span className="absolute left-6 -bottom-px font-display text-[5.5rem] leading-[.75] text-bone/[.07]">{String(i + 1).padStart(2, '0')}</span>
      </div>
      <div className="relative -mt-7 flex flex-1 flex-col px-6 pb-6">
        <span className="grid size-14 place-items-center rounded-full border border-gold/50 bg-gradient-to-b from-[#2a0e12] to-[#120809] text-ember shadow-[0_8px_20px_-6px_rgba(0,0,0,.9)] transition group-hover:text-flame"><Glyph c={c} className="size-6" /></span>
        <h3 className="mt-4 font-display text-3xl leading-none text-bone">{d.label}</h3>
        <p className="mt-2 text-smoke">{d.blurb}.</p>
        <div className="mt-auto flex items-center justify-between pt-5 text-sm">
          <span className="text-gold/80">{count != null ? <>{fmt(count)}{sub != null && <> · {sub} {d.sub![1]}</>}</> : <span className="inline-block h-3 w-16 animate-pulse rounded bg-white/10" />}</span>
          <span className="font-display tracking-[.3em] text-smoke transition group-hover:translate-x-1 group-hover:text-flame">&rarr;</span>
        </div>
      </div>
    </a>
  )
}

/* ---------- Written guides, one per section ---------- */
function Guide({ kicker, title, intro, children }: { kicker: string; title: ReactNode; intro: string; children: ReactNode }) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:items-end">
        <div><p className="font-display text-xs tracking-[.5em] text-ember">{kicker}</p><h2 className="mt-3 font-display text-4xl leading-tight text-bone md:text-5xl">{title}</h2></div>
        <p className="text-lg leading-relaxed text-bone/70">{intro}</p>
      </div>
      <div className="mt-12">{children}</div>
    </>
  )
}
const Col = ({ n, t, children }: { n: string; t: string; children: ReactNode }) => (
  <article>
    <p className="font-display text-sm tracking-[.3em] text-gold/70">{n}</p>
    <h3 className="mt-1 font-display text-2xl text-bone">{t}</h3>
    <div className="mt-3 space-y-3 leading-relaxed text-bone/70">{children}</div>
  </article>
)

const GUIDE: Record<GroupId, ReactNode> = {
  dungeon: (
    <Guide kicker="FROM BEHIND THE SCREEN" title={<>Running the <span className="ember-text">Dungeon</span></>}
      intro="Monsters and treasure are the two levers a Dungeon Master pulls most. One makes the table nervous, the other makes it grin. Here is how to read them before you set them loose.">
      <div className="grid gap-10 md:grid-cols-3">
        <Col n="I" t="Reading a Stat Block">
          <p>Armor Class is how hard the creature is to hit, Hit Points how long it lasts. The Challenge Rating is a rough promise: four adventurers of that level should win, but not without spending something.</p>
          <p>Skim the actions before the session, not during it. Legendary actions and reactions are where a monster surprises people.</p>
        </Col>
        <Col n="II" t="Pacing a Fight">
          <p>Numbers matter more than size. A single giant against four heroes falls fast because it acts once while they act four times. Add a few lesser foes and the same fight becomes a story.</p>
          <p>Give the battlefield something to do: a collapsing bridge, a rising tide, a door that must stay shut.</p>
        </Col>
        <Col n="III" t="Treasure by Tier">
          <p>Rarity tracks how far along the party is. A good rule of thumb:</p>
          <dl className="space-y-1.5 text-[15px]">
            {[['Levels 1 to 4', 'Common and uncommon'], ['Levels 5 to 10', 'Uncommon and rare'], ['Levels 11 to 16', 'Rare and very rare'], ['Levels 17 to 20', 'Very rare and legendary']].map(([a, b]) => (
              <div key={a} className="flex justify-between gap-4 border-b border-white/5 pb-1.5"><dt className="text-bone">{a}</dt><dd className="text-gold/80">{b}</dd></div>
            ))}
          </dl>
        </Col>
      </div>
    </Guide>
  ),
  heroes: (
    <Guide kicker="BEFORE THE FIRST ROLL" title={<>How a Hero <span className="ember-text">Comes Together</span></>}
      intro="Every character at the table was built the same way, one choice at a time. None of them are permanent in spirit, but each one shapes what your hero is good at and who they are.">
      <ol className="grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {[
          ['Choose a Species', 'Your bloodline sets your size, speed and senses, and adds a few small bonuses. A dwarf shrugs off poison, an elf never truly sleeps.'],
          ['Choose a Class', 'The biggest choice. It decides your hit points, your armor and weapons, and the features you gain every level from first to twentieth.'],
          ['Set Ability Scores', 'Six numbers for body and mind. The standard array is 15, 14, 13, 12, 10 and 8. Put the highest where your class needs it most.'],
          ['Pick a Background', 'What you did before adventuring: acolyte, criminal, sage. It grants skills, tools and a feature that helps outside of combat.'],
          ['Gather Equipment', 'Your class and background hand you a starting kit. Armor decides your AC, weapons your attacks, and the rest keeps you alive on the road.'],
          ['Find Your Voice', 'Personality, ideals, bonds and flaws. These are the lines your DM will tug on, so give them something worth pulling.'],
        ].map(([t, d], i) => (
          <li key={t} className="flex gap-5">
            <span className="font-display text-5xl leading-none text-ember/40">{i + 1}</span>
            <div><h3 className="font-display text-2xl text-bone">{t}</h3><p className="mt-2 leading-relaxed text-bone/70">{d}</p></div>
          </li>
        ))}
      </ol>
    </Guide>
  ),
  tome: (
    <Guide kicker="HOW THE GAME IS PLAYED" title={<>The Three <span className="ember-text">Pillars</span></>}
      intro="Every session moves between three kinds of play. Most of the rules exist to settle one of them, and a good adventure gives each its turn in the light.">
      <div className="grid gap-10 md:grid-cols-3">
        <Col n="I" t="Exploration">
          <p>Travel, traps, puzzles and the long walk through the dark. The DM describes the world, the players decide where to look, and the dice settle what they find.</p>
        </Col>
        <Col n="II" t="Social Interaction">
          <p>Bargaining with a merchant, lying to a guard, earning a queen's trust. Words carry as much weight as swords, and Charisma checks only come out when the outcome is truly uncertain.</p>
        </Col>
        <Col n="III" t="Combat">
          <p>When blades come out, time slows into rounds of six seconds. Everyone rolls initiative, takes a turn, and the battle plays out one action at a time until one side breaks.</p>
        </Col>
      </div>
      <div className="mt-14 grid gap-6 rounded-2xl border border-white/5 bg-white/[.02] p-8 md:grid-cols-3">
        {[['The DM describes', 'what the characters see, hear and sense.'], ['The players declare', 'what their characters want to do.'], ['The DM narrates', 'what happens, calling for dice when the result is in doubt.']].map(([a, b], i) => (
          <p key={a} className="leading-relaxed text-bone/70"><span className="mr-2 font-display text-lg text-gold">{i + 1}.</span><span className="text-bone">{a}</span> {b}</p>
        ))}
      </div>
    </Guide>
  ),
}
