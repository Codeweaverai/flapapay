import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { LedgerService } from './ledger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002; // Ledger on 3002

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ledger-service' });
});

// Create Wallet
app.post('/wallets', async (req, res) => {
    try {
        const { userId, currency } = req.body;
        const wallet = await LedgerService.createWallet(userId, currency);
        res.status(201).json(wallet);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get Wallet
app.get('/wallets/:id', async (req, res) => {
    try {
        const wallet = await LedgerService.getWallet(req.params.id);
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
        res.json(wallet);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Record Transaction (Internal API - effectively "Send Money")
app.post('/transactions', async (req, res) => {
    try {
        const tx = await LedgerService.recordTransaction(req.body);
        res.status(201).json(tx);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ledger Service running on port ${PORT}`);
});
