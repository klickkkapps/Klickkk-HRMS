import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'
import AttendanceClient from './attendance-client'
import { format } from 'date-fns'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; employeeId?: string }>
}) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const sp = await searchParams

  const now = new Date()
  const month = sp.month ? Number(sp.month) : now.getMonth() + 1
  const year = sp.year ? Number(sp.year) : now.getFullYear()

  const canManage = hasPermission(session.user.permissions, 'attendance', 'write')

  // Find linked employee
  const linkedEmployee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true, firstName: true, lastName: true },
  })

  const targetEmployeeId = sp.employeeId ?? linkedEmployee?.id

  // Today's record for clock-in/out widget
  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayRecord = linkedEmployee
    ? await prisma.attendanceRecord.findUnique({
        where: { employeeId_date: { employeeId: linkedEmployee.id, date: todayStr } },
      })
    : null

  // Monthly records
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  const records = targetEmployeeId
    ? await prisma.attendanceRecord.findMany({
        where: { tenantId, employeeId: targetEmployeeId, date: { gte: monthStart, lte: monthEnd } },
        orderBy: { date: 'asc' },
      })
    : []

  // For HR/Managers: team summary
  const teamSummary = canManage
    ? await prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { tenantId, date: todayStr },
        _count: true,
      })
    : []

  // Active employees (for selector)
  const employees = canManage
    ? await prisma.employee.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
        orderBy: { firstName: 'asc' },
      })
    : []

  // Compute monthly stats
  const presentCount = records.filter((r) => ['PRESENT', 'WORK_FROM_HOME', 'LATE'].includes(r.status)).length
  const absentCount = records.filter((r) => r.status === 'ABSENT').length
  const halfDayCount = records.filter((r) => r.status === 'HALF_DAY').length
  const onLeaveCount = records.filter((r) => r.status === 'ON_LEAVE').length

  const serialized = {
    month,
    year,
    employee: linkedEmployee ? { id: linkedEmployee.id, name: `${linkedEmployee.firstName} ${linkedEmployee.lastName}` } : null,
    targetEmployeeId: targetEmployeeId ?? null,
    canManage,
    employees: employees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
    todayRecord: todayRecord
      ? {
          id: todayRecord.id,
          status: todayRecord.status,
          checkIn: todayRecord.checkIn ? format(todayRecord.checkIn, 'hh:mm a') : null,
          checkOut: todayRecord.checkOut ? format(todayRecord.checkOut, 'hh:mm a') : null,
          hoursWorked: todayRecord.hoursWorked,
        }
      : null,
    records: records.map((r) => ({
      id: r.id,
      date: format(r.date, 'dd'),
      dayName: format(r.date, 'EEE'),
      fullDate: format(r.date, 'dd MMM'),
      status: r.status,
      checkIn: r.checkIn ? format(r.checkIn, 'hh:mm a') : null,
      checkOut: r.checkOut ? format(r.checkOut, 'hh:mm a') : null,
      hoursWorked: r.hoursWorked,
      notes: r.notes,
    })),
    stats: { presentCount, absentCount, halfDayCount, onLeaveCount },
    teamSummary: teamSummary.map((t) => ({ status: t.status, count: t._count })),
    todayDate: format(now, 'EEEE, dd MMM yyyy'),
  }

  return <AttendanceClient data={serialized} />
}
