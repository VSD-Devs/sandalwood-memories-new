import { type NextRequest, NextResponse } from "next/server"
import { stripe, isStripeAvailable } from "@/lib/stripe"
import { getUserSubscription } from "@/lib/subscription"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  if (!isStripeAvailable()) {
    return NextResponse.json({ error: "Billing portal is not available" }, { status: 503 })
  }

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const subscription = await getUserSubscription(userId)
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: "No customer found" }, { status: 404 })
    }

    const headersList = await headers()
    const origin = headersList.get("origin") || "http://localhost:3000"

    const portalSession = await stripe!.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Portal session error:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
