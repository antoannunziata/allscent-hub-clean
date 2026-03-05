import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BRANDS, PDVS, MONTHS_IT } from '@/lib/constants'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'
import { addDays, format, eachDayOfInterval, parseISO } from 'date-fns'

const LAYERS = [
  { id: 'trade',    label: 'Visibilità Trade',  color: '#a78bfa' },
  { id: 'giornate', label: 'Giornate PDV',       color: '#2dd4bf' },
  { id: 'internal', label: 'Attività Interne',   color: '#fb923c' },
  { id: 'social',   label: 'Social',             color: '#f472b6' },
]

export default function CalendarPage({ session }: { session: Session | null }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [layers, setLayers] = useState({ trade: true, giornate: true, internal: true, social: true })
  const [filterBrand, setFilterBrand] = useState('')
  const [filterPdv, setFilterPdv] = useState('')
  const [trade, setTrade] = useState<any[]>([])
  const [giornate, setGiornate] = useState<any[]>([])
  const [internal, setInternal] = useState<any[]>([])
  const [social, setSocial] = useState<any[]>([])

  useEffect(() => { loadAll() }, [year, month])

  async function loadAll() {
    const ms = `${year}-${String(month+1).padStart(2,'0')}`
    const start = `${ms}-01`, end = `${ms}-31`
    const [t, g, i, s] = await Promise.all([
      supabase.from('trade_activities').select('*').lte('start_date', end).gte('end_date', start),
      supabase.from('giornate').select('*'),
      supabase.from('internal_activities').select('*').lte('start_date', end).gte('start_date', start),
      supabase.from('social_posts').select('*').gte('post_date', start).lte('post_date', end),
    ])
    setTrade(t.data || [])
    setGiornate((g.data || []).filter((r: any) => r.days?.some((d: string) => d.startsWith(ms))))
    setInternal(i.data || [])
    setSocial(s.data || [])
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const ms = `${year}-${String(month+1).padStart(2,'0')}`

  // Build rows
  let rows: any[] = []
  if (layers.trade) {
    trade.filter(a => !filterBrand || a.brand === filterBrand)
      .filter(a => !filterPdv || (a.pdvs||[]).includes(filterPdv))
      .forEach(a => {
        (a.pdvs||[]).filter((p: string) => !filterPdv || p === filterPdv).forEach((pdv: string) => {
          rows.push({ label: a.brand, sub: pdv, badge: a.tipo_label?.slice(0,14)||a.tipo, color: '#a78bfa', start: a.start_date, end: a.end_date })
        })
      })
  }
  if (layers.giornate) {
    giornate.filter(r => !filterBrand || r.brand === filterBrand)
      .filter(r => !filterPdv || r.pdv === filterPdv)
      .forEach(r => {
        rows.push({ label: r.brand, sub: r.pdv+(r.nome_consulente?' · '+r.nome_consulente:''), badge: r.tipo_label||r.tipo, color: '#2dd4bf', days: r.days?.filter((d:string)=>d.startsWith(ms)) })
      })
  }
  if (layers.internal) {
    internal.filter(a => !filterBrand || !a.brand || a.brand === filterBrand)
      .forEach(a => {
        rows.push({ label: a.tipo_label||a.tipo, sub: a.owner||'', badge: a.brand||'Interno', color: '#fb923c', start: a.start_date, end: a.end_date||a.start_date })
      })
  }
  if (layers.social) {
    social.filter(s => !filterBrand || !s.brand || s.brand === filterBrand)
      .forEach(s => {
        rows.push({ label: s.channel_label||s.channel, sub: s.title?.slice(0,20), badge: s.status, color: '#f472b6', days: [s.post_date] })
      })
  }

  return (
    <Layout session={session}>
      <div className="mb-6">
        <h1 className="font-serif text-3xl">Calendario <span className="text-accent italic">Unificato</span></h1>
        <p className="text-muted text-sm mt-1">Tutti i layer sovrapposti — attiva/disattiva con i toggle</p>
      </div>

      <div className="card">
        {/* Controls */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button className="btn-secondary px-3 py-1.5 text-sm" onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }}>‹</button>
            <div className="font-serif text-xl min-w-[180px]">{MONTHS_IT[month]} {year}</div>
            <button className="btn-secondary px-3 py-1.5 text-sm" onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }}>›</button>
          </div>
          <div className="flex gap-2 flex-wrap ml-auto">
            {LAYERS.map(l => (
              <button key={l.id} onClick={() => setLayers(prev => ({ ...prev, [l.id]: !prev[l.id as keyof typeof prev] }))}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all cursor-pointer ${layers[l.id as keyof typeof layers] ? 'opacity-100' : 'opacity-30'}`}
                style={{ borderColor: l.color, color: l.color, background: 'transparent' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mb-4">
          <select className="input w-44 text-xs" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
            <option value="">Tutti i brand</option>
            {BRANDS.map(b => <option key={b}>{b}</option>)}
          </select>
          <select className="input w-44 text-xs" value={filterPdv} onChange={e => setFilterPdv(e.target.value)}>
            <option value="">Tutti i PDV</option>
            {PDVS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Calendar table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: `${daysInMonth * 28 + 260}px` }}>
            <thead>
              <tr>
                <th className="text-left text-xs text-muted2 font-semibold px-3 py-2 bg-surface2 border border-white/5 min-w-[260px]">Attività</th>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dt = new Date(year, month, i+1)
                  const isWe = dt.getDay()===0||dt.getDay()===6
                  const isToday = dt.toDateString() === new Date().toDateString()
                  return (
                    <th key={i} className={`text-center text-[10px] font-semibold py-2 border border-white/5 w-7 ${isWe ? 'text-muted opacity-40' : isToday ? 'text-accent' : 'text-muted'} ${isWe ? 'bg-white/[0.01]' : 'bg-surface2'}`}>
                      {i+1}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {!rows.length ? (
                <tr><td colSpan={daysInMonth+1} className="text-center text-muted text-sm py-12">Nessuna attività per {MONTHS_IT[month]} {year}.</td></tr>
              ) : rows.map((r, ri) => (
                <tr key={ri} className="hover:bg-white/[0.02] transition-colors">
                  <td className="border border-white/5 px-3 py-1.5 bg-surface">
                    <div className="font-semibold text-xs" style={{ color: r.color }}>{r.label}</div>
                    <div className="text-[10px] text-muted">{r.sub}</div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ background: r.color+'22', color: r.color }}>{r.badge}</span>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const ds = `${ms}-${String(i+1).padStart(2,'0')}`
                    const isWe = new Date(year,month,i+1).getDay()===0||new Date(year,month,i+1).getDay()===6
                    const active = r.days ? r.days.includes(ds) : (ds >= r.start && ds <= r.end)
                    return (
                      <td key={i} className={`border border-white/5 h-8 ${isWe ? 'bg-white/[0.01]' : ''}`}>
                        {active && <div className="w-full h-full" style={{ background: r.color, opacity: 0.8 }} />}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
