const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
});

(async () => {
    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, 'enhance_invoices_schema.sql'), 'utf8');
        await client.query(sql);
        console.log('Successfully applied enhanced invoice schema changes');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
})();
