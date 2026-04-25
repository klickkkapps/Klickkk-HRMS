import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const { searchParams } = req.nextUrl
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()
  const employeeId = searchParams.get('employeeId')

  // Determine which employee to fetch for
  let resolvedEmployeeId = employeeId
  if (!resolvedEmployeeId) {
    const emp = await prisma.employee.findFirst({ where: { userId: session.user.id, tenantId } })
    resolvedEmployeeId = emp?.id ?? null
  }
  if (!resolvedEmployeeId) return NextResponse.json([])

  // Get all leave types for tenant
  const leaveTypes = await prisma.leaveType.findMany({ where: { tenantId } })

  // Get existing balances
  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId: resolvedEmployeeId, year },
    include: { leaveType: true },
  })

  // Merge — if no balance record, show zeros
  const result = leaveTypes.map((lt) => {
    const b = balances.find((b) => b.leaveTypeId === lt.id)
    return {
      leaveTypeId: lt.id,
      leaveTypeName: lt.name,
      leaveTypeCode: lt.code,
      isPaidLeave: lt.isPaidLeave,
      allocated: b?.allocated ?? lt.daysAllowed,
      used: b?.used ?? 0,
      pending: b?.pending ?? 0,
      carriedForward: b?.carriedForward ?? 0,
      available: (b?.allocated ?? lt.daysAllowed) + (b?.carriedForward ?? 0) - (b?.used ?? 0) - (b?.pending ?? 0),
    }
  })

  return NextResponse.json(result)
}
