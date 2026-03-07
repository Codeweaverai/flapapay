-- Create Virtual Cards Table
CREATE TABLE IF NOT EXISTS virtual_cards (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last4 VARCHAR(4) NOT NULL,
    brand VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    amount NUMERIC(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    expiry_month VARCHAR(2) NOT NULL,
    expiry_year VARCHAR(2) NOT NULL,
    billing_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookup by user
CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_id ON virtual_cards(user_id);
