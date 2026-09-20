import type { ReactNode } from "react"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminGuard } from '@/components/admin/admin-guard'

export const metadata = {
  title: "Admin — Vurenn",
  description: "Vurenn administration dashboard",
  robots: { index: false, follow: false },
}

/**
 * Admin layout wraps all /admin/* routes with the sidebar nav.
 *
 * AdminGuard verifies the signed-in user against the backend's CEO-only
 * administrator allowlist before rendering any admin content.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard><div className="flex h-screen overflow-hidden bg-background">
      <AdminNav />
      <main className="flex flex-1 flex-col overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div></AdminGuard>
  )
}
