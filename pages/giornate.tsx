import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BRANDS, PDVS, GIORNATE_TIPI } from '@/lib/constants'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

export default function GiornatePage({ session }: { session: Session | null }) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [brand, setBrand] = useState('')
  const [pdv, setPdv] = useState('')
  const [tipo, setTipo] = useState('')
  const [nome, setNome] = useState('')
  const [month, setMonth] = useState(() => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}` })
  const [selDays, setSelDays] = useState<string[]>([])

  useEffect(() => { loadRecords() }, [])

  async function loadRecords() {
    const { data } = await supabase.from('giornate').select('*').order('created_at', { ascending: false })
    setRecords(data || [])
  }

  function getDaysInMonth() {
    const [y, m] = month.split('-').map(Number)
    const days = new Date(y, m, 0).getDate()
    const DNAMES = ['D','L','M','M','G','V','S']
    return Array.from({ length: days }, (_, i) => {
      const d = i + 1
      const dt = new Date(y, m - 1, d)
      return { d, ds: `${month}-${String(d).padStart(2,'0')}`, dow: dt.getDay(), isWe: dt.getDay()===0||dt.getDay()===6, name: DNAMES[dt.getDay()] }
    })
  }

  function toggleDay(ds: string) {
    setSelDays(prev => prev.includes(ds) ? prev.filter(x => x !== ds) : [...prev, ds].sort())
  }

  async function handleAdd() {
    if (!brand || !tipo || !pdv || !selDays.length) { alert('Compila tutti i campi e seleziona almeno un giorno'); return }
    setLoading(true)
    const tipoInfo = GIORNATE_TIPI.find(t => t.value === tipo)
    await supabase.from('giornate').insert({
      brand, pdv, tipo, tipo_label: tipoInfo?.label,
      nome_consulente: nome, days: selDays, giorni_totali: selDays.length,
      created_by: session?.user?.id
    })
    setBrand(''); setPdv(''); setTipo(''); setNome(''); setSelDays([])
    await loadRecords()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare?')) return
    await supabase.from('giornate').delete().eq('id', id)
    await loadRecords()
  }

  const days = getDaysInMonth()

  return (
    <Layout session={session}>
      <div className="mb-6">
        <h1 className="font-serif text-3xl">Giornate <span className="text-accent italic">PDV</span></h1>
        <p className="text-muted text-sm mt-1">Beauty, hostess, specialist, outpost e altro</p>
      </div>

      <div className="card mb-6">
        <div className="label mb-4">Nuova giornata</div>
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
              {GIORNATE_TIPI.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <div className="label mb-1.5">PDV</div>
            <select className="input" value={pdv} onChange={e => setPdv(e.target.value)}>
              <option value="">— Seleziona —</option>
              {PDVS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div className="label mb-1.5">Nome consulente (opz.)</div>
            <input type="text" className="input" value={nome} onChange={e => setNome(e.target.value)} placeholder="es. Angelini" />
          </div>
          <div className="col-span-2">
            <div className="flex items-center gap-4 mb-3">
              <div className="label">Seleziona giorni</div>
              <input type="month" className="input w-44" value={month} onChange={e => { setMonth(e.target.value); setSelDays([]) }} />
              <span className="text-xs text-muted">{selDays.length} giorni selezionati</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {days.map(({ d, ds, name, isWe }) => (
                <button key={ds} onClick={() => toggleDay(ds)}
                  className={`text-xs px-2 py-1 rounded border transition-all cursor-pointer ${isWe ? 'opacity-30' : ''} ${selDays.includes(ds) ? 'bg-teal-400 text-black border-teal-400 font-bold' : 'border-white/10 text-muted2 hover:border-teal-400/50'}`}>
                  {d} {name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={handleAdd} disabled={loading}>
          {loading ? 'Salvataggio...' : 'Aggiungi ✓'}
        </button>
      </div>

      <div className="card">
        <div className="label mb-4">Giornate inserite</div>
        {!records.length ? (
          <div className="text-muted text-sm py-8 text-center">Nessuna giornata inserita.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {records.map(r => {
              const tipoInfo = GIORNATE_TIPI.find(t => t.value === r.tipo)
              return (
                <div key={r.id} className="card-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: (tipoInfo?.color||'#2dd4bf')+'22', color: tipoInfo?.color||'#2dd4bf' }}>👤</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{r.brand} · {r.pdv}{r.nome_consulente ? ' · ' + r.nome_consulente : ''}</div>
                    <div className="text-xs text-muted mt-0.5">{r.tipo_label || r.tipo} · {r.days?.[0]} → {r.days?.[r.days.length-1]}</div>
                  </div>
                  <div className="text-sm font-semibold whitespace-nowrap" style={{ color: tipoInfo?.color||'#2dd4bf' }}>{r.giorni_totali} gg</div>
                  <button className="btn-ghost" onClick={() => handleDelete(r.id)}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
