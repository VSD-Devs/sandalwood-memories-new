import { type NextRequest, NextResponse } from "next/server"
import { stripe, STRIPE_PLANS, type StripePlan, isStripeAvailable } from "@/lib/stripe"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  if (!isStripeAvailable()) {
    return NextResponse.json({ error: "Payment processing is not available" }, { status: 503 })
  }

  try {
    const { plan, userId, userEmail } = await request.json()

    if (!plan || !STRIPE_PLANS[plan as StripePlan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const selectedPlan = STRIPE_PLANS[plan as StripePlan]
    const headersList = await headers()
    const origin = headersList.get("origin") || "http://localhost:3000"

    const checkoutSession = await stripe!.checkout.sessions.create({
      mode: selectedPlan.interval ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency,
            product_data: {
              name: `${selectedPlan.name} Plan`,
              description:
                selectedPlan.name === "Premium"
                  ? "Enhanced features for meaningful memorials"
                  : "Complete memorial creation service",
            },
            unit_amount: selectedPlan.price,
            ...(selectedPlan.interval && {
              recurring: {
                interval: selectedPlan.interval,
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      customer_email: userEmail,
      metadata: {
        userId: userId || "",
        plan: plan,
      },
      ...(selectedPlan.interval && {
        subscription_data: {
          metadata: {
            userId: userId || "",
            plan: plan,
          },
        },
      }),
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
