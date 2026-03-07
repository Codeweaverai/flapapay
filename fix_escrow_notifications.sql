-- Fix Escrow Notification Triggers
-- This script fixes the "read" vs "is_read" column mismatch and adds dual-party notifications

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS escrow_notification_trigger ON escrows;
DROP FUNCTION IF EXISTS notify_escrow_update();

-- 2. Create refined lifecycle trigger function
CREATE OR REPLACE FUNCTION notify_escrow_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_name TEXT;
    v_seller_name TEXT;
    v_notification_payload JSONB;
BEGIN
    -- Get names for better messages
    SELECT full_name INTO v_buyer_name FROM users WHERE id = NEW.buyer_id;
    SELECT full_name INTO v_seller_name FROM users WHERE id = NEW.seller_id;

    v_notification_payload = jsonb_build_object(
        'type', 'escrow_update',
        'escrow_id', NEW.id,
        'status', NEW.status,
        'amount', NEW.amount,
        'currency', NEW.currency
    );

    -- LOGIC FOR NOTIFICATIONS BASED ON STATUS CHANGE
    
    -- Status: CREATED -> Notify Seller (even if seller_id is null, we can't notify via DB yet, but if registered we do)
    IF (OLD.status IS NULL OR OLD.status = 'CREATED') AND NEW.status = 'CREATED' AND NEW.seller_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.seller_id, 'escrow', 'New Escrow Proposal', 'You have a new escrow proposal from ' || v_buyer_name || ' for ' || NEW.amount || ' ' || NEW.currency, v_notification_payload, false, NOW());
    END IF;

    -- Status: FUNDED -> Notify Seller primarily
    IF OLD.status = 'CREATED' AND NEW.status = 'FUNDED' THEN
        IF NEW.seller_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
            VALUES (NEW.seller_id, 'escrow', 'Escrow Funded', 'Funds have been secured for your transaction with ' || v_buyer_name || '. You can now proceed with delivery.', v_notification_payload, false, NOW());
        END IF;
        
        -- Confirmation to Buyer
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Escrow Secured', 'Your funds for ' || NEW.amount || ' ' || NEW.currency || ' are now held securely in escrow.', v_notification_payload, false, NOW());
    END IF;

    -- Status: DELIVERED -> Notify Buyer
    IF OLD.status = 'FUNDED' AND NEW.status = 'DELIVERED' THEN
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Item Delivered', v_seller_name || ' has marked your transaction as delivered. Please confirm receipt to release funds.', v_notification_payload, false, NOW());
    END IF;

    -- Status: RELEASED -> Notify Seller
    IF OLD.status IN ('FUNDED', 'DELIVERED') AND NEW.status = 'RELEASED' THEN
        IF NEW.seller_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
            VALUES (NEW.seller_id, 'escrow', 'Funds Released', 'Success! ' || v_buyer_name || ' has released the funds. ' || NEW.amount || ' ' || NEW.currency || ' has been added to your wallet.', v_notification_payload, false, NOW());
        END IF;
        
        -- Confirmation to Buyer
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Transaction Completed', 'Escrow transaction with ' || v_seller_name || ' is now complete.', v_notification_payload, false, NOW());
    END IF;

    -- Status: DISPUTED -> Notify Both
    IF NEW.status = 'DISPUTED' AND OLD.status != 'DISPUTED' THEN
        -- Notify Buyer
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Dispute Opened', 'A dispute has been opened for your escrow with ' || v_seller_name || '. Our team will review the case.', v_notification_payload, false, NOW());
        
        -- Notify Seller
        IF NEW.seller_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
            VALUES (NEW.seller_id, 'escrow', 'Dispute Opened', 'A dispute has been opened for your escrow with ' || v_buyer_name || '. Funds are currently locked.', v_notification_payload, false, NOW());
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Trigger
CREATE TRIGGER escrow_notification_trigger
AFTER INSERT OR UPDATE ON escrows
FOR EACH ROW
EXECUTE PROCEDURE notify_escrow_lifecycle();
