'use client'

import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { Check, Copy, KeyRound, RefreshCw, ShieldX } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface BetaCode {
  id: string
  label: string
  code_prefix: string
  created_at: string
  redeemed_email: string | null
  redeemed_at: string | null
  revoked_at: string | null
  created_by_email?: string | null
}

export default function AdminInvitesPage() {
  const [items, setItems] = useState<BetaCode[]>([])
  const [label, setLabel] = useState('Private beta guest')
  const [newCode, setNewCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const response = await apiClient.request<{ items?: BetaCode[] }>(API_ENDPOINTS.adminInvites)
      setItems(Array.isArray(response?.items) ? response.items : [])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Access codes could not be loaded.')
    }
  }, [])

  useEffect(() => { queueMicrotask(() => void load()) }, [load])

  async function createCode() {
    setBusy(true)
    setError(null)
    setNewCode('')
    try {
      const created = await apiClient.request<BetaCode & { code: string }>(API_ENDPOINTS.adminInvites, {
        method: 'POST', body: { label },
      })
      setNewCode(created.code)
      setItems((current) => [created, ...current])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The access code could not be created.')
    } finally { setBusy(false) }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(newCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function revoke(id: string) {
    setBusy(true)
    setError(null)
    try {
      await apiClient.request(API_ENDPOINTS.adminInvite(id), { method: 'DELETE' })
      setItems((current) => current.map((item) => item.id === id ? { ...item, revoked_at: new Date().toISOString() } : item))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The access code could not be revoked.')
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Private beta</p>
          <h1 className="mt-2 text-2xl font-semibold">One-person access codes</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Generate as many codes as you need. A code never expires, works with any email, and becomes permanently used when the first account claims it.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-2 size-3.5" /> Refresh</Button>
      </div>

      <section className="mt-7 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><KeyRound className="size-5" /></span>
          <div><h2 className="font-semibold">Generate a code</h2><p className="mt-1 text-xs text-muted-foreground">The code is not tied to an email and has no time limit. Only the first account can redeem it.</p></div>
        </div>
        <label className="mt-5 block max-w-xl text-xs font-medium">Label
          <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} className="auth-input mt-1.5" placeholder="Grandma — private beta" />
        </label>
        <Button className="mt-4" onClick={createCode} disabled={busy || !label.trim()}><KeyRound className="mr-2 size-4" /> Generate one-person code</Button>

        {newCode && (
          <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Code ready — copy it now</p>
            <p className="mt-1 text-xs text-muted-foreground">For security, Vurenn stores only a one-way fingerprint and cannot reveal the full code again.</p>
            <div className="mt-3 flex gap-2">
              <input readOnly value={newCode} className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm font-semibold tracking-wider" />
              <Button onClick={copyCode}>{copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}{copied ? 'Copied' : 'Copy code'}</Button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">Generated codes</h2>
        <div className="mt-4 divide-y divide-border">
          {items.length === 0 && <p className="py-7 text-center text-sm text-muted-foreground">No codes generated yet.</p>}
          {items.map((item) => {
            const status = item.revoked_at ? 'Revoked' : item.redeemed_at ? 'Used' : 'Ready'
            return (
              <article key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{item.label}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status === 'Ready' ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>{status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.code_prefix}•••••••• · created {new Date(item.created_at).toLocaleDateString()}{item.created_by_email ? ` by ${item.created_by_email}` : ''}{item.redeemed_email ? ` · used by ${item.redeemed_email}` : ''}{item.redeemed_at ? ` on ${new Date(item.redeemed_at).toLocaleString()}` : ''}</p>
                </div>
                {status === 'Ready' && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void revoke(item.id)}><ShieldX className="mr-2 size-3.5" /> Revoke</Button>}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
