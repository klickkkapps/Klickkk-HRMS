'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check, Loader2, ArrowRight, Users } from 'lucide-react'

const schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  name: z.string().min(2, 'Your name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  plan: z.enum(['STARTER', 'GROWTH']),
})

type FormData = z.infer<typeof schema>

const PLANS = [
  {
    id: 'STARTER' as const,
    name: 'Starter',
    price: '₹999',
    limit: 'Up to 25 employees',
    badge: null,
  },
  {
    id: 'GROWTH' as const,
    name: 'Growth',
    price: '₹1,999',
    limit: 'Up to 75 employees',
    badge: 'Popular',
  },
]

const inputClass =
  'w-full px-3.5 py-2.5 bg-zinc-800/60 border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'GROWTH' },
  })

  const selectedPlan = watch('plan')

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to create account')
      return
    }

    toast.success('Account created! Starting your 7-day free trial...')
    router.push('/login')
  }

  return (
    <>
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>1</div>
        <div className={`flex-1 h-px transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-zinc-800'}`} />
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>2</div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
              <p className="text-zinc-400 text-sm">7-day free trial · No credit card required</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Company name</label>
              <input {...register('companyName')} placeholder="Acme Technologies" className={inputClass} />
              {errors.companyName && <p className="text-red-400 text-xs mt-1.5">{errors.companyName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Your name</label>
              <input {...register('name')} placeholder="Ravi Sharma" className={inputClass} />
              {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Work email</label>
              <input {...register('email')} type="email" placeholder="ravi@acme.com" className={inputClass} />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <input {...register('password')} type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number" className={inputClass} />
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white mb-1">Choose your plan</h2>
              <p className="text-zinc-400 text-sm">All features included in both plans · Free for 7 days</p>
            </div>

            <div className="space-y-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setValue('plan', plan.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedPlan === plan.id
                      ? 'border-blue-500/60 bg-blue-600/10'
                      : 'border-white/[0.08] bg-zinc-800/40 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{plan.name}</span>
                        {plan.badge && (
                          <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                        <Users size={11} />
                        {plan.limit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{plan.price}</div>
                      <div className="text-xs text-zinc-500">/month</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-600 text-center">
              Extra slots at ₹49/slot/month · All features included in every plan
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 border border-white/10 text-zinc-300 rounded-xl text-sm font-medium hover:bg-white/5 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                Start free trial
              </button>
            </div>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-zinc-500 mt-5">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
          Sign in
        </Link>
      </p>
    </>
  )
}
