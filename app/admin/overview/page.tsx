'use client'

import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { Activity, Construction, DollarSign, RefreshCw, Sparkles, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface Dashboard {
  total_users: number
  plans: { free: number; pro: number; premier: number }
  users: Array<{ id: string; email: string; created_at: string; last_sign_in_at: string | null }>
  revenue: {
    subscription_gross_cents: number
    credit_pack_gross_cents: number
    stripe_available: Array<{ currency: string; amount: number }>
    stripe_pending: Array<{ currency: string; amount: number }>
    note: string
  }
  construction_mode: boolean
}

const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)

export default function AdminOverviewPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setError('')
    apiClient.request<Dashboard>(API_ENDPOINTS.adminDashboard)
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load dashboard.'))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function setConstructionMode(enabled: boolean) {
    setSaving(true)
    try {
      await apiClient.request(API_ENDPOINTS.adminConstructionMode, { method: 'PUT', body: { enabled } })
      setData((current) => current ? { ...current, construction_mode: enabled } : current)
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div className="p-4 text-sm text-destructive sm:p-8">{error}</div>
  if (!data) return <div className="p-8 text-sm text-muted-foreground">Loading live Vurenn metrics…</div>

  const available = data.revenue.stripe_available.find((item) => item.currency === 'usd')?.amount ?? 0
  const pending = data.revenue.stripe_pending.find((item) => item.currency === 'usd')?.amount ?? 0
  const cards = [
    ['Signed-up users', String(data.total_users), 'Supabase Auth', Users],
    ['Subscription gross', money(data.revenue.subscription_gross_cents), 'Paid Stripe invoices', DollarSign],
    ['Credit-pack gross', money(data.revenue.credit_pack_gross_cents), 'Completed top-offs', Sparkles],
    ['Stripe balance', money(available), `${money(pending)} pending`, Activity],
  ] as const

  return (
    <div className="flex flex-col gap-7 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-semibold">CEO overview</h1><p className="mt-1 text-sm text-muted-foreground">Live user and Stripe reporting. Gross figures exclude adjustments described below.</p></div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 size-4" /> Refresh</Button>
      </div>

      <section className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${data.construction_mode ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
        <div className="flex gap-3"><Construction className="mt-0.5 size-5" /><div><h2 className="font-semibold">{data.construction_mode ? 'Under construction is ON' : 'Vurenn is open to the public'}</h2><p className="mt-1 text-xs text-muted-foreground">Admins and approved bypass emails can still use the app while construction mode is on.</p></div></div>
        <Button disabled={saving} onClick={() => setConstructionMode(!data.construction_mode)}>{data.construction_mode ? 'Open to public' : 'Turn construction on'}</Button>
      </section>

      <section className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, note, Icon]) => <div key={label} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between text-xs text-muted-foreground"><span>{label}</span><Icon className="size-4" /></div><p className="mt-4 text-2xl font-semibold">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{note}</p></div>)}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {(['free', 'pro', 'premier'] as const).map((plan) => <div key={plan} className="rounded-2xl border border-border p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{plan}</p><p className="mt-2 text-2xl font-semibold">{data.plans[plan]}</p></div>)}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border">
        <div className="border-b border-border bg-card px-4 py-3"><h2 className="text-sm font-semibold">Signed-up users</h2></div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-xs"><thead className="sticky top-0 bg-muted"><tr><th className="px-4 py-2">Email</th><th className="px-4 py-2">Joined</th><th className="px-4 py-2">Last sign-in</th></tr></thead><tbody>{data.users.map((user) => <tr key={user.id} className="border-t border-border"><td className="px-4 py-3 font-medium">{user.email}</td><td className="px-4 py-3 text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td><td className="px-4 py-3 text-muted-foreground">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</td></tr>)}</tbody></table>
        </div>
      </section>
      <p className="text-xs text-muted-foreground">{data.revenue.note} “Stripe balance” is the connected Stripe account’s reported balance; access does not transfer ownership or funds.</p>
    </div>
  )
}
