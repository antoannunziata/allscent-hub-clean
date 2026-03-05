import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import clsx from 'clsx'

interface Profile { id: string; full_name: string; email: string; role: string }
interface UserModule { module_id: string; can_edit: boolean }

export default function Layout({ children, session }: { children: React.ReactNode, session: Session | null }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userModules, setUserModules] = useState<UserModule[]>([])

  useEffect(() => {
    if (!session) { router.push('/login'); return }
    loadProfile()
  }, [session])

  async function loadProfile() {
    if (!session) return
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (prof) setProfile(prof)
    const { data: mods } = await supabase.from('user_modules').select('*').eq('user_id', session.user.id)
    if (mods) setUserModules(mods)
  }

  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin'
  const hasModule = (id: string) => isAdmin || userModules.some(m => m.module_id === id)

  const initials = (profile?.full_name || session?.user?.email || 'U')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const NavItem = ({ href, icon, label }: { href: string; icon: string; label: string }) => (
    <button
      onClick={() => router.push(href)}
      className={clsx(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 cursor-pointer border-none',
        router.pathname === href ? 'bg-surface3 text-white' : 'text-muted2 hover:bg-surface2 hover:text-white bg-transparent'
      )}
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span>{label}</span>
    </button>
  )

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="text-[10px] uppercase tracking-[1.5px] text-muted font-semibold px-3 pt-4 pb-1">{title}</div>
  )

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="w-56 fixed top-0 left-0 h-screen bg-surface border-r border-white/5 flex flex-col z-50">
        <div className="px-5 pt-6 pb-5 border-b border-white/5">
          <div className="font-serif text-lg text-accent">AllScent</div>
          <div className="text-[10px] uppercase tracking-[2px] text-muted mt-0.5">Marketing Hub</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">

          {/* Sezione 1 — Home */}
          <NavItem href="/dashboard" icon="Home" label="Home" />
          <NavItem href="/calendar"  icon="Cal" label="Calendario" />

          {/* Sezione 2 — Task */}
          <SectionTitle title="Task" />
          
          {hasModule("todo") && <NavItem href="/todo" icon="TK" label="To-do / Task" />}

          {/* Sezione 3 — Attivita */}
          <SectionTitle title="Attivita" />
          {hasModule('trade')    && <NavItem href="/trade"    icon="TR" label="Visibilita Trade" />}
          {hasModule('giornate') && <NavItem href="/giornate" icon="GI" label="Giornate PDV" />}
          {hasModule('internal') && <NavItem href="/internal" icon="AT" label="Attivita Interne" />}
          {hasModule('social')   && <NavItem href="/social"   icon="SO" label="Social" />}

          {/* Sezione 4 — Report */}
          <SectionTitle title="Report" />
          {hasModule('budget') && <NavItem href="/budget" icon="BU" label="Budget Brand" />}
          {hasModule('pdv')    && <NavItem href="/pdv"    icon="PD" label="Vista PDV" />}

          {/* Admin */}
          {isAdmin && (
            <>
              <SectionTitle title="Gestione" />
              <NavItem href="/admin" icon="AD" label="Amministrazione" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white leading-none truncate">
                {profile?.full_name?.split(' ')[0] || 'Utente'}
              </div>
              <div className="text-[10px] text-muted mt-0.5">{profile?.role || 'editor'}</div>
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
