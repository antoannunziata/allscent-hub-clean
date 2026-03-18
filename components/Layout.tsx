import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/pages/_app'
import clsx from 'clsx'

const DEPARTMENTS = [
  { id: 'marketing',   label: 'Marketing',   icon: '💄' },
  { id: 'acquisti',    label: 'Acquisti',     icon: '🛒' },
  { id: 'contabilita', label: 'Contabilità',  icon: '📊' },
  { id: 'hr',          label: 'HR',           icon: '👥' },
]

const NAV_BY_DEPT: Record<string, { href: string; icon: string; label: string; section?: string }[]> = {
  marketing: [
    { href: '/dashboard',  icon: '🏠', label: 'Home' },
    { href: '/calendar',   icon: '📅', label: 'Calendario' },
    { href: '/todo',       icon: '✅', label: 'To-do / Task',       section: 'Task' },
    { href: '/trade',      icon: '💄', label: 'Visibilità Trade',   section: 'Attività' },
    { href: '/giornate',   icon: '👤', label: 'Giornate PDV' },
    { href: '/internal',   icon: '🎯', label: 'Attività Interne' },
    { href: '/social',     icon: '📱', label: 'Social' },
    { href: '/budget',     icon: '💶', label: 'Budget Brand',       section: 'Report' },
    { href: '/pdv',        icon: '🏪', label: 'Vista PDV' },
  ],
  acquisti: [
    { href: '/dashboard',  icon: '🏠', label: 'Home' },
    { href: '/calendar',   icon: '📅', label: 'Calendario' },
    { href: '/todo',       icon: '✅', label: 'To-do / Task',       section: 'Task' },
  ],
  contabilita: [
    { href: '/dashboard',  icon: '🏠', label: 'Home' },
    { href: '/calendar',   icon: '📅', label: 'Calendario' },
    { href: '/todo',       icon: '✅', label: 'To-do / Task',       section: 'Task' },
  ],
  hr: [
    { href: '/dashboard',  icon: '🏠', label: 'Home' },
    { href: '/calendar',   icon: '📅', label: 'Calendario' },
    { href: '/todo',       icon: '✅', label: 'To-do / Task',       section: 'Task' },
    { href: '/team',       icon: '👥', label: 'Team',               section: 'Risorse' },
  ],
}

export default function Layout({
  children,
  session,
  profile: profileProp,
}: {
  children: React.ReactNode
  session: Session | null
  profile?: Profile | null
}) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(profileProp || null)

  useEffect(() => {
    if (profileProp) { setProfile(profileProp); return }
    if (!session) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => { if (data) setProfile(data as Profile) })
  }, [session, profileProp])

  const isSuperAdmin = profile?.role === 'superadmin'

  const availableDepts = isSuperAdmin
    ? DEPARTMENTS
    : DEPARTMENTS.filter(d => profile?.departments?.includes(d.id))

  const defaultDept = availableDepts[0]?.id || 'marketing'
  const [activeDept, setActiveDept] = useState<string>(defaultDept)

  if (!session) { router.push('/login'); return null }

  if (profile?.role === 'pending') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="card max-w-sm text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="font-serif text-xl text-accent mb-2">Accesso in attesa</h2>
          <p className="text-muted text-sm mb-4">
            Il tuo account è stato creato ma non ancora abilitato.<br />
            Contatta il tuo amministratore.
          </p>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="btn-secondary text-sm px-4 py-2"
          >
            Esci
          </button>
        </div>
      </div>
    )
  }

  const navItems = NAV_BY_DEPT[activeDept] || NAV_BY_DEPT.marketing
  const initials = (profile?.full_name || session?.user?.email || 'U')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  type NavEntry = { href: string; icon: string; label: string; section?: string }
  const sections: { title: string | null; items: NavEntry[] }[] = []
  let currentSection: { title: string | null; items: NavEntry[] } = { title: null, items: [] }
  navItems.forEach(item => {
    if (item.section) {
      if (currentSection.items.length) sections.push(currentSection)
      currentSection = { title: item.section, items: [item] }
    } else {
      currentSection.items.push(item)
    }
  })
  if (currentSection.items.length) sections.push(currentSection)

  const deptInfo = DEPARTMENTS.find(d => d.id === activeDept)

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="w-56 fixed top-0 left-0 h-screen bg-surface border-r border-white/5 flex flex-col z-50">
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="font-serif text-lg text-accent">AllScent</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm">{deptInfo?.icon}</span>
            <span className="text-[10px] uppercase tracking-[1.5px] text-muted font-semibold">
              {deptInfo?.label || 'Hub'}
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {sections.map((sec, si) => (
            <div key={si}>
              {sec.title && (
                <div className="text-[10px] uppercase tracking-[1.5px] text-muted font-semibold px-3 pt-4 pb-1">
                  {sec.title}
                </div>
              )}
              {sec.items.map(item => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 cursor-pointer border-none',
                    router.pathname === item.href
                      ? 'bg-surface3 text-white'
                      : 'text-muted2 hover:bg-surface2 hover:text-white bg-transparent'
                  )}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
          {(isSuperAdmin || profile?.role === 'admin') && (
            <>
              <div className="text-[10px] uppercase tracking-[1.5px] text-muted font-semibold px-3 pt-4 pb-1">
                Gestione
              </div>
              <button
                onClick={() => router.push('/admin')}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 cursor-pointer border-none',
                  router.pathname === '/admin'
                    ? 'bg-surface3 text-white'
                    : 'text-muted2 hover:bg-surface2 hover:text-white bg-transparent'
                )}
              >
                <span className="text-base w-5 text-center">⚙️</span>
                <span>Amministrazione</span>
              </button>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-white/5">
          {isSuperAdmin && availableDepts.length > 1 && (
            <div className="mb-3">
              <div className="text-[9px] uppercase tracking-[1.5px] text-muted mb-1 font-semibold">Ufficio attivo</div>
              <select
                value={activeDept}
                onChange={e => setActiveDept(e.target.value)}
                className="w-full text-xs bg-surface2 border border-white/10 rounded-lg px-2 py-1.5 text-white cursor-pointer"
              >
                {availableDepts.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {d.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white leading-none truncate">
                {profile?.full_name?.split(' ')[0] || 'Utente'}
              </div>
              <div className="text-[10px] text-muted mt-0.5 capitalize">{profile?.role || 'editor'}</div>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
            className="w-full text-xs text-muted hover:text-white transition-colors py-1 bg-transparent border-none cursor-pointer text-left"
          >
            Esci
          </button>
        </div>
      </aside>
      <main className="ml-56 flex-1 p-7 max-w-[1400px]">
        {children}
      </main>
    </div>
  )
}
