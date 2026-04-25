import { requirePermission } from '@/lib/session'
import { prisma } from '@klickkk/db'
import PayrollClient from './payroll-client'

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ runId?: string; year?: string }>
}) {
  const session = await requirePermission('payroll', 'read')
  const tenantId = session.user.tenantId!
  const sp = await searchParams

  const year = sp.year ? Number(sp.year) : new Date().getFullYear()
  const canWrite =
    session.user.permissions.includes('*') ||
    session.user.permissions.includes('payroll:write') ||
    session.user.permissions.includes('payroll:run')

  const runs = await prisma.payrollRun.findMany({
    where: { tenantId, year },
    include: { _count: { select: { entries: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  const runId = sp.runId ?? (runs[0]?.id ?? null)

  let selectedRun: {
    id: string
    month: number
    year: number
    status: string
    processedAt: string | null
    entries: {
      id: string
      employeeId: string
      employeeName: string
      employeeCode: string
      department: string
      basic: number
      hra: number
      specialAllowance: number
      grossEarnings: number
      pf: number
      esic: number
      tds: number
      totalDeductions: number
      netPay: number
      workingDays: number
      paidDays: number
      lopDays: number
    }[]
  } | null = null

  if (runId) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
      include: {
        entries: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                department: { select: { name: true } },
              },
            },
          },
          orderBy: { employee: { firstName: 'asc' } },
        },
      },
    })

    if (run) {
      selectedRun = {
        id: run.id,
        month: run.month,
        year: run.year,
        status: run.status,
        processedAt: run.processedAt ? run.processedAt.toISOString() : null,
        entries: run.entries.map((e) => ({
          id: e.id,
          employeeId: e.employeeId,
          employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
          employeeCode: e.employee.employeeCode,
          department: e.employee.department?.name ?? '—',
          basic: e.basic,
          hra: e.hra,
          specialAllowance: e.specialAllowance,
          grossEarnings: e.grossEarnings,
          pf: e.pf,
          esic: e.esic,
          tds: e.tds,
          totalDeductions: e.totalDeductions,
          netPay: e.netPay,
          workingDays: e.workingDays,
          paidDays: e.paidDays,
          lopDays: e.lopDays,
        })),
      }
    }
  }

  const employeesWithSalary = await prisma.employee.count({
    where: { tenantId, status: 'ACTIVE', salaryStructure: { isNot: null } },
  })

  return (
    <PayrollClient
      data={{
        year,
        runs: runs.map((r) => ({
          id: r.id,
          month: r.month,
          year: r.year,
          status: r.status,
          entryCount: r._count.entries,
          processedAt: r.processedAt?.toISOString() ?? null,
        })),
        selectedRun,
        canWrite,
        employeesWithSalary,
      }}
    />
  )
}
