import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({ name: z.string().min(1) })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const dept = await prisma.department.findFirst({ where: { id, tenantId: session.user.tenantId } })
  if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.department.update({ where: { id }, data: { name: parsed.data.name } })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const dept = await prisma.department.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { _count: { select: { employees: true } } },
  })
  if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (dept._count.employees > 0) {
    return NextResponse.json({ error: `Cannot delete — ${dept._count.employees} employee(s) assigned to this department` }, { status: 400 })
  }

  await prisma.department.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
