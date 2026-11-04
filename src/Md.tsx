import { Fragment, type ReactNode } from 'react'
import { rollable } from './codex/dice'

// Minimal, safe markdown renderer for Open5e text: headings, bold/italic, lists, tables, paragraphs.
// Builds React elements directly (no innerHTML).
let ROLL = false
const txt = (s: string, k: number) => (ROLL ? rollable(s, k) : [s])
function inline(s: string, k = 0): ReactNode[] {
  const out: ReactNode[] = []; const re = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_]+_)/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(...txt(s.slice(last, m.index), k * 100 + i))
    const t = m[0]
    // Recurse so nested emphasis like **_Title._** renders cleanly
    if (t.startsWith('***')) out.push(<strong key={`${k}-${i++}`} className="font-semibold italic text-bone">{inline(t.slice(3, -3), k + 1)}</strong>)
    else if (t.startsWith('**')) out.push(<strong key={`${k}-${i++}`} className="font-semibold text-bone">{inline(t.slice(2, -2), k + 1)}</strong>)
    else out.push(<em key={`${k}-${i++}`}>{inline(t.slice(1, -1), k + 1)}</em>)
    last = m.index + t.length
  }
  if (last < s.length) out.push(...txt(s.slice(last), k * 100 + 99))
  return out
}

export default function Md({ text, className = '', roll = false }: { text?: string | null; className?: string; roll?: boolean }) {
  if (!text) return null
  ROLL = roll
  const lines = text.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let i = 0, key = 0
  while (i < lines.length) {
    const l = lines[i].trim()
    if (!l) { i++; continue }
    if (l.startsWith('>')) {
      const q: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) { q.push(lines[i].trim().replace(/^>\s?/, '')); i++ }
      blocks.push(<blockquote key={key++} className="my-5 rounded-r-xl border-l-2 border-gold/50 bg-gold/[.04] px-5 py-4"><Md text={q.join('\n')} roll={ROLL} /></blockquote>)
      continue
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(l)
    if (h) {
      const lvl = h[1].length
      blocks.push(lvl <= 3
        ? <h3 key={key++} className="mt-6 mb-2 font-display text-2xl text-bone first:mt-0">{inline(h[2])}</h3>
        : <h4 key={key++} className="mt-5 mb-1.5 font-display text-lg tracking-wide text-gold first:mt-0">{inline(h[2])}</h4>)
      i++; continue
    }
    if (l.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const r = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
        if (!r.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(r)
        i++
      }
      const [head, ...body] = rows
      blocks.push(
        <div key={key++} className="my-4 overflow-x-auto rounded-lg border border-white/8">
          <table className="w-full text-left text-sm">
            <thead className="bg-ember/10 font-display tracking-wide text-gold"><tr>{head.map((c, j) => <th key={j} className="whitespace-nowrap px-3 py-2 font-normal">{inline(c)}</th>)}</tr></thead>
            <tbody>{body.map((r, j) => <tr key={j} className="border-t border-white/5 odd:bg-white/[.02]">{r.map((c, x) => <td key={x} className="px-3 py-1.5 align-top text-bone/80">{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      )
      continue
    }
    if (/^([*-]|\d+\.)\s+/.test(l)) {
      const items: string[] = []; const ordered = /^\d+\./.test(l)
      while (i < lines.length && /^([*-]|\d+\.)\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^([*-]|\d+\.)\s+/, '')); i++ }
      const Tag = ordered ? 'ol' : 'ul'
      blocks.push(<Tag key={key++} className={`my-3 space-y-1.5 pl-5 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-ember`}>{items.map((t, j) => <li key={j}>{inline(t, j)}</li>)}</Tag>)
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\||>|([*-]|\d+\.)\s)/.test(lines[i].trim())) { para.push(lines[i].trim()); i++ }
    blocks.push(<p key={key++} className="my-3 first:mt-0">{para.map((p, j) => <Fragment key={j}>{j > 0 && ' '}{inline(p, j)}</Fragment>)}</p>)
  }
  return <div className={`leading-relaxed text-bone/80 ${className}`}>{blocks}</div>
}
