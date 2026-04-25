import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const upsertSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND', 'LATE', 'WORK_FROM_HOME']),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const { searchParams } = req.nextUrl
  const employeeId = searchParams.get('employeeId')
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : new Date().getMonth() + 1
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()

  const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`)
  const endDate = new Date(year, month, 0) // last day of month

  const where: Record<string, unknown> = {
    tenantId,
    date: { gte: startDate, lte: endDate },
  }
  if (employeeId) where.employeeId = employeeId

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
    },
    orderBy: [{ date: 'asc' }],
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const body = await req.json()
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const date = new Date(parsed.data.date)
  const checkIn = parsed.data.checkIn ? new Date(parsed.data.checkIn) : null
  const checkOut = parsed.data.checkOut ? new Date(parsed.data.checkOut) : null

  let hoursWorked: number | null = null
  if (checkIn && checkOut) {
    hoursWorked = Math.round(((checkOut.getTime() - checkIn.getTime()) / 3_600_000) * 100) / 100
  }

  const record = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId: parsed.data.employeeId, date } },
    update: { status: parsed.data.status, checkIn, checkOut, hoursWorked, notes: parsed.data.notes },
    create: {
      tenantId,
      employeeId: parsed.data.employeeId,
      date,
      status: parsed.data.status,
      checkIn,
      checkOut,
      hoursWorked,
      notes: parsed.data.notes,
    },
  })

  return NextResponse.json(record)
}
