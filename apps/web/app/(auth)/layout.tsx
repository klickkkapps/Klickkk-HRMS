import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-white pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/8 rounded-full blur-[100px] animate-aurora" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[200px] bg-violet-600/6 rounded-full blur-[80px] animate-aurora [animation-delay:-4s]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Klickkk HR</span>
          </Link>
          <p className="text-zinc-500 text-sm mt-2">Modern HR for growing Indian teams</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
