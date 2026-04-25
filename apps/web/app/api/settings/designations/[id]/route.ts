import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({ name: z.string().min(1), level: z.number().optional() })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const desig = await prisma.designation.findFirst({ where: { id, tenantId: session.user.tenantId } })
  if (!desig) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.designation.update({ where: { id }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const desig = await prisma.designation.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { _count: { select: { employees: true } } },
  })
  if (!desig) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (desig._count.employees > 0) {
    return NextResponse.json({ error: `Cannot delete — ${desig._count.employees} employee(s) have this designation` }, { status: 400 })
  }

  await prisma.designation.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
