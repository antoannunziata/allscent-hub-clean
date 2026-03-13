import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/pages/_app'

const DEPARTMENTS = [
  { id: 'marketing',   label: 'Marketing',   icon: '💄' },
  { id: 'acquisti',    label: 'Acquisti',     icon: '🛒' },
  { id: 'contabilita', label: 'Contabilità',  icon: '📊' },
  { id: 'hr',          label: 'HR',           icon: '👥' },
]

const ROLES = [
  { value: 'pending',      label: '⏳ In attesa',    color: '#6b6b80' },
  { value: 'viewer',       label: '👁 Viewer',       color: '#94a3b8' },
  { value: 'editor',       label: '✏️ Editor',        color: '#60a5fa' },
  { value: 'dept_manager', label: '🧑‍💼 Manager',      color: '#4ade80' },
  { value: 'admin',        label: '🔧 Admin',         color: '#fb923c' },
  { value: 'superadmin',   label: '⭐ Super Admin',   color: '#c9a96e' },
]

export default function AdminPage({ session, profile }: { session: Session | null; profile: Profile | null }) {
  const [users, setUsers] = useState<Profile[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending'>('all')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setUsers(data || [])
  }

  async function updateRole(userId: string, role: string) {
    setSaving(userId + '_role')
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(u => u.map(x => x.id === userId ? { ...x, role: role as Profile['role'] } : x))
    setSaving(null)
  }

  async function toggleDept(userId: string, dept: string, currentDepts: string[]) {
    setSaving(userId + '_' + dept)
    const newDepts = currentDepts.includes(dept)
      ? currentDepts.filter(d => d !== dept)
      : [...currentDepts, dept]
    await supabase.from('profiles').update({ departments: newDepts }).eq('id', userId)
    setUsers(u => u.map(x => x.id === userId ? { ...x, departments: newDepts } : x))
    setSaving(null)
  }

  const isSuperAdmin = profile?.role === 'superadmin'
  if (!isSuperAdmin) return (
    <Layout session={session} profile={profile}>
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Accesso non autorizzato.</p>
      </div>
    </Layout>
  )

  const filtered = filter === 'pending' ? users.filter(u => u.role === 'pending') : users
  const pendingCount = users.filter(u => u.role === 'pending').length

  return (
    <Layout session={session} profile={profile}>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl">
            Amministrazione <span className="text-accent italic">Utenti</span>
          </h1>
          <p className="text-muted text-sm mt-1">
            Gestisci ruoli e accessi per i {users.length} utenti registrati
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filter === 'all' ? 'border-accent text-accent bg-accent/10' : 'border-white/10 text-muted hover:border-white/30'}`}
          >
            Tutti ({users.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filter === 'pending' ? 'border-orange-400 text-orange-400 bg-orange-400/10' : 'border-white/10 text-muted hover:border-white/30'}`}
          >
            In attesa {pendingCount > 0 && <span className="ml-1 bg-orange-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-muted2 font-semibold px-5 py-3 bg-surface2">Utente</th>
              <th className="text-left text-xs text-muted2 font-semibold px-4 py-3 bg-surface2">Ruolo</th>
              <th className="text-left text-xs text-muted2 font-semibold px-4 py-3 bg-surface2">Dipartimenti</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => {
              const roleInfo = ROLES.find(r => r.value === user.role)
              const depts = user.departments || []
              const isMe = user.id === profile?.id
              return (
                <tr key={user.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-surface/30'}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/60 to-purple-400/60 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                        {(user.full_name || user.email || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white flex items-center gap-1.5">
                          {user.full_name || '—'}
                          {isMe && <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-semibold">Tu</span>}
                        </div>
                        <div className="text-[11px] text-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      disabled={isMe || saving === user.id + '_role'}
                      onChange={e => updateRole(user.id, e.target.value)}
                      className="text-xs rounded-lg px-2.5 py-1.5 border border-white/10 bg-surface2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: roleInfo?.color }}
                    >
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value} style={{ color: r.color }}>{r.label}</option>
                      ))}
                    </select>
                    {saving === user.id + '_role' && <span className="text-[10px] text-muted ml-2">salvo...</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {DEPARTMENTS.map(dept => {
                        const active = depts.includes(dept.id)
                        const isSaving = saving === user.id + '_' + dept.id
                        return (
                          <button
                            key={dept.id}
                            disabled={isMe || isSaving}
                            onClick={() => toggleDept(user.id, dept.id, depts)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              active
                                ? 'bg-accent/15 border-accent/50 text-accent'
                                : 'bg-transparent border-white/10 text-muted hover:border-white/30 hover:text-muted2'
                            }`}
                          >
                            {isSaving ? '...' : `${dept.icon} ${dept.label}`}
                          </button>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted text-sm py-12">
                  {filter === 'pending' ? 'Nessun utente in attesa.' : 'Nessun utente.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 card">
        <div className="text-xs text-muted2 font-semibold mb-3 uppercase tracking-wider">Legenda ruoli</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ROLES.map(r => (
            <div key={r.value} className="flex items-center gap-2 text-xs">
              <span style={{ color: r.color }}>{r.label}</span>
              <span className="text-muted">—</span>
              <span className="text-muted">
                {r.value === 'pending' && 'In attesa di abilitazione'}
                {r.value === 'viewer' && 'Solo lettura'}
                {r.value === 'editor' && 'Può creare e modificare'}
                {r.value === 'dept_manager' && 'Gestisce il proprio team'}
                {r.value === 'admin' && 'Accesso completo'}
                {r.value === 'superadmin' && 'Accesso a tutto + gestione utenti'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}