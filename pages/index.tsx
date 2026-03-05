import { useEffect } from 'react'
import { useRouter } from 'next/router'
import type { Session } from '@supabase/supabase-js'

export default function Home({ session }: { session: Session | null }) {
  const router = useRouter()
  useEffect(() => {
    router.push(session ? '/dashboard' : '/login')
  }, [session, router])
  return null
}
