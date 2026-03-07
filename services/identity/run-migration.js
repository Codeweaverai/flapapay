const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345678@localhost:5432/flapapay_db',
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Read the migration file
        const fs = require('fs');
        const migrationSql = fs.readFileSync('./migrations/001_enhanced_auth.sql', 'utf8');
        
        // Execute the migration
        await client.query(migrationSql);
        console.log('Migration completed successfully');
        
        // Check if new tables were created
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('sessions', 'password_reset_tokens', 'email_verification_tokens', 'login_attempts')
        `);
        
        console.log('New tables created:', result.rows.map(r => r.table_name).join(', '));
        
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await client.end();
    }
}

runMigration();