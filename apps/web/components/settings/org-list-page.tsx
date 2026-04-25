'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Check, X, Building2, MapPin, Briefcase } from 'lucide-react'

interface Item {
  id: string
  name: string
  employeeCount: number
  extra?: string
}

interface Props {
  title: string
  description: string
  items: Item[]
  apiPath: string
  placeholder: string
  icon: 'department' | 'designation' | 'location'
  extraFields?: React.ReactNode
  onExtraChange?: (field: string, value: string) => void
}

export function OrgListPage({ title, description, items, apiPath, placeholder, icon }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const Icon = icon === 'department' ? Building2 : icon === 'designation' ? Briefcase : MapPin

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success(`${title.replace(/s$/, '')} added`)
      setNewName('')
      setAdding(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(id: string) {
    if (!editName.trim()) return
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Updated')
      setEditId(null)
      router.refresh()
    } catch {
      toast.error('Failed to update')
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`${apiPath}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to delete')
      }
      toast.success('Deleted')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{description}</p>
        </div>
        <button
          onClick={() => { setAdding(true); setNewName('') }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium flex-shrink-0"
        >
          <Plus size={15} />
          Add {title.replace(/s$/, '')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* Add row */}
        {adding && (
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-blue-50/50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className="text-blue-600" />
            </div>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') setAdding(false)
              }}
              placeholder={placeholder}
              className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder-slate-400"
            />
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAdd}
                disabled={saving || !newName.trim()}
                className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setAdding(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {items.length === 0 && !adding ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Icon size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No {title.toLowerCase()} yet.</p>
            <button
              onClick={() => setAdding(true)}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Add your first one
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-slate-500" />
                </div>

                {editId === item.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEdit(item.id)
                        if (e.key === 'Escape') setEditId(null)
                      }}
                      className="flex-1 text-sm border border-blue-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={() => handleEdit(item.id)} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-900">{item.name}</span>
                      {item.extra && <span className="text-xs text-slate-400 ml-2">{item.extra}</span>}
                    </div>
                    <span className="text-xs text-slate-400 mr-2">
                      {item.employeeCount} {item.employeeCount === 1 ? 'employee' : 'employees'}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => { setEditId(item.id); setEditName(item.name) }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Rename"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title={item.employeeCount > 0 ? 'Cannot delete — has employees' : 'Delete'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
