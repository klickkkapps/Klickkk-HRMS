import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import {
  verifyPaymentSignature,
  verifySubscriptionSignature,
  PLAN_PRICES,
  getRazorpay,
  isRazorpayConfigured,
} from '@/lib/razorpay'
import { createInvoice, buildExtraSlotLineItem, buildPlanLineItem } from '@/lib/invoice'
import { addMonths } from 'date-fns'
import { z } from 'zod'

const schema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('extra_slots'),
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    slots: z.number(),
    subscriptionId: z.string(),
    billingCycleStart: z.string(),
    billingCycleEnd: z.string(),
  }),
  z.object({
    type: z.literal('subscription'),
    razorpay_payment_id: z.string(),
    razorpay_subscription_id: z.string(),
    razorpay_signature: z.string(),
    plan: z.enum(['STARTER', 'GROWTH']),
  }),
])

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

  const data = parsed.data

  if (data.type === 'extra_slots') {
    // Verify signature
    const valid = verifyPaymentSignature({
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature,
    })
    if (!valid) return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })

    const slots = data.slots
    const amountPaid = slots * 4900 // ₹49 × slots in paise

    // Record extra slots
    await prisma.subscriptionExtraSlot.create({
      data: {
        subscriptionId: data.subscriptionId,
        tenantId,
        slotsPurchased: slots,
        billingCycleStart: new Date(data.billingCycleStart),
        billingCycleEnd: new Date(data.billingCycleEnd),
        amountPaid,
        stripePaymentIntentId: data.razorpay_payment_id, // reusing field for Razorpay payment_id
      },
    })

    // Generate GST invoice
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })
    await createInvoice({
      tenantId,
      lineItems: [buildExtraSlotLineItem(slots)],
      supplyType: tenant.supplyType,
      paidAt: new Date(),
    })

    return NextResponse.json({ success: true, slots })
  }

  if (data.type === 'subscription') {
    // Verify signature
    const valid = verifySubscriptionSignature({
      subscriptionId: data.razorpay_subscription_id,
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature,
    })
    if (!valid) return NextResponse.json({ error: 'Invalid subscription signature' }, { status: 400 })

    const plan = data.plan
    const planConfig = PLAN_PRICES[plan]
    const now = new Date()
    const cycleEnd = addMonths(now, 1)

    // Fetch Razorpay subscription details for accurate cycle dates
    let cycleStart = now
    try {
      const razorpay = getRazorpay()
      const rzpSub = await razorpay.subscriptions.fetch(data.razorpay_subscription_id)
      if (rzpSub.current_start) cycleStart = new Date(rzpSub.current_start * 1000)
      if (rzpSub.current_end) cycleEnd.setTime(rzpSub.current_end * 1000)
    } catch (_) {}

    // Upsert subscription
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: data.razorpay_subscription_id },
      update: { status: 'ACTIVE', billingCycleStart: cycleStart, billingCycleEnd: cycleEnd },
      create: {
        tenantId,
        plan,
        planEmployeeLimit: planConfig.employeeLimit,
        billingCycleStart: cycleStart,
        billingCycleEnd: cycleEnd,
        status: 'ACTIVE',
        stripeSubscriptionId: data.razorpay_subscription_id, // reusing field
        amount: planConfig.amount,
      },
    })

    // Update tenant plan
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { plan, planEmployeeLimit: planConfig.employeeLimit },
    })

    // Generate GST invoice
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })
    await createInvoice({
      tenantId,
      lineItems: [buildPlanLineItem(plan, planConfig.amount, planConfig.employeeLimit)],
      supplyType: tenant.supplyType,
      paidAt: now,
    })

    return NextResponse.json({ success: true, plan })
  }
}
