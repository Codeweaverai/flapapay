const crypto = require('crypto');

const normalize = (value) => String(value || '').trim();

const normalizeCounterpartyKey = ({ destinationType, destinationDetails = {}, provider = '' }) => {
    if (destinationType === 'bank_account') {
        const bankId = normalize(destinationDetails.bankId || destinationDetails.bankName).toLowerCase();
        const accountNumber = normalize(destinationDetails.accountNumber).replace(/\D/g, '');
        if (!accountNumber) return null;
        return `bank:${bankId}:${accountNumber}`;
    }

    if (destinationType === 'mobile_money') {
        const normalizedProvider = normalize(destinationDetails.provider || provider).toUpperCase();
        const phoneNumber = normalize(destinationDetails.phoneNumber).replace(/\D/g, '');
        if (!phoneNumber) return null;
        return `mobile_money:${normalizedProvider}:${phoneNumber}`;
    }

    return null;
};

const railFromDestinationType = (destinationType, provider = '') => {
    if (destinationType === 'bank_account') return 'bank';
    if (destinationType === 'mobile_money') return 'mobile_money';
    if (String(provider).toLowerCase() === 'pawapay') return 'mobile_money';
    if (String(provider).toLowerCase() === 'lenco') return 'bank';
    return 'wallet';
};

const toJson = (value) => {
    try {
        return JSON.stringify(value || {});
    } catch (err) {
        return '{}';
    }
};

const insertFraudEvent = async (db, event) => {
    const sql = `
        INSERT INTO fraud_events (
            id, event_type, source_system, occurred_at, livemode,
            user_id, wallet_id, merchant_id, connected_account_id,
            transaction_reference, provider_reference, rail, direction,
            currency, amount, fee_amount, status, counterparty_type,
            counterparty_key, country, ip_address, device_fingerprint,
            user_agent, metadata
        ) VALUES (
            gen_random_uuid(), $1, $2, COALESCE($3, NOW()), COALESCE($4, TRUE),
            $5, $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14, $15, $16, $17,
            $18, $19, $20, $21,
            $22, $23::jsonb
        )
        RETURNING id
    `;

    const values = [
        event.event_type,
        event.source_system || 'wallets',
        event.occurred_at || null,
        event.livemode,
        event.user_id || null,
        event.wallet_id || null,
        event.merchant_id || null,
        event.connected_account_id || null,
        event.transaction_reference || null,
        event.provider_reference || null,
        event.rail || null,
        event.direction || null,
        event.currency || null,
        event.amount || 0,
        event.fee_amount || 0,
        event.status || null,
        event.counterparty_type || null,
        event.counterparty_key || null,
        event.country || null,
        event.ip_address || null,
        event.device_fingerprint || null,
        event.user_agent || null,
        toJson(event.metadata)
    ];

    const result = await db.query(sql, values);
    return result.rows[0];
};

const buildWithdrawalEvent = ({
    eventType,
    sourceSystem = 'wallets',
    userId,
    walletId,
    reference,
    providerReference = null,
    provider = '',
    destinationType,
    destinationDetails = {},
    amount,
    feeAmount = 0,
    currency,
    status,
    livemode = true,
    ipAddress = null,
    userAgent = null,
    metadata = {}
}) => {
    const rail = railFromDestinationType(destinationType, provider);
    const counterpartyKey = normalizeCounterpartyKey({ destinationType, destinationDetails, provider });
    const country = normalize(destinationDetails.country || '').toUpperCase() || null;

    return {
        event_type: eventType,
        source_system: sourceSystem,
        livemode,
        user_id: userId,
        wallet_id: walletId,
        transaction_reference: reference,
        provider_reference: providerReference,
        rail,
        direction: 'debit',
        currency,
        amount,
        fee_amount: feeAmount,
        status,
        counterparty_type: destinationType,
        counterparty_key: counterpartyKey,
        country,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
            provider,
            destinationType,
            destinationDetails,
            ...metadata
        }
    };
};

module.exports = {
    insertFraudEvent,
    buildWithdrawalEvent,
};
