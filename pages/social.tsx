import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BRANDS, SOCIAL_CANALI, SOCIAL_STATI, MONTHS_IT } from '@/lib/constants'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

export default function SocialPage({ session }: { session: Session | null }) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [channel, setChannel] = useState('IGF')
  const [brand, setBrand] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('IDA')
  const [owner, setOwner] = useState('')
  const [postDate, setPostDate] = useState('')
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    const { data } = await supabase.from('social_posts').select('*').order('post_date')
    setPosts(data || [])
  }

  async function handleAdd() {
    if (!postDate || !title) { alert('Inserisci data e titolo'); return }
    setLoading(true)
    const chanInfo = SOCIAL_CANALI.find(c => c.value === channel)
    const statInfo = SOCIAL_STATI.find(s => s.value === status)
    await supabase.from('social_posts').insert({
      channel, channel_label: chanInfo?.label,
      brand, title, status, status_label: statInfo?.label,
      owner, post_date: postDate, created_by: session?.user?.id
    })
    setChannel('IGF'); setBrand(''); setTitle(''); setStatus('IDA'); setOwner(''); setPostDate('')
    setShowForm(false)
    await loadPosts()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare?')) return
    await supabase.from('social_posts').delete().eq('id', id)
    await loadPosts()
  }

  // Build calendar
  const ms = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
  const firstDow = new Date(calYear, calMonth, 1).getDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const cells: { d: number; cur: boolean }[] = []
  const prevDays = new Date(calYear, calMonth, 0).getDate()
  for (let i = offset - 1; i >= 0; i--) cells.push({ d: prevDays - i, cur: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, cur: true })
  while (cells.length % 7 !== 0) cells.push({ d: cells.length - daysInMonth - offset + 1, cur: false })

  return (
    <Layout session={session}>
      <div className="mb-6">
        <h1 className="font-serif text-3xl">Calendario <span className="text-accent italic">Social</span></h1>
        <p className="text-muted text-sm mt-1">Pianifica contenuti per tutti i canali</p>
      </div>

      {/* Calendar */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button className="btn-secondary px-3 py-1.5 text-sm" onClick={() => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1) }}>‹</button>
          <div className="font-serif text-xl">{MONTHS_IT[calMonth]} {calYear}</div>
          <button className="btn-secondary px-3 py-1.5 text-sm" onClick={() => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1) }}>›</button>
          <button className="btn-primary ml-auto text-xs px-4 py-2" onClick={() => setShowForm(v => !v)}>+ Nuovo post</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['LUN','MAR','MER','GIO','VEN','SAB','DOM'].map(d => (
            <div key={d} className="text-center text-xs text-muted font-semibold py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map(({ d, cur }, i) => {
            const ds = `${ms}-${String(d).padStart(2, '0')}`
            const dayPosts = cur ? posts.filter(p => p.post_date === ds) : []
            const isToday = cur && d === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear()
            return (
              <div key={i} className={`min-h-16 rounded-lg p-1.5 border transition-colors ${isToday ? 'border-accent' : 'border-white/5'} ${cur ? 'bg-surface2' : 'bg-surface2/30 opacity-30'}`}>
                <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-accent' : 'text-muted'}`}>{d}</div>
                {dayPosts.map(p => {
                  const c = SOCIAL_CANALI.find(ch => ch.value === p.channel)
                  return (
                    <div key={p.id} className="text-xs px-1 py-0.5 rounded mb-0.5 truncate font-semibold cursor-pointer"
                      style={{ background: (c?.color || '#555') + '33', color: c?.color || '#aaa' }}
                      title={p.title}>
                      {p.channel} {p.title.slice(0, 12)}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <div className="label mb-4">Nuovo post</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="label mb-1.5">Canale</div>
              <select className="input" value={channel} onChange={e => setChannel(e.target.value)}>
                {SOCIAL_CANALI.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <div className="label mb-1.5">Data pubblicazione</div>
              <input type="date" className="input" value={postDate} onChange={e => setPostDate(e.target.value)} />
            </div>
            <div>
              <div className="label mb-1.5">Brand (opz.)</div>
              <select className="input" value={brand} onChange={e => setBrand(e.target.value)}>
                <option value="">— Nessuno —</option>
                {BRANDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="col-span-3">
              <div className="label mb-1.5">Titolo / Copy breve</div>
              <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="es. Lancio Guerlain — reveal prodotto" />
            </div>
            <div>
              <div className="label mb-1.5">Stato</div>
              <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                {SOCIAL_STATI.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <div className="label mb-1.5">Responsabile</div>
              <input type="text" className="input" value={owner} onChange={e => setOwner(e.target.value)} placeholder="es. Social Manager" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn-primary" onClick={handleAdd} disabled={loading}>{loading ? 'Salvataggio...' : 'Aggiungi ✓'}</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Annulla</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="card">
        <div className="label mb-4">Lista post</div>
        {!posts.length ? (
          <div className="text-muted text-sm py-8 text-center">Nessun post pianificato.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {[...posts].sort((a, b) => a.post_date.localeCompare(b.post_date)).map(p => {
              const chanInfo = SOCIAL_CANALI.find(c => c.value === p.channel)
              return (
                <div key={p.id} className="card-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: (chanInfo?.color || '#555') + '22' }}>
                    {p.channel === 'IGF' || p.channel === 'IGR' || p.channel === 'IGS' ? '📸' : p.channel === 'TTK' ? '🎵' : p.channel === 'FB' ? '👥' : '📧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.title}</div>
                    <div className="text-xs text-muted mt-0.5">{p.channel_label || p.channel}{p.brand ? ' · ' + p.brand : ''} · 📅 {p.post_date}{p.owner ? ' · 👤 ' + p.owner : ''}</div>
                    <div className="mt-1"><span className="badge bg-white/5 text-muted2">{p.status_label || p.status}</span></div>
                  </div>
                  <button className="btn-ghost" onClick={() => handleDelete(p.id)}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
