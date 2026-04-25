import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { OrgListPage } from '@/components/settings/org-list-page'

export const metadata = { title: 'Designations' }

export default async function DesignationsPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const designations = await prisma.designation.findMany({
    where: { tenantId },
    include: { _count: { select: { employees: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <OrgListPage
      title="Designations"
      description="Manage job titles and designations for your organization"
      items={designations.map((d) => ({ id: d.id, name: d.name, employeeCount: d._count.employees }))}
      apiPath="/api/settings/designations"
      placeholder="e.g. Senior Software Engineer"
      icon="designation"
    />
  )
}
