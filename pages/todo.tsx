import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

const PRIO_COLORS: Record<string,string> = { alta:'#f87171', media:'#fb923c', bassa:'#4ade80' }
interface SubtaskForm { userId: string; name: string; email: string; title: string }

export default function TodoPage({ session }: { session: Session | null }) {
  const [tab, setTab] = useState<'miei'|'team'>('miei')
  const [profile, setProfile] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])

  // Miei task
  const [myTodos, setMyTodos] = useState<any[]>([])
  const [mySubtasks, setMySubtasks] = useState<any[]>([])
  const [myTitle, setMyTitle] = useState('')
  const [myPrio, setMyPrio] = useState('media')
  const [myStart, setMyStart] = useState('')
  const [myDue, setMyDue] = useState('')

  // Modifica todo personale
  const [editingTodo, setEditingTodo] = useState<any>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrio, setEditPrio] = useState('media')
  const [editStart, setEditStart] = useState('')
  const [editDue, setEditDue] = useState('')

  // Modifica team task
  const [editingTask, setEditingTask] = useState<any>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDesc, setEditTaskDesc] = useState('')
  const [editTaskPrio, setEditTaskPrio] = useState('media')
  const [editTaskStart, setEditTaskStart] = useState('')
  const [editTaskDue, setEditTaskDue] = useState('')

  // Task team
  const [tasks, setTasks] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPrio, setTaskPrio] = useState('media')
  const [taskStart, setTaskStart] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [subtaskForms, setSubtaskForms] = useState<SubtaskForm[]>([{ userId:'', name:'', email:'', title:'' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (session) loadAll() }, [session])

  async function loadAll() {
    const uid = session?.user?.id
    const uname = session?.user?.user_metadata?.full_name || session?.user?.email || ''
    const [{ data: p }, { data: u }, { data: t }, { data: st }, { data: tt }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid!).single(),
      supabase.from('profiles').select('id, full_name, email').order('full_name'),
      supabase.from('todos').select('*').eq('assigned_to', uname).order('done').order('due_date', { nullsFirst: false }),
      supabase.from('team_subtasks').select('*, team_tasks(*)').eq('assigned_to', uid!).order('done'),
      supabase.from('team_tasks').select('*, team_subtasks(*)').order('created_at', { ascending: false }),
    ])
    setProfile(p)
    setUsers(u || [])
    setMyTodos(t || [])
    setMySubtasks(st || [])
    setTasks(tt || [])
  }

  async function addMyTodo() {
    if (!myTitle) return
    setLoading(true)
    const uname = session?.user?.user_metadata?.full_name || session?.user?.email || ''
    await supabase.from('todos').insert({
      title: myTitle, priority: myPrio, assigned_to: uname,
      start_date: myStart || null, due_date: myDue || null, created_by: session?.user?.id
    })
    setMyTitle(''); setMyPrio('media'); setMyStart(''); setMyDue('')
    await loadAll(); setLoading(false)
  }

  async function toggleTodo(id: string, done: boolean) {
    await supabase.from('todos').update({ done: !done }).eq('id', id); await loadAll()
  }
  async function deleteTodo(id: string) {
    await supabase.from('todos').delete().eq('id', id); await loadAll()
  }
  async function toggleSubtask(id: string, done: boolean) {
    await supabase.from('team_subtasks').update({ done: !done }).eq('id', id); await loadAll()
  }

  // Edit todo personale
  function openEdit(todo: any) {
    setEditingTodo(todo)
    setEditTitle(todo.title)
    setEditPrio(todo.priority || 'media')
    setEditStart(todo.start_date || '')
    setEditDue(todo.due_date || '')
  }
  async function saveEdit() {
    if (!editingTodo) return
    await supabase.from('todos').update({
      title: editTitle, priority: editPrio,
      start_date: editStart || null, due_date: editDue || null,
    }).eq('id', editingTodo.id)
    setEditingTodo(null); await loadAll()
  }

  // Edit team task
  function openEditTask(task: any) {
    setEditingTask(task)
    setEditTaskTitle(task.title)
    setEditTaskDesc(task.description || '')
    setEditTaskPrio(task.priority || 'media')
    setEditTaskStart(task.start_date || '')
    setEditTaskDue(task.due_date || '')
  }
  async function saveEditTask() {
    if (!editingTask) return
    await supabase.from('team_tasks').update({
      title: editTaskTitle, description: editTaskDesc, priority: editTaskPrio,
      start_date: editTaskStart || null, due_date: editTaskDue || null,
    }).eq('id', editingTask.id)
    setEditingTask(null); await loadAll()
  }

  function handleUserSelect(idx: number, uid: string) {
    const user = users.find(u => u.id === uid)
    setSubtaskForms(prev => prev.map((f, i) => i === idx ? { ...f, userId: uid, name: user?.full_name || user?.email || '', email: user?.email || '' } : f))
  }

  async function createTeamTask() {
    if (!taskTitle) { alert('Inserisci un titolo'); return }
    const validSubs = subtaskForms.filter(f => f.userId && f.title)
    if (!validSubs.length) { alert('Aggiungi almeno un sotto-task'); return }
    setLoading(true)
    const { data: task } = await supabase.from('team_tasks').insert({
      title: taskTitle, description: taskDesc, priority: taskPrio,
      start_date: taskStart || null, due_date: taskDue || null, created_by: session?.user?.id
    }).select().single()
    if (task) {
      await supabase.from('team_subtasks').insert(validSubs.map(f => ({
        task_id: task.id, assigned_to: f.userId, assigned_name: f.name, assigned_email: f.email, title: f.title
      })))
      for (const f of validSubs) {
        if (f.email) {
          await fetch('/api/notify-todo', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: f.email, assignedTo: f.name, title: f.title, priority: taskPrio, startDate: taskStart||null, dueDate: taskDue||null, assignedBy: session?.user?.email, teamTask: taskTitle })
          }).catch(() => {})
        }
      }
    }
    setTaskTitle(''); setTaskDesc(''); setTaskPrio('media'); setTaskStart(''); setTaskDue('')
    setSubtaskForms([{ userId:'', name:'', email:'', title:'' }]); setShowForm(false)
    await loadAll(); setLoading(false)
  }

  async function deleteTask(id: string) {
    if (!confirm('Eliminare questo task?')) return
    await supabase.from('team_tasks').delete().eq('id', id); await loadAll()
  }

  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin'
  const openMy = myTodos.filter(t => !t.done)
  const doneMy = myTodos.filter(t => t.done)
  const openSub = mySubtasks.filter(s => !s.done)
  const openTasks = tasks.filter(t => !t.done)
  const doneTasks = tasks.filter(t => t.done)

  // Riepilogo task in sospeso per membro del team
  const teamSummary: Record<string, { name: string; count: number }> = {}
  tasks.forEach(task => {
    if (task.done) return
    ;(task.team_subtasks || []).forEach((s: any) => {
      if (s.done) return
      const key = s.assigned_to
      if (!teamSummary[key]) teamSummary[key] = { name: s.assigned_name || key, count: 0 }
      teamSummary[key].count++
    })
  })
  const teamSummaryList = Object.values(teamSummary).sort((a, b) => b.count - a.count)

  return (
    <Layout session={session}>

      {/* Modal modifica todo personale */}
      {editingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-serif text-xl text-white mb-5">Modifica task</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="label mb-1.5">Descrizione</div>
                <input type="text" className="input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div>
                <div className="label mb-1.5">Priorità</div>
                <select className="input" value={editPrio} onChange={e => setEditPrio(e.target.value)}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="label mb-1.5">Inizio</div>
                  <input type="date" className="input" value={editStart} onChange={e => setEditStart(e.target.value)} />
                </div>
                <div>
                  <div className="label mb-1.5">Scadenza</div>
                  <input type="date" className="input" value={editDue} onChange={e => setEditDue(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={saveEdit}>Salva</button>
              <button className="btn-secondary flex-1" onClick={() => setEditingTodo(null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal modifica team task */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-serif text-xl text-white mb-5">Modifica task team</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="label mb-1.5">Titolo</div>
                <input type="text" className="input" value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} />
              </div>
              <div>
                <div className="label mb-1.5">Descrizione (opz.)</div>
                <textarea className="input resize-none h-16" value={editTaskDesc} onChange={e => setEditTaskDesc(e.target.value)} />
              </div>
              <div>
                <div className="label mb-1.5">Priorità</div>
                <select className="input" value={editTaskPrio} onChange={e => setEditTaskPrio(e.target.value)}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="label mb-1.5">Inizio</div>
                  <input type="date" className="input" value={editTaskStart} onChange={e => setEditTaskStart(e.target.value)} />
                </div>
                <div>
                  <div className="label mb-1.5">Scadenza</div>
                  <input type="date" className="input" value={editTaskDue} onChange={e => setEditTaskDue(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={saveEditTask}>Salva</button>
              <button className="btn-secondary flex-1" onClick={() => setEditingTask(null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-serif text-3xl">Task <span className="text-accent italic">Team</span></h1>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('miei')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${tab==='miei' ? 'bg-accent text-black border-accent' : 'bg-transparent text-muted2 border-white/10 hover:border-accent/50'}`}>
          I miei task
        </button>
        <button onClick={() => setTab('team')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${tab==='team' ? 'bg-accent text-black border-accent' : 'bg-transparent text-muted2 border-white/10 hover:border-accent/50'}`}>
          Task team
        </button>
      </div>

      {/* ─── I MIEI TASK ─── */}
      {tab === 'miei' && (
        <>
          <div className="card mb-6">
            <div className="label mb-4">Nuovo task personale</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <div className="label mb-1.5">Descrizione</div>
                <input type="text" className="input" value={myTitle} onChange={e => setMyTitle(e.target.value)}
                  placeholder="es. Preparare presentazione brand" onKeyDown={e => e.key==='Enter'&&addMyTodo()} />
              </div>
              <div>
                <div className="label mb-1.5">Priorita</div>
                <select className="input" value={myPrio} onChange={e => setMyPrio(e.target.value)}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </div>
              <div>
                <div className="label mb-1.5">Inizio (opz.)</div>
                <input type="date" className="input" value={myStart} onChange={e => setMyStart(e.target.value)} />
              </div>
              <div>
                <div className="label mb-1.5">Scadenza (opz.)</div>
                <input type="date" className="input" value={myDue} onChange={e => setMyDue(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary mt-4" onClick={addMyTodo} disabled={loading}>Aggiungi</button>
          </div>

          {/* Riepilogo task in sospeso per membro */}
          {teamSummaryList.length > 0 && (
            <div className="card mb-6">
              <div className="label mb-4">Task in sospeso per membro del team</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {teamSummaryList.map(member => (
                  <div key={member.name} className="flex items-center justify-between bg-surface2 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0">
                        {member.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium truncate">{member.name.split(' ')[0]}</span>
                    </div>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${member.count >= 3 ? 'bg-red-500/20 text-red-400' : member.count === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                      {member.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {openSub.length > 0 && (
            <div className="card mb-5">
              <div className="label mb-4">Assegnati dal team ({openSub.length})</div>
              {openSub.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <button onClick={() => toggleSubtask(s.id, s.done)}
                    className="w-5 h-5 rounded-md border-2 border-white/20 flex-shrink-0 cursor-pointer bg-transparent hover:border-green-400 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-muted">{s.team_tasks?.title}</div>
                  </div>
                  {s.team_tasks?.due_date && <div className="text-xs text-muted">{s.team_tasks.due_date}</div>}
                </div>
              ))}
            </div>
          )}

          <div className="card mb-4">
            <div className="label mb-4">I miei task ({openMy.length})</div>
            {!openMy.length ? <div className="text-muted text-sm py-4">Nessun task aperto</div> :
              openMy.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <button onClick={() => toggleTodo(t.id, t.done)}
                    className="w-5 h-5 rounded-md border-2 border-white/20 flex-shrink-0 cursor-pointer bg-transparent hover:border-green-400 transition-colors" />
                  <div className="flex-1 text-sm font-medium truncate">{t.title}</div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: PRIO_COLORS[t.priority]+'22', color: PRIO_COLORS[t.priority] }}>{t.priority}</span>
                  {t.start_date && <span className="text-xs text-muted">{t.start_date}</span>}
                  {t.due_date && <span className="text-xs text-muted">{t.due_date}</span>}
                  <button className="btn-ghost hover:text-accent transition-colors" onClick={() => openEdit(t)} title="Modifica">✏️</button>
                  <button className="btn-ghost" onClick={() => deleteTodo(t.id)}>x</button>
                </div>
              ))
            }
          </div>

          {doneMy.length > 0 && (
            <div className="card opacity-50">
              <div className="label mb-3">Completati ({doneMy.length})</div>
              {doneMy.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-5 h-5 rounded-md bg-green-400 flex items-center justify-center text-black text-xs font-bold">v</div>
                  <div className="flex-1 text-sm line-through text-muted">{t.title}</div>
                  <button className="btn-ghost" onClick={() => deleteTodo(t.id)}>x</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── TASK TEAM ─── */}
      {tab === 'team' && (
        <>
          <div className="flex justify-end mb-4">
            {isAdmin && (
              <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
                {showForm ? 'Annulla' : '+ Nuovo task team'}
              </button>
            )}
          </div>

          {showForm && (
            <div className="card mb-6">
              <div className="label mb-4">Nuovo task di team</div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-3">
                  <div className="label mb-1.5">Titolo</div>
                  <input type="text" className="input" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="es. Preparazione evento Settembre" />
                </div>
                <div className="col-span-3">
                  <div className="label mb-1.5">Descrizione (opz.)</div>
                  <textarea className="input resize-none h-16" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
                </div>
                <div>
                  <div className="label mb-1.5">Priorita</div>
                  <select className="input" value={taskPrio} onChange={e => setTaskPrio(e.target.value)}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="bassa">Bassa</option>
                  </select>
                </div>
                <div>
                  <div className="label mb-1.5">Inizio (opz.)</div>
                  <input type="date" className="input" value={taskStart} onChange={e => setTaskStart(e.target.value)} />
                </div>
                <div>
                  <div className="label mb-1.5">Scadenza (opz.)</div>
                  <input type="date" className="input" value={taskDue} onChange={e => setTaskDue(e.target.value)} />
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <div className="label mb-3">Sotto-task per persona</div>
                {subtaskForms.map((f, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select className="input w-44 flex-shrink-0" value={f.userId} onChange={e => handleUserSelect(idx, e.target.value)}>
                      <option value="">Utente</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                    </select>
                    <input type="text" className="input flex-1" value={f.title}
                      onChange={e => setSubtaskForms(prev => prev.map((sf, i) => i===idx ? {...sf, title: e.target.value} : sf))}
                      placeholder="Descrizione sotto-task..." />
                    {subtaskForms.length > 1 && <button className="btn-ghost" onClick={() => setSubtaskForms(prev => prev.filter((_,i)=>i!==idx))}>x</button>}
                  </div>
                ))}
                <button className="btn-secondary text-xs mt-1" onClick={() => setSubtaskForms(prev => [...prev, { userId:'', name:'', email:'', title:'' }])}>+ Aggiungi persona</button>
              </div>
              <button className="btn-primary mt-5" onClick={createTeamTask} disabled={loading}>{loading ? 'Creazione...' : 'Crea task team'}</button>
            </div>
          )}

          {!openTasks.length ? (
            <div className="card text-center py-12 text-muted">Nessun task di team attivo.</div>
          ) : openTasks.map(task => {
            const subs = task.team_subtasks || []
            const doneSubs = subs.filter((s:any) => s.done).length
            const pct = subs.length ? Math.round(doneSubs/subs.length*100) : 0
            return (
              <div key={task.id} className="card mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-base">{task.title}</div>
                    {task.description && <div className="text-xs text-muted mt-0.5">{task.description}</div>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: PRIO_COLORS[task.priority]+'22', color: PRIO_COLORS[task.priority] }}>{task.priority}</span>
                      {task.start_date && <span className="text-xs text-muted">{task.start_date}</span>}
                      {task.due_date && <span className="text-xs text-muted">{task.due_date}</span>}
                      <span className="text-xs text-muted">{doneSubs}/{subs.length} completati</span>
                    </div>
                    {subs.length > 0 && (
                      <div className="h-1 bg-surface3 rounded-full mt-2 overflow-hidden w-48">
                        <div className="h-full bg-green-400 rounded-full" style={{ width: pct+'%' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && <button className="btn-ghost hover:text-accent transition-colors" onClick={() => openEditTask(task)} title="Modifica">✏️</button>}
                    {isAdmin && <button className="btn-ghost" onClick={() => deleteTask(task.id)}>x</button>}
                  </div>
                </div>
                <div className="border-t border-white/5 pt-3 flex flex-col gap-1.5">
                  {subs.map((s:any) => (
                    <div key={s.id} className="flex items-center gap-2.5 pl-4">
                      <button onClick={() => toggleSubtask(s.id, s.done)}
                        className={`w-4 h-4 rounded border flex-shrink-0 cursor-pointer transition-all flex items-center justify-center ${s.done ? 'bg-green-400 border-green-400' : 'border-white/20 bg-transparent'}`}>
                        {s.done && <span className="text-black text-[10px] font-bold">v</span>}
                      </button>
                      <div className={`text-sm flex-1 ${s.done ? 'line-through text-muted' : ''}`}>{s.title}</div>
                      <div className="text-xs bg-surface3 px-2 py-0.5 rounded text-muted2">{s.assigned_name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {doneTasks.length > 0 && (
            <div className="card opacity-40 mt-4">
              <div className="label mb-3">Completati ({doneTasks.length})</div>
              {doneTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-5 h-5 rounded-md bg-green-400 flex items-center justify-center text-black text-xs font-bold">v</div>
                  <div className="text-sm line-through text-muted">{task.title}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
