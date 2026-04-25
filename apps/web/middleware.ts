import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const user = session?.user

  // ── Super admin section ──────────────────────────────────────────────────
  if (pathname.startsWith('/superadmin')) {
    // Login page: allow unauthenticated; redirect already-logged-in admins
    if (pathname === '/superadmin') {
      if (user?.isSuperAdmin) {
        return NextResponse.redirect(new URL('/superadmin/dashboard', req.url))
      }
      return NextResponse.next()
    }
    // All other /superadmin/* require a super admin session
    if (!user?.isSuperAdmin) {
      return NextResponse.redirect(new URL('/superadmin', req.url))
    }
    return NextResponse.next()
  }

  // ── Public tenant paths ───────────────────────────────────────────────────
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/billing/webhook') ||
    pathname === '/login' ||
    pathname === '/signup'
  ) {
    return NextResponse.next()
  }

  // ── Require session for all other routes ──────────────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Super admin accidentally on tenant routes → back to their panel
  if (user.isSuperAdmin) {
    return NextResponse.redirect(new URL('/superadmin/dashboard', req.url))
  }

  // Tenant must exist for all dashboard routes
  if (!user.tenantId) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
