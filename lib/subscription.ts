import { neon } from "@neondatabase/serverless"
import { stripe, isStripeAvailable } from "./stripe"

const BAD_SUPABASE_HOST = "api.pooler.supabase.com"
let hasLoggedDbConfigWarning = false

function getValidDatabaseUrl() {
  const rawCandidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL_UNPOOLED]
  const candidates = rawCandidates
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => v!.trim().replace(/^postgres:\/\//, "postgresql://"))

  for (const url of candidates) {
    try {
      const parsed = new URL(url)
      if (parsed.hostname === BAD_SUPABASE_HOST) {
        if (!hasLoggedDbConfigWarning) {
          console.warn(
            "Database URL looks like a Supabase pooled endpoint without a project ref (api.pooler.supabase.com). Skipping DB queries and treating users as free plan until configured."
          )
          hasLoggedDbConfigWarning = true
        }
        continue
      }
      return parsed.toString()
    } catch {
      // Ignore and continue trying other candidates
    }
  }

  return null
}

const isDatabaseAvailable = () => !!getValidDatabaseUrl()
function getSql() {
  const url = getValidDatabaseUrl()
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }
  return neon(url)
}

export interface UserSubscription {
  id: number
  user_id: string
  plan_type: "free" | "premium" | "fully_managed"
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: "active" | "cancelled" | "past_due" | "incomplete"
  created_at: string
  updated_at: string
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  if (!isDatabaseAvailable()) {
    console.warn("Database not configured, returning null subscription")
    return null
  }

  try {
    const sql = getSql()
    const result = (await sql`
      SELECT * FROM user_subscriptions 
      WHERE user_id = ${userId}
      LIMIT 1
    `) as unknown as UserSubscription[]
    return result[0] || null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!hasLoggedDbConfigWarning) {
      console.warn(`Failed to load subscription; treating as free plan (${message})`)
      hasLoggedDbConfigWarning = true
    }
    return null
  }
}

export async function createFreeSubscription(userId: string): Promise<UserSubscription> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not configured")
  }

  const result = (await getSql()`
    INSERT INTO user_subscriptions (user_id, plan_type, status)
    VALUES (${userId}, 'free', 'active')
    RETURNING *
  `) as unknown as UserSubscription[]
  return result[0]
}

export async function getSubscriptionWithStripeData(userId: string) {
  const subscription = await getUserSubscription(userId)
  if (!subscription || !subscription.stripe_subscription_id) {
    return subscription
  }

  if (!isStripeAvailable()) {
    console.warn("Stripe not configured, returning subscription without Stripe data")
    return subscription
  }

  try {
    const stripeSubscription = await stripe!.subscriptions.retrieve(subscription.stripe_subscription_id)
    const stripeCustomer = await stripe!.customers.retrieve(subscription.stripe_customer_id!)

    return {
      ...subscription,
      stripe_data: {
        subscription: stripeSubscription,
        customer: stripeCustomer,
      },
    }
  } catch (error) {
    console.error("Error fetching Stripe data:", error)
    return subscription
  }
}

export async function cancelSubscription(userId: string) {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not configured")
  }

  const subscription = await getUserSubscription(userId)
  if (!subscription?.stripe_subscription_id) {
    throw new Error("No active subscription found")
  }

  if (!isStripeAvailable()) {
    throw new Error("Stripe is not configured")
  }

  await stripe!.subscriptions.cancel(subscription.stripe_subscription_id)

  await getSql()`
    UPDATE user_subscriptions 
    SET status = 'cancelled', updated_at = NOW()
    WHERE user_id = ${userId}
  `
}
