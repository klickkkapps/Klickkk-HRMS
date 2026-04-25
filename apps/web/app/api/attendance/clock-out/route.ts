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

  if (!existing?.checkIn) {
    return NextResponse.json({ error: 'Not clocked in today' }, { status: 400 })
  }
  if (existing.checkOut) {
    return NextResponse.json({ error: 'Already clocked out today' }, { status: 409 })
  }

  const hoursWorked = Math.round(((now.getTime() - existing.checkIn.getTime()) / 3_600_000) * 100) / 100

  const record = await prisma.attendanceRecord.update({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
    data: { checkOut: now, hoursWorked },
  })

  return NextResponse.json(record)
}
