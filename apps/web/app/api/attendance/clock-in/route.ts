import { NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'

export async function POST() {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const employee = await prisma.employee.findFirst({ where: { userId: session.user.id, tenantId } })
  if (!employee) return NextResponse.json({ error: 'No employee profile found' }, { status: 404 })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  })

  if (existing?.checkIn) {
    return NextResponse.json({ error: 'Already clocked in today' }, { status: 409 })
  }

  const record = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
    update: { checkIn: now, status: 'PRESENT' },
    create: { tenantId, employeeId: employee.id, date: today, checkIn: now, status: 'PRESENT' },
  })

  return NextResponse.json(record)
}
