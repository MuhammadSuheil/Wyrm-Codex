import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useResource, type Page } from '../api'
import { acSuggestions, asiText, classSkills, equipmentText, featureText, grantedSkills, hpSuggestion, profLangText, weaponSuggestions, type Armor, type BgDoc, type ClassDoc, type RaceDoc, type Weapon } from './forgeGuide'
import { ABILITY_FIELDS, DEATH_FAIL, DEATH_SUCCESS, SAVE_FIELDS, SKILLS, SLOT_FIELDS, SPELL_FIELDS, WEAPON_FIELDS } from './sheetFields'
import { Chips, PageHeader } from './ui'

const ABIL = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']
const ALIGN = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil', 'Unaligned']
const KEY = 'wyrmcodex.sheet.v1'

type Spell = { name: string; prepared: boolean }
type Sheet = {
  name: string; player: string; cls: string; level: string; background: string; race: string; alignment: string; xp: string
  scores: string[]; inspiration: boolean; saveProf: boolean[]; skillProf: boolean[]
  ac: string; speed: string; hpMax: string; hpCur: string; hpTemp: string; hdTotal: string; hd: string; deathS: boolean[]; deathF: boolean[]
  weapons: string[][]; attacks: string; profLang: string; equipment: string; coins: Record<'CP' | 'SP' | 'EP' | 'GP' | 'PP', string>
  traits: string; ideals: string; bonds: string; flaws: string; features: string
  age: string; height: string; weight: string; eyes: string; skin: string; hair: string
  allies: string; faction: string; backstory: string; featTraits: string; treasure: string; portrait: string; symbol: string
  spellClass: string; spellAbility: string; slots: { total: string; used: string }[]; spells: Record<number, Spell[]>
}
const blank = (): Sheet => ({
  name: '', player: '', cls: '', level: '1', background: '', race: '', alignment: '', xp: '',
  scores: ['10', '10', '10', '10', '10', '10'], inspiration: false, saveProf: Array(6).fill(false), skillProf: Array(18).fill(false),
  ac: '', speed: '30', hpMax: '', hpCur: '', hpTemp: '', hdTotal: '', hd: '', deathS: [false, false, false], deathF: [false, false, false],
  weapons: [['', '', ''], ['', '', ''], ['', '', '']], attacks: '', profLang: '', equipment: '', coins: { CP: '', SP: '', EP: '', GP: '', PP: '' },
  traits: '', ideals: '', bonds: '', flaws: '', features: '',
  age: '', height: '', weight: '', eyes: '', skin: '', hair: '', allies: '', faction: '', backstory: '', featTraits: '', treasure: '', portrait: '', symbol: '',
  spellClass: '', spellAbility: '', slots: Array.from({ length: 9 }, () => ({ total: '', used: '' })),
  spells: Object.fromEntries(Object.entries(SPELL_FIELDS).map(([l, f]) => [l, f.map(() => ({ name: '', prepared: false }))])),
})
const load = (): Sheet => { try { const s = localStorage.getItem(KEY); return s ? { ...blank(), ...JSON.parse(s) } : blank() } catch { return blank() } }

const modOf = (s: string) => Math.floor(((parseInt(s) || 10) - 10) / 2)
const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
const profOf = (lvl: string) => Math.ceil(Math.max(1, Math.min(20, parseInt(lvl) || 1)) / 4) + 1

export default function CharacterSheet() {
  const [s, setS] = useState<Sheet>(load)
  const [tab, setTab] = useState<'core' | 'story' | 'spells'>('core')
  const [saved, setSaved] = useState(true); const [busy, setBusy] = useState(false)
  useEffect(() => { setSaved(false); const t = setTimeout(() => { localStorage.setItem(KEY, JSON.stringify(s)); setSaved(true) }, 500); return () => clearTimeout(t) }, [s])
  const set = <K extends keyof Sheet>(k: K, v: Sheet[K]) => setS((x) => ({ ...x, [k]: v }))
  const at = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x))

  const mods = s.scores.map(modOf), prof = profOf(s.level)
  const saves = mods.map((m, i) => m + (s.saveProf[i] ? prof : 0))
  const skills = SKILLS.map(([, a], i) => mods[a] + (s.skillProf[i] ? prof : 0))
  const passive = 10 + skills[11]
  const castIdx = ABIL.indexOf(s.spellAbility)
  const dc = castIdx >= 0 ? 8 + prof + mods[castIdx] : null, atk = castIdx >= 0 ? prof + mods[castIdx] : null

  const { data: clsList } = useResource<Page<{ name: string; slug: string }>>('/classes/?limit=50&fields=name,slug')
  const { data: raceList } = useResource<Page<{ name: string; slug: string }>>('/races/?limit=50&fields=name,slug')
  const { data: bgList } = useResource<Page<{ name: string; slug: string }>>('/backgrounds/?limit=100&fields=name,slug')
  const { data: spellList } = useResource<Page<{ name: string; level_int: number; dnd_class: string }>>('/spells/?limit=500&fields=name,level_int,dnd_class&document__slug=wotc-srd')
  const { data: weaponList } = useResource<Page<Weapon>>('/weapons/?limit=200&document__slug=wotc-srd&fields=name,category,damage_dice,damage_type,properties')
  const { data: armorList } = useResource<Page<Armor>>('/armor/?limit=50')

  // Match what the player typed to codex entries, then load the full entry
  const find = (list: { name: string; slug: string }[] | undefined, v: string) => list?.find((x) => x.name.toLowerCase() === v.trim().toLowerCase())?.slug
  const kSlug = find(clsList?.results, s.cls), rSlug = find(raceList?.results, s.race), bSlug = find(bgList?.results, s.background)
  const klass = useResource<ClassDoc>(kSlug ? `/classes/${kSlug}/` : null).data
  const race = useResource<RaceDoc>(rSlug ? `/races/${rSlug}/` : null).data
  const bg = useResource<BgDoc>(bSlug ? `/backgrounds/${bSlug}/` : null).data
  const k = kSlug ? klass : null, r = rSlug ? race : null, b = bSlug ? bg : null

  // Rules that are fixed by the choice are applied automatically
  useEffect(() => {
    if (!k) return
    const die = (k.hit_dice || '').replace(/^1/, '')
    setS((x) => ({
      ...x, hd: die, hdTotal: `${parseInt(x.level) || 1}${die}`,
      saveProf: ABIL.map((a) => (k.prof_saving_throws || '').includes(a)),
      spellAbility: ABIL.find((a) => (k.spellcasting_ability || '').includes(a)) ?? '',
      spellClass: k.spellcasting_ability ? k.name : '',
    }))
  }, [k?.name, s.level]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (r?.speed?.walk) setS((x) => ({ ...x, speed: String(r.speed.walk) })) }, [r?.name]) // eslint-disable-line react-hooks/exhaustive-deps
  const granted = useMemo(() => grantedSkills(b, r), [b, r])
  useEffect(() => { if (granted.size) setS((x) => ({ ...x, skillProf: x.skillProf.map((on, i) => on || granted.has(i)) })) }, [granted])

  const lvlNum = Math.max(1, Math.min(20, parseInt(s.level) || 1))
  const pick = classSkills(k)
  const picked = pick.options.filter((i) => s.skillProf[i] && !granted.has(i)).length
  const sug = {
    features: featureText(k, r, b, lvlNum), prof: profLangText(k, r, b), equip: equipmentText(k, b),
    weapons: weaponSuggestions(k, r, weaponList?.results ?? [], mods, prof), ac: acSuggestions(k, armorList?.results ?? [], mods),
    hp: hpSuggestion(k, lvlNum, mods[2]),
  }
  const addWeapon = (w: { name: string; atk: string; dmg: string }) => {
    const i = s.weapons.findIndex((x) => !x[0]); const row = [w.name, w.atk, w.dmg]
    set('weapons', i >= 0 ? at(s.weapons, i, row) : [...s.weapons.slice(1), row])
  }

  const exportPdf = async () => {
    setBusy(true)
    try {
      const { PDFDocument, PDFTextField, PDFCheckBox } = await import('pdf-lib')
      const doc = await PDFDocument.load(await fetch('/sheets/5e-character-sheet.pdf').then((r) => r.arrayBuffer()))
      const form = doc.getForm()
      const T = (n: string, v: string | number | null | undefined) => { try { const f = form.getField(n); if (f instanceof PDFTextField) f.setText(v == null ? '' : String(v)) } catch { /* field missing */ } }
      const C = (n: string, on: boolean) => { try { const f = form.getField(n); if (f instanceof PDFCheckBox) (on ? f.check() : f.uncheck()) } catch { /* field missing */ } }
      T('CharacterName', s.name); T('CharacterName 2', s.name); T('PlayerName', s.player); T('ClassLevel', [s.cls, s.level].filter(Boolean).join(' '))
      T('Background', s.background); T('Race ', s.race); T('Alignment', s.alignment); T('XP', s.xp)
      ABILITY_FIELDS.forEach(([sc, md], i) => { T(sc, s.scores[i]); T(md, sign(mods[i])) })
      T('Inspiration', s.inspiration ? '1' : ''); T('ProfBonus', sign(prof))
      SAVE_FIELDS.forEach(([f, cb], i) => { T(f, sign(saves[i])); C(cb, s.saveProf[i]) })
      SKILLS.forEach(([, , f, cb], i) => { T(f, sign(skills[i])); C(cb, s.skillProf[i]) })
      T('Passive', passive); T('AC', s.ac); T('Initiative', sign(mods[1])); T('Speed', s.speed)
      T('HPMax', s.hpMax); T('HPCurrent', s.hpCur); T('HPTemp', s.hpTemp); T('HDTotal', s.hdTotal); T('HD', s.hd)
      DEATH_SUCCESS.forEach((f, i) => C(f, s.deathS[i])); DEATH_FAIL.forEach((f, i) => C(f, s.deathF[i]))
      WEAPON_FIELDS.forEach((fs, i) => fs.forEach((f, j) => T(f, s.weapons[i][j])))
      T('AttacksSpellcasting', s.attacks); T('ProficienciesLang', s.profLang); T('Equipment', s.equipment)
      Object.entries(s.coins).forEach(([k, v]) => T(k, v))
      T('PersonalityTraits ', s.traits); T('Ideals', s.ideals); T('Bonds', s.bonds); T('Flaws', s.flaws); T('Features and Traits', s.features)
      T('Age', s.age); T('Height', s.height); T('Weight', s.weight); T('Eyes', s.eyes); T('Skin', s.skin); T('Hair', s.hair)
      T('Allies', s.allies); T('FactionName', s.faction); T('Backstory', s.backstory); T('Feat+Traits', s.featTraits); T('Treasure', s.treasure)
      T('Spellcasting Class 2', s.spellClass); T('SpellcastingAbility 2', s.spellAbility); T('SpellSaveDC  2', dc ?? ''); T('SpellAtkBonus 2', atk == null ? '' : sign(atk))
      SLOT_FIELDS.forEach(([tot, rem], i) => { const t = parseInt(s.slots[i].total); T(tot, s.slots[i].total); T(rem, isNaN(t) ? '' : Math.max(0, t - (parseInt(s.slots[i].used) || 0))) })
      Object.entries(SPELL_FIELDS).forEach(([l, fs]) => fs.forEach(([f, cb], i) => { const sp = s.spells[+l]?.[i]; T(f, sp?.name); if (cb) C(cb, !!sp?.prepared && !!sp?.name) }))
      for (const [field, url] of [['CHARACTER IMAGE', s.portrait], ['Faction Symbol Image', s.symbol]] as const) {
        if (!url) continue
        try { const img = await doc.embedPng(await fetch(url).then((r) => r.arrayBuffer())); form.getButton(field).setImage(img) } catch { /* image slot missing */ }
      }
      const bytes = await doc.save()
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
      a.download = `${(s.name || 'character').replace(/[^\w\- ]+/g, '').trim() || 'character'}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    } finally { setBusy(false) }
  }
  const reset = () => { if (confirm('Clear the whole sheet? This cannot be undone.')) setS(blank()) }

  return (
    <>
      <PageHeader c="forge" />
      <datalist id="dl-class">{clsList?.results.map((c) => <option key={c.name} value={c.name} />)}</datalist>
      <datalist id="dl-race">{raceList?.results.map((c) => <option key={c.name} value={c.name} />)}</datalist>
      <datalist id="dl-bg">{bgList?.results.map((c) => <option key={c.name} value={c.name} />)}</datalist>
      <div className="sticky top-[68px] z-20 border-y border-white/5 bg-abyss/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
          <Chips value={tab} onChange={setTab} options={[['core', 'I · Adventurer'], ['story', 'II · Story'], ['spells', 'III · Spellbook']]} />
          <span className="ml-auto text-xs text-smoke">{saved ? 'Saved in this browser' : 'Saving…'}</span>
          <button onClick={reset} className="rounded-full border border-white/10 px-4 py-2 text-sm text-smoke transition hover:border-ember/60 hover:text-bone">Clear</button>
          <button onClick={exportPdf} disabled={busy} className="btn-seal inline-flex items-center gap-2 disabled:opacity-70">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v3h16v-3" /></svg>{busy ? 'Inking…' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 pt-6 pb-24">
        {/* Identity banner, shared by every tab */}
        <div className="sheet-panel grid gap-6 rounded-2xl p-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="block">
            <input value={s.name} onChange={(e) => set('name', e.target.value)} placeholder="Character name" className="w-full border-b border-gold/30 bg-transparent pb-2 font-display text-4xl text-bone outline-none placeholder:text-bone/25 focus:border-flame" />
            <span className="sheet-label">Character Name</span>
          </label>
          <F label="Player Name" v={s.player} on={(v) => set('player', v)} />
          <label className="block"><select value={s.alignment} onChange={(e) => set('alignment', e.target.value)} className="sheet-input"><option value="">Choose…</option>{ALIGN.map((a) => <option key={a}>{a}</option>)}</select><span className="sheet-label">Alignment</span></label>
          <F label="Experience Points" v={s.xp} on={(v) => set('xp', v)} />
        </div>

        {tab === 'core' && (
          <div className="mt-6 space-y-6">
            {/* STEP 1 */}
            <Step n={1} title="Origins" note="Choose who your hero is. Everything below fills in from these choices.">
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                <F label="Class" v={s.cls} on={(v) => set('cls', v)} list="dl-class" ok={!!k} />
                <F label="Level" v={s.level} on={(v) => set('level', v)} type="number" />
                <F label="Species" v={s.race} on={(v) => set('race', v)} list="dl-race" ok={!!r} />
                <F label="Background" v={s.background} on={(v) => set('background', v)} list="dl-bg" ok={!!b} />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {ABIL.map((a, i) => (
                  <div key={a} className="rounded-2xl border border-gold/15 bg-black/25 px-2 pt-2 pb-3 text-center">
                    <p className="text-[9px] uppercase tracking-[.12em] text-gold">{a}</p>
                    <p className="font-display text-4xl leading-tight text-bone">{sign(mods[i])}</p>
                    <input value={s.scores[i]} onChange={(e) => set('scores', at(s.scores, i, e.target.value.replace(/\D/g, '').slice(0, 2)))} inputMode="numeric" aria-label={`${a} score`}
                      className="mx-auto block w-12 rounded-full border border-gold/40 bg-black/40 py-0.5 text-center text-bone outline-none focus:border-flame" />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-smoke">Standard array: 15, 14, 13, 12, 10, 8.{r && asiText(r) && <> Your {r.name} heritage adds <span className="text-gold">{asiText(r)}</span>, so include it in the scores above.</>}</p>
            </Step>

            {/* STEP 2 */}
            <Step n={2} title="Calling" note="What your class, species and background give you.">
              <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                <Box title="Saving Throws">
                  {ABIL.map((a, i) => <Row key={a} on={s.saveProf[i]} set={(v) => set('saveProf', at(s.saveProf, i, v))} val={saves[i]} label={a} hot={s.saveProf[i] && !!k} />)}
                  {k && <p className="mt-2 text-xs text-gold/80">Set by {k.name}: {k.prof_saving_throws}</p>}
                </Box>
                <div className="space-y-3">
                  <Area label="Features & Traits" v={s.features} on={(v) => set('features', v)} rows={9} />
                  <Suggest text={sug.features} onUse={() => set('features', merge(s.features, sug.features))} empty="Pick a class, species and background to see your features." />
                </div>
              </div>
            </Step>

            {/* STEP 3 */}
            <Step n={3} title="Arms & Skills" note="Your weapons, then the skills you are trained in. Highlighted skills are the ones your choices allow.">
              <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div className="space-y-4">
                  <Box title="Attacks & Spellcasting">
                    <div className="grid grid-cols-[1.4fr_.7fr_1.2fr] gap-2 pb-1 text-[10px] uppercase tracking-[.15em] text-smoke"><span>Name</span><span>Atk Bonus</span><span>Damage / Type</span></div>
                    {s.weapons.map((w, i) => (
                      <div key={i} className="grid grid-cols-[1.4fr_.7fr_1.2fr] gap-2 py-1">
                        {w.map((v, j) => <input key={j} value={v} onChange={(e) => set('weapons', at(s.weapons, i, at(w, j, e.target.value)))} className="sheet-input !py-1.5 text-sm" placeholder={['Longsword', '+5', '1d8+3 slashing'][j]} />)}
                      </div>
                    ))}
                    {!!sug.weapons.length && (
                      <div className="mt-3 rounded-xl border border-gold/15 bg-gold/[.04] p-3">
                        <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-gold">From your starting gear · click to add</p>
                        <div className="flex flex-wrap gap-1.5">
                          {sug.weapons.map((w) => <button key={w.name} onClick={() => addWeapon(w)} className="rounded-full border border-gold/30 px-3 py-1 text-xs text-bone transition hover:border-flame hover:text-flame">{w.name} <span className="text-smoke">{w.atk} · {w.dmg}</span></button>)}
                        </div>
                      </div>
                    )}
                    <textarea value={s.attacks} onChange={(e) => set('attacks', e.target.value)} rows={3} placeholder="Other attacks, spell attacks, notes…" className="sheet-input mt-3 resize-y text-sm" />
                  </Box>
                  <Area label="Other Proficiencies & Languages" v={s.profLang} on={(v) => set('profLang', v)} rows={5} />
                  <Suggest text={sug.prof} onUse={() => set('profLang', merge(s.profLang, sug.prof))} empty="Your armor, weapon and language proficiencies will appear here." />
                </div>
                <Box title={pick.count ? `Skills · choose ${pick.count} highlighted (${picked}/${pick.count})` : 'Skills'}>
                  {SKILLS.map(([l, ai], i) => (
                    <Row key={l} on={s.skillProf[i]} set={(v) => set('skillProf', at(s.skillProf, i, v))} val={skills[i]} label={l} hint={ABIL[ai].slice(0, 3)}
                      hot={pick.options.includes(i) || granted.has(i)} tag={granted.get(i)} />
                  ))}
                  <div className="mt-3 flex items-center gap-3 border-t border-white/5 pt-3">
                    <span className="grid size-9 place-items-center rounded-full border border-gold/40 font-display text-lg text-bone">{passive}</span><span className="text-sm text-bone">Passive Wisdom (Perception)</span>
                  </div>
                </Box>
              </div>
            </Step>

            {/* STEP 4 */}
            <Step n={4} title="Defenses & Gear" note="Armor, hit points, and everything you carry.">
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="Armor Class" v={s.ac} on={(v) => set('ac', v)} shield />
                    <Stat label="Initiative" v={sign(mods[1])} />
                    <Stat label="Speed" v={s.speed} on={(v) => set('speed', v)} />
                  </div>
                  {k && (
                    <div className="rounded-xl border border-gold/15 bg-gold/[.04] p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-[.18em] text-gold">Armor Class options · click to use</p>
                      <div className="flex flex-wrap gap-1.5">{sug.ac.map((o) => <button key={o.label} onClick={() => set('ac', String(o.ac))} className={`rounded-full border px-3 py-1 text-xs transition hover:border-flame hover:text-flame ${s.ac === String(o.ac) ? 'border-flame text-bone' : 'border-gold/30 text-bone'}`}>{o.label} <span className="text-gold">{o.ac}</span></button>)}</div>
                    </div>
                  )}
                  <div className="sheet-panel rounded-2xl p-4">
                    <div className="grid grid-cols-3 gap-3">
                      <F label="Hit Point Maximum" v={s.hpMax} on={(v) => set('hpMax', v)} />
                      <F label="Current HP" v={s.hpCur} on={(v) => set('hpCur', v)} />
                      <F label="Temporary HP" v={s.hpTemp} on={(v) => set('hpTemp', v)} />
                    </div>
                    {sug.hp != null && <button onClick={() => setS((x) => ({ ...x, hpMax: String(sug.hp), hpCur: x.hpCur || String(sug.hp) }))} className="mt-3 text-xs text-gold transition hover:text-flame">Suggested maximum: {sug.hp} ({k?.hit_dice} at level {lvlNum}, average rolls + CON) · use</button>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="sheet-panel rounded-2xl p-4"><div className="grid grid-cols-2 gap-3"><F label="Hit Dice Total" v={s.hdTotal} on={(v) => set('hdTotal', v)} /><F label="Hit Die" v={s.hd} on={(v) => set('hd', v)} /></div></div>
                    <div className="sheet-panel rounded-2xl p-4">
                      <p className="sheet-label !mt-0 mb-2">Death Saves</p>
                      {(['deathS', 'deathF'] as const).map((key) => (
                        <div key={key} className="flex items-center justify-between text-xs text-smoke"><span>{key === 'deathS' ? 'Successes' : 'Failures'}</span>
                          <span className="flex gap-1.5">{s[key].map((on, i) => <Dot key={i} on={on} set={(v) => set(key, at(s[key], i, v))} tone={key === 'deathF' ? 'ember' : 'gold'} />)}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="sheet-panel flex items-center gap-3 rounded-xl px-4 py-3"><Dot on={s.inspiration} set={(v) => set('inspiration', v)} big /><span className="text-sm text-bone">Inspiration</span></div>
                    <div className="sheet-panel flex items-center gap-3 rounded-xl px-4 py-3"><span className="grid size-9 place-items-center rounded-full border border-gold/40 font-display text-lg text-flame">{sign(prof)}</span><span className="text-sm text-bone">Proficiency Bonus</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Box title="Equipment">
                    <div className="mb-3 grid grid-cols-5 gap-2">
                      {(['CP', 'SP', 'EP', 'GP', 'PP'] as const).map((c) => (
                        <label key={c} className="text-center"><input value={s.coins[c]} onChange={(e) => set('coins', { ...s.coins, [c]: e.target.value })} className="sheet-input text-center" /><span className="sheet-label">{c}</span></label>
                      ))}
                    </div>
                    <textarea value={s.equipment} onChange={(e) => set('equipment', e.target.value)} rows={9} className="sheet-input resize-y text-sm" placeholder="Backpack, bedroll, rations…" />
                  </Box>
                  <Suggest text={sug.equip} onUse={() => set('equipment', merge(s.equipment, sug.equip))} empty="Your class and background starting gear will appear here." />
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Area label="Personality Traits" v={s.traits} on={(v) => set('traits', v)} rows={4} />
                <Area label="Ideals" v={s.ideals} on={(v) => set('ideals', v)} rows={4} />
                <Area label="Bonds" v={s.bonds} on={(v) => set('bonds', v)} rows={4} />
                <Area label="Flaws" v={s.flaws} on={(v) => set('flaws', v)} rows={4} />
              </div>
            </Step>
          </div>
        )}

        {tab === 'story' && (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-4">
              <div className="sheet-panel grid grid-cols-3 gap-4 rounded-2xl p-5">
                {(['age', 'height', 'weight', 'eyes', 'skin', 'hair'] as const).map((k) => <F key={k} label={k[0].toUpperCase() + k.slice(1)} v={s[k]} on={(v) => set(k, v)} />)}
              </div>
              <ImageSlot label="Character Appearance" v={s.portrait} on={(v) => set('portrait', v)} tall />
              <Area label="Additional Features & Traits" v={s.featTraits} on={(v) => set('featTraits', v)} rows={8} />
            </div>
            <div className="space-y-4">
              <div className="sheet-panel rounded-2xl p-5">
                <p className="sheet-label !mt-0 mb-3">Allies & Organizations</p>
                <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                  <div><F label="Faction Name" v={s.faction} on={(v) => set('faction', v)} /><textarea value={s.allies} onChange={(e) => set('allies', e.target.value)} rows={6} className="sheet-input mt-3 resize-y text-sm" placeholder="The Harpers, a retired captain who owes you a favor…" /></div>
                  <ImageSlot label="Symbol" v={s.symbol} on={(v) => set('symbol', v)} />
                </div>
              </div>
              <Area label="Character Backstory" v={s.backstory} on={(v) => set('backstory', v)} rows={12} />
              <Area label="Treasure" v={s.treasure} on={(v) => set('treasure', v)} rows={5} />
            </div>
          </div>
        )}

        {tab === 'spells' && <Spellbook s={s} set={set} dc={dc} atk={atk} all={spellList?.results ?? []} />}
      </div>
    </>
  )
}

function Spellbook({ s, set, dc, atk, all }: { s: Sheet; set: <K extends keyof Sheet>(k: K, v: Sheet[K]) => void; dc: number | null; atk: number | null; all: { name: string; level_int: number; dnd_class: string }[] }) {
  const klass = (s.spellClass || s.cls).trim().toLowerCase()
  const byLevel = useMemo(() => {
    const m: Record<number, string[]> = {}
    for (const sp of all) if (!klass || sp.dnd_class.toLowerCase().includes(klass)) (m[+sp.level_int] ??= []).push(sp.name)
    return m
  }, [all, klass])
  const setSpell = (l: number, i: number, v: Spell) => set('spells', { ...s.spells, [l]: s.spells[l].map((x, j) => (j === i ? v : x)) })
  return (
    <div className="mt-5">
      {Object.entries(byLevel).map(([l, names]) => <datalist key={l} id={`dl-sp-${l}`}>{names.sort().map((n) => <option key={n} value={n} />)}</datalist>)}
      <div className="sheet-panel grid gap-5 rounded-2xl p-5 sm:grid-cols-4">
        <F label="Spellcasting Class" v={s.spellClass} on={(v) => set('spellClass', v)} list="dl-class" />
        <label className="block"><select value={s.spellAbility} onChange={(e) => set('spellAbility', e.target.value)} className="sheet-input"><option value="">Choose…</option>{ABIL.slice(3).concat(ABIL.slice(0, 3)).map((a) => <option key={a}>{a}</option>)}</select><span className="sheet-label">Spellcasting Ability</span></label>
        <Stat label="Spell Save DC" v={dc == null ? "None" : String(dc)} />
        <Stat label="Spell Attack Bonus" v={atk == null ? "None" : sign(atk)} />
      </div>
      <div className="mt-5 columns-1 gap-5 md:columns-2 xl:columns-3">
        {Object.entries(SPELL_FIELDS).map(([lk, fields]) => {
          const l = +lk
          return (
            <div key={l} className="sheet-panel mb-5 break-inside-avoid rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-ember/50 bg-ember/10 font-display text-lg text-flame">{l || 'C'}</span>
                <span className="font-display text-xl text-bone">{l ? `Level ${l}` : 'Cantrips'}</span>
                {l > 0 && (
                  <span className="ml-auto flex gap-2">
                    <input value={s.slots[l - 1].total} onChange={(e) => set('slots', s.slots.map((x, j) => (j === l - 1 ? { ...x, total: e.target.value } : x)))} aria-label="Slots total" placeholder="Slots" className="sheet-input w-16 !py-1 text-center text-sm" />
                    <input value={s.slots[l - 1].used} onChange={(e) => set('slots', s.slots.map((x, j) => (j === l - 1 ? { ...x, used: e.target.value } : x)))} aria-label="Slots expended" placeholder="Used" className="sheet-input w-16 !py-1 text-center text-sm" />
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {fields.map((_, i) => {
                  const sp = s.spells[l]?.[i] ?? { name: '', prepared: false }
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      {l > 0 ? <Dot on={sp.prepared} set={(v) => setSpell(l, i, { ...sp, prepared: v })} /> : <span className="w-3.5" />}
                      <input value={sp.name} onChange={(e) => setSpell(l, i, { ...sp, name: e.target.value })} list={`dl-sp-${l}`} className="sheet-input !py-1 text-sm" />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- small sheet controls ---------- */
// Append a suggestion without wiping what the player already wrote
const merge = (cur: string, add: string) => (!cur.trim() ? add : cur.includes(add) ? cur : `${cur.trimEnd()}\n${add}`)
function Step({ n, title, note, children }: { n: number; title: string; note: string; children: ReactNode }) {
  return (
    <section className="sheet-panel relative rounded-2xl p-5 md:p-7">
      <div className="mb-5 flex items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/50 bg-gradient-to-b from-[#2a0e12] to-[#120809] font-display text-xl text-flame">{n}</span>
        <div><h2 className="font-display text-3xl leading-none text-bone">{title}</h2><p className="mt-1 text-sm text-smoke">{note}</p></div>
      </div>
      {children}
    </section>
  )
}
function Suggest({ text, onUse, empty }: { text: string; onUse: () => void; empty: string }) {
  return (
    <div className="rounded-xl border border-gold/15 bg-gold/[.04] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[.18em] text-gold">Suggested from the codex</p>
        {text && <button onClick={onUse} className="rounded-full border border-gold/30 px-3 py-1 text-xs text-gold transition hover:border-flame hover:text-flame">Use this</button>}
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-bone/75">{text || <span className="text-smoke">{empty}</span>}</p>
    </div>
  )
}
function F({ label, v, on, list, type, ok }: { label: string; v: string; on: (v: string) => void; list?: string; type?: string; ok?: boolean }) {
  return (
    <label className="block min-w-0">
      <input value={v} onChange={(e) => on(e.target.value)} list={list} type={type} min={type === 'number' ? 1 : undefined} max={type === 'number' ? 20 : undefined} className={`sheet-input ${ok ? '!border-gold/60' : ''}`} />
      <span className="sheet-label">{label}{ok && <span className="ml-1.5 normal-case tracking-normal text-gold">· found in the codex</span>}</span>
    </label>
  )
}
function Area({ label, v, on, rows }: { label: string; v: string; on: (v: string) => void; rows: number }) {
  return <label className="sheet-panel block rounded-2xl p-4"><span className="sheet-label !mt-0 mb-2 block">{label}</span><textarea value={v} onChange={(e) => on(e.target.value)} rows={rows} className="w-full resize-y bg-transparent text-[15px] leading-relaxed text-bone outline-none placeholder:text-bone/25" /></label>
}
function Box({ title, children }: { title: string; children: ReactNode }) {
  return <div className="sheet-panel rounded-2xl p-4"><p className="sheet-label !mt-0 mb-2">{title}</p>{children}</div>
}
function Row({ on, set, val, label, hint, hot, tag }: { on: boolean; set: (v: boolean) => void; val: number; label: string; hint?: string; hot?: boolean; tag?: string }) {
  return (
    <div className={`-mx-2 flex items-center gap-2.5 rounded-md px-2 py-[3px] text-sm transition ${hot ? 'bg-gold/[.07]' : ''}`}>
      <Dot on={on} set={set} /><span className="w-8 border-b border-white/10 text-center text-bone">{sign(val)}</span>
      <span className={hot ? 'text-gold' : 'text-bone/70'}>{label}</span>{hint && <span className="text-[11px] text-smoke">({hint})</span>}
      {tag && <span className="ml-auto rounded-full border border-gold/30 px-2 text-[10px] text-gold/90">{tag}</span>}
    </div>
  )
}
function Dot({ on, set, big, tone = 'gold' }: { on: boolean; set: (v: boolean) => void; big?: boolean; tone?: 'gold' | 'ember' }) {
  return <button type="button" onClick={() => set(!on)} aria-pressed={on} className={`shrink-0 rounded-full border transition ${big ? 'size-6' : 'size-3.5'} ${on ? (tone === 'ember' ? 'border-flame bg-ember shadow-[0_0_8px_#c8202b]' : 'border-gold bg-gold shadow-[0_0_8px_rgba(214,168,90,.7)]') : 'border-white/30 hover:border-gold/70'}`} />
}
function Stat({ label, v, on, shield }: { label: string; v: string; on?: (v: string) => void; shield?: boolean }) {
  return (
    <div className={`sheet-panel flex flex-col items-center justify-center px-2 py-3 text-center ${shield ? 'rounded-b-[40%] rounded-t-2xl' : 'rounded-2xl'}`}>
      {on ? <input value={v} onChange={(e) => on(e.target.value)} className="w-full bg-transparent text-center font-display text-3xl text-bone outline-none" /> : <span className="font-display text-3xl text-bone">{v}</span>}
      <span className="mt-1 text-[10px] uppercase tracking-[.15em] text-gold">{label}</span>
    </div>
  )
}
// Images are normalized to PNG via canvas so the PDF embed always works
function ImageSlot({ label, v, on, tall }: { label: string; v: string; on: (v: string) => void; tall?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const pick = (f?: File) => {
    if (!f) return
    const img = new Image(); img.onload = () => {
      const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      on(c.toDataURL('image/png')); URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(f)
  }
  return (
    <div className="sheet-panel rounded-2xl p-4">
      <p className="sheet-label !mt-0 mb-2">{label}</p>
      <button type="button" onClick={() => ref.current?.click()} className={`group relative grid w-full place-items-center overflow-hidden rounded-xl border border-dashed border-gold/30 bg-black/30 transition hover:border-flame ${tall ? 'h-72' : 'h-36'}`}>
        {v ? <img src={v} alt="" className="h-full w-full object-contain" /> : <span className="text-sm text-smoke group-hover:text-bone">Upload image</span>}
      </button>
      {v && <button onClick={() => on('')} className="mt-2 text-xs text-smoke hover:text-flame">Remove</button>}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  )
}
