import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a single client instance instead of a pool
let client: Client | null = null;

// Function to initialize the client
const initializeClient = (): Client => {
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
export const query = async (text: string, params?: any[]) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        try {
            // Initialize client if not already done
            if (!client) {
                initializeClient();
            }
            
            // Execute the query
            const result = await client!.query(text, params);
            return result;
        } catch (error: any) {
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
    throw new Error('Query function should not reach this point');
};

// Function to safely execute queries with connection recovery
export const safeQuery = async (text: string, params?: any[]) => {
    try {
        return await query(text, params);
    } catch (error: any) {
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
        } catch (retryError: any) {
            console.error('Retry after reconnection also failed:', retryError.message);
            throw retryError;
        }
    }
};

// Initialize the client when module loads
initializeClient();

export default { client, query, initializeClient };
