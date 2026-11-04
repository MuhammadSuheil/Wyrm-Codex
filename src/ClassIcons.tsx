import type { ReactNode } from 'react'

// Emblem glyphs for each class, drawn on a 48x48 grid
const glyphs: Record<string, ReactNode> = {
  Barbarian: <><path d="M24 8v34" /><path d="M24 12c-8-2-14 2-16 10 6-3 11-3 16 0M24 12c8-2 14 2 16 10-6-3-11-3-16 0" /></>,
  Bard: <><path d="M18 34a6 6 0 1 1-6-6c4 0 6 3 6 6Zm0 0V10l18-4v22" /><circle cx="30" cy="28" r="6" /></>,
  Cleric: <><circle cx="24" cy="24" r="6" /><path d="M24 6v8M24 34v8M6 24h8M34 24h8M11 11l6 6M31 31l6 6M37 11l-6 6M17 31l-6 6" /></>,
  Druid: <><path d="M24 42V20" /><path d="M24 22c-10 0-14-8-12-16 8 0 14 6 12 16ZM24 28c8 0 12-6 11-13-7 0-12 5-11 13Z" /></>,
  Fighter: <><path d="M14 6 34 26M34 6 14 26" /><path d="M10 30l8 8M38 30l-8 8M14 34l-6 6M34 34l6 6" /></>,
  Monk: <><path d="M16 20v-6a3 3 0 0 1 6 0v4-6a3 3 0 0 1 6 0v6-4a3 3 0 0 1 6 0v12c0 7-5 12-11 12s-11-4-11-10v-4a3 3 0 0 1 4-3" /></>,
  Paladin: <><path d="M24 6 10 11v11c0 10 6 16 14 20 8-4 14-10 14-20V11Z" /><path d="M24 14v20M17 21h14" /></>,
  Ranger: <><path d="M14 6c14 6 14 30 0 36M14 6v36" /><path d="M10 24h30M34 20l6 4-6 4" /></>,
  Rogue: <><path d="M30 6 18 30l-4 4 4 4 4-4 24-12-10-2Z" /><path d="M12 32l-4 8 8-4" /></>,
  Sorcerer: <><path d="M24 42c8 0 13-5 13-12 0-7-5-12-9-18 0 5-2 8-5 8-3 0-3-5-2-11-7 4-11 11-11 20 0 8 6 13 14 13Z" /><path d="M24 42c-3 0-5-2-5-6 0-3 2-6 5-9 3 3 5 6 5 9 0 4-2 6-5 6Z" /></>,
  Warlock: <><path d="M4 24s8-12 20-12 20 12 20 12-8 12-20 12S4 24 4 24Z" /><path d="M24 17c2 3 2 11 0 14-2-3-2-11 0-14Z" /></>,
  Wizard: <><path d="M24 4 12 34h24L24 4Z" /><path d="M8 38h32M20 22l4-2 4 2M22 28h4" /></>,
}

export function ClassEmblem({ name, className = '' }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 2 58 17v30L32 62 6 47V17Z" strokeWidth="1.5" strokeOpacity=".5" />
      <path d="M32 7 54 20v24L32 57 10 44V20Z" strokeWidth="1" strokeOpacity=".25" />
      <g transform="translate(8 8)" strokeWidth="2.2">{glyphs[name]}</g>
    </svg>
  )
}
