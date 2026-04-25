import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()

  const runs = await prisma.payrollRun.findMany({
    where: { tenantId: session.user.tenantId, year },
    include: { _count: { select: { entries: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  return NextResponse.json(runs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const existing = await prisma.payrollRun.findUnique({
    where: { tenantId_month_year: { tenantId, month: parsed.data.month, year: parsed.data.year } },
  })
  if (existing) return NextResponse.json({ error: 'Payroll run already exists for this period' }, { status: 409 })

  const run = await prisma.payrollRun.create({
    data: { tenantId, ...parsed.data, createdBy: session.user.id },
  })

  return NextResponse.json(run, { status: 201 })
}
