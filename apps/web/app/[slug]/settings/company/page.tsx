import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { CompanySettingsForm } from '@/components/settings/company-settings-form'

export const metadata = { title: 'Company Settings' }

export default async function CompanySettingsPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Company Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your organisation details</p>
      </div>
      <CompanySettingsForm tenant={tenant} />
    </div>
  )
}
