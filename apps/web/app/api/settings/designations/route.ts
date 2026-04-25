import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1), level: z.number().optional() })

export async function GET() {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const designations = await prisma.designation.findMany({
    where: { tenantId: session.user.tenantId },
    include: { _count: { select: { employees: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(designations)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const existing = await prisma.designation.findUnique({
    where: { tenantId_name: { tenantId: session.user.tenantId, name: parsed.data.name } },
  })
  if (existing) return NextResponse.json({ error: 'Designation already exists' }, { status: 409 })

  const desig = await prisma.designation.create({
    data: { tenantId: session.user.tenantId, ...parsed.data },
    include: { _count: { select: { employees: true } } },
  })
  return NextResponse.json(desig, { status: 201 })
}
