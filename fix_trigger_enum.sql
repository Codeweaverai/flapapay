-- Re-create the trigger function with explicit casting for the notification_type enum
CREATE OR REPLACE FUNCTION process_ledger_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT;
    v_message TEXT;
    v_type notification_type; -- Declared as enum type directly
BEGIN
    -- Handle CREDITS (Receiving Money)
    IF NEW.credit_wallet_id IS NOT NULL THEN
        -- Find the user who owns the credit wallet
        SELECT user_id INTO v_user_id FROM wallets WHERE id = NEW.credit_wallet_id;
        
        IF v_user_id IS NOT NULL THEN
            v_title := 'Payment Received';
            v_message := format('You received %s %s. %s', NEW.amount, NEW.currency, COALESCE(NEW.description, ''));
            v_type := 'payment_received'::notification_type;
            
            INSERT INTO notifications (user_id, type, title, message, amount)
            VALUES (v_user_id, v_type, v_title, v_message, format('+%s %s', NEW.amount, NEW.currency));
        END IF;
    END IF;

    -- Handle DEBITS (Sending Money / Payouts)
    IF NEW.debit_wallet_id IS NOT NULL THEN
        -- Find the user who owns the debit wallet
        SELECT user_id INTO v_user_id FROM wallets WHERE id = NEW.debit_wallet_id;
        
        IF v_user_id IS NOT NULL THEN
            IF NEW.transaction_type = 'payout' OR NEW.transaction_type = 'withdrawal' THEN
                v_title := 'Withdrawal Successful';
                v_type := 'withdrawal'::notification_type;
            ELSE
                v_title := 'Payment Sent';
                v_type := 'payment_sent'::notification_type;
            END IF;
            
            v_message := format('Transaction of %s %s processed. %s', NEW.amount, NEW.currency, COALESCE(NEW.description, ''));
            
            INSERT INTO notifications (user_id, type, title, message, amount)
            VALUES (v_user_id, v_type, v_title, v_message, format('-%s %s', NEW.amount, NEW.currency));
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger update is already applied via CREATE OR REPLACE FUNCTION
-- This will fix the ENUM mismatch.
