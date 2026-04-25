'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Clock, ChevronLeft, ChevronRight, LogIn, LogOut, Users } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700',
  WORK_FROM_HOME: 'bg-blue-100 text-blue-700',
  HALF_DAY: 'bg-amber-100 text-amber-700',
  LATE: 'bg-orange-100 text-orange-700',
  ABSENT: 'bg-red-100 text-red-700',
  ON_LEAVE: 'bg-purple-100 text-purple-700',
  HOLIDAY: 'bg-slate-100 text-slate-600',
  WEEKEND: 'bg-slate-50 text-slate-400',
}

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  WORK_FROM_HOME: 'WFH',
  HALF_DAY: 'Half Day',
  LATE: 'Late',
  ABSENT: 'Absent',
  ON_LEAVE: 'On Leave',
  HOLIDAY: 'Holiday',
  WEEKEND: 'Weekend',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props {
  data: {
    month: number
    year: number
    employee: { id: string; name: string } | null
    targetEmployeeId: string | null
    canManage: boolean
    employees: { id: string; name: string; code: string }[]
    todayRecord: {
      id: string
      status: string
      checkIn: string | null
      checkOut: string | null
      hoursWorked: number | null
    } | null
    records: {
      id: string
      date: string
      dayName: string
      fullDate: string
      status: string
      checkIn: string | null
      checkOut: string | null
      hoursWorked: number | null
      notes: string | null
    }[]
    stats: { presentCount: number; absentCount: number; halfDayCount: number; onLeaveCount: number }
    teamSummary: { status: string; count: number }[]
    todayDate: string
  }
}

export default function AttendanceClient({ data }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [clocking, setClocking] = useState<'in' | 'out' | null>(null)

  function navigate(month: number, year: number, employeeId?: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', String(month))
    params.set('year', String(year))
    if (employeeId) params.set('employeeId', employeeId)
    else params.delete('employeeId')
    startTransition(() => router.push(`?${params.toString()}`))
  }

  function prevMonth() {
    const m = data.month === 1 ? 12 : data.month - 1
    const y = data.month === 1 ? data.year - 1 : data.year
    navigate(m, y, data.targetEmployeeId)
  }

  function nextMonth() {
    const m = data.month === 12 ? 1 : data.month + 1
    const y = data.month === 12 ? data.year + 1 : data.year
    navigate(m, y, data.targetEmployeeId)
  }

  async function handleClockIn() {
    setClocking('in')
    try {
      const res = await fetch('/api/attendance/clock-in', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Clocked in successfully')
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to clock in')
    } finally {
      setClocking(null)
    }
  }

  async function handleClockOut() {
    setClocking('out')
    try {
      const res = await fetch('/api/attendance/clock-out', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Clocked out successfully')
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to clock out')
    } finally {
      setClocking(null)
    }
  }

  const { stats, todayRecord } = data
  const canClockIn = !todayRecord?.checkIn
  const canClockOut = !!todayRecord?.checkIn && !todayRecord?.checkOut

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-slate-500 text-sm mt-0.5">{data.todayDate}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Clock in/out + Today status */}
        <div className="space-y-4">
          {/* Clock widget (only for own employee) */}
          {data.employee && (
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-1">Today</h3>
              <p className="text-xs text-slate-500 mb-4">{data.employee.name}</p>

              {todayRecord && (
                <div className="mb-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[todayRecord.status] ?? ''}`}>
                      {STATUS_LABELS[todayRecord.status] ?? todayRecord.status}
                    </span>
                  </div>
                  {todayRecord.checkIn && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Clock In</span>
                      <span className="font-medium text-slate-900">{todayRecord.checkIn}</span>
                    </div>
                  )}
                  {todayRecord.checkOut && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Clock Out</span>
                      <span className="font-medium text-slate-900">{todayRecord.checkOut}</span>
                    </div>
                  )}
                  {todayRecord.hoursWorked && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hours</span>
                      <span className="font-medium text-slate-900">{todayRecord.hoursWorked.toFixed(2)}h</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleClockIn}
                  disabled={!canClockIn || clocking !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <LogIn size={14} />
                  {clocking === 'in' ? 'Clocking…' : 'Clock In'}
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={!canClockOut || clocking !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <LogOut size={14} />
                  {clocking === 'out' ? 'Clocking…' : 'Clock Out'}
                </button>
              </div>
            </div>
          )}

          {/* Monthly stats */}
          <div className="bg-white border border-border rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-3">
              {MONTHS[data.month - 1]} {data.year} Summary
            </h3>
            <div className="space-y-2 text-sm">
              <StatRow label="Present" value={stats.presentCount} color="text-green-600" />
              <StatRow label="Absent" value={stats.absentCount} color="text-red-600" />
              <StatRow label="Half Day" value={stats.halfDayCount} color="text-amber-600" />
              <StatRow label="On Leave" value={stats.onLeaveCount} color="text-purple-600" />
            </div>
          </div>

          {/* Team today (managers) */}
          {data.canManage && data.teamSummary.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} className="text-slate-400" />
                <h3 className="font-semibold text-slate-900 text-sm">Team Today</h3>
              </div>
              <div className="space-y-1.5 text-sm">
                {data.teamSummary.map((t) => (
                  <div key={t.status} className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                    <span className="font-medium text-slate-900">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Monthly calendar / table */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600">
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-3">
                {data.canManage && (
                  <select
                    value={data.targetEmployeeId ?? ''}
                    onChange={(e) => navigate(data.month, data.year, e.target.value || null)}
                    className="text-xs border border-border rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="">My Attendance</option>
                    {data.employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.code})
                      </option>
                    ))}
                  </select>
                )}
                <span className="font-semibold text-slate-900">
                  {MONTHS[data.month - 1]} {data.year}
                </span>
              </div>
              <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-slate-100 text-slate-600">
                <ChevronRight size={18} />
              </button>
            </div>

            {data.records.length === 0 ? (
              <div className="p-10 text-center">
                <Clock size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 text-sm">No attendance records for this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-500 w-24">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Clock In</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Clock Out</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.records.map((r) => (
                      <tr key={r.id} className={r.status === 'WEEKEND' ? 'bg-slate-50/50' : 'hover:bg-slate-50'}>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">{r.fullDate}</span>
                          <span className="text-slate-400 text-xs ml-1">({r.dayName})</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.checkIn ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{r.checkOut ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.hoursWorked != null ? `${r.hoursWorked.toFixed(2)}h` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )
}
