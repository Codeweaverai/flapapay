-- Add amount column to notifications table if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS amount CHARACTER VARYING;

-- Re-create the trigger function with the same logic (it should work now that amount exists)
CREATE OR REPLACE FUNCTION process_ledger_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_title TEXT;
    v_message TEXT;
    v_type TEXT;
BEGIN
    -- Handle CREDITS (Receiving Money)
    IF NEW.credit_wallet_id IS NOT NULL THEN
        -- Find the user who owns the credit wallet
        SELECT user_id INTO v_user_id FROM wallets WHERE id = NEW.credit_wallet_id;
        
        IF v_user_id IS NOT NULL THEN
            v_title := 'Payment Received';
            v_message := format('You received %s %s. %s', NEW.amount, NEW.currency, COALESCE(NEW.description, ''));
            v_type := 'payment_received';
            
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
                v_type := 'withdrawal';
            ELSE
                v_title := 'Payment Sent';
                v_type := 'payment_sent';
            END IF;
            
            v_message := format('Transaction of %s %s processed. %s', NEW.amount, NEW.currency, COALESCE(NEW.description, ''));
            
            INSERT INTO notifications (user_id, type, title, message, amount)
            VALUES (v_user_id, v_type, v_title, v_message, format('-%s %s', NEW.amount, NEW.currency));
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the Trigger
DROP TRIGGER IF EXISTS trg_ledger_notification ON ledger_entries;
CREATE TRIGGER trg_ledger_notification
AFTER INSERT ON ledger_entries
FOR EACH ROW
EXECUTE FUNCTION process_ledger_notification();
