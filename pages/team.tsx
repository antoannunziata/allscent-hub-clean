import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

const RUOLI: Record<string, string> = {
  SM: 'Store Manager', AV: 'Assistente Vendita', HR: 'Risorse Umane',
  VSM: 'Vice Store Manager', ST: 'Stage'
}
const STATI_COLORS: Record<string, string> = {
  attivo: 'bg-green-500/20 text-green-400',
  cessato: 'bg-red-500/20 text-red-400',
  maternita: 'bg-purple-500/20 text-purple-400',
  default: 'bg-surface3 text-muted2'
}

export default function TeamPage({ session }: { session: Session | null }) {
  const [risorse, setRisorse] = useState<any[]>([])
  const [pdvList, setPdvList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filterNome, setFilterNome] = useState('')
  const [filterPdv, setFilterPdv] = useState('')
  const [filterRuolo, setFilterRuolo] = useState('')
  const [filterStato, setFilterStato] = useState('')
  const [filterContratto, setFilterContratto] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({
    cognome: '', nome: '', pdv_nome: '', ruolo: '', contratto: '',
    data_assunzione: '', data_cessazione: '', stato: 'attivo',
    motivo_cessazione: '', telefono: '', email: '', note: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from('risorse').select('*').order('cognome'),
      supabase.from('punti_vendita').select('*').order('nome'),
    ])
    setRisorse(r || [])
    setPdvList(p || [])
    setLoading(false)
  }

  const filtered = risorse.filter(r => {
    const nome = `${r.cognome} ${r.nome}`.toLowerCase()
    if (filterNome && !nome.includes(filterNome.toLowerCase())) return false
    if (filterPdv && r.pdv_nome !== filterPdv) return false
    if (filterRuolo && r.ruolo !== filterRuolo) return false
    if (filterStato && r.stato !== filterStato) return false
    if (filterContratto && r.contratto !== filterContratto) return false
    return true
  })

  function openNew() {
    setEditingId(null)
    setForm({ cognome: '', nome: '', pdv_nome: '', ruolo: '', contratto: '',
      data_assunzione: '', data_cessazione: '', stato: 'attivo',
      motivo_cessazione: '', telefono: '', email: '', note: '' })
    setShowForm(true)
  }

  function openEdit(r: any) {
    setEditingId(r.id)
    setForm({
      cognome: r.cognome || '', nome: r.nome || '', pdv_nome: r.pdv_nome || '',
      ruolo: r.ruolo || '', contratto: r.contratto || '',
      data_assunzione: r.data_assunzione || '', data_cessazione: r.data_cessazione || '',
      stato: r.stato || 'attivo', motivo_cessazione: r.motivo_cessazione || '',
      telefono: r.telefono || '', email: r.email || '', note: r.note || ''
    })
    setShowForm(true)
  }

 async function save() {
  setSaving(true)
  const payload = {
    ...form,
    data_assunzione: form.data_assunzione || null,
    data_cessazione: form.data_cessazione || null,
    motivo_cessazione: form.motivo_cessazione || null,
  }
  if (editingId) {
    await supabase.from('risorse').update(payload).eq('id', editingId)
  } else {
    await supabase.from('risorse').insert(payload)
  }
  const { data: pvs } = await supabase.from('punti_vendita').select('id, nome')
  for (const pv of pvs || []) {
    await supabase.from('risorse').update({ pdv_id: pv.id }).eq('pdv_nome', pv.nome)
  }
  setShowForm(false)
  await loadAll()
  setSaving(false)
}

  async function deleteRisorsa(id: string) {
    if (!confirm('Eliminare questa risorsa?')) return
    await supabase.from('risorse').delete().eq('id', id)
    await loadAll()
  }

  function exportExcel() {
    const headers = ['Cognome', 'Nome', 'PDV', 'Ruolo', 'Contratto', 'Data Assunzione', 'Data Cessazione', 'Stato', 'Motivo Cessazione', 'Telefono', 'Email']
    const rows = filtered.map(r => [
      r.cognome, r.nome, r.pdv_nome, RUOLI[r.ruolo] || r.ruolo,
      r.contratto, r.data_assunzione || '', r.data_cessazione || '',
      r.stato, r.motivo_cessazione || '', r.telefono || '', r.email || ''
    ])
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const today = new Date().toISOString().slice(0, 10)
    a.download = `anagrafica_risorse_${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

const ruoliUniq = risorse.map(r => r.ruolo).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
const statiUniq = risorse.map(r => r.stato).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
const contrattiUniq = risorse.map(r => r.contratto).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)

  return (
    <Layout session={session}>
      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl text-white mb-5">
              {editingId ? 'Modifica risorsa' : 'Nuova risorsa'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="label mb-1.5">Cognome *</div>
                <input className="input" value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} />
              </div>
              <div>
                <div className="label mb-1.5">Nome *</div>
                <input className="input" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              </div>
              <div>
                <div className="label mb-1.5">PDV / Filiale</div>
                <select className="input" value={form.pdv_nome} onChange={e => setForm({...form, pdv_nome: e.target.value})}>
                  <option value="">— Seleziona —</option>
                  {pdvList.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <div className="label mb-1.5">Ruolo</div>
                <select className="input" value={form.ruolo} onChange={e => setForm({...form, ruolo: e.target.value})}>
                  <option value="">— Seleziona —</option>
                  <option value="SM">Store Manager</option>
                  <option value="VSM">Vice Store Manager</option>
                  <option value="AV">Assistente Vendita</option>
                  <option value="ST">Stage</option>
                  <option value="HR">Risorse Umane</option>
                </select>
              </div>
              <div>
                <div className="label mb-1.5">Contratto</div>
                <select className="input" value={form.contratto} onChange={e => setForm({...form, contratto: e.target.value})}>
                  <option value="">— Seleziona —</option>
                  <option value="indeterminato">Indeterminato</option>
                  <option value="determinato">Determinato</option>
                  <option value="apprendistato">Apprendistato</option>
                  <option value="stage">Stage</option>
                  <option value="partita_iva">Partita IVA</option>
                </select>
              </div>
              <div>
                <div className="label mb-1.5">Stato</div>
                <select className="input" value={form.stato} onChange={e => setForm({...form, stato: e.target.value})}>
                  <option value="attivo">Attivo</option>
                  <option value="cessato">Cessato</option>
                  <option value="maternita">Maternità</option>
                  <option value="malattia">Malattia</option>
                </select>
              </div>
              <div>
                <div className="label mb-1.5">Data assunzione</div>
                <input type="date" className="input" value={form.data_assunzione} onChange={e => setForm({...form, data_assunzione: e.target.value})} />
              </div>
              <div>
                <div className="label mb-1.5">Data cessazione</div>
                <input type="date" className="input" value={form.data_cessazione} onChange={e => setForm({...form, data_cessazione: e.target.value})} />
              </div>
              <div>
                <div className="label mb-1.5">Telefono</div>
                <input className="input" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
              </div>
              <div>
                <div className="label mb-1.5">Email</div>
                <input className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="col-span-2">
                <div className="label mb-1.5">Motivo cessazione</div>
                <input className="input" value={form.motivo_cessazione} onChange={e => setForm({...form, motivo_cessazione: e.target.value})} />
              </div>
              <div className="col-span-2">
                <div className="label mb-1.5">Note</div>
                <textarea className="input resize-none h-16" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={save} disabled={saving}>
                {saving ? 'Salvo...' : 'Salva'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl">Anagrafica <span className="text-accent italic">Risorse</span></h1>
          <p className="text-muted text-sm mt-1">{filtered.length} di {risorse.length} risorse</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={exportExcel}>⬇️ Esporta CSV</button>
          <button className="btn-primary" onClick={openNew}>+ Nuova risorsa</button>
        </div>
      </div>

      {/* Filtri */}
      <div className="card mb-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
        <input className="input col-span-2 lg:col-span-1" placeholder="🔍 Cerca nome..." value={filterNome} onChange={e => setFilterNome(e.target.value)} />
        <select className="input" value={filterPdv} onChange={e => setFilterPdv(e.target.value)}>
          <option value="">Tutti i PDV</option>
          {pdvList.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
        </select>
        <select className="input" value={filterRuolo} onChange={e => setFilterRuolo(e.target.value)}>
          <option value="">Tutti i ruoli</option>
          {ruoliUniq.map(r => <option key={r} value={r}>{RUOLI[r] || r}</option>)}
        </select>
        <select className="input" value={filterStato} onChange={e => setFilterStato(e.target.value)}>
          <option value="">Tutti gli stati</option>
          {statiUniq.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={filterContratto} onChange={e => setFilterContratto(e.target.value)}>
          <option value="">Tutti i contratti</option>
          {contrattiUniq.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabella */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-surface2">
              <th className="text-left text-xs text-muted2 font-semibold px-4 py-3">Risorsa</th>
              <th className="text-left text-xs text-muted2 font-semibold px-4 py-3">PDV</th>
              <th className="text-left text-xs text-muted2 font-semibold px-4 py-3">Ruolo</th>
              <th className="text-left text-xs text-muted2 font-semibold px-4 py-3">Contratto</th>
              <th className="text-left text-xs text-muted2 font-semibold px-4 py-3">Assunzione</th>
              <th className="text-left text-xs text-muted2 font-semibold px-4 py-3">Stato</th>
              <th className="text-left text-xs text-muted2 font-semibold px-4 py-3">Telefono</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center text-muted py-12">Caricamento...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-muted py-12">Nessuna risorsa trovata</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-surface/30'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/60 to-purple-400/60 flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0">
                      {`${r.cognome[0]}${r.nome[0]}`.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{r.cognome} {r.nome}</div>
                      <div className="text-[11px] text-muted">{r.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted2">{r.pdv_nome || '—'}</td>
                <td className="px-4 py-3 text-sm text-muted2">{RUOLI[r.ruolo] || r.ruolo || '—'}</td>
                <td className="px-4 py-3 text-sm text-muted2 capitalize">{r.contratto || '—'}</td>
                <td className="px-4 py-3 text-sm text-muted2">{r.data_assunzione || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATI_COLORS[r.stato] || STATI_COLORS.default}`}>
                    {r.stato}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted2">{r.telefono || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button className="btn-ghost hover:text-accent" onClick={() => openEdit(r)}>✏️</button>
                    <button className="btn-ghost hover:text-red-400" onClick={() => deleteRisorsa(r.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
