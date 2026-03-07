-- Update Escrow Notification Triggers to include Amount
-- This script ensures the amount being secured is mentioned and stored in the dedicated column

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS escrow_notification_trigger ON escrows;
DROP FUNCTION IF EXISTS notify_escrow_lifecycle();

-- 2. Create refined lifecycle trigger function with amounts
CREATE OR REPLACE FUNCTION notify_escrow_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_name TEXT;
    v_seller_name TEXT;
    v_notification_payload JSONB;
    v_formatted_amount TEXT;
BEGIN
    -- Format amount for display
    v_formatted_amount := NEW.amount || ' ' || NEW.currency;

    -- Get names
    SELECT full_name INTO v_buyer_name FROM users WHERE id = NEW.buyer_id;
    SELECT full_name INTO v_seller_name FROM users WHERE id = NEW.seller_id;

    v_notification_payload = jsonb_build_object(
        'type', 'escrow_update',
        'escrow_id', NEW.id,
        'status', NEW.status,
        'amount', NEW.amount,
        'currency', NEW.currency
    );

    -- Status: CREATED -> Notify Seller
    IF (OLD.status IS NULL OR OLD.status = 'CREATED') AND NEW.status = 'CREATED' AND NEW.seller_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, amount, metadata, is_read, created_at)
        VALUES (NEW.seller_id, 'escrow', 'New Escrow Proposal', 'You have a new escrow proposal for ' || v_formatted_amount || ' from ' || COALESCE(v_buyer_name, 'a buyer'), v_formatted_amount, v_notification_payload, false, NOW());
    END IF;

    -- Status: FUNDED -> Notify Seller and Buyer
    IF (OLD.status = 'CREATED' OR OLD.status IS NULL) AND NEW.status = 'FUNDED' THEN
        -- Notify Seller
        IF NEW.seller_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, amount, metadata, is_read, created_at)
            VALUES (NEW.seller_id, 'escrow', 'Escrow Funds Secured', 'Funds of ' || v_formatted_amount || ' have been secured in escrow by ' || COALESCE(v_buyer_name, 'the buyer') || '. You may now proceed with delivery.', v_formatted_amount, v_notification_payload, false, NOW());
        END IF;
        -- Notify Buyer
        INSERT INTO notifications (user_id, type, title, message, amount, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Escrow Funded Successfully', 'Your funds (' || v_formatted_amount || ') are now held securely in escrow for your transaction with ' || COALESCE(v_seller_name, NEW.seller_email), '-' || v_formatted_amount, v_notification_payload, false, NOW());
    END IF;

    -- Status: DELIVERED -> Notify Buyer
    IF OLD.status = 'FUNDED' AND NEW.status = 'DELIVERED' THEN
        INSERT INTO notifications (user_id, type, title, message, amount, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Item/Service Delivered', COALESCE(v_seller_name, 'The seller') || ' has marked your ' || v_formatted_amount || ' transaction as delivered. Please confirm receipt to release funds.', v_formatted_amount, v_notification_payload, false, NOW());
    END IF;

    -- Status: RELEASED -> Notify Seller and Buyer
    IF (OLD.status = 'FUNDED' OR OLD.status = 'DELIVERED') AND NEW.status = 'RELEASED' THEN
        -- Notify Seller (Receiving money)
        IF NEW.seller_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, amount, metadata, is_read, created_at)
            VALUES (NEW.seller_id, 'escrow', 'Funds Released!', v_formatted_amount || ' has been released to your wallet from your escrow with ' || COALESCE(v_buyer_name, 'the buyer'), '+' || v_formatted_amount, v_notification_payload, false, NOW());
        END IF;
        -- Notify Buyer
        INSERT INTO notifications (user_id, type, title, message, amount, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Transaction Completed', 'You have released ' || v_formatted_amount || ' from escrow. The transaction is now complete.', v_formatted_amount, v_notification_payload, false, NOW());
    END IF;

    -- Status: DISPUTED -> Notify Both
    IF NEW.status = 'DISPUTED' AND OLD.status != 'DISPUTED' THEN
        INSERT INTO notifications (user_id, type, title, message, amount, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Escrow in Dispute', 'A dispute has been opened for your ' || v_formatted_amount || ' transaction. Our arbitration team will review it.', v_formatted_amount, v_notification_payload, false, NOW());
        
        IF NEW.seller_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, amount, metadata, is_read, created_at)
            VALUES (NEW.seller_id, 'escrow', 'Escrow in Dispute', 'The buyer has opened a dispute for the ' || v_formatted_amount || ' escrow transaction.', v_formatted_amount, v_notification_payload, false, NOW());
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-create the trigger
CREATE TRIGGER escrow_notification_trigger
AFTER INSERT OR UPDATE ON escrows
FOR EACH ROW
EXECUTE PROCEDURE notify_escrow_lifecycle();
