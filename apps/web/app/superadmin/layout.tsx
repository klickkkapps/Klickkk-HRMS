import { SessionProvider } from 'next-auth/react'
import { AdminNav } from '@/components/superadmin/admin-nav'

export const dynamic = 'force-dynamic'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="bg-slate-950 text-slate-100 min-h-screen">
        <AdminNav />
        <main className="p-6">{children}</main>
      </div>
    </SessionProvider>
  )
}
