'use client'

import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { BookOpen, CheckCircle2, ExternalLink, History } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface WorkshopItem {
  id: string
  title: string
  summary: string
  category: string
  status: 'ready_for_review' | 'released'
  submitted_by: string
  submitted_at: string
}

interface AuditEvent {
  id?: string
  action?: string
  details?: string
  actor_email?: string
  created_at?: string
}

export default function AdminContentPage() {
  const router = useRouter()
  const [items, setItems] = useState<WorkshopItem[]>([])
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [status, setStatus] = useState('')
  const [publishing, setPublishing] = useState('')

  function load() {
    return Promise.all([
      apiClient.request<{ items: WorkshopItem[] }>(API_ENDPOINTS.teamWorkshop),
      apiClient.request<{ events: AuditEvent[] }>(API_ENDPOINTS.adminJournalAudit),
    ]).then(([workshop, audit]) => {
      setItems(workshop.items)
      setEvents(audit.events)
    })
  }

  useEffect(() => {
    void load().catch(() => setStatus('Could not load content activity.'))
  }, [])

  async function release(item: WorkshopItem) {
    setPublishing(item.id)
    try {
      await apiClient.request(API_ENDPOINTS.adminPublishWorkshop(item.id), { method: 'PUT' })
      router.push(`/journal-editor?release=${encodeURIComponent(item.id)}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not release this update.')
      setPublishing('')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Content releases</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review team submissions and see who changed the public journal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/blog" target="_blank" />} nativeButton={false} variant="outline"><ExternalLink className="mr-2 size-4" /> Public journal</Button>
          <Button render={<Link href="/journal-editor" />} nativeButton={false}><BookOpen className="mr-2 size-4" /> Open editor</Button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Ready for review</h2>
        <p className="mt-1 text-xs text-muted-foreground">Release creates a reviewed journal draft; it does not deploy application source code.</p>
        <div className="mt-4 divide-y divide-border">
          {items.filter((item) => item.status === 'ready_for_review').length === 0 && <p className="py-6 text-sm text-muted-foreground">Nothing is waiting for review.</p>}
          {items.filter((item) => item.status === 'ready_for_review').map((item) => (
            <article key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">Submitted by {item.submitted_by} · {new Date(item.submitted_at).toLocaleString()}</p>
              </div>
              <Button className="shrink-0" onClick={() => void release(item)} disabled={publishing === item.id}>
                <CheckCircle2 className="mr-2 size-4" /> {publishing === item.id ? 'Releasing…' : 'Release & write post'}
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2"><History className="size-4 text-primary" /><h2 className="font-semibold">Journal activity</h2></div>
        <div className="mt-4 divide-y divide-border">
          {events.length === 0 && <p className="py-6 text-sm text-muted-foreground">No recorded edits yet.</p>}
          {events.map((event, index) => (
            <div key={event.id ?? index} className="py-3">
              <p className="text-sm font-medium">{event.details || event.action || 'Journal update'}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {event.actor_email || 'Team member'}{event.created_at ? ` · ${new Date(event.created_at).toLocaleString()}` : ''}
              </p>
            </div>
          ))}
        </div>
      </section>
      {status && <p className="text-right text-xs text-destructive">{status}</p>}
    </div>
  )
}
