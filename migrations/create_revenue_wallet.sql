-- Create Wallet for System User
-- Ideally, create a system user first, but to keep it simple, we assume a designated system user ID exists or create one.
-- Let's create a dedicated 'system' user with a specific UUID if it doesn't exist.

INSERT INTO users (id, email, password_hash, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@flapapay.com', 'hashed_placeholder', 'FlapaPay System', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'system_usd@flapapay.com', 'hashed_placeholder', 'FlapaPay System USD', 'admin')
ON CONFLICT (id) DO NOTHING;


-- Revenue Wallet ZMW
INSERT INTO wallets (user_id, currency, balance, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'ZMW', 0.00, 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Revenue Wallet USD
INSERT INTO wallets (user_id, currency, balance, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'USD', 0.00, 'ACTIVE')
ON CONFLICT DO NOTHING;
