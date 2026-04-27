'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign, TrendingUp,
  BookOpen, Receipt, FileText, BarChart3, Settings, GitBranch,
  ChevronDown, ChevronRight, Briefcase, CreditCard,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  path?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children?: { label: string; path: string }[]
}

function buildNavItems(slug: string): NavItem[] {
  const p = (path: string) => `/${slug}${path}`
  return [
    { label: 'Dashboard',   path: p('/'),            icon: LayoutDashboard },
    { label: 'Employees',   path: p('/employees'),   icon: Users },
    { label: 'Org Chart',   path: p('/org-chart'),   icon: GitBranch },
    { label: 'Attendance',  path: p('/attendance'),  icon: Clock },
    { label: 'Leave',       path: p('/leave'),       icon: CalendarDays },
    { label: 'Payroll',     path: p('/payroll'),     icon: DollarSign },
    { label: 'Recruitment', path: p('/recruitment'), icon: Briefcase },
    { label: 'Performance', path: p('/performance'), icon: TrendingUp },
    { label: 'Learning',    path: p('/learning'),    icon: BookOpen },
    { label: 'Expenses',    path: p('/expenses'),    icon: Receipt },
    { label: 'Documents',   path: p('/documents'),   icon: FileText },
    { label: 'Reports',     path: p('/reports'),     icon: BarChart3 },
    {
      label: 'Settings',
      icon: Settings,
      children: [
        { label: 'Company',           path: p('/settings/company') },
        { label: 'Roles & Permissions', path: p('/settings/roles') },
        { label: 'Departments',       path: p('/settings/departments') },
        { label: 'Designations',      path: p('/settings/designations') },
        { label: 'Locations',         path: p('/settings/locations') },
      ],
    },
  ]
}

export function Sidebar({ tenantName, slug }: { tenantName: string; slug: string }) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const navItems = buildNavItems(slug)

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  const isActive = (path: string) => {
    if (path === `/${slug}/`) return pathname === `/${slug}` || pathname === `/${slug}/`
    return pathname.startsWith(path)
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col z-30 bg-[#070d1a] border-r border-white/[0.05]">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.05] shrink-0">
        <Link href={`/${slug}/`} className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
            <span className="text-white font-bold text-xs">K</span>
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm truncate leading-tight">{tenantName}</div>
            <div className="text-zinc-600 text-[10px] leading-tight">Klickkk HR</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-none">
        {navItems.map((item) => {
          if (item.children) {
            const isOpen = openGroups.includes(item.label)
            const hasActiveChild = item.children.some((c) => isActive(c.path))

            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                    hasActiveChild
                      ? 'text-white bg-white/8'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                  )}
                >
                  <item.icon size={14} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {isOpen && (
                  <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/[0.05] pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        href={child.path}
                        className={cn(
                          'block px-2.5 py-1.5 rounded-lg text-xs transition-all',
                          isActive(child.path)
                            ? 'text-blue-400 bg-blue-500/10 font-medium'
                            : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          const active = isActive(item.path!)
          return (
            <Link
              key={item.path}
              href={item.path!}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                active
                  ? 'text-white bg-blue-600/20 border border-blue-500/20 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
              )}
            >
              <item.icon
                size={14}
                className={cn('shrink-0', active ? 'text-blue-400' : '')}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Billing */}
      <div className="px-2 py-3 border-t border-white/[0.05] shrink-0">
        <Link
          href={`/${slug}/billing`}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
            isActive(`/${slug}/billing`)
              ? 'text-white bg-blue-600/20 border border-blue-500/20'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
          )}
        >
          <CreditCard size={14} className="shrink-0" />
          Billing & Slots
        </Link>
      </div>
    </aside>
  )
}
