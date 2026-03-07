-- Create Payment Links Table
CREATE TABLE IF NOT EXISTS payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    currency VARCHAR(3) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    active BOOLEAN DEFAULT true,
    redirect_url TEXT,
    allows_mobile_money BOOLEAN DEFAULT true,
    allows_card BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    payments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON payment_links(user_id);
