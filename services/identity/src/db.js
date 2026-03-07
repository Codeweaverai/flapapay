const { Client } = require('pg');
require('dotenv').config();

// Create a single client instance
let client = null;

// Function to initialize the client
const initializeClient = () => {
    if (!client) {
        client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: false, // Disable SSL for local development
        });

        // Handle client errors gracefully
        client.on('error', (err) => {
            console.error('PostgreSQL client error:', err);
            // Don't crash the process, just log the error
        });

        // Connect to the database
        client.connect()
            .then(() => {
                console.log('Connected to PostgreSQL database');
            })
            .catch(err => {
                console.error('Failed to connect to PostgreSQL database:', err);
            });
    }
    return client;
};

// Function to execute queries with error handling and retries
const query = async (text, params) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        try {
            // Initialize client if not already done
            if (!client) {
                initializeClient();
            }
            
            // Execute the query
            const result = await client.query(text, params);
            return result;
        } catch (error) {
            attempts++;
            console.error(`Database query attempt ${attempts} failed:`, error.message);
            
            // If this was the last attempt, throw the error
            if (attempts >= maxAttempts) {
                console.error('All database query attempts failed');
                throw error;
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
        }
    }
};

// Function to safely execute queries with connection recovery
const safeQuery = async (text, params) => {
    try {
        return await query(text, params);
    } catch (error) {
        console.error('Query failed, attempting to reconnect:', error.message);
        
        // Try to reconnect
        if (client) {
            try {
                await client.end();
            } catch (e) {
                console.error('Error ending client connection:', e);
            }
        }
        
        // Reinitialize the client
        client = null;
        initializeClient();
        
        // Retry the query once more after reconnection
        try {
            return await query(text, params);
        } catch (retryError) {
            console.error('Retry after reconnection also failed:', retryError.message);
            throw retryError;
        }
    }
};

// Export the client and query function
module.exports = {
    client: initializeClient(),
    query: safeQuery,
    initializeClient
};