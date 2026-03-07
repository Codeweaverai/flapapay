import express from 'express';
import cors from 'cors';
import routes from './routes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

app.use('/auth', routes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'identity-service' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Identity Service running on port ${PORT}`);
});
