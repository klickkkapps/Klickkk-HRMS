import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10).toUpperCase(),
  category: z.enum(['CASUAL', 'SICK', 'PRIVILEGE', 'MATERNITY', 'PATERNITY', 'COMPENSATORY', 'UNPAID', 'OTHER']),
  daysAllowed: z.number().int().min(1),
  isCarryForward: z.boolean().default(false),
  maxCarryForward: z.number().int().min(0).default(0),
  isPaidLeave: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
})

export async function GET() {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const types = await prisma.leaveType.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(types)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const existing = await prisma.leaveType.findUnique({
    where: { tenantId_code: { tenantId, code: parsed.data.code } },
  })
  if (existing) return NextResponse.json({ error: 'Leave type code already exists' }, { status: 409 })

  const leaveType = await prisma.leaveType.create({
    data: { tenantId, ...parsed.data },
  })

  return NextResponse.json(leaveType, { status: 201 })
}
