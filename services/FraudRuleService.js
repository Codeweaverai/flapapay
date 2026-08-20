const FraudScoringService = require('./FraudScoringService');

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toArray = (value) => Array.isArray(value) ? value : [];

const normalizeString = (value) => String(value || '').trim().toLowerCase();

const normalizeArray = (value) => toArray(value).map(normalizeString).filter(Boolean);

const ruleAppliesToEvent = (params = {}, event = {}, amount = 0) => {
    const rail = normalizeString(event?.rail);
    const counterpartyType = normalizeString(event?.counterparty_type);
    const currency = String(event?.currency || '').trim().toUpperCase();

    const onlyRails = normalizeArray(params.only_rails);
    if (onlyRails.length > 0 && !onlyRails.includes(rail)) return false;

    const excludeRails = normalizeArray(params.exclude_rails);
    if (excludeRails.includes(rail)) return false;

    const onlyCounterpartyTypes = normalizeArray(params.only_counterparty_types);
    if (onlyCounterpartyTypes.length > 0 && !onlyCounterpartyTypes.includes(counterpartyType)) return false;

    const excludeCounterpartyTypes = normalizeArray(params.exclude_counterparty_types);
    if (excludeCounterpartyTypes.includes(counterpartyType)) return false;

    const onlyCurrencies = toArray(params.only_currencies).map((value) => String(value || '').trim().toUpperCase()).filter(Boolean);
    if (onlyCurrencies.length > 0 && !onlyCurrencies.includes(currency)) return false;

    const excludeCurrencies = toArray(params.exclude_currencies).map((value) => String(value || '').trim().toUpperCase()).filter(Boolean);
    if (excludeCurrencies.includes(currency)) return false;

    const minimumAmount = toNumber(params.min_amount_for_rule, 0);
    if (minimumAmount > 0 && amount < minimumAmount) return false;

    const maximumAmount = toNumber(params.max_amount_for_rule, 0);
    if (maximumAmount > 0 && amount > maximumAmount) return false;

    return true;
};

const pickAction = (rules = []) => {
    if (rules.some((rule) => rule.action === 'freeze')) return 'freeze';
    if (rules.some((rule) => rule.action === 'review')) return 'review';
    if (rules.some((rule) => rule.action === 'alert')) return 'alert';
    return 'allow';
};

module.exports = {
    async evaluateEvent(db, event) {
        const eventType = event?.event_type || '';
        const occurredAt = event?.occurred_at || new Date().toISOString();
        const userId = event?.user_id || null;
        const counterpartyKey = event?.counterparty_key || null;
        const amount = toNumber(event?.amount, 0);
        const currency = event?.currency || null;

        const rulesRes = await db.query(
            `SELECT *
             FROM fraud_rules
             WHERE enabled = TRUE
               AND ($1 = ANY(applies_to) OR 'all' = ANY(applies_to))
             ORDER BY created_at ASC`,
            [eventType]
        );

        const signals = [];
        const matchedRules = [];

        for (const rule of rulesRes.rows) {
            const params = rule.parameters || {};
            let triggered = false;
            let description = '';
            let metadata = {};

            if (!ruleAppliesToEvent(params, event, amount)) continue;

            if (rule.rule_type === 'large_amount') {
                const threshold = toNumber(params.amount, 0);
                if (amount >= threshold && threshold > 0) {
                    triggered = true;
                    description = `Amount ${currency || ''} ${amount.toFixed(2)} exceeds configured threshold ${threshold.toFixed(2)}`;
                    metadata = { amount, threshold, currency };
                }
            } else if (rule.rule_type === 'velocity_count' && userId) {
                const windowMinutes = Math.max(1, toNumber(params.window_minutes, 30));
                const limit = Math.max(1, toNumber(params.count, 3));
                const countRes = await db.query(
                    `SELECT COUNT(*)::int AS count
                     FROM fraud_events
                     WHERE user_id = $1
                       AND event_type = $2
                       AND occurred_at >= ($3::timestamptz - make_interval(mins => $4::int))`,
                    [userId, eventType, occurredAt, windowMinutes]
                );
                const count = Number(countRes.rows[0]?.count || 0);
                if (count >= limit) {
                    triggered = true;
                    description = `${count} similar withdrawal events detected in ${windowMinutes} minutes`;
                    metadata = { count, limit, window_minutes: windowMinutes };
                }
            } else if (rule.rule_type === 'velocity_amount' && userId) {
                const windowMinutes = Math.max(1, toNumber(params.window_minutes, 60));
                const threshold = toNumber(params.amount, 0);
                const amountRes = await db.query(
                    `SELECT COALESCE(SUM(amount), 0)::numeric AS total
                     FROM fraud_events
                     WHERE user_id = $1
                       AND event_type = $2
                       AND occurred_at >= ($3::timestamptz - make_interval(mins => $4::int))`,
                    [userId, eventType, occurredAt, windowMinutes]
                );
                const total = toNumber(amountRes.rows[0]?.total, 0);
                if (threshold > 0 && total >= threshold) {
                    triggered = true;
                    description = `Total withdrawal volume ${total.toFixed(2)} exceeds ${threshold.toFixed(2)} within ${windowMinutes} minutes`;
                    metadata = { total, threshold, window_minutes: windowMinutes, currency };
                }
            } else if (rule.rule_type === 'repeat_counterparty' && userId && counterpartyKey) {
                const windowHours = Math.max(1, toNumber(params.window_hours, 24));
                const limit = Math.max(1, toNumber(params.count, 3));
                const countRes = await db.query(
                    `SELECT COUNT(*)::int AS count
                     FROM fraud_events
                     WHERE user_id = $1
                       AND counterparty_key = $2
                       AND direction = 'debit'
                       AND occurred_at >= ($3::timestamptz - make_interval(hours => $4::int))`,
                    [userId, counterpartyKey, occurredAt, windowHours]
                );
                const count = Number(countRes.rows[0]?.count || 0);
                if (count >= limit) {
                    triggered = true;
                    description = `${count} withdrawals to the same destination in ${windowHours} hours`;
                    metadata = { count, limit, window_hours: windowHours, counterparty_key: counterpartyKey };
                }
            } else if (rule.rule_type === 'new_counterparty_large_amount' && userId && counterpartyKey) {
                const minimumAmount = toNumber(params.min_amount, 0);
                if (amount >= minimumAmount && minimumAmount > 0) {
                    const priorRes = await db.query(
                        `SELECT COUNT(*)::int AS count
                         FROM fraud_events
                         WHERE user_id = $1
                           AND counterparty_key = $2
                           AND id <> $3`,
                        [userId, counterpartyKey, event.id]
                    );
                    const priorCount = Number(priorRes.rows[0]?.count || 0);
                    if (priorCount === 0) {
                        triggered = true;
                        description = `Large withdrawal to a first-time destination`;
                        metadata = { min_amount: minimumAmount, amount, counterparty_key: counterpartyKey };
                    }
                }
            } else if (rule.rule_type === 'high_risk_country') {
                const countries = toArray(params.countries).map((value) => String(value).toUpperCase());
                if (event.country && countries.includes(String(event.country).toUpperCase())) {
                    triggered = true;
                    description = `Transaction involves configured high-risk country ${String(event.country).toUpperCase()}`;
                    metadata = { country: String(event.country).toUpperCase(), countries };
                }
            }

            if (!triggered) continue;

            matchedRules.push({
                id: rule.id,
                name: rule.name,
                rule_type: rule.rule_type,
                action: rule.action,
                severity: rule.severity,
                description
            });

            signals.push({
                rule_id: rule.id,
                signal_code: `rule.${rule.rule_type}`,
                severity: rule.severity,
                weight: toNumber(rule.weight, 0),
                description,
                metadata: {
                    rule_name: rule.name,
                    action: rule.action,
                    ...metadata
                }
            });
        }

        const { score, severity } = FraudScoringService.scoreSignals(signals);
        return {
            event_id: event?.id || null,
            score,
            severity,
            action: pickAction(matchedRules),
            signals,
            matched_rules: matchedRules
        };
    }
};
