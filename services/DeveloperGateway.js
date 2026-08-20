const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678'
});

const jwt = require('jsonwebtoken');
const {
    resolveApiKey,
    resolveEnvironment,
    ENVIRONMENT_CONTEXT_ENABLED,
    ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT,
} = require('./environmentContext');

class DeveloperGateway {
    static jwtSecret = process.env.JWT_SECRET || 'dev_secret_key_123';

    /**
     * Authenticates an API request using the Bearer token.
     * Supports both Merchant API Keys and User JWTs (for dashboard access).
     */
    static async authenticate(authHeader, context = {}) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Unauthorized: Missing or invalid API Key');
        }

        const tokenOrKey = authHeader.split(' ')[1];

        // 1. Try to find as an API Key first
        try {
            const keyData = await resolveApiKey(pool, tokenOrKey);
            const environment = ENVIRONMENT_CONTEXT_ENABLED
                ? await resolveEnvironment(pool, {
                    merchantId: keyData.merchant_id,
                    environmentId: keyData.environment_id,
                })
                : null;
            return {
                merchantId: keyData.merchant_id,
                merchantName: keyData.merchant_name,
                ownerId: keyData.owner_id,
                apiKeyId: keyData.api_key_id,
                environmentId: environment?.id || null,
                environmentSlug: environment?.slug || null,
                environment: ENVIRONMENT_CONTEXT_ENABLED
                    ? environment?.kind
                    : (keyData.environment || 'test'),
                permissions: keyData.permissions || [],
            };
        } catch (error) {
            if (error?.code !== 'INVALID_API_KEY') throw error;
        }

        // 2. Fallback: Try to verify as a JWT (Merchant User Session)
        try {
            const decoded = jwt.verify(tokenOrKey, this.jwtSecret);
            const merchRes = await pool.query(
                `SELECT m.id as merchant_id, m.business_name as merchant_name, m.user_id as owner_id 
                 FROM merchants m 
                 WHERE m.user_id = $1`,
                [decoded.userId]
            );

            if (merchRes.rows.length === 0) {
                throw new Error('Unauthorized: No merchant account found for this user');
            }

            const merchant = merchRes.rows[0];
            if (ENVIRONMENT_CONTEXT_ENABLED && ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT && !context.environmentId) {
                throw new Error('Environment context is required for dashboard API access');
            }
            const environment = await resolveEnvironment(pool, {
                merchantId: merchant.merchant_id,
                environmentId: context.environmentId || null,
            });
            return {
                merchantId: merchant.merchant_id,
                merchantName: merchant.merchant_name,
                ownerId: merchant.owner_id,
                apiKeyId: null,
                environmentId: ENVIRONMENT_CONTEXT_ENABLED ? environment.id : null,
                environmentSlug: ENVIRONMENT_CONTEXT_ENABLED ? environment.slug : null,
                environment: ENVIRONMENT_CONTEXT_ENABLED ? environment.kind : 'live',
                permissions: ['all']
            };
        } catch (err) {
            if (err.message.includes('No merchant account')) throw err;
            throw new Error('Unauthorized: Invalid API Key or Session Token');
        }
    }

    /**
     * Helper to wrap escrow requests with developer-friendly responses.
     */
    static formatResponse(data, environment) {
        if (Array.isArray(data)) {
            return data.map(item => this.formatResponse(item, environment));
        }
        return {
            ...data,
            environment: environment
        };
    }
}

module.exports = DeveloperGateway;
