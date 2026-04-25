import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  isRemote: z.boolean().default(false),
})

export async function GET() {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locations = await prisma.location.findMany({
    where: { tenantId: session.user.tenantId },
    include: { _count: { select: { employees: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(locations)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const existing = await prisma.location.findUnique({
    where: { tenantId_name: { tenantId: session.user.tenantId, name: parsed.data.name } },
  })
  if (existing) return NextResponse.json({ error: 'Location already exists' }, { status: 409 })

  const loc = await prisma.location.create({
    data: { tenantId: session.user.tenantId, ...parsed.data },
    include: { _count: { select: { employees: true } } },
  })
  return NextResponse.json(loc, { status: 201 })
}
