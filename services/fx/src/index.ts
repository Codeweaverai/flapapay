import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Mock Data
const RATES: Record<string, number> = {
    'USD-NGN': 1500.00,
    'NGN-USD': 0.00067,
    'USD-KES': 160.00,
    'KES-USD': 0.00625,
    'USD-GHS': 12.00,
    'GHS-USD': 0.083
};

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'fx-service' });
});

app.get('/rates', (req, res) => {
    const { pair } = req.query;

    if (!pair || typeof pair !== 'string') {
        return res.status(400).json({ error: 'Missing pair query parameter (e.g., USD-NGN)' });
    }

    const rate = RATES[pair.toUpperCase()];

    if (rate === undefined) {
        return res.status(404).json({ error: 'Rate not found for pair' });
    }

    // Simulate slight fluctuation?
    // const fluctuation = (Math.random() - 0.5) * (rate * 0.01);

    res.json({
        pair: pair.toUpperCase(),
        rate: rate, // + fluctuation,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`FX Service running on port ${PORT}`);
});
