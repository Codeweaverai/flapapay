const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678'
});

async function check() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('ai_chat_sessions', 'ai_chat_messages', 'help_articles')");
        console.log('Tables found:', res.rows.map(r => r.table_name));

        const articles = await pool.query("SELECT count(*) FROM help_articles");
        console.log('Total help articles:', articles.rows[0].count);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
check();
