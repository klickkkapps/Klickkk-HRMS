import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  isOptional: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = req.nextUrl.searchParams.get('year') ? Number(req.nextUrl.searchParams.get('year')) : new Date().getFullYear()

  const holidays = await prisma.holiday.findMany({
    where: {
      tenantId: session.user.tenantId,
      date: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) },
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(holidays)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const date = new Date(parsed.data.date)

  const existing = await prisma.holiday.findUnique({
    where: { tenantId_date: { tenantId, date } },
  })
  if (existing) return NextResponse.json({ error: 'Holiday already exists for this date' }, { status: 409 })

  const holiday = await prisma.holiday.create({
    data: { tenantId, name: parsed.data.name, date, isOptional: parsed.data.isOptional },
  })

  return NextResponse.json(holiday, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.holiday.deleteMany({ where: { id, tenantId: session.user.tenantId } })
  return new NextResponse(null, { status: 204 })
}
