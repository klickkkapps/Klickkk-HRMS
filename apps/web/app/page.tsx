import Link from 'next/link'
import {
  Users, Clock, CalendarDays, DollarSign, TrendingUp, BookOpen,
  Receipt, FileText, BarChart3, GitBranch, Briefcase, Check, ArrowRight,
  Zap, Shield, Globe,
} from 'lucide-react'

const FEATURES = [
  { icon: Users,       title: 'Employee Management',  desc: 'Centralise all employee data, documents, and org structure in one place.' },
  { icon: Clock,       title: 'Attendance Tracking',  desc: 'Track clock-ins, clock-outs, WFH days, and late arrivals effortlessly.' },
  { icon: CalendarDays,title: 'Leave Management',     desc: 'Configurable leave types, balances, carry-forward, and approval workflows.' },
  { icon: DollarSign,  title: 'Payroll Processing',   desc: 'Run payroll with auto-computed PF, ESIC, TDS, and LOP deductions.' },
  { icon: Briefcase,   title: 'Recruitment (ATS)',    desc: 'Post jobs, track candidates through your pipeline, and hire faster.' },
  { icon: TrendingUp,  title: 'Performance Reviews',  desc: 'Set goals, track progress, and conduct structured performance reviews.' },
  { icon: BookOpen,    title: 'Learning & Development',desc: 'Publish courses and track employee learning progress across your org.' },
  { icon: Receipt,     title: 'Expense Management',   desc: 'Employees submit claims; managers approve — all in a few clicks.' },
  { icon: FileText,    title: 'Documents',            desc: 'Store offer letters, contracts, and all employee documents securely.' },
  { icon: GitBranch,   title: 'Org Chart',            desc: 'Visualise your reporting hierarchy with an interactive org chart.' },
  { icon: BarChart3,   title: 'HR Reports',           desc: 'Headcount trends, attendance summaries, payroll analytics, and more.' },
]

const ALL_FEATURES = [
  'Employee Management & Org Chart',
  'Attendance & Leave Tracking',
  'Payroll with PF, ESIC & TDS',
  'Recruitment (ATS)',
  'Performance Reviews & Goals',
  'Learning & Development',
  'Expense Management',
  'Document Storage',
  'HR Reports & Analytics',
  'Billing & Invoicing',
]

const PLANS = [
  {
    name: 'Starter',
    price: '₹999',
    period: '/month',
    limit: 'Up to 25 employees',
    note: 'GST included',
    highlight: false,
    cta: 'Start free trial',
  },
  {
    name: 'Growth',
    price: '₹1,999',
    period: '/month',
    limit: 'Up to 75 employees',
    note: 'GST included · Most popular',
    highlight: true,
    cta: 'Start free trial',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Klickkk HR</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-600/20"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 bg-grid-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-aurora" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[300px] bg-violet-600/8 rounded-full blur-[100px] animate-aurora [animation-delay:-3s]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030712]" />

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Modern HRMS built for Indian businesses
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            HR management{' '}
            <span className="text-gradient">that actually works</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            From onboarding to payroll, Klickkk HR handles your entire employee lifecycle
            — so you can focus on building your team, not managing spreadsheets.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Start 7-day free trial
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-sm transition-all border border-white/10 hover:border-white/20"
            >
              Sign in to workspace
            </Link>
          </div>

          <p className="mt-5 text-xs text-zinc-600">
            No credit card required · GST invoices included · Cancel anytime
          </p>

          {/* Trust badges */}
          <div className="mt-16 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: Shield, text: 'SOC 2 compliant' },
              { icon: Zap,    text: '99.9% uptime SLA' },
              { icon: Globe,  text: 'India-first payroll' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-zinc-500 text-sm">
                <Icon size={14} className="text-zinc-600" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-dot-white pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">Everything you need</p>
            <h2 className="text-4xl font-bold text-white">Your complete HR platform</h2>
            <p className="text-zinc-400 mt-3 max-w-xl mx-auto">
              A full suite of HR tools in one platform — all features included in every plan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative bg-zinc-900/60 border border-white/[0.06] rounded-2xl p-6 glow-blue-hover cursor-default"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/[0.03] to-violet-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <f.icon size={18} className="text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">Pricing</p>
            <h2 className="text-4xl font-bold text-white">Simple, transparent pricing</h2>
            <p className="text-zinc-400 mt-3">
              All features included in every plan. Only the employee limit differs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border transition-all ${
                  plan.highlight
                    ? 'bg-blue-600/10 border-blue-500/40 shadow-2xl shadow-blue-600/10'
                    : 'bg-zinc-900/60 border-white/[0.08] hover:border-white/20'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-zinc-500">{plan.note}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-zinc-400 text-sm pb-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">{plan.limit}</p>
                </div>

                <div className="mb-8">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">All features included</p>
                  <ul className="space-y-2.5">
                    {ALL_FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                        <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Check size={10} className="text-blue-400" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:-translate-y-0.5'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-zinc-600 mt-8">
            Extra employee slots available at ₹49/slot/month (GST incl.) · 7-day free trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">K</span>
            </div>
            <span className="font-semibold text-zinc-400">Klickkk HR</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login"  className="hover:text-zinc-300 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-zinc-300 transition-colors">Sign up</Link>
          </div>
          <p>© {new Date().getFullYear()} Klickkk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
