import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { getTenantCapacity } from '@/lib/capacity'
import { Users, UserCheck, UserX, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const [capacity, stats, recentEmployees] = await Promise.all([
    getTenantCapacity(tenantId),
    prisma.employee.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    }),
    prisma.employee.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { department: true, designation: true },
    }),
  ])

  const totalEmployees = stats.reduce((sum, s) => sum + s._count, 0)
  const activeCount    = stats.find((s) => s.status === 'ACTIVE')?._count    ?? 0
  const exitedCount    = stats.find((s) => s.status === 'EXITED')?._count    ?? 0
  const onNoticeCount  = stats.find((s) => s.status === 'ON_NOTICE')?._count ?? 0

  const capacityPct = capacity.totalCapacity > 0
    ? Math.round((capacity.usedSlots / capacity.totalCapacity) * 100)
    : 0

  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Good to see you, {firstName}</h1>
        <p className="text-slate-400 text-sm mt-0.5">Here&apos;s what&apos;s happening with your team today</p>
      </div>

      {/* Alerts */}
      {capacity.availableSlots <= 3 && capacity.availableSlots > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-amber-900 text-sm">Almost at capacity — </span>
            <span className="text-amber-700 text-sm">
              {capacity.availableSlots} slot{capacity.availableSlots !== 1 ? 's' : ''} remaining.{' '}
              <Link href={`/${slug}/billing`} className="underline font-medium">Buy extra slots</Link>
            </span>
          </div>
        </div>
      )}
      {capacity.availableSlots === 0 && (
        <div className="bg-red-50 border border-red-200/80 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-red-900 text-sm">Capacity exhausted — </span>
            <span className="text-red-700 text-sm">
              <Link href={`/${slug}/billing`} className="underline font-medium">Purchase additional slots</Link> to activate new employees.
            </span>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Employees" value={totalEmployees} suffix=""    color="blue"  />
        <StatCard icon={UserCheck} label="Active"          value={activeCount}    suffix=""    color="green" />
        <StatCard icon={TrendingUp}label="On Notice"       value={onNoticeCount}  suffix=""    color="amber" />
        <StatCard icon={UserX}     label="Exited"          value={exitedCount}    suffix=""    color="red"   />
      </div>

      {/* Capacity + Recent employees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Capacity card */}
        <div className="bg-white rounded-xl border border-border p-5 lg:col-span-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Employee Capacity</h3>
              <p className="text-xs text-slate-400 mt-0.5">{capacity.usedSlots} of {capacity.totalCapacity} slots used</p>
            </div>
            <Link
              href={`/${slug}/billing`}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight size={11} />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-end gap-3">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  capacityPct >= 90 ? 'bg-red-500' : capacityPct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(capacityPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{capacity.planLimit} in plan</span>
              {capacity.extraSlotsPurchased > 0 && <span>+{capacity.extraSlotsPurchased} extra</span>}
              <span className="text-slate-600 font-medium">{capacity.availableSlots} free</span>
            </div>
          </div>
        </div>

        {/* Recent employees */}
        <div className="bg-white rounded-xl border border-border lg:col-span-2">
          <div className="px-5 py-4 flex justify-between items-center border-b border-border">
            <h3 className="font-semibold text-slate-900 text-sm">Recent Employees</h3>
            <Link href={`/${slug}/employees`} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentEmployees.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Users size={28} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">
                  No employees yet.{' '}
                  <Link href={`/${slug}/employees/new`} className="text-blue-600 hover:underline font-medium">
                    Add your first
                  </Link>
                </p>
              </div>
            ) : (
              recentEmployees.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/${slug}/employees/${emp.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-semibold text-xs">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm">{emp.firstName} {emp.lastName}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {emp.designation?.name ?? '—'} · {emp.department?.name ?? '—'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    emp.status === 'ACTIVE'    ? 'bg-green-100 text-green-700' :
                    emp.status === 'ON_NOTICE' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {emp.status.replace('_', ' ')}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  suffix: string
  color: 'blue' | 'green' | 'amber' | 'red'
}) {
  const styles = {
    blue:  { bg: 'bg-blue-50',   text: 'text-blue-600',  border: 'border-blue-100' },
    green: { bg: 'bg-green-50',  text: 'text-green-600', border: 'border-green-100' },
    amber: { bg: 'bg-amber-50',  text: 'text-amber-600', border: 'border-amber-100' },
    red:   { bg: 'bg-red-50',    text: 'text-red-600',   border: 'border-red-100' },
  }
  const s = styles[color]

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 leading-none">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${s.bg} ${s.border}`}>
          <Icon size={16} className={s.text} />
        </div>
      </div>
    </div>
  )
}
