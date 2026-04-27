'use client'

import { Suspense, useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, UserX, ArrowRight } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

const inputClass =
  'w-full px-3.5 py-2.5 bg-zinc-800/60 border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl')
  const [showPassword, setShowPassword] = useState(false)
  const [noAccount, setNoAccount] = useState(false)
  const [noAccountEmail, setNoAccountEmail] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setNoAccount(false)

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(data.email)}`)
      const { exists } = await res.json()
      if (!exists) {
        setNoAccount(true)
        setNoAccountEmail(data.email)
      } else {
        toast.error('Incorrect password. Please try again.')
      }
      return
    }

    if (callbackUrl && callbackUrl !== '/') {
      router.push(callbackUrl)
      router.refresh()
      return
    }

    const session = await getSession()
    const tenantSlug = (session?.user as any)?.tenantSlug
    if (tenantSlug) {
      router.push(`/${tenantSlug}/`)
    } else {
      router.push('/onboarding')
    }
    router.refresh()
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-zinc-400 text-sm">Sign in to your Klickkk HR workspace</p>
      </div>

      {noAccount && (
        <div className="mb-5 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <UserX size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">No account found</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              <span className="font-mono">{noAccountEmail}</span> isn&apos;t registered.{' '}
              <Link href="/signup" className="font-semibold underline hover:text-amber-300">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email address</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@company.com"
            className={inputClass}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
          Sign in
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
          Start free trial
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-zinc-500 py-4">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
