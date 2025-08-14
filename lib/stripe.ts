import Stripe from "stripe"

const isStripeConfigured =
  process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PREMIUM_PRICE_ID && process.env.STRIPE_FULLY_MANAGED_PRICE_ID

export const stripe = isStripeConfigured
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // Use the latest supported API version for the installed Stripe SDK
      apiVersion: "2025-07-30.basil",
    })
  : null

export const STRIPE_PLANS = {
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || "price_premium_yearly",
    name: "Premium",
    price: 9900, // £99 in pence
    currency: "gbp",
    interval: "year",
  },
  fullyManaged: {
    priceId: process.env.STRIPE_FULLY_MANAGED_PRICE_ID || "price_fully_managed",
    name: "Fully Managed",
    price: 25000, // £250 in pence
    currency: "gbp",
    interval: null, // One-time payment
  },
} as const

export type StripePlan = keyof typeof STRIPE_PLANS

export const isStripeAvailable = () => stripe !== null
