import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { OrgListPage } from '@/components/settings/org-list-page'

export const metadata = { title: 'Departments' }

export default async function DepartmentsPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const departments = await prisma.department.findMany({
    where: { tenantId },
    include: { _count: { select: { employees: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <OrgListPage
      title="Departments"
      description="Manage your company's department structure"
      items={departments.map((d) => ({ id: d.id, name: d.name, employeeCount: d._count.employees }))}
      apiPath="/api/settings/departments"
      placeholder="e.g. Engineering"
      icon="department"
    />
  )
}
