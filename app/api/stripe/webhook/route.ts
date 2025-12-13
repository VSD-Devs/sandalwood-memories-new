import { type NextRequest, NextResponse } from "next/server"
import { stripe, isStripeAvailable } from "@/lib/stripe"
import { headers } from "next/headers"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const rawCandidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL_UNPOOLED]
  const candidates = rawCandidates
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => v!.trim().replace(/^postgres:\/\//, "postgresql://"))
  for (const url of candidates) {
    try {
      return neon(url)
    } catch {}
  }
  throw new Error("DATABASE_URL is not set")
}

export async function POST(request: NextRequest) {
  if (!isStripeAvailable()) {
    return NextResponse.json({ error: "Webhook processing is not available" }, { status: 503 })
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe!.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    const sql = getSql()

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (userId && plan) {
          // Update user subscription in database
          await sql`
            INSERT INTO user_subscriptions (user_id, plan_type, stripe_customer_id, stripe_subscription_id, status, created_at)
            VALUES (${userId}, ${plan}, ${session.customer}, ${session.subscription || null}, 'active', NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
              plan_type = ${plan},
              stripe_customer_id = ${session.customer},
              stripe_subscription_id = ${session.subscription || null},
              status = 'active',
              updated_at = NOW()
          `
        }
        break
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const status = subscription.status === "active" ? "active" : "cancelled"

        await sql`
          UPDATE user_subscriptions 
          SET status = ${status}, updated_at = NOW()
          WHERE stripe_subscription_id = ${subscription.id}
        `
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any
        await sql`
          UPDATE user_subscriptions 
          SET status = 'past_due', updated_at = NOW()
          WHERE stripe_subscription_id = ${invoice.subscription}
        `
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
