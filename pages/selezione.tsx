import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

const RUOLI_SELEZIONE = ['Store Manager', 'Vice Store Manager', 'Assistente Vendita', 'Stage']
const MOTIVI = ['Dimissioni volontarie', 'Apertura nuovo PDV', 'Licenziamento', 'Scadenza contratto', 'Ampliamento organico']

function giorniDa(data: string) {
  const d = new Date(data)
  const oggi = new Date()
  return Math.floor((oggi.getTime() - d.getTime()) / 86400000)
}

function durataStr(giorni: number) {
  if (giorni < 7) return `${giorni}gg`
  if (giorni < 30) return `${Math.floor(giorni / 7)} sett.`
  return `${Math.floor(giorni / 30)} mesi`
}

export default function SelezionePage({ session }: { session: Session | null }) {
  const [tab, setTab] = useState<'aperte' | 'archivio'>('aperte')
  const [selezioni, setSelezioni] = useState<any[]>([])
  const [pdvList, setPdvList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSel, setSelectedSel] = useState<string | null>(null)
  const [candidati, setCandidati] = useState<Record<string, any[]>>({})

  // Form nuova selezione
  const [showForm, setShowForm] = useState(false)
  const [selForm, setSelForm] = useState({ pdv_nome: '', ruolo: '', motivo: '', note: '' })

  // Form nuovo candidato
  const [showCandForm, setShowCandForm] = useState<string | null>(null)
  const [candForm, setCandForm] = useState({ nome: '', cognome: '', telefono: '', email: '', note: '' })

  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('selezioni').select('*').order('created_at', { ascending: false }),
      supabase.from('punti_vendita').select('*').order('nome'),
    ])
    setSelezioni(s || [])
    setPdvList(p || [])

    // Carica candidati per tutte le selezioni
    if (s && s.length > 0) {
      const { data: c } = await supabase.from('candidati').select('*').order('created_at')
      const grouped: Record<string, any[]> = {}
      ;(c || []).forEach((cand: any) => {
        if (!grouped[cand.selezione_id]) grouped[cand.selezione_id] = []
        grouped[cand.selezione_id].push(cand)
      })
      setCandidati(grouped)
    }
    setLoading(false)
  }

  async function createSelezione() {
    if (!selForm.pdv_nome || !selForm.ruolo) return
    setSaving(true)
    await supabase.from('selezioni').insert({
      ...selForm,
      data_apertura: new Date().toISOString().slice(0, 10),
      stato: 'aperta',
      created_by: session?.user?.id
    })
    setSelForm({ pdv_nome: '', ruolo: '', motivo: '', note: '' })
    setShowForm(false)
    await loadAll()
    setSaving(false)
  }

  async function chiudiSelezione(id: string) {
    if (!confirm('Chiudere e archiviare questa selezione?')) return
    await supabase.from('selezioni').update({
      stato: 'chiusa',
      data_chiusura: new Date().toISOString().slice(0, 10)
    }).eq('id', id)
    await loadAll()
  }

  async function deleteSelezione(id: string) {
    if (!confirm('Eliminare definitivamente questa selezione?')) return
    await supabase.from('selezioni').delete().eq('id', id)
    await loadAll()
  }

  async function addCandidato(selezioneId: string) {
    if (!candForm.nome || !candForm.cognome) return
    setSaving(true)
    await supabase.from('candidati').insert({ ...candForm, selezione_id: selezioneId })
    setCandForm({ nome: '', cognome: '', telefono: '', email: '', note: '' })
    setShowCandForm(null)
    await loadAll()
    setSaving(false)
  }

  async function toggleCandidato(candId: string, field: string, value: boolean) {
    await supabase.from('candidati').update({ [field]: value }).eq('id', candId)
    await loadAll()
  }

  async function updateColloquioData(candId: string, data: string) {
    await supabase.from('candidati').update({ colloquio_data: data || null }).eq('id', candId)
    await loadAll()
  }

  async function deleteCandidato(id: string) {
    if (!confirm('Eliminare questo candidato?')) return
    await supabase.from('candidati').delete().eq('id', id)
    await loadAll()
  }

  async function assumiCandidato(candId: string, selezioneId: string) {
    if (!confirm('Segnare come assunto e chiudere la selezione?')) return
    await supabase.from('candidati').update({ assunto: true }).eq('id', candId)
    await supabase.from('selezioni').update({
      stato: 'chiusa',
      data_chiusura: new Date().toISOString().slice(0, 10)
    }).eq('id', selezioneId)
    await loadAll()
  }

  const aperte = selezioni.filter(s => s.stato === 'aperta')
  const archiviate = selezioni.filter(s => s.stato === 'chiusa')
  const displayed = tab === 'aperte' ? aperte : archiviate

  return (
    <Layout session={session}>
      {/* Modal nuova selezione */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-serif text-xl text-white mb-5">Nuova selezione</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="label mb-1.5">Punto vendita *</div>
                <select className="input" value={selForm.pdv_nome} onChange={e => setSelForm({...selForm, pdv_nome: e.target.value})}>
                  <option value="">— Seleziona PDV —</option>
                  {pdvList.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <div className="label mb-1.5">Ruolo cercato *</div>
                <select className="input" value={selForm.ruolo} onChange={e => setSelForm({...selForm, ruolo: e.target.value})}>
                  <option value="">— Seleziona ruolo —</option>
                  {RUOLI_SELEZIONE.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <div className="label mb-1.5">Motivo apertura</div>
                <select className="input" value={selForm.motivo} onChange={e => setSelForm({...selForm, motivo: e.target.value})}>
                  <option value="">— Seleziona motivo —</option>
                  {MOTIVI.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <div className="label mb-1.5">Note</div>
                <textarea className="input resize-none h-16" value={selForm.note} onChange={e => setSelForm({...selForm, note: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={createSelezione} disabled={saving}>
                {saving ? 'Creo...' : 'Apri selezione'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl">Selezione <span className="text-accent italic">HR</span></h1>
          <p className="text-muted text-sm mt-1">{aperte.length} selezioni aperte · {archiviate.length} archiviate</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nuova selezione</button>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('aperte')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${tab === 'aperte' ? 'bg-accent text-black border-accent' : 'bg-transparent text-muted2 border-white/10 hover:border-accent/50'}`}>
          Aperte ({aperte.length})
        </button>
        <button onClick={() => setTab('archivio')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${tab === 'archivio' ? 'bg-accent text-black border-accent' : 'bg-transparent text-muted2 border-white/10 hover:border-accent/50'}`}>
          Archivio ({archiviate.length})
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-muted">Caricamento...</div>
      ) : displayed.length === 0 ? (
        <div className="card text-center py-12 text-muted">
          {tab === 'aperte' ? 'Nessuna selezione aperta.' : 'Nessuna selezione archiviata.'}
        </div>
      ) : displayed.map(sel => {
        const cands = candidati[sel.id] || []
        const giorni = giorniDa(sel.data_apertura)
        const colloquiFatti = cands.filter(c => c.colloquio_fatto).length
        const isExpanded = selectedSel === sel.id
        const assunto = cands.find(c => c.assunto)

        return (
          <div key={sel.id} className="card mb-4">
            {/* Header selezione */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-base">{sel.pdv_nome}</span>
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">{sel.ruolo}</span>
                  {sel.stato === 'chiusa' && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">✓ Chiusa</span>
                  )}
                </div>
                {sel.motivo && <div className="text-xs text-muted mt-0.5">Motivo: {sel.motivo}</div>}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted">📅 Aperta da <span className={`font-semibold ${giorni > 30 ? 'text-red-400' : giorni > 14 ? 'text-yellow-400' : 'text-green-400'}`}>{durataStr(giorni)}</span></span>
                  <span className="text-xs text-muted">👥 {cands.length} candidati · {colloquiFatti} colloqui</span>
                  {sel.data_chiusura && <span className="text-xs text-muted">Chiusa: {sel.data_chiusura}</span>}
                </div>
                {assunto && (
                  <div className="text-xs text-green-400 mt-1">✓ Assunto: {assunto.cognome} {assunto.nome}</div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3">
                {sel.stato === 'aperta' && (
                  <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => chiudiSelezione(sel.id)}>
                    Archivia
                  </button>
                )}
                <button className="btn-ghost hover:text-red-400" onClick={() => deleteSelezione(sel.id)}>🗑️</button>
              </div>
            </div>

            {/* Toggle candidati */}
            <button className="text-xs text-muted hover:text-white transition-colors mb-2"
              onClick={() => setSelectedSel(isExpanded ? null : sel.id)}>
              {isExpanded ? '▲ Nascondi candidati' : `▼ Mostra candidati (${cands.length})`}
            </button>

            {isExpanded && (
              <div className="border-t border-white/5 pt-4">
                {/* Lista candidati */}
                {cands.length === 0 ? (
                  <div className="text-xs text-muted mb-3">Nessun candidato inserito</div>
                ) : (
                  <div className="flex flex-col gap-3 mb-4">
                    {cands.map(c => (
                      <div key={c.id} className={`bg-surface2 rounded-xl p-4 border ${c.assunto ? 'border-green-500/30' : 'border-white/5'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-semibold text-sm">{c.cognome} {c.nome}</div>
                            <div className="text-xs text-muted">{c.telefono} {c.email && `· ${c.email}`}</div>
                          </div>
                          <div className="flex gap-1.5">
                            {sel.stato === 'aperta' && !c.assunto && (
                              <button className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer border-none"
                                onClick={() => assumiCandidato(c.id, sel.id)}>
                                ✓ Assumi
                              </button>
                            )}
                            {c.assunto && <span className="text-xs text-green-400 font-semibold">✓ Assunto</span>}
                            <button className="btn-ghost hover:text-red-400 text-xs" onClick={() => deleteCandidato(c.id)}>🗑️</button>
                          </div>
                        </div>

                        {/* Tracking fasi */}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'colloquio_fatto', label: '📞 Colloquio fatto' },
                            { key: 'fase_superata', label: '✅ Fase superata' },
                            { key: 'documenti_richiesti', label: '📄 Documenti richiesti' },
                            { key: 'documenti_ricevuti', label: '📬 Documenti ricevuti' },
                          ].map(({ key, label }) => (
                            <button key={key}
                              onClick={() => sel.stato === 'aperta' && toggleCandidato(c.id, key, !c[key])}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border cursor-pointer text-left ${
                                c[key]
                                  ? 'bg-green-500/15 border-green-500/30 text-green-400'
                                  : 'bg-surface3 border-white/5 text-muted2 hover:border-white/20'
                              } ${sel.stato === 'chiusa' ? 'opacity-60 cursor-default' : ''}`}>
                              <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${c[key] ? 'bg-green-400 border-green-400' : 'border-white/30'}`}>
                                {c[key] && <span className="text-black text-[8px] font-bold">✓</span>}
                              </div>
                              {label}
                            </button>
                          ))}
                        </div>

                        {/* Data colloquio */}
                        {c.colloquio_fatto && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-muted">Data colloquio:</span>
                            <input type="date" className="input text-xs py-1 px-2 w-36"
                              value={c.colloquio_data || ''}
                              onChange={e => sel.stato === 'aperta' && updateColloquioData(c.id, e.target.value)}
                              disabled={sel.stato === 'chiusa'} />
                          </div>
                        )}

                        {c.note && <div className="text-xs text-muted mt-2 italic">{c.note}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Form nuovo candidato */}
                {sel.stato === 'aperta' && (
                  showCandForm === sel.id ? (
                    <div className="bg-surface2 rounded-xl p-4 border border-white/10">
                      <div className="label mb-3">Aggiungi candidato</div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="label mb-1.5">Cognome *</div>
                          <input className="input" value={candForm.cognome} onChange={e => setCandForm({...candForm, cognome: e.target.value})} />
                        </div>
                        <div>
                          <div className="label mb-1.5">Nome *</div>
                          <input className="input" value={candForm.nome} onChange={e => setCandForm({...candForm, nome: e.target.value})} />
                        </div>
                        <div>
                          <div className="label mb-1.5">Telefono</div>
                          <input className="input" value={candForm.telefono} onChange={e => setCandForm({...candForm, telefono: e.target.value})} />
                        </div>
                        <div>
                          <div className="label mb-1.5">Email</div>
                          <input className="input" value={candForm.email} onChange={e => setCandForm({...candForm, email: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                          <div className="label mb-1.5">Note</div>
                          <input className="input" value={candForm.note} onChange={e => setCandForm({...candForm, note: e.target.value})} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-primary text-sm px-4" onClick={() => addCandidato(sel.id)} disabled={saving}>
                          {saving ? 'Salvo...' : 'Aggiungi'}
                        </button>
                        <button className="btn-secondary text-sm px-4" onClick={() => setShowCandForm(null)}>Annulla</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-secondary text-sm w-full" onClick={() => setShowCandForm(sel.id)}>
                      + Aggiungi candidato
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )
      })}
    </Layout>
  )
}
