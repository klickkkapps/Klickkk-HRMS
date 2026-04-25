import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { SessionProvider } from 'next-auth/react'
import './globals.css'
import { AdminNav } from '@/components/admin-nav'

const inter = Inter({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Klickkk HRMS — Super Admin', template: '%s | Super Admin' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        <SessionProvider>
          <AdminNav />
          <main className="p-6">{children}</main>
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  )
}
