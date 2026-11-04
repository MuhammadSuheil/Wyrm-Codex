import { useEffect, useState, type ReactNode } from 'react'

type Roll = { label: string; total: number; detail: string; crit?: 'hit' | 'miss'; k: number }

export function rollExpr(expr: string): Omit<Roll, 'label' | 'k'> {
  const e = expr.replace(/\s+/g, '').replace(/−/g, '-')
  const hit = /^([+-]\d+)$/.exec(e)
  if (hit) {
    const d = 1 + Math.floor(Math.random() * 20), m = +hit[1]
    return { total: d + m, detail: `d20 (${d}) ${m >= 0 ? '+' : '-'} ${Math.abs(m)}`, crit: d === 20 ? 'hit' : d === 1 ? 'miss' : undefined }
  }
  const m = /^(\d*)d(\d+)([+-]\d+)?$/.exec(e)
  if (!m) return { total: 0, detail: expr }
  const n = +(m[1] || 1), s = +m[2], mod = +(m[3] || 0)
  const rolls = Array.from({ length: Math.min(n, 100) }, () => 1 + Math.floor(Math.random() * s))
  return { total: rolls.reduce((a, b) => a + b, 0) + mod, detail: `[${rolls.join(', ')}]${mod ? ` ${mod > 0 ? '+' : '-'} ${Math.abs(mod)}` : ''}` }
}

export const roll = (expr: string, label = expr) => dispatchEvent(new CustomEvent('codex-roll', { detail: { ...rollExpr(expr), label, k: Date.now() + Math.random() } }))

// Splits text into plain runs and clickable dice / to-hit chips
const RE = /(\d+d\d+(?:\s*[+−-]\s*\d+)?)|([+−-]\d+)(?=\s+to hit)/g
export function rollable(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = []; let last = 0, m: RegExpExecArray | null, i = 0
  RE.lastIndex = 0
  while ((m = RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const expr = m[0]
    out.push(
      <button key={`r${key}-${i++}`} type="button" onClick={(e) => { e.stopPropagation(); roll(expr, m![2] ? 'Attack roll' : expr) }}
        className="dice-chip mx-0.5 inline-flex items-center gap-1 rounded-md border border-ember/40 bg-ember/10 px-1.5 py-px align-baseline text-[0.92em] text-[#ffb3a6] transition hover:border-flame hover:bg-ember/25 hover:text-bone" title={`Roll ${expr}`}>
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" /></svg>{expr}
      </button>,
    )
    last = m.index + expr.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** Shows the latest roll from anywhere in the codex */
export function RollToast() {
  const [rolls, setRolls] = useState<Roll[]>([])
  useEffect(() => {
    const on = (e: Event) => { const r = (e as CustomEvent<Roll>).detail; setRolls((x) => [r, ...x].slice(0, 3)); setTimeout(() => setRolls((x) => x.filter((y) => y.k !== r.k)), 4200) }
    addEventListener('codex-roll', on); return () => removeEventListener('codex-roll', on)
  }, [])
  return (
    <div className="pointer-events-none fixed bottom-24 right-5 z-50 flex flex-col items-end gap-2">
      {rolls.map((r, i) => (
        <div key={r.k} className="rise flex items-center gap-4 rounded-2xl border border-ember/40 bg-coal/95 py-3 pl-4 pr-5 shadow-[0_20px_50px_-10px_rgba(0,0,0,.9),0_0_30px_-10px_rgba(200,32,43,.6)] backdrop-blur" style={{ opacity: 1 - i * 0.25 }}>
          <span key={r.k} className={`rolling font-display text-4xl leading-none ${r.crit === 'hit' ? 'text-gold' : r.crit === 'miss' ? 'text-smoke' : 'ember-text'}`}>{r.total}</span>
          <span className="text-left">
            <span className="block font-display text-sm tracking-wider text-bone">{r.label}{r.crit === 'hit' ? ' · Natural 20!' : r.crit === 'miss' ? ' · Natural 1' : ''}</span>
            <span className="block text-xs text-smoke">{r.detail}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
