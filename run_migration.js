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
        const sql = fs.readFileSync(path.join(__dirname, 'create_invoices.sql'), 'utf8');
        await client.query(sql);
        console.log('Successfully executed create_invoices.sql');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
})();
