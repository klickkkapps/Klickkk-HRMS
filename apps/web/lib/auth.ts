import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@klickkk/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

for (const key of ['AUTH_URL', 'NEXTAUTH_URL']) {
  const value = process.env[key]
  if (value && !/^https?:\/\//.test(value)) {
    process.env[key] = `https://${value}`
  }
}

process.env.AUTH_TRUST_HOST = 'true'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        loginType: { label: 'Login Type', type: 'text' }, // 'tenant' | 'admin'
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const isAdminLogin = credentials?.loginType === 'admin'

        const user = await prisma.user.findFirst({
          where: {
            email,
            isSuperAdmin: isAdminLogin,
          },
          include: {
            tenant: true,
            userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
          },
        })

        if (!user) return null
        if (!user.passwordHash) return null
        if (!isAdminLogin && !user.isActive) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        const permissions = user.isSuperAdmin
          ? ['*']
          : user.userRoles.flatMap((ur) =>
              ur.role.rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`)
            )

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isSuperAdmin: user.isSuperAdmin,
          tenantId: user.tenantId,
          tenantSlug: user.tenant?.slug ?? null,
          tenantName: user.tenant?.name ?? null,
          permissions,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ''
        token.isSuperAdmin = (user as any).isSuperAdmin
        token.tenantId = (user as any).tenantId
        token.tenantSlug = (user as any).tenantSlug
        token.tenantName = (user as any).tenantName
        token.permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
        session.user.tenantId = token.tenantId as string | null
        session.user.tenantSlug = token.tenantSlug as string | null
        session.user.tenantName = token.tenantName as string | null
        session.user.permissions = token.permissions as string[]
      }
      return session
    },
  },
})
