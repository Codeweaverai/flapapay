-- Comprehensive Notification and Trigger Fix for Escrow
-- 1. Add 'escrow' to notification_type enum if it doesn't exist
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'escrow';

-- 2. Clean up old triggers/functions
DROP TRIGGER IF EXISTS escrow_notification_trigger ON escrows;
DROP FUNCTION IF EXISTS notify_escrow_update();

-- 3. Create refined lifecycle trigger function for dual notifications
CREATE OR REPLACE FUNCTION notify_escrow_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_name TEXT;
    v_seller_name TEXT;
    v_notification_payload JSONB;
BEGIN
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

    -- LOGIC: Trigger on multiple status changes
    
    -- Status: CREATED -> Notify Seller
    IF (OLD.status IS NULL OR OLD.status = 'CREATED') AND NEW.status = 'CREATED' AND NEW.seller_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.seller_id, 'escrow', 'New Escrow Proposal', 'You have a new escrow proposal from ' || COALESCE(v_buyer_name, 'a buyer') || ' for ' || NEW.amount || ' ' || NEW.currency, v_notification_payload, false, NOW());
    END IF;

    -- Status: FUNDED -> Notify Seller and Buyer
    IF (OLD.status = 'CREATED' OR OLD.status IS NULL) AND NEW.status = 'FUNDED' THEN
        -- Notify Seller
        IF NEW.seller_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
            VALUES (NEW.seller_id, 'escrow', 'Escrow Funds Secured', 'Funds have been secured in escrow by ' || COALESCE(v_buyer_name, 'the buyer') || '. You may now proceed with delivery.', v_notification_payload, false, NOW());
        END IF;
        -- Notify Buyer (Confirmation)
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Escrow Funded Successfully', 'Your funds are now held securely in escrow for your transaction with ' || COALESCE(v_seller_name, NEW.seller_email), v_notification_payload, false, NOW());
    END IF;

    -- Status: DELIVERED -> Notify Buyer
    IF OLD.status = 'FUNDED' AND NEW.status = 'DELIVERED' THEN
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Item/Service Delivered', COALESCE(v_seller_name, 'The seller') || ' has marked the item as delivered. Please confirm receipt to release funds.', v_notification_payload, false, NOW());
    END IF;

    -- Status: RELEASED -> Notify Seller and Buyer
    IF (OLD.status = 'FUNDED' OR OLD.status = 'DELIVERED') AND NEW.status = 'RELEASED' THEN
        -- Notify Seller
        IF NEW.seller_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
            VALUES (NEW.seller_id, 'escrow', 'Funds Released!', 'The buyer has confirmed receipt and funds have been released to your wallet.', v_notification_payload, false, NOW());
        END IF;
        -- Notify Buyer
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Transaction Completed', 'You have released the funds. The transaction is now complete.', v_notification_payload, false, NOW());
    END IF;

    -- Status: DISPUTED -> Notify Both
    IF NEW.status = 'DISPUTED' AND OLD.status != 'DISPUTED' THEN
        INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
        VALUES (NEW.buyer_id, 'escrow', 'Escrow in Dispute', 'A dispute has been opened. Our arbitration team will review the details shortly.', v_notification_payload, false, NOW());
        
        IF NEW.seller_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at)
            VALUES (NEW.seller_id, 'escrow', 'Escrow in Dispute', 'The buyer has opened a dispute. Funds remain locked until resolution.', v_notification_payload, false, NOW());
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Re-create the trigger for BOTH insert and update
CREATE TRIGGER escrow_notification_trigger
AFTER INSERT OR UPDATE ON escrows
FOR EACH ROW
EXECUTE PROCEDURE notify_escrow_lifecycle();
