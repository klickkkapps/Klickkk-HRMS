import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { redirect } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await requireAuth()

  if (!session.user.tenantId) {
    redirect('/onboarding')
  }

  if (session.user.tenantSlug && slug !== session.user.tenantSlug) {
    redirect(`/${session.user.tenantSlug}/`)
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { name: true, logoUrl: true, status: true, slug: true },
  })

  if (!tenant || tenant.status === 'CANCELLED') {
    redirect('/login?error=tenant-suspended')
  }

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50/80">
        <Sidebar tenantName={tenant.name} slug={tenant.slug} />
        <div className="flex-1 flex flex-col ml-60 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-5">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
