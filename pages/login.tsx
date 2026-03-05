import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function Login({ session }: { session: Session | null }) {
  const router = useRouter()

  useEffect(() => {
    if (session) router.push('/dashboard')
  }, [session, router])

  const loginMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'openid profile email',
        redirectTo: `https://allscent-hub.vercel.app/dashboard`,
        queryParams: {
          tenant: process.env.NEXT_PUBLIC_AZURE_TENANT_ID!,
        },
      },
    })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full px-6">
        <div className="text-center">
          <div className="font-serif text-5xl text-accent mb-2">AllScent</div>
          <div className="text-xs uppercase tracking-[3px] text-muted">Marketing Hub</div>
        </div>
        <div className="w-12 h-px bg-accent/30" />
        <div className="card w-full text-center">
          <p className="text-sm text-muted2 mb-6 leading-relaxed">
            Accedi con il tuo account Microsoft aziendale per entrare nella dashboard del team.
          </p>
          <button
            onClick={loginMicrosoft}
            className="w-full flex items-center justify-center gap-3 bg-accent text-black font-semibold text-sm py-3 px-6 rounded-lg hover:bg-accent2 transition-all hover:-translate-y-px"
          >
            <svg width="18" height="18" viewBox="0 0 23 23">
              <rect x="1" y="1" width="10" height="10" fill="#f35325"/>
              <rect x="12" y="1" width="10" height="10" fill="#81bc06"/>
              <rect x="1" y="12" width="10" height="10" fill="#05a6f0"/>
              <rect x="12" y="12" width="10" height="10" fill="#ffba08"/>
            </svg>
            Accedi con Microsoft
          </button>
          <p className="text-xs text-muted mt-4">Solo account @allscentbeauty.com</p>
        </div>
        <p className="text-xs text-muted text-center">CARLOTTA SRL · AllScent Beauty</p>
      </div>
    </div>
  )
}
