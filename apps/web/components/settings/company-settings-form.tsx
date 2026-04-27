'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Building2, MapPin, Receipt } from 'lucide-react'
import type { Tenant } from '@klickkk/db'

const inputClass =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all'

const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

export function CompanySettingsForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter()
  const [saving,  setSaving]  = useState(false)
  const [name,    setName]    = useState(tenant.name)
  const [gstin,   setGstin]   = useState(tenant.gstin ?? '')
  const [address, setAddress] = useState(tenant.address ?? '')
  const [state,   setState]   = useState(tenant.state ?? '')
  const [pincode, setPincode] = useState(tenant.pincode ?? '')

  async function saveCompany() {
    setSaving(true)
    const res = await fetch('/api/settings/company', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gstin, address, state, pincode }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Company settings saved')
      router.refresh()
    } else {
      toast.error('Failed to save settings')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-6">
      {/* Company name */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={15} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900 text-sm">Company Information</h2>
        </div>
        <div>
          <label className={labelClass}>Company Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Acme Technologies Pvt Ltd"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* GST */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={15} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900 text-sm">GST Details</h2>
        </div>
        <div>
          <label className={labelClass}>GSTIN</label>
          <input
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            className={inputClass}
            placeholder="22AAAAA0000A1Z5"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Address */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={15} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900 text-sm">Registered Address</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Street Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              placeholder="123, MG Road"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>State</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={inputClass}
                placeholder="Karnataka"
              />
            </div>
            <div>
              <label className={labelClass}>Pincode</label>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className={inputClass}
                placeholder="560001"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={saveCompany}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-600/20"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}
