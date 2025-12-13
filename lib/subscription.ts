import { createClient } from "@supabase/supabase-js"
import { stripe, isStripeAvailable } from "./stripe"

// Supabase client for database operations
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration not available")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const isDatabaseAvailable = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!(supabaseUrl && supabaseServiceKey)
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
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error
    }

    return data || null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to load subscription; treating as free plan (${message})`)
    return null
  }
}

export async function createFreeSubscription(userId: string): Promise<UserSubscription> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not configured")
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_type: 'free',
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
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

export async function upgradeToPremium(userId: string): Promise<UserSubscription> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not configured")
  }

  // Get current subscription
  const currentSubscription = await getUserSubscription(userId)

  if (!currentSubscription) {
    // For demo purposes, create a premium subscription directly
    // In a real app, you'd ensure the user exists first
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'premium',
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      // If foreign key constraint fails, try upsert (this might work if the table allows it)
      console.warn('Insert failed, trying upsert approach:', error.message)
      throw new Error('User does not exist. Please sign up first.')
    }

    return data
  } else {
    // Update existing subscription to premium
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        plan_type: 'premium',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
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

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}
