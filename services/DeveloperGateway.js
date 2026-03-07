const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678'
});

class DeveloperGateway {
    /**
     * Authenticates an API request using the Bearer token.
     * Returns the merchant object if valid, otherwise throws error.
     */
    static async authenticate(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Unauthorized: Missing or invalid API Key');
        }

        const apiKey = authHeader.split(' ')[1];

        // Find key in database
        // Note: In production, keys should be hashed or use a cache.
        const keyRes = await pool.query(
            `SELECT a.*, m.business_name as merchant_name, m.user_id as owner_id 
             FROM api_keys a 
             JOIN merchants m ON a.merchant_id = m.id 
             WHERE a.key_value = $1`,
            [apiKey]
        );

        if (keyRes.rows.length === 0) {
            throw new Error('Unauthorized: Invalid API Key');
        }

        const keyData = keyRes.rows[0];
        // You can add logic here to check if the merchant is active/verified.

        return {
            merchantId: keyData.merchant_id,
            merchantName: keyData.merchant_name,
            ownerId: keyData.owner_id,
            environment: keyData.environment, // 'test' or 'live'
            permissions: keyData.permissions
        };
    }

    /**
     * Helper to wrap escrow requests with developer-friendly responses.
     */
    static formatResponse(data, environment) {
        return {
            id: data.id,
            status: data.status,
            amount: data.amount,
            currency: data.currency,
            description: data.description,
            environment: environment,
            links: {
                self: `/api/v1/escrows/${data.id}`,
                checkout: `https://flapapay.com/escrow-gateway/${data.id}?env=${environment}`
            }
        };
    }
}

module.exports = DeveloperGateway;
