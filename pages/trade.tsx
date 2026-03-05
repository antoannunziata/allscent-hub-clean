import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BRANDS, PDVS, TRADE_TIPI } from '@/lib/constants'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

export default function TradePage({ session }: { session: Session | null }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [brand, setBrand] = useState('')
  const [tipo, setTipo] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [selPdvs, setSelPdvs] = useState<string[]>([])
  const [filterBrand, setFilterBrand] = useState('')
  const [filterPdv, setFilterPdv] = useState('')

  useEffect(() => { loadActivities() }, [])

  async function loadActivities() {
    const { data } = await supabase.from('trade_activities').select('*').order('created_at', { ascending: false })
    setActivities(data || [])
  }

  const tipoInfo = TRADE_TIPI.find(t => t.value === tipo)
  const nPdv = Math.max(1, selPdvs.length)
  const estimatedPrice = tipoInfo ? (tipoInfo.unit === 'pdv2w' ? tipoInfo.price * nPdv : tipoInfo.price) : 0

  function togglePdv(pdv: string) {
    setSelPdvs(prev => prev.includes(pdv) ? prev.filter(p => p !== pdv) : [...prev, pdv])
  }

  async function handleAdd() {
    if (!brand || !tipo || !startDate || !endDate || !selPdvs.length) {
      alert('Compila tutti i campi e seleziona almeno un PDV'); return
    }
    setLoading(true)
    await supabase.from('trade_activities').insert({
      brand, tipo, tipo_label: tipoInfo?.label,
      pdvs: selPdvs, start_date: startDate, end_date: endDate,
      price: estimatedPrice, incl_contributo: tipoInfo?.incl || false,
      note, created_by: session?.user?.id
    })
    setBrand(''); setTipo(''); setStartDate(''); setEndDate(''); setNote(''); setSelPdvs([])
    await loadActivities()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa attivazione?')) return
    await supabase.from('trade_activities').delete().eq('id', id)
    await loadActivities()
  }

  const filtered = activities.filter(a => {
    if (filterBrand && a.brand !== filterBrand) return false
    if (filterPdv && !(a.pdvs||[]).includes(filterPdv)) return false
    return true
  })

  return (
    <Layout session={session}>
      <div className="mb-6">
        <h1 className="font-serif text-3xl">Visibilità <span className="text-accent italic">Trade</span></h1>
        <p className="text-muted text-sm mt-1">Gestisci attivazioni con calcolo budget automatico</p>
      </div>

      {/* Form */}
      <div className="card mb-6">
        <div className="label mb-4">Nuova attivazione</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="label mb-1.5">Brand</div>
            <select className="input" value={brand} onChange={e => setBrand(e.target.value)}>
              <option value="">— Seleziona —</option>
              {BRANDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <div className="label mb-1.5">Tipologia</div>
            <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">— Seleziona —</option>
              {TRADE_TIPI.map(t => <option key={t.value} value={t.value}>{t.label} ({t.value})</option>)}
            </select>
          </div>
          <div>
            <div className="label mb-1.5">Data inizio</div>
            <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <div className="label mb-1.5">Data fine</div>
            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="col-span-2">
            <div className="label mb-1.5">Punti Vendita</div>
            <div className="flex gap-2 mb-2">
              <button className="text-xs text-accent underline bg-none border-none cursor-pointer" onClick={() => setSelPdvs([...PDVS])}>Tutti</button>
              <button className="text-xs text-muted underline bg-none border-none cursor-pointer" onClick={() => setSelPdvs([])}>Nessuno</button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
              {PDVS.map(p => (
                <button key={p} onClick={() => togglePdv(p)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${selPdvs.includes(p) ? 'bg-accent text-black border-accent font-bold' : 'border-white/10 text-muted2 hover:border-accent/50'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {tipoInfo && (
            <div className="col-span-2 bg-surface3 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <div className="label">Costo stimato</div>
                <div className="font-serif text-2xl text-accent">{estimatedPrice.toLocaleString('it-IT')} €</div>
              </div>
              <span className={`badge ${tipoInfo.incl ? 'badge-incl' : 'badge-extra'}`}>
                {tipoInfo.incl ? '✓ Incluso contributo' : '✗ Extra contributo'}
              </span>
            </div>
          )}
          <div className="col-span-2">
            <div className="label mb-1.5">Note (opzionale)</div>
            <input type="text" className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="..." />
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={handleAdd} disabled={loading}>
          {loading ? 'Salvataggio...' : 'Aggiungi ✓'}
        </button>
      </div>

      {/* List */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="label">Attivazioni inserite</div>
          <select className="input w-40 ml-auto" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
            <option value="">Tutti i brand</option>
            {BRANDS.map(b => <option key={b}>{b}</option>)}
          </select>
          <select className="input w-40" value={filterPdv} onChange={e => setFilterPdv(e.target.value)}>
            <option value="">Tutti i PDV</option>
            {PDVS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        {!filtered.length ? (
          <div className="text-muted text-sm py-8 text-center">Nessuna attivazione inserita.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(a => (
              <div key={a.id} className="card-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-400/10 flex items-center justify-center text-sm flex-shrink-0">💄</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{a.brand} — {a.tipo_label || a.tipo}</div>
                  <div className="text-xs text-muted mt-0.5">📍 {(a.pdvs||[]).join(', ')} · 📅 {a.start_date} → {a.end_date}</div>
                  <div className="flex gap-2 mt-1">
                    <span className={`badge ${a.incl_contributo ? 'badge-incl' : 'badge-extra'}`}>
                      {a.incl_contributo ? 'contributo' : 'extra'}
                    </span>
                    {a.note && <span className="badge bg-white/5 text-muted2">{a.note}</span>}
                  </div>
                </div>
                <div className="font-serif text-lg text-accent whitespace-nowrap">{Number(a.price).toLocaleString('it-IT')} €</div>
                <button className="btn-ghost" onClick={() => handleDelete(a.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
