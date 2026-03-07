const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678'
});

(async () => {
    try {
        console.log('Starting migration...');
        await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS allows_installments BOOLEAN DEFAULT FALSE');
        await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_paid DECIMAL(18, 2) DEFAULT 0');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS invoice_payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
                amount DECIMAL(18, 2) NOT NULL,
                currency VARCHAR(3) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                status VARCHAR(20) NOT NULL,
                transaction_reference VARCHAR(100),
                metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('Schema updated successfully');
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
})();
