const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('1. Updating escrow_status enum...');
        await client.query("ALTER TYPE escrow_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT'");
        await client.query("ALTER TYPE escrow_status ADD VALUE IF NOT EXISTS 'SHIPPED'");
        await client.query("ALTER TYPE escrow_status ADD VALUE IF NOT EXISTS 'ADMIN_REVIEW'");

        console.log('2. Updating notification tables...');
        await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(50)");
        await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'");
        await client.query("ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium'");
        await client.query("ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'");

        console.log('3. Implementing notify_escrow_lifecycle function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION notify_escrow_lifecycle()
            RETURNS TRIGGER AS $$
            DECLARE
                buyer_msg TEXT;
                seller_msg TEXT;
                admin_msg TEXT;
            BEGIN
                -- Status: FUNDED
                IF (TG_OP = 'UPDATE' AND NEW.status = 'FUNDED' AND OLD.status != 'FUNDED') THEN
                    buyer_msg := 'Your payment for escrow ' || NEW.id || ' has been secured.';
                    seller_msg := 'Funds for escrow ' || NEW.id || ' have been secured. You can now ship the item.';
                    
                    INSERT INTO notifications (user_id, escrow_id, event_type, message, channel)
                    VALUES (NEW.buyer_id, NEW.id, 'escrow', buyer_msg, 'in-app');
                    
                    IF NEW.seller_id IS NOT NULL THEN
                        INSERT INTO notifications (user_id, escrow_id, event_type, message, channel)
                        VALUES (NEW.seller_id, NEW.id, 'escrow', seller_msg, 'in-app');
                    END IF;
                END IF;

                -- Status: SHIPPED
                IF (TG_OP = 'UPDATE' AND NEW.status = 'SHIPPED' AND OLD.status != 'SHIPPED') THEN
                    buyer_msg := 'Seller has marked escrow ' || NEW.id || ' as SHIPPED. Please confirm delivery once received.';
                    INSERT INTO notifications (user_id, escrow_id, event_type, message, channel)
                    VALUES (NEW.buyer_id, NEW.id, 'escrow', buyer_msg, 'in-app');
                END IF;

                -- Status: DELIVERED
                IF (TG_OP = 'UPDATE' AND NEW.status = 'DELIVERED' AND OLD.status != 'DELIVERED') THEN
                    buyer_msg := 'Escrow ' || NEW.id || ' marked as DELIVERED. Inspection period is active.';
                    seller_msg := 'Buyer confirmed delivery for escrow ' || NEW.id || '.';
                    
                    INSERT INTO notifications (user_id, escrow_id, event_type, message, channel)
                    VALUES (NEW.buyer_id, NEW.id, 'escrow', buyer_msg, 'in-app');
                    
                    IF NEW.seller_id IS NOT NULL THEN
                        INSERT INTO notifications (user_id, escrow_id, event_type, message, channel)
                        VALUES (NEW.seller_id, NEW.id, 'escrow', seller_msg, 'in-app');
                    END IF;
                END IF;

                -- Status: RELEASE_REQUESTED
                IF (TG_OP = 'UPDATE' AND NEW.status = 'RELEASE_REQUESTED' AND OLD.status != 'RELEASE_REQUESTED') THEN
                    admin_msg := 'Escrow ' || NEW.id || ' requires payout review.';
                    INSERT INTO admin_notifications (escrow_id, event_type, message, priority)
                    VALUES (NEW.id, 'escrow_review', admin_msg, 'medium');
                END IF;

                -- Status: ADMIN_REVIEW (High Priority/Risk)
                IF (TG_OP = 'UPDATE' AND NEW.status = 'ADMIN_REVIEW' AND OLD.status != 'ADMIN_REVIEW') THEN
                    admin_msg := 'Escrow ' || NEW.id || ' entered ADMIN_REVIEW (Manual Intervention Required).';
                    INSERT INTO admin_notifications (escrow_id, event_type, message, priority)
                    VALUES (NEW.id, 'escrow_alert', admin_msg, 'high');
                END IF;

                -- Status: DISPUTED
                IF (TG_OP = 'UPDATE' AND NEW.status = 'DISPUTED' AND OLD.status != 'DISPUTED') THEN
                    admin_msg := 'A dispute has been opened for escrow ' || NEW.id || '.';
                    INSERT INTO admin_notifications (escrow_id, event_type, message, priority)
                    VALUES (NEW.id, 'escrow_dispute', admin_msg, 'high');
                    
                    INSERT INTO notifications (user_id, escrow_id, event_type, message, channel)
                    VALUES (NEW.buyer_id, NEW.id, 'escrow', 'Dispute opened for your transaction.', 'in-app');
                    
                    IF NEW.seller_id IS NOT NULL THEN
                        INSERT INTO notifications (user_id, escrow_id, event_type, message, channel)
                        VALUES (NEW.seller_id, NEW.id, 'escrow', 'A dispute has been opened by the buyer.', 'in-app');
                    END IF;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log('4. Attaching trigger...');
        await client.query("DROP TRIGGER IF EXISTS trg_escrow_lifecycle ON escrows");
        await client.query(`
            CREATE TRIGGER trg_escrow_lifecycle
            AFTER UPDATE ON escrows
            FOR EACH ROW
            EXECUTE FUNCTION notify_escrow_lifecycle();
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}
migrate();
