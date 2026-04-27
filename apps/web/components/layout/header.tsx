'use client'

import { signOut } from 'next-auth/react'
import { useCurrentUser } from '@/hooks/use-session'
import { Bell, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user } = useCurrentUser()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? 'U')

  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-end px-5 sticky top-0 z-20 gap-2">
      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
        <Bell size={16} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
      </button>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-slate-800 leading-tight">{user?.name ?? user?.email}</div>
            <div className="text-xs text-slate-400 leading-tight">{user?.tenantName}</div>
          </div>
          <ChevronDown size={13} className="text-slate-400 hidden md:block" />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-20">
              <div className="px-3 py-2.5 border-b border-slate-100">
                <div className="text-sm font-semibold text-slate-900 truncate">{user?.name}</div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</div>
              </div>
              <div className="py-1">
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => { /* profile */ }}
                >
                  <Settings size={14} className="text-slate-400" />
                  Account settings
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
