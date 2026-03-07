-- Add System Wallets for Escrow
-- Escrow Hold Wallet (Global ID)
INSERT INTO wallets (id, user_id, currency, balance, status)
VALUES ('00000000-0000-0000-0000-000000000001', NULL, 'ZMW', 0, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- System Revenue Wallet (Global ID)
INSERT INTO wallets (id, user_id, currency, balance, status)
VALUES ('00000000-0000-0000-0000-000000000000', NULL, 'ZMW', 0, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
