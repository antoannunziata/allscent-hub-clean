import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MODULES, ROLES } from '@/lib/constants'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

export default function AdminPage({ session }: { session: Session | null }) {
  const [users, setUsers] = useState<any[]>([])
  const [userModules, setUserModules] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [selUser, setSelUser] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      loadAll()
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data))
    }
  }, [session])

  async function loadAll() {
    const { data: u } = await supabase.from('profiles').select('*').order('full_name')
    const { data: m } = await supabase.from('user_modules').select('*')
    setUsers(u || [])
    setUserModules(m || [])
  }

  async function updateRole(userId: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    await loadAll()
  }

  async function toggleModule(userId: string, moduleId: string) {
    const existing = userModules.find(m => m.user_id === userId && m.module_id === moduleId)
    if (existing) {
      await supabase.from('user_modules').delete().eq('id', existing.id)
    } else {
      await supabase.from('user_modules').insert({ user_id: userId, module_id: moduleId, can_edit: true, granted_by: session?.user?.id })
    }
    await loadAll()
  }

  if (profile?.role !== 'superadmin' && profile?.role !== 'admin') {
    return (
      <Layout session={session}>
        <div className="card text-center py-20 text-muted">Non hai i permessi per accedere a questa sezione.</div>
      </Layout>
    )
  }

  return (
    <Layout session={session}>
      <div className="mb-6">
        <h1 className="font-serif text-3xl">Amministrazione <span className="text-accent italic">Team</span></h1>
        <p className="text-muted text-sm mt-1">Gestisci utenti, ruoli e permessi sui moduli</p>
      </div>

      <div className="card">
        <div className="label mb-4">Utenti registrati ({users.length})</div>
        {!users.length ? (
          <div className="text-muted text-sm py-6">Nessun utente ancora. Gli utenti appaiono qui dopo il primo login.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map(u => {
              const mods = userModules.filter(m => m.user_id === u.id)
              const isExpanded = selUser === u.id
              return (
                <div key={u.id} className="card-sm">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelUser(isExpanded ? null : u.id)}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                      {(u.full_name||u.email||'U').split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{u.full_name || '—'}</div>
                      <div className="text-xs text-muted truncate">{u.email}</div>
                    </div>
                    <select
                      className="input w-36 text-xs"
                      value={u.role}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateRole(u.id, e.target.value)}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <div className="text-xs text-muted">{mods.length} moduli</div>
                    <div className="text-muted text-sm">{isExpanded ? '▲' : '▼'}</div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="label mb-3">Moduli abilitati</div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {MODULES.filter(m => m.id !== 'admin').map(mod => {
                          const enabled = mods.some(m => m.module_id === mod.id)
                          return (
                            <button
                              key={mod.id}
                              onClick={() => toggleModule(u.id, mod.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${enabled ? 'border-accent/50 bg-accent/10 text-white' : 'border-white/5 bg-transparent text-muted hover:border-white/20'}`}
                            >
                              <span>{mod.icon}</span>
                              <span>{mod.label}</span>
                              {enabled && <span className="ml-auto text-accent">✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card mt-5">
        <div className="label mb-3">Come funzionano i ruoli</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { role: 'superadmin', desc: 'Vede tutto, gestisce tutti gli utenti e i permessi' },
            { role: 'admin',      desc: 'Vede tutti i moduli, gestisce il proprio team' },
            { role: 'editor',     desc: 'Può inserire e modificare dati nei moduli assegnati' },
            { role: 'viewer',     desc: 'Solo lettura — non può modificare nulla' },
          ].map(r => (
            <div key={r.role} className="card-sm">
              <div className="text-xs font-bold text-accent uppercase tracking-wider mb-1">{r.role}</div>
              <div className="text-xs text-muted">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
