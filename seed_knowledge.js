const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'flapapay_db',
    password: '12345678',
    port: 5432
});

const articles = [
    {
        title: 'How to get a Virtual Card',
        category: 'cards',
        content: 'To get a FlapaPay Virtual Card, navigate to the Cards tab in your dashboard. Click on "Create New Card", choose your currency (USD or ZMW), and confirm. Your card will be active instantly for online payments. USD cards are Mastercard branded and ZMW cards are Visa branded.'
    },
    {
        title: 'KYC Verification Process',
        category: 'account',
        content: 'FlapaPay requires KYC for high-value transactions. Go to Profile -> KYC, upload a valid Government ID and a recently taken selfie. Processing usually takes 24-48 hours. You will receive a notification once verified. Statuses: PENDING, APPROVED, REJECTED.'
    },
    {
        title: 'Mobile Money Deposits (PawaPay)',
        category: 'payments',
        content: 'You can deposit funds using mobile money via our partner PawaPay. Go to Wallets -> Deposit, select "Mobile Money", enter your number and the amount. You will receive a prompt on your phone to authorize the transaction. Supported networks: MTN, Airtel, Zamtel.'
    },
    {
        title: 'Reporting Transaction Issues',
        category: 'support',
        content: 'If a transaction fails but funds were deducted, navigate to Transactions, click on the specific record, and use the "Report Issue" button. Provide the Transaction Hash and our team will resolve it within 4 hours. You can also view the Global Ledger to track your funds.'
    }
];

async function updateKB() {
    try {
        for (const a of articles) {
            const slug = a.title.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '');
            await pool.query(
                'INSERT INTO help_articles (title, category, content, slug) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content',
                [a.title, a.category, a.content, slug]
            );
        }
        console.log('Knowledge base updated successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error updating KB:', err);
        process.exit(1);
    }
}

updateKB();
