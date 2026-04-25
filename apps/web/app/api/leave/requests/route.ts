import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { differenceInBusinessDays, addDays } from 'date-fns'

const createSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
  employeeId: z.string().optional(), // HR Admin can submit on behalf
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const employeeId = searchParams.get('employeeId')
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()

  const where: Record<string, unknown> = {
    tenantId,
    startDate: {
      gte: new Date(`${year}-01-01`),
      lte: new Date(`${year}-12-31`),
    },
  }
  if (status) where.status = status
  if (employeeId) where.employeeId = employeeId

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
      leaveType: { select: { id: true, name: true, code: true } },
      reviewer: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Find the employee linked to this user (or use provided employeeId for HR Admin)
  let employeeId = parsed.data.employeeId
  if (!employeeId) {
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id, tenantId },
    })
    if (!employee) return NextResponse.json({ error: 'No employee profile found' }, { status: 404 })
    employeeId = employee.id
  }

  const startDate = new Date(parsed.data.startDate)
  const endDate = new Date(parsed.data.endDate)

  if (endDate < startDate) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
  }

  // Calculate working days (excluding weekends; TODO: also exclude holidays)
  const days = Math.max(1, differenceInBusinessDays(addDays(endDate, 1), startDate))

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: parsed.data.leaveTypeId, tenantId },
  })
  if (!leaveType) return NextResponse.json({ error: 'Leave type not found' }, { status: 404 })

  // Check overlapping approved/pending requests
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        { startDate: { lte: endDate }, endDate: { gte: startDate } },
      ],
    },
  })
  if (overlap) return NextResponse.json({ error: 'Overlapping leave request exists' }, { status: 409 })

  // Check/upsert balance
  const currentYear = new Date().getFullYear()
  let balance = await prisma.leaveBalance.findUnique({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: leaveType.id, year: currentYear } },
  })
  if (!balance) {
    balance = await prisma.leaveBalance.create({
      data: {
        tenantId,
        employeeId,
        leaveTypeId: leaveType.id,
        year: currentYear,
        allocated: leaveType.daysAllowed,
      },
    })
  }

  const available = balance.allocated + balance.carriedForward - balance.used - balance.pending
  if (leaveType.isPaidLeave && available < days) {
    return NextResponse.json(
      { error: `Insufficient leave balance. Available: ${available.toFixed(1)} days` },
      { status: 400 }
    )
  }

  const [request] = await prisma.$transaction([
    prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        days,
        reason: parsed.data.reason,
        status: leaveType.requiresApproval ? 'PENDING' : 'APPROVED',
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        leaveType: { select: { name: true, code: true } },
      },
    }),
    prisma.leaveBalance.update({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: leaveType.id, year: currentYear } },
      data: leaveType.requiresApproval ? { pending: { increment: days } } : { used: { increment: days } },
    }),
  ])

  return NextResponse.json(request, { status: 201 })
}
