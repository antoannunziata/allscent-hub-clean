import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import '@/styles/globals.css'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: 'superadmin' | 'admin' | 'dept_manager' | 'editor' | 'viewer' | 'pending'
  departments: string[]
}

export default function App({ Component, pageProps }: AppProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data || null)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-accent font-serif text-2xl">AllScent Hub</div>
    </div>
  )

  return <Component {...pageProps} session={session} profile={profile} />
}