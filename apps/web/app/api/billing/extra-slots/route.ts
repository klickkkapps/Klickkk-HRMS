import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { getRazorpay, isRazorpayConfigured, EXTRA_SLOT_PRICE_PAISE } from '@/lib/razorpay'
import { z } from 'zod'

const schema = z.object({
  slots: z.number().int().min(1).max(500),
  subscriptionId: z.string(),
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

  const { slots, subscriptionId } = parsed.data

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, tenantId },
  })
  if (!subscription) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

  const totalPaise = slots * EXTRA_SLOT_PRICE_PAISE
  const razorpay = getRazorpay()

  // Create Razorpay Order
  const order = await razorpay.orders.create({
    amount: totalPaise,
    currency: 'INR',
    receipt: `slots-${tenantId}-${Date.now()}`,
    notes: {
      tenantId,
      subscriptionId,
      slots: String(slots),
      type: 'extra_slots',
      billingCycleStart: subscription.billingCycleStart.toISOString(),
      billingCycleEnd: subscription.billingCycleEnd.toISOString(),
    },
  })

  return NextResponse.json({
    orderId: order.id,
    amount: totalPaise,
    currency: 'INR',
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    slots,
    subscriptionId,
  })
}
