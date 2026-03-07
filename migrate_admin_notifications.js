const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create the admin notifications table
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) NOT NULL, -- security, user, system, transaction
                read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create trigger function for NEW USERS
        await client.query(`
            CREATE OR REPLACE FUNCTION notify_new_user()
            RETURNS TRIGGER AS $$
            BEGIN
                INSERT INTO admin_notifications (title, message, type)
                VALUES (
                    'New User Registration',
                    'A new user ' || NEW.full_name || ' (' || NEW.email || ') has registered.',
                    'user'
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Drop trigger if exists, then create
        await client.query(`DROP TRIGGER IF EXISTS trigger_new_user_notification ON users;`);
        await client.query(`
            CREATE TRIGGER trigger_new_user_notification
            AFTER INSERT ON users
            FOR EACH ROW
            EXECUTE FUNCTION notify_new_user();
        `);

        // Create trigger function for ALL TRANSACTIONS
        await client.query(`
            CREATE OR REPLACE FUNCTION notify_transaction()
            RETURNS TRIGGER AS $$
            BEGIN
                INSERT INTO admin_notifications (title, message, type)
                VALUES (
                    'Transaction Executed',
                    'A transaction (' || NEW.transaction_type || ') of ' || NEW.amount || ' ' || NEW.currency || ' has occurred. (Ref: ' || NEW.transaction_reference || ')',
                    'transaction'
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Drop trigger if exists, then create
        await client.query(`DROP TRIGGER IF EXISTS trigger_transaction_notification ON ledger_entries;`);
        await client.query(`DROP TRIGGER IF EXISTS trigger_large_transaction_notification ON ledger_entries;`);
        await client.query(`
            CREATE TRIGGER trigger_transaction_notification
            AFTER INSERT ON ledger_entries
            FOR EACH ROW
            EXECUTE FUNCTION notify_transaction();
        `);

        await client.query('COMMIT');
        console.log("Admin notifications schema and triggers created successfully.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", err);
    } finally {
        client.release();
        process.exit();
    }
}

run();
