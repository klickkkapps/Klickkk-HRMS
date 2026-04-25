import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  reviewComment: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tenantId = session.user.tenantId
  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const request = await prisma.leaveRequest.findFirst({
    where: { id, tenantId },
    include: { leaveType: true },
  })
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only pending requests can be reviewed' }, { status: 400 })
  }

  // Find reviewer's employee record
  const reviewerEmployee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
  })

  const currentYear = new Date().getFullYear()
  const { status, reviewComment } = parsed.data

  // Update leave balance based on decision
  const balanceUpdate =
    status === 'APPROVED'
      ? { pending: { decrement: request.days }, used: { increment: request.days } }
      : { pending: { decrement: request.days } }

  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewerEmployee?.id ?? null,
        reviewedAt: new Date(),
        reviewComment,
      },
    }),
    prisma.leaveBalance.updateMany({
      where: {
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year: currentYear,
      },
      data: balanceUpdate,
    }),
  ])

  return NextResponse.json({ success: true })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const request = await prisma.leaveRequest.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
      leaveType: true,
      reviewer: { select: { id: true, firstName: true, lastName: true } },
    },
  })
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(request)
}
