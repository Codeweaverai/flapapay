-- Migration: Create Escrow Tables
-- Description: Sets up the tables for Marketplace Escrow feature including disputes and transaction links.

-- Create Status Enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escrow_status') THEN
        CREATE TYPE escrow_status AS ENUM (
            'CREATED', 'FUNDED', 'AWAITING_DELIVERY', 'DELIVERED', 'RELEASED', 'DISPUTED', 'REFUNDED', 'CANCELLED'
        );
    END IF;
END $$;

-- Escrows Table
CREATE TABLE IF NOT EXISTS escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id), -- Nullable initially if seller is not yet registered
    seller_email VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    description TEXT,
    instructions TEXT,
    delivery_timeframe INTEGER, -- Expected delivery in days
    inspection_period INTEGER DEFAULT 3, -- Inspection period in days after delivery
    escrow_fee_percent DECIMAL(5,2) DEFAULT 2.00,
    escrow_fee_amount DECIMAL(15,2) DEFAULT 0.00,
    status escrow_status DEFAULT 'CREATED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Escrow Transactions Table (Links to Ledger)
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id UUID REFERENCES escrows(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- e.g., 'FUNDING', 'RELEASE', 'REFUND', 'FEE_DEDUCTION'
    amount DECIMAL(15,2) NOT NULL,
    wallet_reference UUID, -- Reference to a ledger_entries id or transaction reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Escrow Disputes Table
CREATE TABLE IF NOT EXISTS escrow_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id UUID REFERENCES escrows(id) ON DELETE CASCADE,
    disputed_by UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    evidence_url TEXT,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, UNDER_REVIEW, RESOLVED_SELLER, RESOLVED_BUYER
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_escrows_modtime BEFORE UPDATE ON escrows FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_escrow_disputes_modtime BEFORE UPDATE ON escrow_disputes FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Add Escrow Hold Notification Trigger (Example)
CREATE OR REPLACE FUNCTION notify_escrow_update()
RETURNS TRIGGER AS $$
DECLARE
    notification_payload JSONB;
BEGIN
    notification_payload = jsonb_build_object(
        'type', 'escrow_update',
        'escrow_id', NEW.id,
        'status', NEW.status,
        'buyer_id', NEW.buyer_id,
        'seller_id', NEW.seller_id,
        'amount', NEW.amount,
        'currency', NEW.currency
    );
    
    -- Insert into notifications table (assuming one exists based on unified-server.js logic)
    INSERT INTO notifications (user_id, type, title, message, metadata, read)
    VALUES (
        CASE 
            WHEN TG_OP = 'UPDATE' AND NEW.status = 'FUNDED' THEN NEW.seller_id 
            WHEN TG_OP = 'UPDATE' AND NEW.status = 'DELIVERED' THEN NEW.buyer_id
            ELSE NEW.buyer_id -- Default
        END,
        'escrow',
        'Escrow Update: ' || NEW.status,
        'Your escrow transaction for ' || NEW.amount || ' ' || NEW.currency || ' is now ' || NEW.status,
        notification_payload,
        false
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER escrow_notification_trigger
AFTER UPDATE ON escrows
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE PROCEDURE notify_escrow_update();
