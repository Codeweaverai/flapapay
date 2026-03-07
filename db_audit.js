const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function audit() {
    try {
        console.log('--- TABLES ---');
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.rows.map(r => r.table_name).join(', '));

        console.log('\n--- ENUMS ---');
        const enums = await pool.query(`
            SELECT t.typname, e.enumlabel 
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            ORDER BY t.typname, e.enumsortorder
        `);
        console.log(enums.rows);

        console.log('\n--- TRIGGERS ---');
        const triggers = await pool.query("SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers");
        console.log(triggers.rows);

        console.log('\n--- ESCROW COLUMNS ---');
        const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'escrows'");
        console.log(cols.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
audit();
