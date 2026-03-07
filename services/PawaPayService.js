const axios = require('axios');

class PawaPayService {
    constructor() {
        this.token = process.env.PAWAPAY_TOKEN;
        this.baseUrl = 'https://api.sandbox.pawapay.io';
    }

    async initiateBulkPayout(payouts) {
        if (!this.token) {
            throw new Error('PAWAPAY_TOKEN is not configured');
        }

        try {
            console.log(`[PawaPay] Initiating bulk payout for ${payouts.length} recipients`);

            const response = await axios.post(
                `${this.baseUrl}/v2/payouts/bulk`,
                payouts,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('[PawaPay] Bulk Payout Error:', error.response?.data || error.message);
            throw error;
        }
    }

    async checkPayoutStatus(payoutId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/v2/payouts/${payoutId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error(`[PawaPay] Status Check Error for ${payoutId}:`, error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new PawaPayService();
