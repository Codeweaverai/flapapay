-- Refined Trigger Function to process ledger entries with narration and fixed decimals
CREATE OR REPLACE FUNCTION process_ledger_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_user_id UUID;
    v_recipient_user_id UUID;
    v_sender_name TEXT;
    v_recipient_name TEXT;
    v_title TEXT;
    v_message TEXT;
    v_type notification_type;
    v_amount_formatted TEXT;
BEGIN
    -- Format amount to 2 decimal places with thousands separator if needed, but keeping it simple for now
    v_amount_formatted := to_char(NEW.amount, 'FM999,999,990.00');

    -- Get sender info (debit)
    IF NEW.debit_wallet_id IS NOT NULL THEN
        SELECT w.user_id, u.full_name INTO v_sender_user_id, v_sender_name 
        FROM wallets w JOIN users u ON w.user_id = u.id 
        WHERE w.id = NEW.debit_wallet_id;
    END IF;

    -- Get recipient info (credit)
    IF NEW.credit_wallet_id IS NOT NULL THEN
        SELECT w.user_id, u.full_name INTO v_recipient_user_id, v_recipient_name 
        FROM wallets w JOIN users u ON w.user_id = u.id 
        WHERE w.id = NEW.credit_wallet_id;
    END IF;

    -- Notifying Sender (Payment Sent)
    IF v_sender_user_id IS NOT NULL THEN
        v_title := 'Payment Made';
        IF v_recipient_name IS NOT NULL THEN
            v_message := format('Payment Made to %s. Purpose: %s', v_recipient_name, COALESCE(NEW.description, 'None'));
        ELSE
            -- Self-transaction or deposit/withdrawal check
            IF NEW.transaction_type = 'payout' OR NEW.transaction_type = 'withdrawal' THEN
                v_title := 'Withdrawal Successful';
                v_message := format('Withdrawal of %s %s processed. Purpose: %s', v_amount_formatted, NEW.currency, COALESCE(NEW.description, 'Standard Withdrawal'));
            ELSE
                v_message := format('Payment Made. Purpose: %s', COALESCE(NEW.description, 'None'));
            END IF;
        END IF;
        
        v_type := CASE 
            WHEN NEW.transaction_type IN ('payout', 'withdrawal') THEN 'withdrawal'::notification_type
            ELSE 'payment_sent'::notification_type
        END;
        
        INSERT INTO notifications (user_id, type, title, message, amount)
        VALUES (v_sender_user_id, v_type, v_title, v_message, format('-%s %s', v_amount_formatted, NEW.currency));
    END IF;

    -- Notifying Recipient (Payment Received)
    IF v_recipient_user_id IS NOT NULL THEN
        v_title := 'Payment Received';
        IF v_sender_name IS NOT NULL THEN
            v_message := format('Payment Received from %s. Purpose: %s', v_sender_name, COALESCE(NEW.description, 'None'));
        ELSE
            -- Check for deposit (no sender wallet)
            IF NEW.transaction_type = 'deposit' THEN
                v_message := format('Deposit of %s %s received successfully.', v_amount_formatted, NEW.currency);
            ELSE
                v_message := format('Payment Received. Purpose: %s', COALESCE(NEW.description, 'None'));
            END IF;
        END IF;

        v_type := 'payment_received'::notification_type;
        
        INSERT INTO notifications (user_id, type, title, message, amount)
        VALUES (v_recipient_user_id, v_type, v_title, v_message, format('+%s %s', v_amount_formatted, NEW.currency));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
