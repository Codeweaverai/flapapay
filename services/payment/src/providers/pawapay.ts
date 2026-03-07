import { v4 as uuidv4 } from 'uuid';

export interface PayoutRequest {
    phoneNumber: string;
    amount: number;
    currency: string;
    provider: 'MTN' | 'AIRTEL' | 'VODAFONE';
}

export interface PayoutResponse {
    id: string;
    status: 'COMPLETED' | 'FAILED' | 'PENDING';
    providerRef: string;
}

export const PawaPayProvider = {
    async sendPayout(req: PayoutRequest): Promise<PayoutResponse> {
        console.log(`[PawaPay Mock] Sending ${req.currency} ${req.amount} to ${req.phoneNumber} via ${req.provider}`);

        // Simulate Network Latency
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate Failure for specific amount
        if (req.amount === 999) {
            throw new Error("Insufficient funds in provider float");
        }

        return {
            id: uuidv4(),
            status: 'COMPLETED',
            providerRef: `PAWA_${uuidv4().substring(0, 8).toUpperCase()}`
        };
    }
};
