-- FlapaPay Core Financial Ledger Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Identity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    kyc_level INT DEFAULT 1, -- 1: Basic, 2: Verified, 3: Enhanced
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Wallets (Accounts)
-- Supports multi-currency. A user can have multiple wallets.
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    currency VARCHAR(3) NOT NULL, -- ISO 4217 (USD, KES, NGN, GHS, etc.)
    balance DECIMAL(20, 4) DEFAULT 0.0000, -- High precision for financial data
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, FREEZED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Ledger Entries (Double Entry Accounting)
-- This is the immutable source of truth for all money movement.
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_reference VARCHAR(100) NOT NULL UNIQUE, -- Idempotency key
    debit_wallet_id UUID REFERENCES wallets(id), -- Source of funds
    credit_wallet_id UUID REFERENCES wallets(id), -- Destination of funds
    amount DECIMAL(20, 4) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL,
    description TEXT,
    transaction_type VARCHAR(50) NOT NULL, -- DEPOSIT, TRANSFER, WITHDRAWAL, FEE
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_ledger_entries_reference ON ledger_entries(transaction_reference);
CREATE INDEX idx_ledger_debit_wallet ON ledger_entries(debit_wallet_id);
CREATE INDEX idx_ledger_credit_wallet ON ledger_entries(credit_wallet_id);
