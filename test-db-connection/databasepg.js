// databasepg.js - PostgreSQL client connection test
const { Client } = require('pg');

// PostgreSQL connection configuration
const client = new Client({
    host: 'localhost',        // Host where PostgreSQL is running
    port: 5432,               // Default PostgreSQL port
    database: 'flapapay_db',  // Database name
    user: 'postgres',         // Database user
    password: '12345678',     // Database password
    ssl: false                // Disable SSL for local connection
});

async function testConnection() {
    try {
        console.log('Attempting to connect to PostgreSQL...');
        
        // Connect to the database
        await client.connect();
        console.log('Connected to PostgreSQL successfully!');
        
        // Test query to verify connection
        console.log('Executing test query...');
        const result = await client.query('SELECT NOW() as timestamp, version() as postgres_version;');
        
        console.log('Test query successful!');
        console.log('Current timestamp:', result.rows[0].timestamp);
        console.log('PostgreSQL version:', result.rows[0].postgres_version);
        
        // Query to check if our tables exist
        console.log('\nChecking for existing tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log('Tables in database:');
        tablesResult.rows.forEach(row => {
            console.log('- ' + row.table_name);
        });
        
        // Test with a simple query on our users table if it exists
        try {
            const usersResult = await client.query('SELECT COUNT(*) as user_count FROM users LIMIT 5;');
            console.log('\nUsers table exists with', usersResult.rows[0].user_count, 'records');
        } catch (err) {
            console.log('\nUsers table does not exist or has an error:', err.message);
        }
        
    } catch (err) {
        console.error('Error connecting to PostgreSQL:', err.message);
    } finally {
        // Close the connection
        await client.end();
        console.log('Connection closed.');
    }
}

// Run the test
testConnection();