import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { getRazorpay, isRazorpayConfigured, PLAN_PRICES } from '@/lib/razorpay'
import { z } from 'zod'

const schema = z.object({
  plan: z.enum(['STARTER', 'GROWTH']),
})

export async function POST(req: NextRequest) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: 'Payments are not configured' }, { status: 503 })
  }

  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { plan } = parsed.data
  const planConfig = PLAN_PRICES[plan]

  if (!planConfig.razorpayPlanId) {
    return NextResponse.json({ error: 'Plan not available for self-serve' }, { status: 400 })
  }

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })
  const razorpay = getRazorpay()

  // Create Razorpay Subscription
  const subscription = await razorpay.subscriptions.create({
    plan_id: planConfig.razorpayPlanId,
    customer_notify: 1,
    total_count: 120, // 10 years max — effectively indefinite
    notes: {
      tenantId,
      plan,
      companyName: tenant.name,
    },
  })

  return NextResponse.json({
    subscriptionId: subscription.id,
    amount: planConfig.amount,
    currency: 'INR',
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    plan,
  })
}
