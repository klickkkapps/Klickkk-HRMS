import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { OrgListPage } from '@/components/settings/org-list-page'

export const metadata = { title: 'Locations' }

export default async function LocationsPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const locations = await prisma.location.findMany({
    where: { tenantId },
    include: { _count: { select: { employees: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <OrgListPage
      title="Office Locations"
      description="Manage office locations and work sites"
      items={locations.map((l) => ({
        id: l.id,
        name: l.name,
        employeeCount: l._count.employees,
        extra: l.city ? (l.state ? `${l.city}, ${l.state}` : l.city) : undefined,
      }))}
      apiPath="/api/settings/locations"
      placeholder="e.g. Bangalore HQ"
      icon="location"
    />
  )
}
