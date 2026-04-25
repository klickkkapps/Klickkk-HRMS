import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'

// Working days in a month (excluding weekends)
function getWorkingDays(year: number, month: number): number {
  let count = 0
  const date = new Date(year, month - 1, 1)
  while (date.getMonth() === month - 1) {
    const day = date.getDay()
    if (day !== 0 && day !== 6) count++
    date.setDate(date.getDate() + 1)
  }
  return count
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tenantId = session.user.tenantId

  const run = await prisma.payrollRun.findFirst({ where: { id, tenantId } })
  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (run.status !== 'DRAFT') return NextResponse.json({ error: 'Only DRAFT runs can be processed' }, { status: 400 })

  // Update to processing
  await prisma.payrollRun.update({ where: { id }, data: { status: 'PROCESSING' } })

  const workingDays = getWorkingDays(run.year, run.month)
  const monthStart = new Date(run.year, run.month - 1, 1)
  const monthEnd = new Date(run.year, run.month, 0)

  // Get all active employees with salary structures
  const employees = await prisma.employee.findMany({
    where: { tenantId, status: 'ACTIVE', salaryStructure: { isNot: null } },
    include: { salaryStructure: true },
  })

  if (employees.length === 0) {
    await prisma.payrollRun.update({ where: { id }, data: { status: 'DRAFT' } })
    return NextResponse.json({ error: 'No active employees with salary structures found' }, { status: 400 })
  }

  const entries = []

  for (const emp of employees) {
    const ss = emp.salaryStructure!

    // Count approved leaves in this month (LOP for unpaid, handled below)
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: emp.id,
        status: 'APPROVED',
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      include: { leaveType: true },
    })

    const unpaidLeaveDays = leaves
      .filter((l) => !l.leaveType.isPaidLeave)
      .reduce((sum, l) => sum + l.days, 0)

    // Count attendance absences not covered by leaves
    const absences = await prisma.attendanceRecord.count({
      where: {
        employeeId: emp.id,
        date: { gte: monthStart, lte: monthEnd },
        status: 'ABSENT',
      },
    })

    const lopDays = Math.min(unpaidLeaveDays + absences, workingDays)
    const paidDays = workingDays - lopDays
    const ratio = paidDays / workingDays

    // Monthly salary components (annual / 12, prorated)
    const monthlyBasic = Math.round(ss.basic / 12)
    const monthlyHra = Math.round(ss.hra / 12)
    const monthlySpecial = Math.round(ss.specialAllowance / 12)
    const monthlyPf = Math.round(ss.pf / 12)
    const monthlyEsic = Math.round(ss.esic / 12)
    const monthlyTds = Math.round(ss.tds / 12)

    const basic = Math.round(monthlyBasic * ratio)
    const hra = Math.round(monthlyHra * ratio)
    const specialAllowance = Math.round(monthlySpecial * ratio)
    const grossEarnings = basic + hra + specialAllowance

    const pf = Math.round(monthlyPf * ratio)
    const esic = Math.round(monthlyEsic * ratio)
    const tds = Math.round(monthlyTds * ratio)
    const totalDeductions = pf + esic + tds

    const netPay = grossEarnings - totalDeductions

    entries.push({
      payrollRunId: id,
      tenantId,
      employeeId: emp.id,
      basic,
      hra,
      specialAllowance,
      grossEarnings,
      pf,
      esic,
      tds,
      totalDeductions,
      netPay: Math.max(0, netPay),
      workingDays,
      paidDays,
      lopDays,
    })
  }

  // Delete previous entries and recreate
  await prisma.$transaction([
    prisma.payrollEntry.deleteMany({ where: { payrollRunId: id } }),
    prisma.payrollEntry.createMany({ data: entries }),
    prisma.payrollRun.update({
      where: { id },
      data: { status: 'COMPLETED', processedAt: new Date() },
    }),
  ])

  return NextResponse.json({ processed: entries.length })
}
