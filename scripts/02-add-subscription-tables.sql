-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'premium', 'fully_managed')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create usage tracking table for free tier limits
CREATE TABLE IF NOT EXISTS memorial_usage (
    id SERIAL PRIMARY KEY,
    memorial_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    media_count INTEGER DEFAULT 0,
    media_size_mb DECIMAL(10,2) DEFAULT 0,
    timeline_events INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_memorial_usage_user_id ON memorial_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_memorial_usage_memorial_id ON memorial_usage(memorial_id);
