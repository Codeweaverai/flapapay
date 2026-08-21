'use strict';

/**
 * P0 environment context for FlapaPay.
 *
 * Rollout flags:
 *   ENVIRONMENT_CONTEXT_ENABLED=false  -> legacy callers may continue temporarily.
 *   ENVIRONMENT_CONTEXT_ENABLED=true   -> API keys must be linked to an environment.
 *   ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT=true -> dashboard JWT requests must send
 *       x-flapapay-environment-id; use only after the dashboard switch is released.
 *
 * This module is intentionally dependency-injected with a pg Pool so it can be
 * used by unified-server.js and DeveloperGateway.js without creating a second
 * database connection strategy.
 */

const ENVIRONMENT_CONTEXT_ENABLED = process.env.ENVIRONMENT_CONTEXT_ENABLED === 'true';
const ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT = process.env.ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT === 'true';
const ENVIRONMENT_HEADER = 'x-flapapay-environment-id';

class EnvironmentError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

function readEnvironmentId(req) {
    const value = req.headers[ENVIRONMENT_HEADER];
    if (Array.isArray(value)) return value[0];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function resolveEnvironment(pool, { merchantId, environmentId, kind = null, slug = null }) {
    if (!merchantId) {
        throw new EnvironmentError(401, 'MERCHANT_REQUIRED', 'Merchant context is required');
    }

    const predicates = ['merchant_id = $1', "status = 'active'"];
    const params = [merchantId];

    if (environmentId) {
        params.push(environmentId);
        predicates.push(`id = $${params.length}`);
    } else if (slug) {
        params.push(slug);
        predicates.push(`slug = $${params.length}`);
    } else if (kind) {
        params.push(kind);
        predicates.push(`kind = $${params.length}`);
    } else {
        // Compatibility default only during the migration window. Once the
        // dashboard sends the header on every request, require explicit mode.
        predicates.push("kind = 'live'");
    }

    const result = await pool.query(
        `SELECT id, merchant_id, name, slug, kind, status
         FROM merchant_environments
         WHERE ${predicates.join(' AND ')}
         LIMIT 1`,
        params,
    );

    if (result.rows.length === 0) {
        throw new EnvironmentError(403, 'ENVIRONMENT_NOT_ACCESSIBLE', 'Requested environment is not accessible');
    }

    return result.rows[0];
}

async function assertLiveEnvironmentEligible(pool, merchantId, environment) {
    if (environment?.kind !== 'live') return environment;
    const result = await pool.query(
        `SELECT compliance_status, is_live_enabled
           FROM merchants
          WHERE id = $1
          LIMIT 1`,
        [merchantId],
    );
    const merchant = result.rows[0];
    if (!merchant || merchant.compliance_status !== 'ACTIVE' || merchant.is_live_enabled !== true) {
        throw new EnvironmentError(409, 'LIVE_COMPLIANCE_REQUIRED', 'Live environment requires approved merchant compliance');
    }
    return environment;
}

async function resolveApiKey(pool, rawKey) {
    const result = await pool.query(
        `SELECT
            k.id AS api_key_id,
            k.merchant_id,
            k.key_type,
            k.key_value,
            k.is_active,
            k.environment_id,
            k.mode,
            m.business_name AS merchant_name,
            m.user_id AS owner_id,
            me.name AS environment_name,
            me.slug AS environment_slug,
            me.kind AS environment_kind,
            me.status AS environment_status
         FROM api_keys k
         JOIN merchants m ON m.id = k.merchant_id
         LEFT JOIN merchant_environments me ON me.id = k.environment_id
         WHERE k.key_value = $1
           AND k.is_active = TRUE
         LIMIT 1`,
        [rawKey],
    );

    if (result.rows.length === 0) {
        throw new EnvironmentError(401, 'INVALID_API_KEY', 'Invalid API key');
    }

    const key = result.rows[0];
    if (ENVIRONMENT_CONTEXT_ENABLED && !key.environment_id) {
        throw new EnvironmentError(403, 'API_KEY_ENVIRONMENT_REQUIRED', 'API key has not been assigned to an environment');
    }
    if (ENVIRONMENT_CONTEXT_ENABLED && key.environment_status !== 'active') {
        throw new EnvironmentError(403, 'ENVIRONMENT_NOT_ACTIVE', 'API key environment is not active');
    }

    return key;
}

async function attachApiKeyEnvironment(req, pool, rawKey) {
    const key = await resolveApiKey(pool, rawKey);
    const environment = await resolveEnvironment(pool, {
        merchantId: key.merchant_id,
        environmentId: key.environment_id,
        kind: key.environment_id ? null : (String(key.key_type || '').startsWith('test_') ? 'sandbox' : 'live'),
    });
    await assertLiveEnvironmentEligible(pool, key.merchant_id, environment);

    req.merchant = {
        ...key,
        merchant_id: key.merchant_id,
        user_id: key.owner_id,
    };
    req.apiKeyId = key.api_key_id;
    req.environmentId = environment.id;
    req.environmentKind = environment.kind;
    req.environmentSlug = environment.slug;
    req.isTestMode = req.environmentKind === 'sandbox';
    req.environmentSource = ENVIRONMENT_CONTEXT_ENABLED ? 'api_key' : 'legacy_key_type';

    return req;
}

async function attachJwtEnvironment(req, pool, { merchantId, actorUserId }) {
    const requestedEnvironmentId = readEnvironmentId(req);
    if (ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT && !requestedEnvironmentId) {
        throw new EnvironmentError(400, 'ENVIRONMENT_REQUIRED', `Header ${ENVIRONMENT_HEADER} is required`);
    }

    let environment;
    if (requestedEnvironmentId) {
        environment = await resolveEnvironment(pool, {
            merchantId,
            environmentId: requestedEnvironmentId,
        });
        await assertLiveEnvironmentEligible(pool, merchantId, environment);
    } else {
        try {
            environment = await resolveEnvironment(pool, { merchantId, kind: 'live' });
            await assertLiveEnvironmentEligible(pool, merchantId, environment);
        } catch (error) {
            if (error?.code !== 'LIVE_COMPLIANCE_REQUIRED') throw error;
            environment = await resolveEnvironment(pool, { merchantId, kind: 'sandbox' });
        }
    }

    // P0 rule: until environment-specific team grants exist, only the merchant
    // owner may use the dashboard environment context. Expand this check to a
    // merchant_environment_members table in the RBAC phase.
    if (ENVIRONMENT_CONTEXT_ENABLED) {
        const owner = await pool.query(
            'SELECT 1 FROM merchants WHERE id = $1 AND user_id = $2 LIMIT 1',
            [merchantId, actorUserId],
        );
        if (owner.rows.length === 0) {
            throw new EnvironmentError(403, 'ENVIRONMENT_ACCESS_DENIED', 'User is not the merchant owner for this environment');
        }
    }

    req.environmentId = environment.id;
    req.environmentKind = environment.kind;
    req.environmentSlug = environment.slug;
    req.environmentSource = requestedEnvironmentId
        ? 'jwt_header'
        : (environment.kind === 'sandbox' ? 'compliance_sandbox_default' : 'compat_live_default');
    req.isTestMode = environment.kind === 'sandbox';
    return req;
}

function environmentResponse(req) {
    return {
        id: req.environmentId,
        kind: req.environmentKind,
        slug: req.environmentSlug || null,
        isTestMode: req.isTestMode === true,
    };
}
function assertProviderRailSafe(context, providerName = 'provider') {
    const kind = context?.environmentKind || (context?.isTestMode ? 'sandbox' : 'live');
    if (ENVIRONMENT_CONTEXT_ENABLED && kind === 'sandbox' && process.env.SANDBOX_PROVIDER_ENABLED !== 'true') {
        const error = new EnvironmentError(409, 'SANDBOX_PROVIDER_DISABLED', `Sandbox environment cannot invoke ${providerName} provider rails`);
        throw error;
    }
    return true;
}
function environmentErrorHandler(error, res) {
    if (error instanceof EnvironmentError) {
        return res.status(error.status).json({ error: error.message, code: error.code });
    }
    throw error;
}

module.exports = {
    ENVIRONMENT_HEADER,
    ENVIRONMENT_CONTEXT_ENABLED,
    ENVIRONMENT_CONTEXT_REQUIRE_EXPLICIT,
    EnvironmentError,
    readEnvironmentId,
    resolveEnvironment,
    assertLiveEnvironmentEligible,
    resolveApiKey,
    attachApiKeyEnvironment,
    attachJwtEnvironment,
    environmentResponse,
    assertProviderRailSafe,
    environmentErrorHandler,
};
