'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CalendarDays, CheckCircle2, XCircle, Clock, Plus, ChevronDown, ChevronUp,
} from 'lucide-react'

interface LeaveType {
  id: string
  name: string
  code: string
  category: string
  daysAllowed: number
  requiresApproval: boolean
  isPaidLeave: boolean
}

interface Balance {
  leaveTypeId: string
  leaveTypeName: string
  leaveTypeCode: string
  isPaidLeave: boolean
  allocated: number
  used: number
  pending: number
  carriedForward: number
  available: number
}

interface MyRequest {
  id: string
  leaveTypeName: string
  leaveTypeCode: string
  startDate: string
  endDate: string
  days: number
  status: string
  reason: string | null
  createdAt: string
}

interface TeamRequest {
  id: string
  employeeName: string
  employeeCode: string
  department: string
  leaveTypeName: string
  leaveTypeCode: string
  startDate: string
  endDate: string
  days: number
  reason: string | null
  createdAt: string
}

interface Props {
  data: {
    employee: { id: string; name: string } | null
    leaveTypes: LeaveType[]
    balances: Balance[]
    myRequests: MyRequest[]
    teamRequests: TeamRequest[]
    canApprove: boolean
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
}

export default function LeaveClient({ data }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'my' | 'apply' | 'team'>('my')
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Apply form state
  const [form, setForm] = useState({
    leaveTypeId: data.leaveTypes[0]?.id ?? '',
    startDate: '',
    endDate: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!form.startDate || !form.endDate) return toast.error('Please select dates')
    setSubmitting(true)
    try {
      const res = await fetch('/api/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to apply')
      toast.success('Leave request submitted')
      setForm({ ...form, startDate: '', endDate: '', reason: '' })
      startTransition(() => router.refresh())
      setTab('my')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReview(requestId: string, status: 'APPROVED' | 'REJECTED', comment?: string) {
    try {
      const res = await fetch(`/api/leave/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewComment: comment }),
      })
      if (!res.ok) throw new Error('Action failed')
      toast.success(status === 'APPROVED' ? 'Leave approved' : 'Leave rejected')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Action failed')
    }
  }

  async function handleCancel(requestId: string) {
    try {
      const res = await fetch(`/api/leave/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Leave request cancelled')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Action failed')
    }
  }

  const tabs = [
    { key: 'my', label: 'My Leaves' },
    { key: 'apply', label: 'Apply Leave' },
    ...(data.canApprove ? [{ key: 'team', label: `Pending Approvals${data.teamRequests.length > 0 ? ` (${data.teamRequests.length})` : ''}` }] : []),
  ] as { key: 'my' | 'apply' | 'team'; label: string }[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {data.employee ? `Logged in as ${data.employee.name}` : 'Manage leave requests and approvals'}
        </p>
      </div>

      {/* Balance Cards */}
      {data.balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.balances.map((b) => (
            <div key={b.leaveTypeId} className="bg-white border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{b.leaveTypeCode}</span>
                {!b.isPaidLeave && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Unpaid</span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{b.available.toFixed(1)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{b.leaveTypeName}</p>
              <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                <div className="flex justify-between"><span>Allocated</span><span>{b.allocated}</span></div>
                {b.carriedForward > 0 && <div className="flex justify-between"><span>Carried fwd</span><span>+{b.carriedForward}</span></div>}
                <div className="flex justify-between"><span>Used</span><span>{b.used}</span></div>
                {b.pending > 0 && <div className="flex justify-between text-amber-600"><span>Pending</span><span>{b.pending}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* My Leaves Tab */}
      {tab === 'my' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {data.myRequests.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">No leave requests this year.</p>
              <button
                onClick={() => setTab('apply')}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <Plus size={14} /> Apply for leave
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Dates</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Days</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Applied</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.myRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{r.leaveTypeName}</span>
                      <span className="ml-1.5 text-xs text-slate-400">{r.leaveTypeCode}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.startDate} – {r.endDate}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.days}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.createdAt}</td>
                    <td className="px-4 py-3">
                      {r.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Apply Leave Tab */}
      {tab === 'apply' && (
        <div className="bg-white rounded-xl border border-border p-6 max-w-lg">
          {!data.employee ? (
            <p className="text-slate-500 text-sm">
              Your account is not linked to an employee profile. Please contact HR.
            </p>
          ) : data.leaveTypes.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No leave types configured. Please contact your HR Admin.
            </p>
          ) : (
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                <select
                  value={form.leaveTypeId}
                  onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {data.leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.code}) — {data.balances.find((b) => b.leaveTypeId === lt.id)?.available.toFixed(1) ?? lt.daysAllowed} days available
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Briefly describe the reason…"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit Leave Request'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Team Requests Tab (approvers only) */}
      {tab === 'team' && (
        <div className="space-y-3">
          {data.teamRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-green-300" />
              <p className="text-slate-500 text-sm">No pending leave requests. All caught up!</p>
            </div>
          ) : (
            data.teamRequests.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-semibold text-xs">
                          {r.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 text-sm">{r.employeeName}</span>
                        <span className="text-slate-400 text-xs ml-1.5">#{r.employeeCode}</span>
                        {r.department && (
                          <span className="text-slate-400 text-xs ml-1.5">· {r.department}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">{r.leaveTypeName}</span>
                      <span>·</span>
                      <span>{r.startDate} – {r.endDate}</span>
                      <span>·</span>
                      <span className="font-medium">{r.days} day{r.days !== 1 ? 's' : ''}</span>
                    </div>

                    {r.reason && (
                      <p className="mt-1 text-xs text-slate-500 truncate">{r.reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReview(r.id, 'APPROVED')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 border border-green-200"
                    >
                      <CheckCircle2 size={13} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(r.id, 'REJECTED')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 border border-red-200"
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600"
                    >
                      {expandedId === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {expandedId === r.id && (
                  <RejectWithComment requestId={r.id} onReject={(id, comment) => handleReview(id, 'REJECTED', comment)} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function RejectWithComment({ requestId, onReject }: { requestId: string; onReject: (id: string, comment: string) => void }) {
  const [comment, setComment] = useState('')
  return (
    <div className="mt-4 pt-4 border-t border-border flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-xs text-slate-500 mb-1">Rejection reason (optional)</label>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter reason…"
          className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <button
        onClick={() => onReject(requestId, comment)}
        className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium"
      >
        Reject
      </button>
    </div>
  )
}
