import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'
import LeaveClient from './leave-client'
import { format } from 'date-fns'

export default async function LeavePage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const canApprove = hasPermission(session.user.permissions, 'leave', 'approve')

  // Find linked employee
  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true, firstName: true, lastName: true },
  })

  // Leave types
  const leaveTypes = await prisma.leaveType.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })

  const currentYear = new Date().getFullYear()

  // My requests
  const myRequests = employee
    ? await prisma.leaveRequest.findMany({
        where: {
          employeeId: employee.id,
          startDate: { gte: new Date(`${currentYear}-01-01`) },
        },
        include: { leaveType: { select: { name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  // My balances
  const rawBalances = employee
    ? await prisma.leaveBalance.findMany({
        where: { employeeId: employee.id, year: currentYear },
        include: { leaveType: true },
      })
    : []

  const balances = leaveTypes.map((lt) => {
    const b = rawBalances.find((b) => b.leaveTypeId === lt.id)
    return {
      leaveTypeId: lt.id,
      leaveTypeName: lt.name,
      leaveTypeCode: lt.code,
      isPaidLeave: lt.isPaidLeave,
      allocated: b?.allocated ?? lt.daysAllowed,
      used: b?.used ?? 0,
      pending: b?.pending ?? 0,
      carriedForward: b?.carriedForward ?? 0,
      available:
        (b?.allocated ?? lt.daysAllowed) + (b?.carriedForward ?? 0) - (b?.used ?? 0) - (b?.pending ?? 0),
    }
  })

  // Team requests (pending) for approvers
  const teamRequests = canApprove
    ? await prisma.leaveRequest.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          startDate: { gte: new Date(`${currentYear}-01-01`) },
        },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } },
          },
          leaveType: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
    : []

  const serialized = {
    employee: employee ? { id: employee.id, name: `${employee.firstName} ${employee.lastName}` } : null,
    leaveTypes: leaveTypes.map((lt) => ({
      id: lt.id,
      name: lt.name,
      code: lt.code,
      category: lt.category,
      daysAllowed: lt.daysAllowed,
      requiresApproval: lt.requiresApproval,
      isPaidLeave: lt.isPaidLeave,
    })),
    balances,
    myRequests: myRequests.map((r) => ({
      id: r.id,
      leaveTypeName: r.leaveType.name,
      leaveTypeCode: r.leaveType.code,
      startDate: format(r.startDate, 'dd MMM yyyy'),
      endDate: format(r.endDate, 'dd MMM yyyy'),
      days: r.days,
      status: r.status,
      reason: r.reason,
      createdAt: format(r.createdAt, 'dd MMM yyyy'),
    })),
    teamRequests: teamRequests.map((r) => ({
      id: r.id,
      employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
      employeeCode: r.employee.employeeCode,
      department: r.employee.department?.name ?? '—',
      leaveTypeName: r.leaveType.name,
      leaveTypeCode: r.leaveType.code,
      startDate: format(r.startDate, 'dd MMM yyyy'),
      endDate: format(r.endDate, 'dd MMM yyyy'),
      days: r.days,
      reason: r.reason,
      createdAt: format(r.createdAt, 'dd MMM yyyy'),
    })),
    canApprove,
  }

  return <LeaveClient data={serialized} />
}
