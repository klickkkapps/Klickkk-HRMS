'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Banknote, Play, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PROCESSING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

function formatCurrency(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  )
}

interface RunSummary {
  id: string
  month: number
  year: number
  status: string
  entryCount: number
  processedAt: string | null
}

interface RunDetail {
  id: string
  month: number
  year: number
  status: string
  processedAt: string | null
  entries: {
    id: string
    employeeId: string
    employeeName: string
    employeeCode: string
    department: string
    basic: number
    hra: number
    specialAllowance: number
    grossEarnings: number
    pf: number
    esic: number
    tds: number
    totalDeductions: number
    netPay: number
    workingDays: number
    paidDays: number
    lopDays: number
  }[]
}

interface Props {
  data: {
    year: number
    runs: RunSummary[]
    selectedRun: RunDetail | null
    canWrite: boolean
    employeesWithSalary: number
  }
}

export default function PayrollClient({ data }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  const [creating, setCreating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  function selectRun(runId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('runId', runId)
    startTransition(() => router.push(`?${params.toString()}`))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create')
      toast.success('Payroll run created')
      setShowCreateModal(false)
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setCreating(false)
    }
  }

  async function handleProcess(runId: string) {
    if (!confirm('Run payroll for this period? This will compute salaries for all active employees with salary structures.')) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/payroll/runs/${runId}/process`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Processing failed')
      toast.success(`Payroll processed for ${json.processed} employees`)
      startTransition(() => router.refresh())
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  const { selectedRun } = data
  const totalNetPay = selectedRun?.entries.reduce((sum, e) => sum + e.netPay, 0) ?? 0
  const totalGross = selectedRun?.entries.reduce((sum, e) => sum + e.grossEarnings, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {data.employeesWithSalary} employee{data.employeesWithSalary !== 1 ? 's' : ''} with salary structures
          </p>
        </div>
        {data.canWrite && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
          >
            <Banknote size={15} />
            New Payroll Run
          </button>
        )}
      </div>

      {data.employeesWithSalary === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-amber-900 text-sm">No salary structures configured</div>
            <div className="text-amber-700 text-sm">
              Add salary structures to employee profiles to enable payroll processing.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Runs list */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-slate-900 text-sm">Payroll Runs — {data.year}</h3>
            </div>
            {data.runs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No runs yet. Create your first payroll run.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.runs.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => selectRun(r.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                      selectedRun?.id === r.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 text-sm">
                        {MONTHS[r.month - 1]} {r.year}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[r.status] ?? ''}`}>
                        {r.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {r.entryCount} employee{r.entryCount !== 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Run detail */}
        <div className="lg:col-span-3">
          {!selectedRun ? (
            <div className="bg-white border border-border rounded-xl p-10 text-center">
              <Banknote size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 text-sm">Select or create a payroll run to view details.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Run header */}
              <div className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {MONTH_NAMES[selectedRun.month - 1]} {selectedRun.year}
                    </h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedRun.status] ?? ''}`}>
                      {selectedRun.status}
                    </span>
                    {selectedRun.processedAt && (
                      <span className="text-xs text-slate-400 ml-2">
                        Processed {new Date(selectedRun.processedAt).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                  {data.canWrite && selectedRun.status === 'DRAFT' && (
                    <button
                      onClick={() => handleProcess(selectedRun.id)}
                      disabled={processing || data.employeesWithSalary === 0}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-40 font-medium"
                    >
                      <Play size={14} />
                      {processing ? 'Processing…' : 'Run Payroll'}
                    </button>
                  )}
                </div>

                {selectedRun.entries.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <SummaryBox label="Total Gross" value={formatCurrency(totalGross)} color="text-slate-900" />
                    <SummaryBox label="Total Deductions" value={formatCurrency(selectedRun.entries.reduce((s, e) => s + e.totalDeductions, 0))} color="text-red-600" />
                    <SummaryBox label="Total Net Pay" value={formatCurrency(totalNetPay)} color="text-green-700" />
                  </div>
                )}
              </div>

              {/* Entries table */}
              {selectedRun.entries.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-8 text-center">
                  <p className="text-slate-400 text-sm">
                    {selectedRun.status === 'DRAFT'
                      ? 'Click "Run Payroll" to process salaries for this period.'
                      : 'No entries found.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Employee</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Gross</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Deductions</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Net Pay</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Days</th>
                        <th className="px-4 py-3 w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedRun.entries.map((e) => (
                        <>
                          <tr key={e.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{e.employeeName}</div>
                              <div className="text-xs text-slate-400">#{e.employeeCode} · {e.department}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(e.grossEarnings)}</td>
                            <td className="px-4 py-3 text-right text-red-600">{formatCurrency(e.totalDeductions)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(e.netPay)}</td>
                            <td className="px-4 py-3 text-right text-slate-500 text-xs">
                              {e.paidDays}/{e.workingDays}
                              {e.lopDays > 0 && <span className="text-red-500 ml-1">(LOP: {e.lopDays})</span>}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setExpandedEntry(expandedEntry === e.id ? null : e.id)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                {expandedEntry === e.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </td>
                          </tr>
                          {expandedEntry === e.id && (
                            <tr key={`${e.id}-detail`} className="bg-slate-50">
                              <td colSpan={6} className="px-4 py-3">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <p className="font-medium text-slate-700 mb-1">Earnings</p>
                                    <div className="space-y-0.5 text-slate-600">
                                      <div className="flex justify-between"><span>Basic</span><span>{formatCurrency(e.basic)}</span></div>
                                      <div className="flex justify-between"><span>HRA</span><span>{formatCurrency(e.hra)}</span></div>
                                      <div className="flex justify-between"><span>Special Allowance</span><span>{formatCurrency(e.specialAllowance)}</span></div>
                                      <div className="flex justify-between font-medium text-slate-900 pt-1 border-t border-border"><span>Gross</span><span>{formatCurrency(e.grossEarnings)}</span></div>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-700 mb-1">Deductions</p>
                                    <div className="space-y-0.5 text-slate-600">
                                      <div className="flex justify-between"><span>PF (Employee)</span><span>{formatCurrency(e.pf)}</span></div>
                                      <div className="flex justify-between"><span>ESIC</span><span>{formatCurrency(e.esic)}</span></div>
                                      <div className="flex justify-between"><span>TDS</span><span>{formatCurrency(e.tds)}</span></div>
                                      <div className="flex justify-between font-medium text-red-700 pt-1 border-t border-border"><span>Total</span><span>{formatCurrency(e.totalDeductions)}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create run modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-slate-900 mb-4">New Payroll Run</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <select
                  value={createForm.month}
                  onChange={(e) => setCreateForm({ ...createForm, month: Number(e.target.value) })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  value={createForm.year}
                  onChange={(e) => setCreateForm({ ...createForm, year: Number(e.target.value) })}
                  min={2020}
                  max={2099}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}
