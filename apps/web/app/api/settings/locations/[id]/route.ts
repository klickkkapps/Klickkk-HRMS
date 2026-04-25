import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  isRemote: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const loc = await prisma.location.findFirst({ where: { id, tenantId: session.user.tenantId } })
  if (!loc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.location.update({ where: { id }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const loc = await prisma.location.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { _count: { select: { employees: true } } },
  })
  if (!loc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (loc._count.employees > 0) {
    return NextResponse.json({ error: `Cannot delete — ${loc._count.employees} employee(s) assigned to this location` }, { status: 400 })
  }

  await prisma.location.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
