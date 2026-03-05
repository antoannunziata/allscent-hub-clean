import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BRANDS, INTERNAL_TIPI } from '@/lib/constants'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

export default function InternalPage({ session }: { session: Session | null }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState('')
  const [brand, setBrand] = useState('')
  const [owner, setOwner] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pdvArea, setPdvArea] = useState('')
  const [desc, setDesc] = useState('')

  useEffect(() => { loadActivities() }, [])

  async function loadActivities() {
    const { data } = await supabase.from('internal_activities').select('*').order('start_date')
    setActivities(data || [])
  }

  async function handleAdd() {
    if (!tipo || !startDate) { alert('Seleziona tipo e data inizio'); return }
    setLoading(true)
    const tipoInfo = INTERNAL_TIPI.find(t => t.value === tipo)
    await supabase.from('internal_activities').insert({
      tipo, tipo_label: tipoInfo?.label, brand, owner,
      start_date: startDate, end_date: endDate || startDate,
      pdv_area: pdvArea, description: desc, created_by: session?.user?.id
    })
    setTipo(''); setBrand(''); setOwner(''); setStartDate(''); setEndDate(''); setPdvArea(''); setDesc('')
    await loadActivities()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare?')) return
    await supabase.from('internal_activities').delete().eq('id', id)
    await loadActivities()
  }

  return (
    <Layout session={session}>
      <div className="mb-6">
        <h1 className="font-serif text-3xl">Attività <span className="text-accent italic">Interne</span></h1>
        <p className="text-muted text-sm mt-1">GWP, aperture, eventi, formazione, campagne</p>
      </div>

      <div className="card mb-6">
        <div className="label mb-4">Nuova attività</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="label mb-1.5">Tipo attività</div>
            <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">— Seleziona —</option>
              {INTERNAL_TIPI.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div>
            <div className="label mb-1.5">Brand (opz.)</div>
            <select className="input" value={brand} onChange={e => setBrand(e.target.value)}>
              <option value="">— Nessuno —</option>
              {BRANDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <div className="label mb-1.5">Responsabile</div>
            <input type="text" className="input" value={owner} onChange={e => setOwner(e.target.value)} placeholder="es. Benedetta" />
          </div>
          <div>
            <div className="label mb-1.5">Data inizio</div>
            <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <div className="label mb-1.5">Data fine (opz.)</div>
            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <div className="label mb-1.5">PDV / Area (opz.)</div>
            <input type="text" className="input" value={pdvArea} onChange={e => setPdvArea(e.target.value)} placeholder="es. Tutti / Morelli, Pompei" />
          </div>
          <div className="col-span-3">
            <div className="label mb-1.5">Descrizione</div>
            <textarea className="input resize-none h-20" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Dettagli dell'attività..." />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={handleAdd} disabled={loading}>
          {loading ? 'Salvataggio...' : 'Aggiungi ✓'}
        </button>
      </div>

      <div className="card">
        <div className="label mb-4">Attività inserite</div>
        {!activities.length ? (
          <div className="text-muted text-sm py-8 text-center">Nessuna attività inserita.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {activities.map(a => {
              const tipoInfo = INTERNAL_TIPI.find(t => t.value === a.tipo)
              return (
                <div key={a.id} className="card-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-400/10 flex items-center justify-center text-base flex-shrink-0">{tipoInfo?.icon || '🎯'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{a.tipo_label || a.tipo}{a.brand ? ' · ' + a.brand : ''}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {a.owner ? '👤 ' + a.owner + ' · ' : ''}📅 {a.start_date}{a.end_date && a.end_date !== a.start_date ? ' → ' + a.end_date : ''}{a.pdv_area ? ' · 📍 ' + a.pdv_area : ''}
                    </div>
                    {a.description && <div className="text-xs text-muted mt-0.5 opacity-70 truncate">{a.description}</div>}
                  </div>
                  <button className="btn-ghost" onClick={() => handleDelete(a.id)}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
