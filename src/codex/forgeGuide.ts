// Turns Open5e class, species and background entries into character sheet suggestions.
import { SKILLS } from './sheetFields'

export type ClassDoc = { name: string; hit_dice: string; prof_saving_throws: string; prof_skills: string; prof_armor: string; prof_weapons: string; prof_tools: string; equipment: string; table: string; spellcasting_ability: string }
export type RaceDoc = { name: string; asi: { attributes: string[]; value: number }[]; speed: Record<string, number>; traits: string; vision: string; languages: string }
export type BgDoc = { name: string; skill_proficiencies: string | null; tool_proficiencies: string | null; languages: string | null; equipment: string | null; feature: string | null }
export type Weapon = { name: string; category: string; damage_dice: string; damage_type: string; properties: string[] | null }
export type Armor = { name: string; category: string; base_ac: number; plus_dex_mod: boolean; plus_max: number; plus_con_mod: boolean; plus_wis_mod: boolean; plus_flat_mod: number; document__slug: string }

export const ABIL = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']
const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 }
const strip = (s?: string | null) => (s ?? '').replace(/\*+_?|_?\*+/g, '').replace(/\s+/g, ' ').trim()

/** Skill indexes the class lets you pick from, and how many */
export function classSkills(k?: ClassDoc | null): { count: number; options: number[] } {
  if (!k?.prof_skills) return { count: 0, options: [] }
  const t = k.prof_skills.toLowerCase(), count = WORDS[(/choose (?:any )?(\w+)/.exec(t)?.[1]) ?? ''] ?? 2
  if (/any/.test(t)) return { count, options: SKILLS.map((_, i) => i) }
  return { count, options: SKILLS.map(([l], i) => [l, i] as const).filter(([l]) => t.includes(l.toLowerCase()) || (l === 'Animal Handling' && t.includes('animal'))).map(([, i]) => i) }
}

/** Skills handed out for free by the background or species */
export function grantedSkills(bg?: BgDoc | null, race?: RaceDoc | null): Map<number, string> {
  const out = new Map<number, string>()
  const from = (text: string, who: string) => SKILLS.forEach(([l], i) => { if (text.toLowerCase().includes(l.toLowerCase())) out.set(i, who) })
  // Only the fixed skills count; anything after "either" or "or" is the player's choice
  if (bg?.skill_proficiencies) from(bg.skill_proficiencies.split(/\beither\b|\bor\b/i)[0], bg.name)
  for (const m of (race?.traits ?? '').matchAll(/proficiency in the (\w[\w ]*?) skill/gi)) from(m[1], race!.name)
  return out
}

export const traitNames = (md?: string | null) => [...(md ?? '').matchAll(/\*\*\*?_?([^*_\n]+?)\._?\*?\*\*/g)].map((m) => m[1].trim())

/** Class features gained up to the given level, read from the class table */
export function classFeatures(k: ClassDoc, level: number) {
  const out: string[] = []
  for (const row of (k.table ?? '').split('\n')) {
    const c = row.split('|').map((x) => x.trim()).filter(Boolean)
    const lv = parseInt(c[0]); if (!lv || lv > level || !c[2] || c[2] === '-') continue
    out.push(...c[2].split(',').map((x) => x.trim()).filter((x) => x && !/^ability score improvement$/i.test(x)))
  }
  return [...new Set(out)]
}

export function featureText(k?: ClassDoc | null, r?: RaceDoc | null, b?: BgDoc | null, level = 1) {
  const lines: string[] = []
  if (k) { const f = classFeatures(k, level); if (f.length) lines.push(`${k.name.toUpperCase()} (LEVEL ${level}): ${f.join(', ')}`) }
  if (r) { const t = [...traitNames(r.vision), ...traitNames(r.traits)]; if (t.length) lines.push(`${r.name.toUpperCase()}: ${t.join(', ')}`) }
  if (b?.feature) lines.push(`${b.name.toUpperCase()}: ${b.feature}`)
  return lines.join('\n')
}

export function profLangText(k?: ClassDoc | null, r?: RaceDoc | null, b?: BgDoc | null) {
  const lines: string[] = []
  if (k) { lines.push(`Armor: ${k.prof_armor || 'None'}`, `Weapons: ${k.prof_weapons || 'None'}`); if (k.prof_tools && k.prof_tools !== 'None') lines.push(`Tools: ${k.prof_tools}`) }
  if (b?.tool_proficiencies && b.tool_proficiencies !== 'None') lines.push(`Tools (${b.name}): ${b.tool_proficiencies}`)
  const langs = [r && (/write ([^.]+)/i.exec(strip(r.languages))?.[1] ?? strip(r.languages).replace(/^Languages\.\s*/i, '').split('. ')[0]), b?.languages && b.languages !== 'None' ? `${b.languages} (${b.name})` : ''].filter(Boolean)
  if (langs.length) lines.push(`Languages: ${langs.join('; ')}`)
  return lines.join('\n')
}

export function equipmentText(k?: ClassDoc | null, b?: BgDoc | null) {
  const lines: string[] = []
  if (k?.equipment) lines.push(...k.equipment.split('\n').filter((l) => /^\s*\*/.test(l)).map((l) => `• ${strip(l.replace(/^\s*\*\s*/, '')).replace(/\(a\)|\(b\)|\(c\)/g, (m) => m.toUpperCase())}`))
  if (b?.equipment) lines.push(`• ${b.equipment} (${b.name})`)
  return lines.join('\n')
}

const norm = (n: string) => n.toLowerCase().replace(/^(.+), (.+)$/, '$2 $1')
const mentions = (text: string, name: string) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(e?s)?\\b`, 'i').test(text)

/** Weapons named in the class starting gear, with attack bonus and damage worked out */
export function weaponSuggestions(k: ClassDoc | null | undefined, r: RaceDoc | null | undefined, weapons: Weapon[], mods: number[], prof: number) {
  if (!k) return []
  const text = k.equipment ?? ''
  const profs = `${k.prof_weapons} ${r?.traits ?? ''}`.toLowerCase()
  return weapons.filter((w) => mentions(text, norm(w.name))).slice(0, 6).map((w) => {
    const props = (w.properties ?? []).join(' ').toLowerCase(), ranged = /ranged/i.test(w.category)
    const m = /finesse/.test(props) ? Math.max(mods[0], mods[1]) : ranged ? mods[1] : mods[0]
    const proficient = (/simple/i.test(w.category) && profs.includes('simple weapons')) || (/martial/i.test(w.category) && profs.includes('martial weapons')) || profs.includes(norm(w.name))
    const dmg = /^\d+d\d+$/.test(w.damage_dice) ? `${w.damage_dice}${m ? sign(m) : ''}` : w.damage_dice
    return { name: w.name.replace(/^(.+), (.+)$/, (_, a, b) => `${b[0].toUpperCase()}${b.slice(1)} ${a.toLowerCase()}`), atk: sign(m + (proficient ? prof : 0)), dmg: `${dmg} ${w.damage_type}`.trim() }
  })
}

/** Armor class options from starting gear and class features */
export function acSuggestions(k: ClassDoc | null | undefined, armor: Armor[], mods: number[]) {
  const out: { label: string; ac: number }[] = []
  const calc = (a: Armor) => a.base_ac + (a.plus_dex_mod ? (a.plus_max ? Math.min(a.plus_max, mods[1]) : mods[1]) : 0) + (a.plus_con_mod ? mods[2] : 0) + (a.plus_wis_mod ? mods[4] : 0)
  const shield = armor.find((a) => a.name === 'Shield')
  const hasShield = !!k && mentions(k.equipment, 'shield')
  const srd = armor.filter((a) => a.document__slug === 'wotc-srd')
  for (const a of srd) {
    const alias = k && [`${norm(a.name)} armor`, norm(a.name)].find((x) => mentions(k.equipment, x))
    if (/armor$/i.test(a.category) && alias && !out.some((o) => o.label.toLowerCase().startsWith(alias))) {
      const label = alias[0].toUpperCase() + alias.slice(1)
      out.push({ label, ac: calc(a) })
      if (hasShield && shield) out.push({ label: `${label} + shield`, ac: calc(a) + shield.plus_flat_mod })
    }
  }
  const un = srd.find((a) => a.name === `Unarmored Defense (${k?.name})`)
  if (un) out.push({ label: 'Unarmored Defense', ac: calc(un) })
  if (k && /sorcerer|wizard/i.test(k.name)) out.push({ label: 'Mage Armor (spell)', ac: 13 + mods[1] })
  out.push({ label: 'No armor', ac: 10 + mods[1] })
  // Keep the strongest option first
  return out.sort((a, b) => b.ac - a.ac).filter((o, i, arr) => arr.findIndex((x) => x.label === o.label) === i)
}

export function hpSuggestion(k: ClassDoc | null | undefined, level: number, con: number) {
  const die = parseInt((k?.hit_dice ?? '').split('d')[1]); if (!die) return null
  return Math.max(1, die + con + (level - 1) * (Math.floor(die / 2) + 1 + con))
}

export const asiText = (r?: RaceDoc | null) => (r?.asi ?? []).map((x) => `${x.attributes.map((a) => (a === 'Other' ? 'any' : a.slice(0, 3).toUpperCase())).join('/')} +${x.value}`).join(', ')
