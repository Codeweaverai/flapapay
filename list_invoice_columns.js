const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

async function listColumns() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'invoices'
        `);

        if (res && res.rows) {
            const output = res.rows.map(row => `${row.column_name} (${row.data_type})`).join('\n');
            fs.writeFileSync('invoices_columns.txt', output || 'No columns found');
            console.log('Columns written to invoices_columns.txt');
        } else {
            console.log('No result returned from query');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listColumns();
