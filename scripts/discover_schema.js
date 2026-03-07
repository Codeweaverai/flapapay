const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function discoverSchema() {
    try {
        console.log('--- Discovering Tables ---');
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

        console.log('\n--- Discovering Triggers ---');
        const triggers = await pool.query("SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers");
        console.log('Triggers:', JSON.stringify(triggers.rows, null, 2));

        console.log('\n--- Discovering Users Table ---');
        const userCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Users Columns:', JSON.stringify(userCols.rows, null, 2));

        console.log('\n--- Discovering Notifications Table ---');
        const notifCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'");
        console.log('Notifications Columns:', JSON.stringify(notifCols.rows, null, 2));

    } catch (err) {
        console.error('Schema discovery error:', err);
    } finally {
        await pool.end();
    }
}

discoverSchema();
