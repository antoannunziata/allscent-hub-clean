import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-accent font-serif text-2xl">AllScent Hub</div>
    </div>
  )

  return <Component {...pageProps} session={session} />
}
