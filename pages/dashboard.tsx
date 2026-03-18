import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

export default function Dashboard({ session }: { session: Session | null }) {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>({})
  const [todos, setTodos] = useState<any[]>([])
  const [upcoming, setUpcoming] = useState<any[]>([])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'
  const today = now.toISOString().slice(0, 10)
  const in7 = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)

  useEffect(() => {
    if (!session) return
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [session])

  useEffect(() => {
    if (!profile) return
    const dept = profile.role === 'superadmin'
      ? 'marketing'
      : (profile.departments?.[0] || 'marketing')
    loadData(dept)
  }, [profile])

  async function loadData(dept: string) {
    const uname = session?.user?.user_metadata?.full_name || session?.user?.email || ''

    if (dept === 'marketing') {
      const [t, g, td, s] = await Promise.all([
        supabase.from('trade_activities').select('id', { count: 'exact', head: true }),
        supabase.from('giornate').select('id', { count: 'exact', head: true }),
        supabase.from('todos').select('*').eq('done', false).order('due_date'),
        supabase.from('social_posts').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        cards: [
          { label: 'Attivazioni Trade', value: t.count || 0, color: '#a78bfa' },
          { label: 'Giorni Consulente',  value: g.count || 0, color: '#2dd4bf' },
          { label: 'Task Aperti',        value: td.count || 0, color: '#4a8fff' },
          { label: 'Post Pianificati',   value: s.count || 0, color: '#f472b6' },
        ]
      })
      setTodos((td.data || []).slice(0, 5))
      const { data: upTrade } = await supabase.from('trade_activities').select('*').lte('end_date', in7).gte('end_date', today)
      const { data: upInt } = await supabase.from('internal_activities').select('*').gte('start_date', today).lte('start_date', in7)
      setUpcoming([
        ...(upTrade || []).map((a: any) => ({ label: `${a.brand} — scade attivazione`, date: a.end_date, color: '#a78bfa' })),
        ...(upInt || []).map((a: any) => ({ label: `${a.tipo_label || a.tipo} inizia`, date: a.start_date, color: '#fb923c' })),
      ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5))
    }

    else if (dept === 'acquisti') {
      const [td, ord] = await Promise.all([
        supabase.from('todos').select('*').eq('done', false).eq('assigned_to', uname).order('due_date'),
        supabase.from('todos').select('id', { count: 'exact', head: true }).eq('done', false),
      ])
      setStats({
        cards: [
          { label: 'Task Aperti',   value: td.count || 0, color: '#4a8fff' },
          { label: 'Task Totali',   value: ord.count || 0, color: '#2dd4bf' },
        ]
      })
      setTodos((td.data || []).slice(0, 5))
      setUpcoming([])
    }

    else if (dept === 'contabilita') {
      const [td] = await Promise.all([
        supabase.from('todos').select('*').eq('done', false).eq('assigned_to', uname).order('due_date'),
      ])
      setStats({
        cards: [
          { label: 'Task Aperti', value: td.count || 0, color: '#4a8fff' },
        ]
      })
      setTodos((td.data || []).slice(0, 5))
      setUpcoming([])
    }

    else if (dept === 'hr') {
      const [td, sub] = await Promise.all([
        supabase.from('todos').select('*').eq('done', false).order('due_date'),
        supabase.from('team_subtasks').select('id', { count: 'exact', head: true }).eq('done', false),
      ])
      setStats({
        cards: [
          { label: 'Task Aperti Team', value: td.count || 0, color: '#4a8fff' },
          { label: 'Sotto-task aperti', value: sub.count || 0, color: '#f472b6' },
        ]
      })
      setTodos((td.data || []).slice(0, 5))
      setUpcoming([])
    }
  }

  const dept = profile?.role === 'superadmin'
    ? 'marketing'
    : (profile?.departments?.[0] || 'marketing')

  return (
    <Layout session={session}>
      <div className="mb-7">
        <h1 className="font-serif text-3xl">
          {greeting}, <span className="text-accent italic">
            {profile?.full_name?.split(' ')[0] || 'Team'}
          </span>
        </h1>
        <p className="text-muted text-sm mt-1">
          {now.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      {stats.cards && (
        <div className={`grid grid-cols-2 lg:grid-cols-${Math.min(stats.cards.length, 4)} gap-4 mb-7`}>
          {stats.cards.map((s: any) => (
            <div key={s.label} className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10"
                style={{ background: s.color, transform: 'translate(30%,-30%)' }} />
              <div className="font-serif text-4xl" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs uppercase tracking-wider text-muted mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Scadenze — solo marketing */}
        {dept === 'marketing' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="label">Prossime scadenze (7 giorni)</div>
            </div>
            {upcoming.length ? upcoming.map((u, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: u.color }} />
                <div className="flex-1 text-sm text-muted2">{u.label}</div>
                <div className="text-xs text-muted">{u.date}</div>
              </div>
            )) : (
              <div className="text-muted text-sm py-4">Nessuna scadenza nei prossimi 7 giorni 🎉</div>
            )}
          </div>
        )}

        {/* Task aperti */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <div className="label">Task aperti</div>
          </div>
          {todos.length ? todos.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: t.priority === 'alta' ? '#f87171' : t.priority === 'media' ? '#fb923c' : '#4ade80' }} />
              <div className="flex-1 text-sm text-muted2 truncate">{t.title}</div>
              {t.assigned_to && (
                <div className="text-xs text-muted bg-surface3 px-2 py-0.5 rounded">👤 {t.assigned_to}</div>
              )}
              {t.due_date && (
                <div className="text-xs text-muted">{t.due_date}</div>
              )}
            </div>
          )) : (
            <div className="text-muted text-sm py-4">Nessun task aperto 🎉</div>
          )}
        </div>
      </div>
    </Layout>
  )
}
