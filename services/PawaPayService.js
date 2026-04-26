const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class PawaPayService {
    constructor() {
        this.token = process.env.PAWAPAY_TOKEN;
        this.baseUrl = 'https://api.sandbox.pawapay.io';
    }

    // ─── Connect: Single payout to a mobile money number ──────────────────────
    async initiateConnectPayout(payoutId, amount, currency, msisdn, correspondent) {
        if (!this.token) throw new Error('PAWAPAY_TOKEN is not configured');

        const payload = {
            payoutId,
            amount: String(parseFloat(amount).toFixed(2)),
            currency,
            correspondent,    // e.g. MTN_MOMO_ZMB, AIRTEL_OAPI_ZMB, ZAMTEL_ZMB
            recipient: { type: 'MSISDN', address: { value: msisdn } },
            customerTimestamp: new Date().toISOString(),
            statementDescription: 'FlapaPay Connect Payout'
        };

        try {
            console.log(`[PawaPay Connect] Initiating payout ${payoutId} -> ${msisdn} (${correspondent}) ${amount} ${currency}`);
            const res = await axios.post(`${this.baseUrl}/v1/payouts`, payload, {
                headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
            });
            return res.data; // { payoutId, status: 'ACCEPTED' | 'REJECTED', ... }
        } catch (error) {
            console.error('[PawaPay Connect] Payout Error:', error.response?.data || error.message);
            throw error;
        }
    }

    // ─── Lookup correspondent code for a network name ─────────────────────────
    networkToCorrespondent(network, country = 'ZMB') {
        const MAP = {
            MTN: `MTN_MOMO_${country}`,
            AIRTEL: `AIRTEL_OAPI_${country}`,
            ZAMTEL: `ZAMTEL_${country}`,
            MPESA: 'MPESA_KEN',
        };
        return MAP[(network || '').toUpperCase()] || `MTN_MOMO_${country}`;
    }

    // ─── Check status of a previously initiated payout ────────────────────────
    async checkPayoutStatus(payoutId) {
        if (!this.token) throw new Error('PAWAPAY_TOKEN is not configured');
        try {
            const res = await axios.get(`${this.baseUrl}/v1/payouts/${payoutId}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            return Array.isArray(res.data) ? res.data[0] : res.data;
        } catch (error) {
            console.error(`[PawaPay] Status Check Error for ${payoutId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    // ─── Bulk payout (existing bulk remittance feature) ───────────────────────
    async initiateBulkPayout(payouts) {
        if (!this.token) throw new Error('PAWAPAY_TOKEN is not configured');
        try {
            console.log(`[PawaPay] Initiating bulk payout for ${payouts.length} recipients`);
            const res = await axios.post(`${this.baseUrl}/v2/payouts/bulk`, payouts, {
                headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
            });
            return res.data;
        } catch (error) {
            console.error('[PawaPay] Bulk Payout Error:', error.response?.data || error.message);
            throw error;
        }
    }

    // ─── Deposit (collect from mobile money — STK push) ───────────────────────
    // Used for subscription recurring charges in live mode.
    // PawaPay sends an STK push to the customer's phone; they confirm on-device.
    // Response is async — status starts as ACCEPTED, finalises via webhook or poll.
    async initiateDeposit(depositId, amount, currency, msisdn, correspondent, description = 'FlapaPay Subscription') {
        if (!this.token) throw new Error('PAWAPAY_TOKEN is not configured');

        const payload = {
            depositId,
            amount: String(parseFloat(amount).toFixed(2)),
            currency,
            correspondent,
            payer: { type: 'MSISDN', address: { value: msisdn } },
            customerTimestamp: new Date().toISOString(),
            statementDescription: description.substring(0, 22), // PawaPay max 22 chars
        };

        try {
            console.log(`[PawaPay] Initiating deposit ${depositId} from ${msisdn} (${correspondent}) ${amount} ${currency}`);
            const res = await axios.post(`${this.baseUrl}/v1/deposits`, payload, {
                headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
            });
            // Response: { depositId, status: 'ACCEPTED' | 'REJECTED', ... }
            return res.data;
        } catch (error) {
            console.error('[PawaPay] Deposit initiation error:', error.response?.data || error.message);
            throw error;
        }
    }

    // ─── Check status of a previously initiated deposit ───────────────────────
    // Statuses: ACCEPTED | COMPLETED | FAILED | DUPLICATE_IGNORED
    async checkDepositStatus(depositId) {
        if (!this.token) throw new Error('PAWAPAY_TOKEN is not configured');
        try {
            const res = await axios.get(`${this.baseUrl}/v1/deposits/${depositId}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            return Array.isArray(res.data) ? res.data[0] : res.data;
        } catch (error) {
            console.error(`[PawaPay] Deposit status check error for ${depositId}:`, error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new PawaPayService();
