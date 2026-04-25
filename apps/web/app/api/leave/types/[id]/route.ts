import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  daysAllowed: z.number().int().min(1).optional(),
  isCarryForward: z.boolean().optional(),
  maxCarryForward: z.number().int().min(0).optional(),
  isPaidLeave: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const leaveType = await prisma.leaveType.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!leaveType) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.leaveType.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const leaveType = await prisma.leaveType.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!leaveType) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.leaveType.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
