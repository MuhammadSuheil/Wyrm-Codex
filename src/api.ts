import { useEffect, useRef, useState } from 'react'

export const API = 'https://api.open5e.com/v1'

// In-memory cache shared by every hook, so navigating back and forth never refetches
const cache = new Map<string, Promise<any>>()
export function get<T = any>(url: string): Promise<T> {
  const full = url.startsWith('http') ? url.replace('http://', 'https://') : `${API}${url}`
  if (!cache.has(full)) {
    const p = fetch(full).then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
    p.catch(() => cache.delete(full))
    cache.set(full, p)
  }
  return cache.get(full)!
}

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '' && v !== false) u.set(k, String(v))
  return u.toString()
}

export type Page<T> = { count: number; next: string | null; results: T[] }

/** Fetch a single resource. Pass null to skip. */
export function useResource<T = any>(url: string | null) {
  const [state, set] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: !!url })
  useEffect(() => {
    if (!url) return
    let live = true
    set((s) => ({ data: s.data, loading: true }))
    get<T>(url).then((data) => live && set({ data, loading: false })).catch((e) => live && set({ error: String(e), loading: false }))
    return () => { live = false }
  }, [url])
  return state
}

/** Paginated list that appends the next page on demand (used for infinite scroll). */
export function useInfinite<T = any>(url: string) {
  const [items, setItems] = useState<T[]>([]); const [count, setCount] = useState<number | null>(null)
  const [next, setNext] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  const gen = useRef(0)
  useEffect(() => {
    const g = ++gen.current
    setLoading(true); setError(null); setItems([]); setCount(null)
    get<Page<T>>(url).then((p) => { if (g !== gen.current) return; setItems(p.results); setCount(p.count); setNext(p.next); setLoading(false) })
      .catch((e) => { if (g === gen.current) { setError(String(e)); setLoading(false) } })
  }, [url])
  const more = () => {
    if (!next || loading) return
    const g = gen.current; setLoading(true)
    get<Page<T>>(next).then((p) => { if (g !== gen.current) return; setItems((x) => [...x, ...p.results]); setNext(p.next); setLoading(false) })
      .catch((e) => { if (g === gen.current) { setError(String(e)); setLoading(false) } })
  }
  return { items, count, loading, error, hasMore: !!next, more }
}

export function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v)
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t) }, [v, ms])
  return d
}

/** Live totals shown on the landing page and in the nav. */
export type Stats = Record<'spells' | 'monsters' | 'magicitems' | 'classes' | 'subclasses' | 'species' | 'subraces' | 'backgrounds' | 'feats' | 'equipment' | 'rules' | 'conditions', number>
let statsP: Promise<Stats> | null = null
export function loadStats(): Promise<Stats> {
  const n = (e: string) => get<Page<unknown>>(`/${e}/?limit=1&fields=slug`).then((p) => p.count)
  statsP ??= Promise.all([
    n('spells'), n('monsters'), n('magicitems'), n('backgrounds'), n('feats'), n('weapons'), n('armor'), n('sections'), n('conditions'),
    get<Page<{ archetypes: unknown[] }>>('/classes/?limit=50&fields=slug,archetypes'),
    get<Page<{ subraces: unknown[] }>>('/races/?limit=50&fields=slug,subraces'),
  ]).then(([spells, monsters, magicitems, backgrounds, feats, weapons, armor, rules, conditions, cls, sp]) => ({
    spells, monsters, magicitems, backgrounds, feats, equipment: weapons + armor, rules, conditions,
    classes: cls.count, subclasses: cls.results.reduce((a, c) => a + c.archetypes.length, 0),
    species: sp.count, subraces: sp.results.reduce((a, r) => a + r.subraces.length, 0),
  }))
  statsP.catch(() => { statsP = null })
  return statsP
}
export function useStats() {
  const [s, set] = useState<Stats | null>(null)
  useEffect(() => { loadStats().then(set).catch(() => {}) }, [])
  return s
}

export const fmt = (n: number) => n.toLocaleString('en-US')
export const cap = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())
