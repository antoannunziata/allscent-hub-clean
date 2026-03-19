import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

const RUOLI: Record<string, string> = {
  SM: 'Store Manager', AV: 'Assistente Vendita', HR: 'Risorse Umane',
  VSM: 'Vice Store Manager', ST: 'Stage'
}

function Semaforo({ attive, target }: { attive: number; target: number }) {
  const pct = target > 0 ? attive / target : 1
  if (pct >= 1) return <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" /><span className="text-xs text-green-400 font-semibold">Completo</span></div>
  if (pct >= 0.6) return <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" /><span className="text-xs text-yellow-400 font-semibold">Parziale</span></div>
  return <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]" /><span className="text-xs text-red-400 font-semibold">Scoperto</span></div>
}

export default function PdvPage({ session }: { session: Session | null }) {
  const [pdvList, setPdvList] = useState<any[]>([])
  const [risorse, setRisorse] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTarget, setEditingTarget] = useState<string | null>(null)
  const [newTarget, setNewTarget] = useState(1)
  const [showNewPdv, setShowNewPdv] = useState(false)
  const [newPdvForm, setNewPdvForm] = useState({ nome: '', citta: '', indirizzo: '', target_risorse: 1 })
  const [saving, setSaving] = useState(false)
  const [selectedPdv, setSelectedPdv] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('punti_vendita').select('*').order('nome'),
      supabase.from('risorse').select('*').eq('stato', 'attivo').order('cognome'),
    ])
    setPdvList(p || [])
    setRisorse(r || [])
    setLoading(false)
  }

  async function saveTarget(pdvId: string) {
    setSaving(true)
    await supabase.from('punti_vendita').update({ target_risorse: newTarget }).eq('id', pdvId)
    setEditingTarget(null)
    await loadAll()
    setSaving(false)
  }

  async function saveNewPdv() {
    if (!newPdvForm.nome) return
    setSaving(true)
    await supabase.from('punti_vendita').insert(newPdvForm)
    setShowNewPdv(false)
    setNewPdvForm({ nome: '', citta: '', indirizzo: '', target_risorse: 1 })
    await loadAll()
    setSaving(false)
  }

  async function deletePdv(id: string) {
    if (!confirm('Eliminare questo PDV? Le risorse associate non verranno eliminate.')) return
    await supabase.from('punti_vendita').delete().eq('id', id)
    await loadAll()
  }

  function getRisorsePdv(pdvNome: string) {
    return risorse.filter(r => r.pdv_nome === pdvNome)
  }

  const totaleAttive = risorse.length
  const pdvCompleti = pdvList.filter(p => getRisorsePdv(p.nome).length >= p.target_risorse).length
  const pdvScoperti = pdvList.filter(p => getRisorsePdv(p.nome).length < p.target_risorse * 0.6).length

  return (
    <Layout session={session}>
      {/* Modal nuovo PDV */}
      {showNewPdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-serif text-xl text-white mb-5">Nuovo punto vendita</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="label mb-1.5">Nome / Filiale *</div>
                <input className="input" value={newPdvForm.nome} onChange={e => setNewPdvForm({...newPdvForm, nome: e.target.value})} placeholder="es. MILANO CENTRO" />
              </div>
              <div>
                <div className="label mb-1.5">Città</div>
                <input className="input" value={newPdvForm.citta} onChange={e => setNewPdvForm({...newPdvForm, citta: e.target.value})} />
              </div>
              <div>
                <div className="label mb-1.5">Indirizzo</div>
                <input className="input" value={newPdvForm.indirizzo} onChange={e => setNewPdvForm({...newPdvForm, indirizzo: e.target.value})} />
              </div>
              <div>
                <div className="label mb-1.5">Target risorse</div>
                <input type="number" min={1} className="input" value={newPdvForm.target_risorse} onChange={e => setNewPdvForm({...newPdvForm, target_risorse: parseInt(e.target.value) || 1})} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={saveNewPdv} disabled={saving}>
                {saving ? 'Salvo...' : 'Crea PDV'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setShowNewPdv(false)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl">Stato <span className="text-accent italic">Punti Vendita</span></h1>
          <p className="text-muted text-sm mt-1">{pdvList.length} PDV — {totaleAttive} risorse attive</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNewPdv(true)}>+ Nuovo PDV</button>
      </div>

      {/* Riepilogo */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10 bg-green-400" style={{ transform: 'translate(30%,-30%)' }} />
          <div className="font-serif text-4xl text-green-400">{pdvCompleti}</div>
          <div className="text-xs uppercase tracking-wider text-muted mt-2">PDV completi 🟢</div>
        </div>
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10 bg-yellow-400" style={{ transform: 'translate(30%,-30%)' }} />
          <div className="font-serif text-4xl text-yellow-400">{pdvList.length - pdvCompleti - pdvScoperti}</div>
          <div className="text-xs uppercase tracking-wider text-muted mt-2">PDV parziali 🟡</div>
        </div>
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10 bg-red-400" style={{ transform: 'translate(30%,-30%)' }} />
          <div className="font-serif text-4xl text-red-400">{pdvScoperti}</div>
          <div className="text-xs uppercase tracking-wider text-muted mt-2">PDV scoperti 🔴</div>
        </div>
      </div>

      {/* Lista PDV */}
      {loading ? (
        <div className="card text-center py-12 text-muted">Caricamento...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pdvList.map(pdv => {
            const risorsePdv = getRisorsePdv(pdv.nome)
            const attive = risorsePdv.length
            const target = pdv.target_risorse
            const pct = target > 0 ? Math.min(attive / target, 1) : 1
            const isExpanded = selectedPdv === pdv.id

            return (
              <div key={pdv.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-base">{pdv.nome}</div>
                    {pdv.citta && <div className="text-xs text-muted">{pdv.citta}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Semaforo attive={attive} target={target} />
                    <button className="btn-ghost text-muted hover:text-red-400" onClick={() => deletePdv(pdv.id)}>🗑️</button>
                  </div>
                </div>

                {/* Barra progresso */}
                <div className="h-1.5 bg-surface3 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct * 100}%`,
                      background: pct >= 1 ? '#4ade80' : pct >= 0.6 ? '#facc15' : '#f87171'
                    }} />
                </div>

                {/* Target */}
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted2">{attive} / {target} risorse</span>
                  {editingTarget === pdv.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} className="input w-16 text-xs py-1 px-2"
                        value={newTarget} onChange={e => setNewTarget(parseInt(e.target.value) || 1)} />
                      <button className="btn-primary text-xs px-2 py-1" onClick={() => saveTarget(pdv.id)} disabled={saving}>✓</button>
                      <button className="btn-ghost text-xs" onClick={() => setEditingTarget(null)}>✗</button>
                    </div>
                  ) : (
                    <button className="text-xs text-muted hover:text-accent transition-colors"
                      onClick={() => { setEditingTarget(pdv.id); setNewTarget(target) }}>
                      ✏️ Target: {target}
                    </button>
                  )}
                </div>

                {/* Toggle risorse */}
                <button className="text-xs text-muted hover:text-white transition-colors w-full text-left"
                  onClick={() => setSelectedPdv(isExpanded ? null : pdv.id)}>
                  {isExpanded ? '▲ Nascondi risorse' : `▼ Mostra risorse (${attive})`}
                </button>

                {isExpanded && (
                  <div className="mt-3 border-t border-white/5 pt-3 flex flex-col gap-2">
                    {risorsePdv.length === 0 ? (
                      <div className="text-xs text-muted">Nessuna risorsa attiva assegnata</div>
                    ) : risorsePdv.map(r => (
                      <div key={r.id} className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent/60 to-purple-400/60 flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0">
                          {`${r.cognome[0]}${r.nome[0]}`.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{r.cognome} {r.nome}</div>
                          <div className="text-xs text-muted">{RUOLI[r.ruolo] || r.ruolo}</div>
                        </div>
                        <div className="text-xs text-muted">{r.telefono}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
