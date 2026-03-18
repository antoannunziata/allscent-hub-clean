import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

const DEPT_COLORS: Record<string, string> = {
  marketing:   '#a78bfa',
  acquisti:    '#2dd4bf',
  contabilita: '#fb923c',
  hr:          '#f472b6',
}

const DEPT_LABELS: Record<string, string> = {
  marketing:   '💄 Marketing',
  acquisti:    '🛒 Acquisti',
  contabilita: '📊 Contabilità',
  hr:          '👥 HR',
}

export default function Dashboard({ session }: { session: Session | null }) {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>({})
  const [todos, setTodos] = useState<any[]>([])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [deptTodos, setDeptTodos] = useState<Record<string, any[]>>({})

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
    if (profile.role === 'superadmin' || profile.role === 'admin') {
      loadSuperAdminData()
    } else {
      const dept = profile.departments?.[0] || 'marketing'
      loadDeptData(dept)
    }
  }, [profile])

  async function loadSuperAdminData() {
    // Stats generali
    const [t, g, td, s] = await Promise.all([
      supabase.from('trade_activities').select('id', { count: 'exact', head: true }),
      supabase.from('giornate').select('id', { count: 'exact', head: true }),
      supabase.from('todos').select('id', { count: 'exact', head: true }).eq('done', false),
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

    // Scadenze 7 giorni
    const { data: upTrade } = await supabase.from('trade_activities').select('*').lte('end_date', in7).gte('end_date', today)
    const { data: upInt } = await supabase.from('internal_activities').select('*').gte('start_date', today).lte('start_date', in7)
    setUpcoming([
      ...(upTrade || []).map((a: any) => ({ label: `${a.brand} — scade attivazione`, date: a.end_date, color: '#a78bfa' })),
      ...(upInt || []).map((a: any) => ({ label: `${a.tipo_label || a.tipo} inizia`, date: a.start_date, color: '#fb923c' })),
    ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5))

    // Carica todos personali + team subtasks + profili
    const [{ data: allTodos }, { data: allSubtasks }, { data: allProfiles }] = await Promise.all([
      supabase.from('todos').select('*').eq('done', false).order('due_date'),
      supabase.from('team_subtasks').select('*').eq('done', false),
      supabase.from('profiles').select('id, full_name, email, departments'),
    ])

    // Mappa id → profilo e nome → dipartimento
    const idToProfile: Record<string, any> = {}
    const nameToDept: Record<string, string> = {}
    ;(allProfiles || []).forEach((p: any) => {
      idToProfile[p.id] = p
      const name = p.full_name || p.email || ''
      if (name) nameToDept[name] = p.departments?.[0] || 'marketing'
    })

    // Raggruppa per dipartimento
    const grouped: Record<string, any[]> = {}

    // Todos personali — assigned_to è il nome
    ;(allTodos || []).forEach((t: any) => {
      const dept = nameToDept[t.assigned_to] || 'marketing'
      if (!grouped[dept]) grouped[dept] = []
      grouped[dept].push({ ...t })
    })

    // Team subtasks — assigned_to è UUID
    ;(allSubtasks || []).forEach((s: any) => {
      const p = idToProfile[s.assigned_to]
      const dept = p?.departments?.[0] || 'marketing'
      const name = p?.full_name || p?.email || s.assigned_name || 'Sconosciuto'
      if (!grouped[dept]) grouped[dept] = []
      grouped[dept].push({
        id: s.id,
        title: s.title,
        assigned_to: name,
        priority: 'media',
        due_date: null,
      })
    })

    setDeptTodos(grouped)
    setTodos((allTodos || []).slice(0, 5))
  }

  async function loadDeptData(dept: string) {
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
    } else {
      const { data: td } = await supabase.from('todos').select('*').eq('done', false).eq('assigned_to', uname).order('due_date')
      setStats({
        cards: [{ label: 'Task Aperti', value: td?.length || 0, color: '#4a8fff' }]
      })
      setTodos((td || []).slice(0, 5))
      setUpcoming([])
    }
  }

  const isSuperAdmin = profile?.role === 'superadmin' || profile?.role === 'admin'

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
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

      {/* SUPERADMIN: todo per dipartimento */}
      {isSuperAdmin && Object.keys(deptTodos).length > 0 && (
        <div className="mb-7">
          <h2 className="font-serif text-xl mb-4">
            Task aperti <span className="text-accent italic">per ufficio</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Object.entries(deptTodos).map(([dept, items]) => {
              const byPerson: Record<string, { name: string; count: number; todos: any[] }> = {}
              items.forEach((t: any) => {
                const key = t.assigned_to || 'Non assegnato'
                if (!byPerson[key]) byPerson[key] = { name: key, count: 0, todos: [] }
                byPerson[key].count++
                byPerson[key].todos.push(t)
              })
              const color = DEPT_COLORS[dept] || '#4a8fff'
              return (
                <div key={dept} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <div className="label">{DEPT_LABELS[dept] || dept}</div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: color + '22', color }}>
                      {items.length} aperti
                    </span>
                  </div>
                  {Object.values(byPerson).sort((a, b) => b.count - a.count).map(person => (
                    <div key={person.name} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0"
                            style={{ background: color }}>
                            {person.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{person.name.split(' ')[0]}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                          person.count >= 3 ? 'bg-red-500/20 text-red-400' :
                          person.count === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>{person.count} task</span>
                      </div>
                      <div className="pl-8 flex flex-col gap-1">
                        {person.todos.slice(0, 3).map((t: any) => (
                          <div key={t.id} className="flex items-center gap-2 text-xs text-muted2">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: t.priority === 'alta' ? '#f87171' : t.priority === 'media' ? '#fb923c' : '#4ade80' }} />
                            <span className="truncate">{t.title}</span>
                            {t.due_date && <span className="text-muted flex-shrink-0">{t.due_date}</span>}
                          </div>
                        ))}
                        {person.todos.length > 3 && (
                          <div className="text-xs text-muted pl-3">+{person.todos.length - 3} altri...</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Scadenze + Task */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {upcoming.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="label">Prossime scadenze (7 giorni)</div>
            </div>
            {upcoming.map((u, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: u.color }} />
                <div className="flex-1 text-sm text-muted2">{u.label}</div>
                <div className="text-xs text-muted">{u.date}</div>
              </div>
            ))}
          </div>
        )}
        {!isSuperAdmin && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <div className="label">I miei task aperti</div>
            </div>
            {todos.length ? todos.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: t.priority === 'alta' ? '#f87171' : t.priority === 'media' ? '#fb923c' : '#4ade80' }} />
                <div className="flex-1 text-sm text-muted2 truncate">{t.title}</div>
                {t.due_date && <div className="text-xs text-muted">{t.due_date}</div>}
              </div>
            )) : (
              <div className="text-muted text-sm py-4">Nessun task aperto 🎉</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
