import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@klickkk/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findFirst({
          where: { email: parsed.data.email, isSuperAdmin: true },
        })

        if (!user?.passwordHash) return null
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, isSuperAdmin: true }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ''
        token.isSuperAdmin = (user as any).isSuperAdmin
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      ;(session.user as any).isSuperAdmin = token.isSuperAdmin
      return session
    },
  },
})
