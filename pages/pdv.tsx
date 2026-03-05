import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PDVS, GIORNATE_TIPI } from '@/lib/constants'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

export default function PdvPage({ session }: { session: Session | null }) {
  const [selPdv, setSelPdv] = useState('')
  const [trade, setTrade] = useState<any[]>([])
  const [giornate, setGiornate] = useState<any[]>([])
  const [internal, setInternal] = useState<any[]>([])

  async function loadPdv(pdv: string) {
    if (!pdv) return
    const [t, g, i] = await Promise.all([
      supabase.from('trade_activities').select('*').contains('pdvs', [pdv]),
      supabase.from('giornate').select('*').eq('pdv', pdv),
      supabase.from('internal_activities').select('*').ilike('pdv_area', `%${pdv}%`),
    ])
    setTrade(t.data || [])
    setGiornate(g.data || [])
    setInternal(i.data || [])
  }

  return (
    <Layout session={session}>
      <div className="mb-6">
        <h1 className="font-serif text-3xl">Vista <span className="text-accent italic">PDV</span></h1>
        <p className="text-muted text-sm mt-1">Tutte le attività di un punto vendita</p>
      </div>

      <div className="flex gap-3 mb-6">
        <select className="input w-64 text-base" value={selPdv} onChange={e => { setSelPdv(e.target.value); loadPdv(e.target.value) }}>
          <option value="">— Seleziona PDV —</option>
          {PDVS.map(p => <option key={p}>{p}</option>)}
        </select>
        {selPdv && <button className="btn-secondary text-xs" onClick={() => window.print()}>🖨️ Stampa</button>}
      </div>

      {selPdv && (
        <>
          {/* Hero */}
          <div className="card mb-5" style={{ background: 'linear-gradient(135deg, #1a1a24, #22222f)' }}>
            <div className="font-serif text-3xl text-accent mb-3">📍 {selPdv}</div>
            <div className="flex gap-8">
              {[
                { label: 'Attivazioni Trade', value: trade.length, color: '#a78bfa' },
                { label: 'Giorni consulente', value: giornate.reduce((s, r) => s + r.giorni_totali, 0), color: '#2dd4bf' },
                { label: 'Attività interne', value: internal.length, color: '#fb923c' },
                { label: 'Budget trade', value: trade.reduce((s, a) => s + Number(a.price), 0).toLocaleString('it-IT') + ' €', color: '#c9a96e' },
              ].map(s => (
                <div key={s.label}>
                  <div className="font-serif text-2xl" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-muted uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade */}
          {trade.length > 0 && (
            <div className="card mb-4">
              <div className="label mb-3">Visibilità Trade</div>
              <div className="flex flex-col gap-2">
                {trade.map(a => (
                  <div key={a.id} className="card-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center text-sm">💄</div>
                    <div className="flex-1"><div className="text-sm font-semibold">{a.brand} — {a.tipo_label||a.tipo}</div><div className="text-xs text-muted">{a.start_date} → {a.end_date}</div></div>
                    <span className={`badge ${a.incl_contributo?'badge-incl':'badge-extra'}`}>{a.incl_contributo?'contributo':'extra'}</span>
                    <div className="font-serif text-accent">{Number(a.price).toLocaleString('it-IT')} €</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Giornate */}
          {giornate.length > 0 && (
            <div className="card mb-4">
              <div className="label mb-3">Giornate</div>
              <div className="flex flex-col gap-2">
                {giornate.map(r => {
                  const t = GIORNATE_TIPI.find(t => t.value === r.tipo)
                  return (
                    <div key={r.id} className="card-sm flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: (t?.color||'#2dd4bf')+'22', color: t?.color||'#2dd4bf' }}>👤</div>
                      <div className="flex-1"><div className="text-sm font-semibold">{r.brand}{r.nome_consulente?' · '+r.nome_consulente:''}</div><div className="text-xs text-muted">{r.tipo_label||r.tipo} · {r.days?.[0]} → {r.days?.[r.days.length-1]}</div></div>
                      <div className="text-sm font-semibold" style={{ color: t?.color||'#2dd4bf' }}>{r.giorni_totali} gg</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Internal */}
          {internal.length > 0 && (
            <div className="card">
              <div className="label mb-3">Attività Interne</div>
              <div className="flex flex-col gap-2">
                {internal.map(a => (
                  <div key={a.id} className="card-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-400/10 flex items-center justify-center text-sm">🎯</div>
                    <div className="flex-1"><div className="text-sm font-semibold">{a.tipo_label||a.tipo}{a.brand?' · '+a.brand:''}</div><div className="text-xs text-muted">{a.start_date}{a.end_date&&a.end_date!==a.start_date?' → '+a.end_date:''}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!trade.length && !giornate.length && !internal.length && (
            <div className="card text-center py-12 text-muted">Nessuna attività per {selPdv}.</div>
          )}
        </>
      )}

      {!selPdv && (
        <div className="card text-center py-16 text-muted">Seleziona un PDV per vedere tutte le attività.</div>
      )}
    </Layout>
  )
}
