'use client'

import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface SafetyEvent {
  id: string
  email?: string
  category: string
  content: string
  request_id?: string
  created_at: string
  expires_at: string
}

export default function AdminSecurityPage() {
  const [events, setEvents] = useState<SafetyEvent[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiClient.request<{ events: SafetyEvent[]; notice: string }>(
        API_ENDPOINTS.adminSecurityEvents,
      )
      setEvents(result.events)
      setNotice(result.notice)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load safety records.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [load])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-primary" />
            <h1 className="text-xl font-semibold">Safety evidence</h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Restricted records for safety review, disputes, and valid legal requests. Records expire after 90 days.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {notice && <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">{notice}</p>}
      {error && <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading && <p className="p-6 text-sm text-muted-foreground">Loading restricted records…</p>}
        {!loading && events.length === 0 && <p className="p-6 text-sm text-muted-foreground">No safety events are currently retained.</p>}
        <div className="divide-y divide-border">
          {events.map((event) => (
            <article key={event.id} className="p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">{event.category.replaceAll('_', ' ')}</span>
                <span className="text-sm font-medium">{event.email || 'Unknown account'}</span>
                <span className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</span>
              </div>
              <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-3 font-sans text-sm leading-relaxed">{event.content}</pre>
              <p className="mt-3 break-all text-[11px] text-muted-foreground">
                Request {event.request_id || 'unavailable'} · Expires {new Date(event.expires_at).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
