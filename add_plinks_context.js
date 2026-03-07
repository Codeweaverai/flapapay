const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function addDocs() {
    try {
        await pool.query(
            `INSERT INTO help_articles (title, category, content, slug) VALUES ($1, $2, $3, $4)`,
            [
                'Payment Links & Websites Widget',
                'API Documentation',
                'FlapaPay allows merchants to create reusable payment links and embed them directly into their websites as a payment widget. To create a payment link, send a POST request to /v1/payment-links with amount, currency, and description. To embed the widget on a website, include the FlapaPay Widget script (`<script src="https://js.flapapay.com/v1/widget.js"></script>`) in your HTML, and call `FlapaPayWidget.open({ paymentLinkId: "plink_..." })` on a button click.',
                'payment-links-website-widget'
            ]
        );
        console.log('Payment Links documentation added to AI database context.');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
addDocs();
