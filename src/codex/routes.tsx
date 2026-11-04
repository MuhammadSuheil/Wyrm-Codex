import type { ReactNode } from 'react'
import type { Stats } from '../api'

export type Cat = 'forge' | 'monsters' | 'magic-items' | 'classes' | 'species' | 'spells' | 'backgrounds' | 'feats' | 'equipment' | 'rules' | 'conditions'
export type Route = { cat: Cat | null; slug: string | null; group: GroupId | null }

export const parseHash = (): Route => {
  const [cat, slug] = location.hash.replace(/^#\/?/, '').split('/')
  return { cat: (CATS.find((c) => c.id === cat)?.id ?? null), slug: slug ? decodeURIComponent(slug) : null, group: GROUPS.find((g) => g.id === cat)?.id ?? null }
}
export const href = (cat: Cat | GroupId | null, slug?: string | null) => `#/${cat ?? ''}${slug ? `/${encodeURIComponent(slug)}` : ''}`
export const go = (cat: Cat | GroupId | null, slug?: string | null) => { location.hash = href(cat, slug) }

// Category glyphs, filled in the codex red
const g = (d: ReactNode) => d
export const GLYPH: Record<Cat, ReactNode> = {
  forge: g(<path d="M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8.5 11h9v1.5h-9V11Zm0 3.5h9V16h-9v-1.5Zm0 3.5h6v1.5h-6V18ZM4 5h1v18h12v1H4V5Z" />),
  monsters: g(<path fillRule="evenodd" d="M3 22l.6-4.4-2.1-.4 2.6-2-1.4-1.3 2.5-.4C5 11 5.6 9 7 7.6L4.5 1.8l5.1 3.8c1-.5 2.1-.8 3.3-.8L14.6 1l1.2 4.3c1.8.6 3.6 1.7 4.9 3.3l2.3 3-3.2.8-3.4.5 4.8 1.7c-1.2 1.4-2.9 2.2-4.9 2.4-1.4.2-2.7.6-3.7 1.4L11 22H3Zm11.6-14.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />),
  'magic-items': g(<path d="M6 3h12l4 6-10 12L2 9l4-6Zm1.2 2L4.8 8.5h4L10.6 5H7.2Zm6.2 0 1.8 3.5h4L16.8 5h-3.4ZM5 10.5l5.6 6.8-2.2-6.8H5Zm5.5 0L12 15.4l1.5-4.9h-3Zm5.1 0-2.2 6.8 5.6-6.8h-3.4Z" />),
  classes: g(<path d="M4 3h3l9.5 9.5-1.4 1.4-1.4-1.4-4 4 1.4 1.4-1.4 1.4-1.6-1.6L5 21.5 2.5 19l3.3-3.1-1.6-1.6 1.4-1.4 1.4 1.4 4-4L4 3.7V3Zm12.6 0 4.4 4.4-1.8 1.8-1.2-1.2-3 3-1.4-1.4 3-3-1.2-1.2L16.6 3Zm-1.3 12 5.2 5.2-1.4 1.4-5.2-5.2 1.4-1.4Z" />),
  species: g(<path d="M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-7 2a2.4 2.4 0 1 1 0 4.8A2.4 2.4 0 0 1 5 6Zm14 0a2.4 2.4 0 1 1 0 4.8A2.4 2.4 0 0 1 19 6ZM12 11.5c3.3 0 6 2 6 5V19H6v-2.5c0-3 2.7-5 6-5Zm-7 .8c.6 0 1.2.1 1.7.3A6 6 0 0 0 4.6 17v2H1v-2.4c0-2.4 1.8-4.3 4-4.3Zm14 0c2.2 0 4 1.9 4 4.3V19h-3.6v-2a6 6 0 0 0-2.1-4.4c.5-.2 1.1-.3 1.7-.3Z" />),
  spells: g(<path d="M15 2c0 3 3 4 3 7a3 3 0 0 1-6 0c0-1 .5-1.8 1-2.4 0 1 .6 1.6 1.2 1.6C15.4 6 13 4.5 15 2ZM5 9.5a1.2 1.2 0 0 1 2.4 0V13h.6V7.5a1.2 1.2 0 0 1 2.4 0V13h.6V8.5a1.2 1.2 0 0 1 2.4 0V14c1-1.2 2.8-2.4 4-1.7.6.4.5 1-.1 1.6L14 17.5c-1.5 2-3 4-6 4-3.3 0-4.5-2.6-4.5-5.5V11a1.2 1.2 0 0 1 2.4 0v-1.5Z" />),
  backgrounds: g(<path d="M3 4h18v16H3V4Zm2 2v9.5l4-4.5 3.5 3.8L15 12l4 4.5V6H5Zm11 1.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Z" />),
  feats: g(<path d="M7 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM4 8h6v7H9v7H5v-7H4V8Zm9 2h3V5h2.5a1.5 1.5 0 1 1 0 2H18v3h.5a1.5 1.5 0 1 1 0 2H18v3h.5a1.5 1.5 0 1 1 0 2H16v-5h-3v-2Z" />),
  equipment: g(<path d="M9 2h6l-1.5 3.5c3.6 1.6 6.5 5.6 6.5 10 0 3.6-2.6 6.5-8 6.5s-8-2.9-8-6.5c0-4.4 2.9-8.4 6.5-10L9 2Zm1.2 5-1 1.3h5.6l-1-1.3h-3.6Z" />),
  rules: g(<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 2.3L8.4 13h7.2L12 4.3ZM5 8.2v7.2l2.4-1.4L5 8.2Zm14 0L16.6 14l2.4 1.4V8.2ZM8.2 14.8 5.8 16.2 11 19.1l-2.8-4.3Zm7.6 0L13 19.1l5.2-2.9-2.4-1.4Z" />),
  conditions: g(<path d="M12 21C6.5 17 2 13.3 2 8.6 2 5.5 4.4 3 7.4 3c1.9 0 3.5 1 4.6 2.5C13.1 4 14.7 3 16.6 3 19.6 3 22 5.5 22 8.6c0 .5 0 1-.1 1.4H16l-1.5-3-3 6-1.5-3H2.6h5.6l1.8 3.6 1.5-3 1.5 3 1.5-3 1 2h4.9C18.7 15.7 15.6 18.5 12 21Z" />),
}
export const Glyph = ({ c, className = 'size-5' }: { c: Cat; className?: string }) => <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>{GLYPH[c]}</svg>

type CatDef = { id: Cat; label: string; blurb: string; stat?: keyof Stats; sub?: [keyof Stats, string] }
export const CATS: CatDef[] = [
  { id: 'forge', label: 'Character Forge', blurb: 'Build your hero step by step and export a PDF' },
  { id: 'monsters', label: 'Monsters', blurb: 'Every fang, claw and horror in the multiverse', stat: 'monsters' },
  { id: 'magic-items', label: 'Magic Items', blurb: 'Relics, potions and cursed trinkets', stat: 'magicitems' },
  { id: 'classes', label: 'Classes', blurb: 'The callings of heroes', stat: 'classes', sub: ['subclasses', 'subclasses'] },
  { id: 'species', label: 'Species', blurb: 'Bloodlines and peoples', stat: 'species', sub: ['subraces', 'subraces'] },
  { id: 'spells', label: 'Spells', blurb: 'The weave, catalogued', stat: 'spells' },
  { id: 'backgrounds', label: 'Backgrounds', blurb: 'Where your story began', stat: 'backgrounds' },
  { id: 'feats', label: 'Feats', blurb: 'Talents beyond your class', stat: 'feats' },
  { id: 'equipment', label: 'Equipment', blurb: 'Weapons and armor', stat: 'equipment' },
  { id: 'rules', label: 'Rules', blurb: 'The laws of the table', stat: 'rules' },
  { id: 'conditions', label: 'Conditions', blurb: 'Blinded, charmed, grappled and more', stat: 'conditions' },
]
export const cat = (id: Cat) => CATS.find((c) => c.id === id)!

export type GroupId = 'dungeon' | 'heroes' | 'tome'
export const GROUPS: { id: GroupId; label: string; kicker: string; items: Cat[]; img: string; title: string; lede: string }[] = [
  { id: 'dungeon', label: 'Dungeon', kicker: 'For the Dungeon Master', items: ['monsters', 'magic-items'], img: '/realms/dungeon.webp',
    title: 'Beyond the Edge of the Map', lede: 'Where the ground cracks open and the sky fills with wings. Everything a Dungeon Master needs to make the party sweat, and the treasure that makes it worth it.' },
  { id: 'heroes', label: 'Heroes', kicker: 'For the Adventurer', items: ['classes', 'species', 'spells', 'backgrounds', 'feats', 'equipment'], img: '/realms/heroes.webp',
    title: 'Every Legend Starts Small', lede: 'A sword, a spell, a name nobody knows yet. Build the hero who walks into the fog and comes back with a story.' },
  { id: 'tome', label: 'Tome', kicker: 'Rules of the Realm', items: ['rules', 'conditions'], img: '/realms/tome.webp',
    title: 'The Laws of the Wide World', lede: 'Mountains do not move for heroes, and neither do the rules. Combat, travel, rest and every condition that can befall you, set down in one place.' },
]
export const groupOf = (c: Cat) => GROUPS.find((g) => g.items.includes(c))
