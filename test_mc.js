require('dotenv').config();
const { Pool } = require('pg');
const MastercardCardService = require('./services/MastercardCardService');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function main() {
    try {
        const res = await pool.query('SELECT card_contract_id FROM virtual_cards ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length === 0) {
            console.log('No virtual cards found.');
            process.exit(0);
        }
        const cardContractId = res.rows[0].card_contract_id;
        console.log(`Testing with Card Contract ID: ${cardContractId}`);

        const mcDetails = await MastercardCardService.getCardDetails(cardContractId);
        console.log('Mastercard Response:');
        console.log(JSON.stringify(mcDetails, null, 2));

    } catch (err) {
        if (err.response) {
            console.error('API Error:', err.response.data);
        } else {
            console.error('Error:', err);
        }
    } finally {
        pool.end();
    }
}

main();
