import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BRANDS, BRAND_COLORS } from '@/lib/constants'
import Layout from '@/components/Layout'
import type { Session } from '@supabase/supabase-js'

export default function BudgetPage({ session }: { session: Session | null }) {
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => { supabase.from('trade_activities').select('*').then(({ data }) => setActivities(data || [])) }, [])

  const totale = activities.reduce((s, a) => s + Number(a.price), 0)
  const contrib = activities.filter(a => a.incl_contributo).reduce((s, a) => s + Number(a.price), 0)
  const extra = activities.filter(a => !a.incl_contributo).reduce((s, a) => s + Number(a.price), 0)

  const byBrand: Record<string, { total: number; incl: number; extra: number; items: any[] }> = {}
  activities.forEach(a => {
    if (!byBrand[a.brand]) byBrand[a.brand] = { total: 0, incl: 0, extra: 0, items: [] }
    byBrand[a.brand].total += Number(a.price)
    if (a.incl_contributo) byBrand[a.brand].incl += Number(a.price)
    else byBrand[a.brand].extra += Number(a.price)
    byBrand[a.brand].items.push(a)
  })
  const brandList = Object.entries(byBrand).sort((a, b) => b[1].total - a[1].total)
  const maxTotal = Math.max(...brandList.map(([, v]) => v.total), 1)

  return (
    <Layout session={session}>
      <div className="mb-6">
        <h1 className="font-serif text-3xl">Budget <span className="text-accent italic">Brand</span></h1>
        <p className="text-muted text-sm mt-1">Riepilogo investimenti trade per brand</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Budget Totale',      value: totale,              color: '#c9a96e' },
          { label: 'Incluso Contributo', value: contrib,             color: '#4ade80' },
          { label: 'Extra Contributo',   value: extra,               color: '#fb923c' },
          { label: 'Brand Attivi',       value: brandList.length,    color: '#a78bfa', isCount: true },
        ].map(s => (
          <div key={s.label} className="card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10" style={{ background: s.color, transform: 'translate(30%,-30%)' }} />
            <div className="font-serif text-3xl" style={{ color: s.color }}>
              {s.isCount ? s.value : s.value.toLocaleString('it-IT') + ' €'}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted mt-2">{s.label}</div>
          </div>
        ))}
      </div>

      {!brandList.length ? (
        <div className="card text-center py-12 text-muted">Nessuna attivazione inserita.</div>
      ) : brandList.map(([brand, data], bi) => {
        const color = BRAND_COLORS[BRANDS.indexOf(brand) % BRAND_COLORS.length]
        return (
          <div key={brand} className="card-sm mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-base" style={{ color }}>{brand}</div>
              <div className="font-serif text-xl text-accent">{data.total.toLocaleString('it-IT')} €</div>
            </div>
            <div className="h-1.5 bg-surface3 rounded-full mb-3 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(data.total / maxTotal * 100).toFixed(1)}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
            </div>
            <div className="flex flex-col gap-1.5">
              {data.items.map(a => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <div className="text-muted2">{a.tipo_label || a.tipo} · {(a.pdvs||[]).length} PDV</div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${a.incl_contributo ? 'badge-incl' : 'badge-extra'}`}>{a.incl_contributo ? 'contributo' : 'extra'}</span>
                    <span className="font-semibold">{Number(a.price).toLocaleString('it-IT')} €</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-1.5 border-t border-white/5 mt-1 text-muted">
                <span>Contributo / Extra</span>
                <span>{data.incl.toLocaleString('it-IT')} € / {data.extra.toLocaleString('it-IT')} €</span>
              </div>
            </div>
          </div>
        )
      })}
    </Layout>
  )
}
