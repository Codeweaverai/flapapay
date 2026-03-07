require('dotenv').config();
const express = require('express');
const React = require('react');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool, Client } = require('pg');
const crypto = require('crypto');
const Stripe = require('stripe');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const OpenAI = require('openai');
const MastercardCardService = require('./services/MastercardCardService');
const PawaPayService = require('./services/PawaPayService');
const EscrowService = require('./services/EscrowService');
const DeveloperGateway = require('./services/DeveloperGateway');
const multer = require('multer');

const fs = require('fs');
const path = require('path');

// Multer storage for KYC documents
const kycStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'C:/FlapaPay/apps/web/public/assets/images/kyc';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadKyc = multer({ storage: kycStorage });

// Multer storage for User Avatars
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'C:/FlapaPay/apps/web/public/assets/images/avatars';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Multer storage for Blog/CMS Uploads
const blogStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'C:/FlapaPay/apps/web/public/assets/images/blog';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadBlog = multer({
    storage: blogStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});


// Redirect logs to file
const logStream = fs.createWriteStream(path.join(__dirname, 'server_debug.log'), { flags: 'a' });
process.stdout.write = process.stderr.write = logStream.write.bind(logStream);
console.log(`--- Server Debug Started at ${new Date().toISOString()} ---`);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const PORT = 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

const LENCO_SECRET_KEY = process.env.LENCO_SECRET_KEY || 'xo+CAiijrIy9XvZCYyhjrv0fpSAL6CfU8CgA+up1NXqK';
const LENCO_PUBLIC_KEY = process.env.LENCO_PUBLIC_KEY || '';
const LENCO_BASE_URL = 'https://api.lenco.co/access/v2';

// PostgreSQL configuration - uses environment variables for security
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'; // System User for Fees

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// --- Email & PDF Services ---
const { Resend } = require('resend');
const ReactPDF = require('@react-pdf/renderer');
const { TransferReceiptDocument } = require('./services/TransferReceiptGenerator');
const { renderTransferEmail } = require('./emails/TransferEmail');
const { InvoiceDocument } = require('./services/InvoiceGenerator');
const { renderInvoiceEmail } = require('./emails/InvoiceEmail');
const { renderRequestMoneyEmail } = require('./emails/RequestMoneyEmail');
const { renderForgotPasswordEmail } = require('./emails/ForgotPasswordEmail');

const resend = new Resend(process.env.RESEND_API_KEY);
if (process.env.RESEND_API_KEY) {
    console.log('[Resend] API Key loaded successfully');
} else {
    console.warn('[Resend] Warning: RESEND_API_KEY is missing');
}

// --- Real-time Postgres Listener ---
const listenerClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'flapapay_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345678',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

(async () => {
    try {
        await listenerClient.connect();
        await listenerClient.query('LISTEN new_message_event');
        await listenerClient.query('LISTEN new_notification_event');
        console.log('Listening for Postgres real-time events...');
    } catch (err) {
        console.error('Failed to connect listener client:', err);
    }
})();

listenerClient.on('notification', (msg) => {
    try {
        const payload = JSON.parse(msg.payload);
        if (msg.channel === 'new_notification_event') {
            io.to(`user:${payload.user_id}`).emit('new_notification', payload);
        } else if (msg.channel === 'new_message_event') {
            io.to(`session:${payload.session_id}`).emit('new_message', payload);
        }
    } catch (err) {
        console.error('Error parsing notification payload:', err);
    }
});

// --- FX Rate Caching & Services ---
const FX_CACHE = new Map();
const FX_QUOTES = new Map();
const FX_SPREAD = 0.02; // 2% configurable spread

const getExchangeRates = async (baseCurrency) => {
    const now = Date.now();
    if (FX_CACHE.has(baseCurrency)) {
        const { rates, timestamp } = FX_CACHE.get(baseCurrency);
        if (now - timestamp < 60000) { // 60 seconds cache
            return rates;
        }
    }

    try {
        const apiKey = process.env.EXCHANGE_RATE_API_KEY;
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`);

        if (response.data.result === 'success') {
            const rates = response.data.conversion_rates;
            FX_CACHE.set(baseCurrency, { rates, timestamp: now });
            return rates;
        }
        throw new Error('Failed to fetch exchange rates');
    } catch (err) {
        console.error('FX Rate Error:', err.message);
        throw err;
    }
};

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_user', (userId) => {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined user:${userId}`);
    });

    socket.on('join_session', (sessionId) => {
        socket.join(`session:${sessionId}`);
        console.log(`Socket ${socket.id} joined session:${sessionId}`);
    });
});

app.use(cors());
app.use(express.json());
app.use('/assets/images', express.static(path.join(__dirname, 'apps/web/public/assets/images')));

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers));
    next();
});

// --- Helper Functions ---

const generateToken = (length = 32) => crypto.randomBytes(length).toString('hex');

const generateMerchantApiKey = (type) => {
    const prefix = type === 'test_public' ? 'pk_test_' :
        type === 'test_secret' ? 'sk_test_' :
            type === 'live_public' ? 'pk_live_' :
                type === 'sk_live_';
    return prefix + crypto.randomBytes(24).toString('hex');
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const verifyPasswordStrength = (password) => {
    if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters long' };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: 'Uppercase letter required' };
    if (!/[0-9]/.test(password)) return { isValid: false, message: 'Number required' };
    return { isValid: true };
};

const recordFee = async (client, txnRef, amount, currency, description) => {
    try {
        // Find System Wallet for this currency
        const walletRes = await client.query('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [SYSTEM_USER_ID, currency]);
        if (walletRes.rows.length === 0) {
            console.error(`System wallet not found for ${currency}`);
            return;
        }
        const revenueWalletId = walletRes.rows[0].id;

        // Credit Revenue Wallet
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, revenueWalletId]);

        // Record Fee Ledger Entry
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'FEE', 'COMPLETED')`,
            [txnRef + '-FEE', revenueWalletId, amount, currency, description]
        );
    } catch (err) {
        console.error('Failed to record fee:', err);
        // Don't throw, let the main transaction succeed even if fee recording fails (or throw if strict)
        // For now, we log it.
    }
};

// --- Middleware ---

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userResult = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = $1', [decoded.userId]);

        if (userResult.rows.length === 0) return res.status(401).json({ error: 'User not found' });

        req.user = userResult.rows[0];
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

const verifyUserPin = async (userId, pin) => {
    if (!pin) return false;
    const result = await pool.query('SELECT pin_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return false;
    const user = result.rows[0];
    if (!user.pin_hash) return true; // For legacy users without PIN (if any)
    return await bcrypt.compare(pin, user.pin_hash);
};

const getOrCreateStripeCustomer = async (userId, email) => {
    try {
        const userRes = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
        let customerId = userRes.rows[0]?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({ email });
            customerId = customer.id;

            try {
                await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, userId]);
            } catch (e) {
                if (e.code === '42703') { // undefined_column
                    await pool.query('ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255)');
                    try {
                        await pool.query('ALTER TABLE users ADD COLUMN default_payment_method_id VARCHAR(255)');
                    } catch (err) { /* ignore if exists */ }

                    await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, userId]);
                } else {
                    throw e;
                }
            }
        }
        return customerId;
    } catch (e) {
        console.error('Error getting/creating stripe customer:', e);
        throw e;
    }
};

// --- Schema Initialization ---
const ensureSchema = async () => {
    try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS default_payment_method_id VARCHAR(255)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255)');

        // Create payouts table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payouts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                wallet_id UUID REFERENCES wallets(id),
                amount DECIMAL(15, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                provider VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING',
                client_reference_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create merchants table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS merchants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) UNIQUE,
                business_name VARCHAR(255),
                business_type VARCHAR(50),
                country VARCHAR(100),
                pacra_number VARCHAR(100),
                tpin VARCHAR(100),
                director_name VARCHAR(255),
                director_nrc VARCHAR(100),
                registered_address TEXT,
                compliance_status VARCHAR(50) DEFAULT 'SANDBOX_ONLY', -- SANDBOX_ONLY, PENDING, ACTIVE, REJECTED
                is_live_enabled BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query('ALTER TABLE merchants ADD COLUMN IF NOT EXISTS pacra_number VARCHAR(100)');
        await pool.query('ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tpin VARCHAR(100)');
        await pool.query('ALTER TABLE merchants ADD COLUMN IF NOT EXISTS director_name VARCHAR(255)');
        await pool.query('ALTER TABLE merchants ADD COLUMN IF NOT EXISTS director_nrc VARCHAR(100)');
        await pool.query('ALTER TABLE merchants ADD COLUMN IF NOT EXISTS registered_address TEXT');
        await pool.query('ALTER TABLE merchants ADD COLUMN IF NOT EXISTS kyc_draft JSONB');
        await pool.query('ALTER TABLE merchants ADD COLUMN IF NOT EXISTS kyc_payload JSONB');
        await pool.query('ALTER TABLE merchants ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP');
        await pool.query('ALTER TABLE merchants ADD COLUMN IF NOT EXISTS admin_kyc_notes TEXT');

        // Create merchant_documents table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS merchant_documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                merchant_id UUID REFERENCES merchants(id),
                document_type VARCHAR(100), -- INCORPORATION, TPIN_CERT, DIRECTOR_NRC
                file_url TEXT,
                status VARCHAR(50) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create api_keys table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS api_keys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                merchant_id UUID REFERENCES merchants(id),
                key_type VARCHAR(20), -- test_public, test_secret, live_public, live_secret
                key_value VARCHAR(255) UNIQUE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create charges table for tracking payments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS charges (
                id VARCHAR(255) PRIMARY KEY, -- 'ch_...'
                merchant_id UUID REFERENCES merchants(id),
                amount DECIMAL(15, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                status VARCHAR(50), -- succeeded, pending, failed
                payment_method VARCHAR(50), -- card, mobile_money
                payment_details JSONB,
                description TEXT,
                metadata JSONB,
                livemode BOOLEAN DEFAULT FALSE,
                application_fee_amount DECIMAL(15, 2),
                destination_merchant_id UUID,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query('ALTER TABLE charges ADD COLUMN IF NOT EXISTS destination_merchant_id UUID');
        await pool.query('ALTER TABLE charges ADD COLUMN IF NOT EXISTS application_fee_amount DECIMAL(15, 2)');
        await pool.query('ALTER TABLE charges ADD COLUMN IF NOT EXISTS livemode BOOLEAN DEFAULT FALSE');
        await pool.query('ALTER TABLE charges ADD COLUMN IF NOT EXISTS available_at TIMESTAMP WITH TIME ZONE');
        await pool.query('ALTER TABLE charges ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT FALSE');

        // Create webhooks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS webhooks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                merchant_id UUID REFERENCES merchants(id),
                url TEXT NOT NULL,
                secret VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create webhook_delivery_logs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                webhook_id UUID REFERENCES webhooks(id),
                merchant_id UUID REFERENCES merchants(id),
                event_type VARCHAR(50),
                payload JSONB,
                response_code INTEGER,
                response_body TEXT,
                status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
                retry_count INTEGER DEFAULT 0,
                next_retry_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create connected_accounts table for Marketplace
        await pool.query(`
            CREATE TABLE IF NOT EXISTS connected_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                platform_merchant_id UUID REFERENCES merchants(id),
                business_name VARCHAR(255),
                email VARCHAR(255),
                business_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'PENDING',
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Update connected_accounts with V2 fields (Unified Identity)
        await pool.query(`
            ALTER TABLE connected_accounts 
            ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{"currently_due": []}',
            ADD COLUMN IF NOT EXISTS business_profile JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS tpin VARCHAR(50),
            ADD COLUMN IF NOT EXISTS pacra_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS livemode BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'custom',
            ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'ZM'
        `);

        // Create account_sessions table (Embedded Onboarding)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS account_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                account_id UUID REFERENCES connected_accounts(id),
                client_secret VARCHAR(255) NOT NULL,
                components JSONB DEFAULT '{}',
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create balances table (Ledger)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS balances (
                merchant_id UUID PRIMARY KEY, -- Can be Platform (merchants.id) or Connected Account (connected_accounts.id)
                pending_amount DECIMAL(15, 2) DEFAULT 0.00,
                available_amount DECIMAL(15, 2) DEFAULT 0.00,
                currency VARCHAR(10) DEFAULT 'ZMW',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query('ALTER TABLE balances ADD COLUMN IF NOT EXISTS pending_amount DECIMAL(15, 2) DEFAULT 0.00');
        await pool.query('ALTER TABLE balances ADD COLUMN IF NOT EXISTS available_amount DECIMAL(15, 2) DEFAULT 0.00');
        await pool.query('ALTER TABLE balances ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT \'ZMW\'');

        // Create transfers table (Money Movement)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transfers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                source_merchant_id UUID, -- NULL if external deposit
                destination_merchant_id UUID,
                amount DECIMAL(15, 2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'ZMW',
                type VARCHAR(50), -- SPLIT, PAYOUT, TOPUP
                status VARCHAR(50) DEFAULT 'COMPLETED',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create checkout_sessions table (Hosted Gateway)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS checkout_sessions (
                id VARCHAR(255) PRIMARY KEY,
                merchant_id UUID REFERENCES merchants(id),
                amount DECIMAL(15, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                payment_method_types JSONB, -- ['card', 'mobile_money']
                success_url TEXT,
                cancel_url TEXT,
                status VARCHAR(50) DEFAULT 'open', -- open, complete, expired
                client_reference_id VARCHAR(255),
                metadata JSONB,
                application_fee_amount DECIMAL(15, 2),
                transfer_data JSONB, -- { destination: 'acct_...' }
                payment_intent VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query('ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS application_fee_amount DECIMAL(15, 2)');
        await pool.query('ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS transfer_data JSONB');
        await pool.query('ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS payment_intent VARCHAR(255)');
        // Create virtual_cards table (Mastercard)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS virtual_cards (
                id VARCHAR(255) PRIMARY KEY, -- 'mc_...'
                user_id UUID REFERENCES users(id),
                last4 VARCHAR(4),
                brand VARCHAR(50),
                status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, BLOCKED, DEACTIVATED
                amount DECIMAL(15, 2) DEFAULT 0, -- Current Balance
                currency VARCHAR(10) DEFAULT 'USD',
                expiry_month VARCHAR(2),
                expiry_year VARCHAR(4),
                billing_address JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure columns exist if table was already created
        await pool.query('ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS amount DECIMAL(15, 2) DEFAULT 0');
        await pool.query('ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'ACTIVE\'');

        // Ledger entries and Wallets already exist as per user confirmation




        // Create help_articles table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS help_articles (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(100),
                tags TEXT[],
                slug VARCHAR(255) UNIQUE,
                published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create blog_posts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS blog_posts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                excerpt TEXT,
                content TEXT NOT NULL,
                slug VARCHAR(255) UNIQUE,
                category VARCHAR(100),
                image_url TEXT,
                read_time VARCHAR(50),
                author VARCHAR(100),
                published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create job_postings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS job_postings (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                department VARCHAR(100),
                location VARCHAR(100),
                type VARCHAR(50),
                description TEXT,
                requirements TEXT[],
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create merchant_bank_accounts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                merchant_id UUID REFERENCES merchants(id),
                account_name VARCHAR(255),
                account_number VARCHAR(100),
                bank_id VARCHAR(50),
                bank_name VARCHAR(255),
                country VARCHAR(10),
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create connected_account_payout_methods table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS connected_account_payout_methods (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                connected_account_id UUID REFERENCES connected_accounts(id),
                type VARCHAR(50), -- 'bank_account', 'mobile_money'
                details JSONB,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Support Sessions and Chat Messages
        await pool.query(`
            CREATE TABLE IF NOT EXISTS support_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                agent_id UUID REFERENCES users(id),
                status VARCHAR(50) DEFAULT 'active', -- active, waiting_for_agent, agent_active, closed
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query('ALTER TABLE support_sessions ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES users(id)');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES support_sessions(id),
                sender VARCHAR(20) NOT NULL, -- user, ai, agent, system
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT false
            )
        `);

        // AI Assistant Chat History Tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_chat_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                context_type VARCHAR(50) DEFAULT 'general', -- 'developer_docs', 'general'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database schema ensured');
    } catch (err) {
        console.error('Schema Sync Error:', err);
    }
};

ensureSchema();

// --- PawaPay Integration ---

const PAWAPAY_BASE_URL = 'https://api.sandbox.pawapay.io';
const PAWAPAY_TOKEN = process.env.PAWAPAY_TOKEN;

app.post('/pawapay/deposit', authenticateToken, async (req, res) => {
    const { amount, phoneNumber, provider, currency = 'ZMW' } = req.body;

    console.log('[PawaPay Deposit] Request received:', { amount, phoneNumber, provider, currency });

    if (!amount || !phoneNumber || !provider) {
        return res.status(400).json({ error: 'Missing required fields: amount, phoneNumber, and provider are required' });
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Normalize phone number: remove +, spaces, dashes, ensure country code
    let normalizedPhone = phoneNumber.replace(/\D/g, '');

    // Determine country code based on currency
    const expectedCountryCode = currency === 'ZMW' ? '260' : currency === 'NGN' ? '234' : '260';

    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = expectedCountryCode + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith(expectedCountryCode)) {
        normalizedPhone = expectedCountryCode + normalizedPhone;
    }

    console.log('[PawaPay Deposit] Normalized phone:', normalizedPhone);

    try {
        const depositId = crypto.randomUUID();
        const clientReferenceId = `DEP-${Date.now()}`;

        const response = await axios.post(`${PAWAPAY_BASE_URL}/v2/deposits`, {
            depositId: depositId,
            payer: {
                type: 'MMO',
                accountDetails: {
                    phoneNumber: normalizedPhone,
                    provider: provider
                }
            },
            amount: numericAmount.toFixed(2),
            currency: currency,
            clientReferenceId: clientReferenceId,
            customerMessage: 'FlapaPay Deposit',
            metadata: [{ userId: req.user.id }]
        }, {
            headers: {
                'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('[PawaPay Deposit] Success:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('[PawaPay Deposit] Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        res.status(error.response?.status || 500).json({
            error: 'Failed to initiate deposit',
            details: error.response?.data || error.message,
            provider: provider,
            phone: normalizedPhone
        });
    }
});

app.get('/pawapay/deposit/:depositId', authenticateToken, async (req, res) => {
    const { depositId } = req.params;

    try {
        const response = await axios.get(`${PAWAPAY_BASE_URL}/v2/deposits/${depositId}`, {
            headers: { 'Authorization': `Bearer ${PAWAPAY_TOKEN}` }
        });

        // IF status is 'COMPLETED' and not already processed, we should deduct fee here (via Webhook preferred)
        // For simulation, we assume 'deposit' webhook handles it or simulated /wallets/deposit handles it.

        res.json(response.data);
    } catch (error) {
        console.error('PawaPay Status Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to check status', details: error.response?.data });
    }
});

app.post('/pawapay/resend-callback', authenticateToken, async (req, res) => {
    const { depositId } = req.body;

    try {
        const response = await axios.post(`${PAWAPAY_BASE_URL}/v2/deposits/resend-callback/${depositId}`, {}, {
            headers: { 'Authorization': `Bearer ${PAWAPAY_TOKEN}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('PawaPay Resend Callback Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to resend callback', details: error.response?.data });
    }
});

// --- Auth Routes ---

app.post('/pawapay/payout', authenticateToken, async (req, res) => {
    console.log('--- Payout Request Start ---');
    console.log('User:', req.user);
    console.log('Body:', req.body);

    const { amount, phoneNumber, provider, currency, walletId, customerMessage, pin } = req.body;

    // Verify PIN
    const isPinValid = await verifyUserPin(req.user.id, pin);
    if (!isPinValid) return res.status(401).json({ error: 'Invalid security PIN' });

    if (!amount) { console.error('Missing amount'); return res.status(400).json({ error: 'Missing amount' }); }
    if (!phoneNumber) { console.error('Missing phoneNumber'); return res.status(400).json({ error: 'Missing phoneNumber' }); }
    if (!provider) { console.error('Missing provider'); return res.status(400).json({ error: 'Missing provider' }); }
    if (!currency) { console.error('Missing currency'); return res.status(400).json({ error: 'Missing currency' }); }
    if (!walletId) { console.error('Missing walletId'); return res.status(400).json({ error: 'Missing walletId' }); }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Check wallet balance
        const walletRes = await client.query(
            'SELECT balance FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE',
            [walletId, req.user.id]
        );

        if (walletRes.rows.length === 0) throw new Error('Wallet not found');

        const payoutFee = 0.10;
        const totalDeduction = parseFloat(amount) + payoutFee;

        if (parseFloat(walletRes.rows[0].balance) < totalDeduction) {
            throw new Error(`Insufficient funds. Available: ${walletRes.rows[0].balance}, Required: ${totalDeduction.toFixed(2)} (incl. $0.10 fee)`);
        }

        // 2. Initiate Payout with PawaPay
        const payoutId = crypto.randomUUID();
        const clientReferenceId = `PAY-${Date.now()}`;

        const response = await axios.post(`${PAWAPAY_BASE_URL}/v2/payouts`, {
            payoutId: payoutId,
            recipient: {
                type: 'MMO',
                accountDetails: { phoneNumber: phoneNumber, provider: provider }
            },
            amount: amount.toString(),
            currency: currency,
            clientReferenceId: clientReferenceId,
            customerMessage: customerMessage || 'FlapaPay Withdrawal',
            metadata: [
                { orderId: clientReferenceId },
                { customerId: req.user.email, isPII: true }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        // 3. Record Payout in DB
        await client.query(`
            INSERT INTO payouts (id, user_id, wallet_id, amount, currency, phone_number, provider, status, client_reference_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [payoutId, req.user.id, walletId, amount, currency, phoneNumber, provider, response.data.status, clientReferenceId]
        );

        // 4. Debit Wallet (for Payout we usually debit upfront or on completion. Here upfront with reversal on failure is safer for UX)
        await client.query(
            'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
            [amount, walletId]
        );

        // 5. Add to Ledger
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'WITHDRAWAL', 'PENDING')`,
            [clientReferenceId, walletId, amount, currency, `Withdrawal to ${phoneNumber}`]
        );

        // 6. Deduct Payout Fee ($0.10) - Fee defined above
        // const payoutFee = 0.10; // Already declared
        // Check if we already deducted enough? We checked balance >= amount. 
        // We should have checked balance >= amount + fee.

        // Let's assume the user needs Amount + Fee.
        // Debit Fee
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [payoutFee, walletId]);

        // Record Fee
        await recordFee(client, clientReferenceId + '-FEE', payoutFee, currency, 'Payout Fee');

        await client.query('COMMIT');
        res.json(response.data);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('PawaPay Payout Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.message || 'Failed to initiate payout',
            details: error.response?.data
        });
    } finally {
        client.release();
    }
});

app.get('/pawapay/payout/:payoutId', authenticateToken, async (req, res) => {
    const { payoutId } = req.params;

    try {
        const response = await axios.get(`${PAWAPAY_BASE_URL}/v2/payouts/${payoutId}`, {
            headers: { 'Authorization': `Bearer ${PAWAPAY_TOKEN}` }
        });

        // Optionally update local status
        await pool.query('UPDATE payouts SET status = $1 WHERE id = $2', [response.data[0]?.status, payoutId]);

        res.json(response.data);
    } catch (error) {
        console.error('PawaPay Payout Status Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to check payout status', details: error.response?.data });
    }
});

app.post('/pawapay/payout/resend-callback/:payoutId', authenticateToken, async (req, res) => {
    const { payoutId } = req.params;

    try {
        const response = await axios.post(`${PAWAPAY_BASE_URL}/v2/payouts/resend-callback/${payoutId}`, {}, {
            headers: { 'Authorization': `Bearer ${PAWAPAY_TOKEN}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('PawaPay Payout Resend Callback Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to resend payout callback', details: error.response?.data });
    }
});

app.post('/pawapay/payout/fail-enqueued/:payoutId', authenticateToken, async (req, res) => {
    const { payoutId } = req.params;

    try {
        const response = await axios.post(`${PAWAPAY_BASE_URL}/v2/payouts/fail-enqueued/${payoutId}`, {}, {
            headers: { 'Authorization': `Bearer ${PAWAPAY_TOKEN}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('PawaPay Payout Cancel Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to cancel payout', details: error.response?.data });
    }
});
app.post('/auth/register', async (req, res) => {
    const { email, password, fullName, pin } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (!pin || pin.length !== 4) return res.status(400).json({ error: 'A 4-digit security PIN is required' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

    try {
        const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) return res.status(409).json({ error: 'User already exists' });

        const passwordHash = await bcrypt.hash(password, 12);
        const pinHash = await bcrypt.hash(pin, 12);

        // Handle new registration fields (firstName, lastName, phone)
        const fullNameStr = fullName || (req.body.firstName && req.body.lastName ? `${req.body.firstName} ${req.body.lastName}` : '');
        const phone = req.body.phone || '';

        await pool.query('BEGIN');
        const userResult = await pool.query(
            `INSERT INTO users (email, password_hash, pin_hash, full_name, phone, email_verified, created_at)
             VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING id, email`,
            [email, passwordHash, pinHash, fullNameStr, phone]
        );
        const user = userResult.rows[0];

        // Create default wallets
        await pool.query(`INSERT INTO wallets (user_id, currency, balance) VALUES ($1, 'ZMW', 0.00)`, [user.id]);
        await pool.query(`INSERT INTO wallets (user_id, currency, balance) VALUES ($1, 'USD', 0.00)`, [user.id]);

        await pool.query('COMMIT');

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ message: 'User registered successfully', user, token });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // If user has a PIN, require PIN verification before issuing final token
        if (user.pin_hash) {
            // Generate a temporary partial token for PIN verification
            const partialToken = jwt.sign({ userId: user.id, email: user.email, partial: true }, JWT_SECRET, { expiresIn: '5m' });
            return res.json({
                message: 'Password verified. PIN required.',
                pinRequired: true,
                partialToken
            });
        }

        // LEGACY USER: If no PIN is set, require PIN setup
        const setupToken = jwt.sign({ userId: user.id, email: user.email, partial: true, setup: true }, JWT_SECRET, { expiresIn: '5m' });
        return res.json({
            message: 'Password verified. PIN setup required.',
            setupPinRequired: true,
            partialToken: setupToken
        });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                defaultPaymentMethodId: user.default_payment_method_id,
                avatarUrl: user.avatar_url,
                hasPin: !!user.pin_hash
            },
            token: token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/auth/verify-pin', async (req, res) => {
    const { partialToken, pin } = req.body;

    if (!partialToken || !pin) return res.status(400).json({ error: 'Token and PIN are required' });

    try {
        const decoded = jwt.verify(partialToken, JWT_SECRET);
        if (!decoded.partial) return res.status(401).json({ error: 'Invalid token type' });

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];
        const match = await bcrypt.compare(pin, user.pin_hash);
        if (!match) return res.status(401).json({ error: 'Invalid security PIN' });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'PIN verified. Login successful.',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                defaultPaymentMethodId: user.default_payment_method_id,
                avatarUrl: user.avatar_url,
                hasPin: true
            }
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired. Please login again.' });
        console.error('PIN verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/auth/setup-pin', async (req, res) => {
    const { partialToken, pin } = req.body;

    if (!partialToken || !pin || pin.length !== 4) {
        return res.status(400).json({ error: 'Token and a 4-digit PIN are required' });
    }

    try {
        const decoded = jwt.verify(partialToken, JWT_SECRET);
        if (!decoded.partial || !decoded.setup) return res.status(401).json({ error: 'Invalid token for PIN setup' });

        const pinHash = await bcrypt.hash(pin, 12);
        await pool.query('UPDATE users SET pin_hash = $1 WHERE id = $2', [pinHash, decoded.userId]);

        const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        const user = userRes.rows[0];

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'PIN setup successful.',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                defaultPaymentMethodId: user.default_payment_method_id,
                avatarUrl: user.avatar_url,
                hasPin: true
            }
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired. Please login again.' });
        console.error('PIN setup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/auth/me', authenticateToken, async (req, res) => {
    try {
        const walletsResult = await pool.query('SELECT id, currency, balance FROM wallets WHERE user_id = $1', [req.user.id]);
        const userRes = await pool.query('SELECT id, email, full_name, role, default_payment_method_id, avatar_url, pin_hash FROM users WHERE id = $1', [req.user.id]);
        const updatedUser = userRes.rows[0];

        res.json({
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.full_name,
                role: updatedUser.role,
                defaultPaymentMethodId: updatedUser.default_payment_method_id,
                avatarUrl: updatedUser.avatar_url,
                hasPin: !!updatedUser.pin_hash
            },
            wallets: walletsResult.rows
        });
    } catch (err) {
        console.error('Auth/Me Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/auth/change-pin', authenticateToken, async (req, res) => {
    const { oldPin, newPin } = req.body;

    if (!newPin || newPin.length !== 4) return res.status(400).json({ error: 'New 4-digit PIN is required' });

    try {
        const userRes = await pool.query('SELECT pin_hash FROM users WHERE id = $1', [req.user.id]);
        const user = userRes.rows[0];

        if (user.pin_hash) {
            if (!oldPin) return res.status(400).json({ error: 'Current PIN is required to set a new one' });
            const match = await bcrypt.compare(oldPin, user.pin_hash);
            if (!match) return res.status(401).json({ error: 'Current PIN is incorrect' });
        }

        const newPinHash = await bcrypt.hash(newPin, 12);
        await pool.query('UPDATE users SET pin_hash = $1 WHERE id = $2', [newPinHash, req.user.id]);

        res.json({ message: 'Security PIN updated successfully' });
    } catch (err) {
        console.error('Change PIN Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const userRes = await pool.query('SELECT id, email, full_name FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            // Return success even if user not found for security (prevent email enumeration)
            return res.json({ message: 'If an account exists with this email, you will receive reset instructions.' });
        }

        const user = userRes.rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [resetToken, expires, user.id]
        );

        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        await resend.emails.send({
            from: 'FlapaPay <noreply@skillpulse.cloud>',
            to: [user.email],
            subject: 'Reset your FlapaPay password',
            html: renderForgotPasswordEmail({
                userEmail: user.email,
                resetLink: resetLink
            })
        });

        res.json({ message: 'Recovery email sent successfully.' });
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ error: 'Failed to process request.' });
    }
});

app.post('/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });

    try {
        const userRes = await pool.query(
            'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
            [token]
        );

        if (userRes.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }

        const user = userRes.rows[0];
        const passwordHash = await bcrypt.hash(newPassword, 12);

        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [passwordHash, user.id]
        );

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

app.post('/v1/user/avatar', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const avatarUrl = `/assets/images/avatars/${req.file.filename}`;

        await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);

        res.json({
            message: 'Avatar updated successfully',
            avatarUrl
        });
    } catch (err) {
        console.error('Avatar Upload Error:', err);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// --- Wallet & Transaction Routes ---

app.post('/wallets', authenticateToken, async (req, res) => {
    const { currency } = req.body;
    if (!currency) return res.status(400).json({ error: 'Currency is required' });

    try {
        const existing = await pool.query('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [req.user.id, currency]);
        if (existing.rows.length > 0) return res.status(400).json({ error: `You already have a ${currency} wallet` });

        const result = await pool.query(
            'INSERT INTO wallets (user_id, currency, balance, status) VALUES ($1, $2, 0.00, \'ACTIVE\') RETURNING *',
            [req.user.id, currency]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Wallet creation error:', err);
        res.status(500).json({ error: 'Failed to create wallet' });
    }
});

app.post('/wallets/deposit', authenticateToken, async (req, res) => {
    const { walletId, amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const walletResult = await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [walletId, req.user.id]);
        if (walletResult.rows.length === 0) throw new Error('Wallet not found');

        const wallet = walletResult.rows[0];

        // FEE LOGIC: 1.8% Markup
        // User requesting to deposit 'amount'.
        // We simulate charging Provider: Amount + Fee.
        // We Credit User: Amount.
        // We Credit Revenue: Fee.

        const feeRate = 0.018;
        const fee = parseFloat((amount * feeRate).toFixed(2));
        const totalCharged = amount + fee; // Simulated external charge

        const ref = 'DEP-' + crypto.randomBytes(8).toString('hex').toUpperCase();

        // Credit User (Full request amount)
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'DEPOSIT', 'COMPLETED')`,
            [ref, walletId, amount, wallet.currency, description || 'Funds added']
        );

        const updateResult = await client.query(
            'UPDATE wallets SET balance = balance + $1 WHERE id = $2 RETURNING balance',
            [amount, walletId]
        );

        // Record Fee
        await recordFee(client, ref + '-FEE', fee, wallet.currency, 'Mobile Money Deposit Fee');

        await client.query('COMMIT');
        res.json({
            message: 'Deposit successful',
            newBalance: updateResult.rows[0].balance,
            reference: ref,
            fee: fee.toFixed(2),
            netAmount: Number(amount).toFixed(2),
            totalCharged: totalCharged.toFixed(2)
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Deposit error:', err);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.get('/wallets', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch wallets' });
    }
});

app.post('/payments/transfer', authenticateToken, async (req, res) => {
    const { debitWalletId, creditWalletId, amount, currency, description, pin } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    // Verify PIN
    const isPinValid = await verifyUserPin(req.user.id, pin);
    if (!isPinValid) return res.status(401).json({ error: 'Invalid security PIN' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const debitRes = await client.query('SELECT balance, currency FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [debitWalletId, req.user.id]);
        if (debitRes.rows.length === 0) throw new Error('Source wallet not found or access denied');

        const sourceWallet = debitRes.rows[0];
        if (sourceWallet.currency !== currency) throw new Error('Currency mismatch');
        if (parseFloat(sourceWallet.balance) < amount) throw new Error('Insufficient funds');

        let targetWalletId = creditWalletId;
        if (!targetWalletId && req.body.recipientEmail) {
            const userRes = await client.query('SELECT id FROM users WHERE email = $1', [req.body.recipientEmail]);
            if (userRes.rows.length === 0) throw new Error('Recipient user not found');
            const recipientId = userRes.rows[0].id;
            const walletRes = await client.query('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [recipientId, currency]);
            if (walletRes.rows.length === 0) throw new Error(`Recipient does not have a ${currency} wallet`);
            targetWalletId = walletRes.rows[0].id;
        }

        const creditRes = await client.query('SELECT balance, currency FROM wallets WHERE id = $1 FOR UPDATE', [targetWalletId]);
        if (creditRes.rows.length === 0) throw new Error('Destination wallet not found');

        // Calculate Fee (1% for P2P Transfer)
        const feeRate = 0.01;
        const fee = parseFloat((amount * feeRate).toFixed(2));
        const totalDeduction = parseFloat(amount) + fee;

        if (parseFloat(sourceWallet.balance) < totalDeduction) {
            throw new Error(`Insufficient funds. Required: ${totalDeduction.toFixed(2)} ${currency} (incl. ${fee} fee)`);
        }

        const ref = 'TX-' + crypto.randomBytes(8).toString('hex').toUpperCase();

        // 1. Ledger: Transfer (Debit Sender, Credit Recipient) - Main Amount
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, credit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'TRANSFER', 'COMPLETED')`,
            [ref, debitWalletId, targetWalletId, amount, currency, description]
        );

        // 2. Debit Sender (Total = Amount + Fee)
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [totalDeduction, debitWalletId]);

        // 3. Credit Recipient (Amount)
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, targetWalletId]);

        // 4. Record Fee
        await recordFee(client, ref + '-FEE', fee, currency, 'Transfer Fee');

        await client.query('COMMIT');

        // --- Post-Transfer Notifications ---
        try {
            const sender = req.user;
            const receiverRes = await pool.query('SELECT full_name, email FROM users WHERE id = (SELECT user_id FROM wallets WHERE id = $1)', [targetWalletId]);
            const receiver = receiverRes.rows[0];

            if (receiver) {
                // Fetch full transfer details for PDF
                const transferRes = await pool.query('SELECT * FROM ledger_entries WHERE transaction_reference = $1', [ref]);
                const transfer = transferRes.rows[0];

                // Generate PDF Buffer
                const pdfBuffer = await ReactPDF.renderToBuffer(
                    React.createElement(TransferReceiptDocument, { transfer, sender, receiver })
                );

                const emailAttachments = [
                    {
                        filename: `Receipt-${ref}.pdf`,
                        content: pdfBuffer,
                    },
                ];

                // Sender Email
                resend.emails.send({
                    from: 'FlapaPay <noreply@skillpulse.cloud>',
                    to: [sender.email],
                    subject: `Transfer Successful: ${currency} ${amount} sent to ${receiver.full_name}`,
                    html: renderTransferEmail({
                        type: 'SENDER',
                        senderName: sender.full_name,
                        receiverName: receiver.full_name,
                        amount: amount,
                        currency: currency,
                        reference: ref,
                        description: description,
                        date: new Date().toLocaleString()
                    }),
                    attachments: emailAttachments
                }).catch(e => console.error('Failed to send sender email:', e));

                // Receiver Email
                resend.emails.send({
                    from: 'FlapaPay <noreply@skillpulse.cloud>',
                    to: [receiver.email],
                    subject: `You received ${currency} ${amount} from ${sender.full_name}`,
                    html: renderTransferEmail({
                        type: 'RECEIVER',
                        senderName: sender.full_name,
                        receiverName: receiver.full_name,
                        amount: amount,
                        currency: currency,
                        reference: ref,
                        description: description,
                        date: new Date().toLocaleString()
                    }),
                    attachments: emailAttachments
                }).catch(e => console.error('Failed to send receiver email:', e));
            }
        } catch (notifErr) {
            console.error('Post-transfer notification error:', notifErr);
        }

        res.json({ message: 'Transfer successful', reference: ref });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.post('/payments/send-from-card', authenticateToken, async (req, res) => {
    const { paymentMethodId, recipientEmail, amount, currency, description } = req.body;

    if (!amount || amount <= 0 || !paymentMethodId || !recipientEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();
    try {
        // 1. Charge the Card (Markup: Amount + Stripe Fees)
        const customerId = await getOrCreateStripeCustomer(req.user.id, req.user.email);

        // Stripe Fee: 2.9% + 0.30
        const stripeFee = (amount * 0.029) + 0.30;
        // Total Charge
        const totalCharge = amount + stripeFee;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalCharge * 100),
            currency: currency.toLowerCase(),
            customer: customerId,
            payment_method: paymentMethodId,
            off_session: true,
            confirm: true,
            description: `Send money to ${recipientEmail}`,
            metadata: {
                target_amount: amount,
                fee: stripeFee.toFixed(2)
            }
        });

        if (paymentIntent.status !== 'succeeded') {
            throw new Error(`Payment failed: ${paymentIntent.status}`);
        }

        // 2. Process Transfer to Recipient Wallet
        await client.query('BEGIN');

        // Find Recipient Wallet
        const userRes = await client.query('SELECT id FROM users WHERE email = $1', [recipientEmail]);
        if (userRes.rows.length === 0) throw new Error('Recipient user not found');
        const recipientId = userRes.rows[0].id;

        const walletRes = await client.query('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [recipientId, currency]);
        if (walletRes.rows.length === 0) throw new Error(`Recipient does not have a ${currency} wallet`);
        const targetWalletId = walletRes.rows[0].id;

        const ref = 'CTX-' + crypto.randomBytes(8).toString('hex').toUpperCase();

        // Record Ledger Entry (Credit recipient, Debit is card/NULL)
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'TRANSFER', 'COMPLETED')`,
            [ref, targetWalletId, amount, currency, description || `Transfer from ${req.user.email} (Card)`]
        );

        // Update Recipient Balance
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, targetWalletId]);

        await client.query('COMMIT');

        // --- Post-Card-Transfer Notifications ---
        try {
            const sender = req.user;
            const receiverRes = await pool.query('SELECT full_name, email FROM users WHERE email = $1', [recipientEmail]);
            const receiver = receiverRes.rows[0];

            if (receiver) {
                // Fetch full transfer details for PDF
                const transferRes = await pool.query('SELECT * FROM ledger_entries WHERE transaction_reference = $1', [ref]);
                const transfer = transferRes.rows[0];

                // Generate PDF Buffer
                const pdfBuffer = await ReactPDF.renderToBuffer(
                    React.createElement(TransferReceiptDocument, { transfer, sender, receiver })
                );

                const emailAttachments = [
                    {
                        filename: `Receipt-${ref}.pdf`,
                        content: pdfBuffer,
                    },
                ];

                // Sender Email
                resend.emails.send({
                    from: 'FlapaPay <noreply@skillpulse.cloud>',
                    to: [sender.email],
                    subject: `Card Transfer Successful: ${currency} ${amount} sent to ${receiver.full_name}`,
                    html: renderTransferEmail({
                        type: 'SENDER',
                        senderName: sender.full_name,
                        receiverName: receiver.full_name,
                        amount: amount,
                        currency: currency,
                        reference: ref,
                        description: description || 'Transfer from Card',
                        date: new Date().toLocaleString()
                    }),
                    attachments: emailAttachments
                }).catch(e => console.error('Failed to send sender card email:', e));

                // Receiver Email
                resend.emails.send({
                    from: 'FlapaPay <noreply@skillpulse.cloud>',
                    to: [receiver.email],
                    subject: `You received ${currency} ${amount} from ${sender.full_name}`,
                    html: renderTransferEmail({
                        type: 'RECEIVER',
                        senderName: sender.full_name,
                        receiverName: receiver.full_name,
                        amount: amount,
                        currency: currency,
                        reference: ref,
                        description: description || `Transfer from ${sender.full_name} (Card)`,
                        date: new Date().toLocaleString()
                    }),
                    attachments: emailAttachments
                }).catch(e => console.error('Failed to send receiver card email:', e));
            }
        } catch (notifErr) {
            console.error('Post-card-transfer notification error:', notifErr);
        }

        res.json({ message: 'Transfer successful', reference: ref, paymentIntentId: paymentIntent.id });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Send from Card Error:', err);
        res.status(400).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// --- PawaPay Payouts (Bulk Remittance) ---

app.get('/v1/wallet/balance', authenticateToken, async (req, res) => {
    try {
        const walletsResult = await pool.query('SELECT currency, balance FROM wallets WHERE user_id = $1', [req.user.id]);
        res.json({ wallets: walletsResult.rows });
    } catch (err) {
        console.error('Failed to fetch wallet balances:', err);
        res.status(500).json({ error: 'Failed to fetch balances' });
    }
});

app.post('/v1/payouts/bulk', authenticateToken, async (req, res) => {
    const payouts = req.body;

    if (!Array.isArray(payouts) || payouts.length === 0) {
        return res.status(400).json({ error: 'Payouts must be a non-empty array' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const totals = payouts.reduce((acc, p) => {
            const amt = parseFloat(p.amount);
            acc[p.currency] = (acc[p.currency] || 0) + amt;
            return acc;
        }, {});

        for (const [currency, totalAmount] of Object.entries(totals)) {
            const walletRes = await client.query('SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE', [req.user.id, currency]);
            if (walletRes.rows.length === 0) throw new Error(`You do not have a ${currency} wallet`);

            const wallet = walletRes.rows[0];
            if (parseFloat(wallet.balance) < totalAmount) {
                throw new Error(`Insufficient funds in your ${currency} wallet. Needed: ${totalAmount}, Available: ${wallet.balance}`);
            }

            await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [totalAmount, wallet.id]);

            const batchRef = 'BULK-' + crypto.randomBytes(6).toString('hex').toUpperCase();
            await client.query(`
                INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, amount, currency, description, transaction_type, status)
                VALUES ($1, $2, $3, $4, $5, 'WITHDRAWAL', 'COMPLETED')`,
                [batchRef, wallet.id, totalAmount, currency, `Bulk Remittance via PawaPay (${payouts.length} recipients)`]
            );
        }

        const pawapayResult = await PawaPayService.initiateBulkPayout(payouts);

        await client.query('COMMIT');

        res.json({
            message: 'Bulk payout initiated successfully',
            batchId: pawapayResult.batchId || 'PENDING',
            pawaPayResponse: pawapayResult
        });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Bulk Payout Error:', err);
        res.status(400).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});


app.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT le.*, w.currency,
                (SELECT amount FROM ledger_entries fee WHERE fee.transaction_reference = le.transaction_reference AND fee.transaction_type = 'FEE' LIMIT 1) as fee_amount
            FROM ledger_entries le
            JOIN wallets w ON le.credit_wallet_id = w.id OR le.debit_wallet_id = w.id
            WHERE w.user_id = $1 AND le.transaction_type != 'FEE'
            ORDER BY le.created_at DESC
            LIMIT 20
        `;
        const result = await pool.query(query, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// --- Escrow Routes ---

app.post('/escrows/create', authenticateToken, async (req, res) => {
    try {
        const escrow = await EscrowService.createEscrow(req.body, req.user.id);
        res.status(201).json(escrow);
    } catch (err) {
        console.error('Escrow Create Error:', err);
        res.status(400).json({ error: err.message });
    }
});

// --- Marketplace API v1 (Developer Gateway) ---
app.post('/api/v1/escrows', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const escrowData = {
            ...req.body,
            // Marketplace identifier prefixing or special flags could go here
        };
        const escrow = await EscrowService.createEscrow(escrowData, merchant.owner_id);
        res.status(201).json(DeveloperGateway.formatResponse(escrow, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/api/v1/escrows/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query(
            'SELECT * FROM escrows WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
            [req.params.id, merchant.owner_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Escrow not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.post('/escrows/:id/fund', authenticateToken, async (req, res) => {
    try {
        const result = await EscrowService.fundEscrow(req.params.id, req.user.id, req.body);
        res.json(result);
    } catch (err) {
        console.error('Escrow Fund Error:', err);
        res.status(400).json({ error: err.message });
    }
});


app.post('/escrows/:id/release', authenticateToken, async (req, res) => {
    try {
        const result = await EscrowService.requestRelease(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        console.error('Escrow Release Error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.get('/escrows', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM escrows WHERE buyer_id = $1 OR seller_id = $2 ORDER BY created_at DESC',
            [req.user.id, req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch escrows' });
    }
});

app.get('/escrows/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, 
                    b.full_name as buyer_name, b.avatar_url as buyer_avatar, b.email as buyer_email,
                    s.full_name as seller_name, s.avatar_url as seller_avatar, s.email as seller_email_actual
             FROM escrows e
             LEFT JOIN users b ON e.buyer_id = b.id
             LEFT JOIN users s ON e.seller_id = s.id
             WHERE e.id = $1 AND (e.buyer_id = $2 OR e.seller_id = $3)`,
            [req.params.id, req.user.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Escrow not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching escrow:', err);
        res.status(500).json({ error: 'Failed to fetch escrow details' });
    }
});

app.post('/escrows/:id/deliver', authenticateToken, async (req, res) => {
    try {
        const result = await EscrowService.markAsShipped(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        console.error('Escrow Deliver Error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/escrows/:id/confirm', authenticateToken, async (req, res) => {
    try {
        const result = await EscrowService.confirmDelivery(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        console.error('Escrow Confirm Error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/escrows/:id/dispute', authenticateToken, async (req, res) => {
    try {
        const { reason, evidenceUrl } = req.body;
        const result = await EscrowService.disputeEscrow(req.params.id, req.user.id, reason, evidenceUrl);
        res.json(result);
    } catch (err) {
        console.error('Escrow Dispute Error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.get('/admin/escrows', authenticateToken, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        if (userRes.rows[0]?.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

        const result = await pool.query(
            `SELECT e.*, 
                    b.full_name as buyer_name, b.email as buyer_email,
                    s.full_name as seller_name, s.email as seller_email_actual
             FROM escrows e
             LEFT JOIN users b ON e.buyer_id = b.id
             LEFT JOIN users s ON e.seller_id = s.id
             ORDER BY e.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Admin Fetch Escrows Error:', err);
        res.status(500).json({ error: 'Failed to fetch global escrows' });
    }
});

app.get('/admin/escrows/:id', authenticateToken, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        if (userRes.rows[0]?.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

        const escrowRes = await pool.query(
            `SELECT e.*, 
                    b.full_name as buyer_name, b.email as buyer_email, b.avatar_url as buyer_avatar,
                    s.full_name as seller_name, s.email as seller_email_actual, s.avatar_url as seller_avatar
             FROM escrows e
             LEFT JOIN users b ON e.buyer_id = b.id
             LEFT JOIN users s ON e.seller_id = s.id
             WHERE e.id = $1`,
            [req.params.id]
        );
        if (escrowRes.rows.length === 0) return res.status(404).json({ error: 'Escrow not found' });

        const escrow = escrowRes.rows[0];

        // Fetch AI Alerts for this escrow
        const alertsRes = await pool.query(
            `SELECT * FROM admin_notifications 
             WHERE type = 'escrow' AND message LIKE $1 
             ORDER BY created_at DESC`,
            [`%Escrow ${escrow.id.substring(0, 8)}%`]
        );

        res.json({
            ...escrow,
            ai_alerts: alertsRes.rows
        });
    } catch (err) {
        console.error('Admin Fetch Escrow Detail Error:', err);
        res.status(500).json({ error: 'Failed to fetch escrow detail' });
    }
});

app.post('/admin/escrows/:id/force-release', authenticateToken, async (req, res) => {
    try {
        const result = await EscrowService.forceReleaseFunds(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        console.error('Admin Force Release Error:', err);
        res.status(400).json({ error: err.message });
    }
});

app.post('/admin/escrows/:id/force-refund', authenticateToken, async (req, res) => {
    try {
        const result = await EscrowService.forceRefundFunds(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        console.error('Admin Force Refund Error:', err);
        res.status(400).json({ error: err.message });
    }
});



app.get('/escrow-public/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, seller_email, amount, currency, description, status, created_at FROM escrows WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Escrow not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch escrow details' });
    }
});

// --- Stripe Routes ---

app.post('/payments/create-payment-intent', authenticateToken, async (req, res) => {
    const { amount, currency, paymentMethodId } = req.body;
    try {
        const customerId = await getOrCreateStripeCustomer(req.user.id, req.user.email);
        let paymentIntent;
        if (paymentMethodId) {
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: currency.toLowerCase(),
                customer: customerId,
                payment_method: paymentMethodId,
                off_session: true,
                confirm: true,
            });
        } else {
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: currency.toLowerCase(),
                customer: customerId,
                automatic_payment_methods: { enabled: true },
                setup_future_usage: 'off_session',
            });
        }

        // Calculate Fee for reference (2.9% + $0.30)
        // Note: This does not affect what the user pays (Amount), but allows us to track expected revenue.
        // If we wanted to surcharge, we would increase the amount here.
        const fee = (amount * 0.029) + 0.30;
        await stripe.paymentIntents.update(paymentIntent.id, {
            metadata: {
                ...paymentIntent.metadata,
                expected_fee: fee.toFixed(2),
                net_amount: (amount - fee).toFixed(2)
            }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Payment Intent Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/payments/create-setup-intent', authenticateToken, async (req, res) => {
    try {
        const customerId = await getOrCreateStripeCustomer(req.user.id, req.user.email);
        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
        });
        res.json({ clientSecret: setupIntent.client_secret, customerId: customerId });
    } catch (err) {
        console.error('Setup Intent Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/payments/methods', authenticateToken, async (req, res) => {
    try {
        const customerId = await getOrCreateStripeCustomer(req.user.id, req.user.email);
        const paymentMethods = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
        res.json({ methods: paymentMethods.data });
    } catch (err) {
        console.error('Error fetching payment methods:', err);
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
});

app.get('/users/search', authenticateToken, async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query required' });
    try {
        const searchQuery = `%${query}%`;
        const result = await pool.query(
            'SELECT id, email, full_name, avatar_url FROM users WHERE email ILIKE $1 OR full_name ILIKE $1 LIMIT 5',
            [searchQuery]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/v1/users/:id/public', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, avatar_url FROM users WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Fetch public user error:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

app.post('/user/settings/default-card', authenticateToken, async (req, res) => {
    const { paymentMethodId } = req.body;
    try {
        await pool.query('UPDATE users SET default_payment_method_id = $1 WHERE id = $2', [paymentMethodId, req.user.id]);
        res.json({ message: 'Default payment method updated' });
    } catch (err) {
        console.error('Error updating default card:', err);
        res.status(500).json({ error: 'Failed to update default card' });
    }
});

// --- Misc Routes ---

app.get('/rates', (req, res) => {
    const { pair } = req.query;
    if (pair === 'USD-ZMW') {
        res.json({ pair: 'USD-ZMW', rate: 27.50 });
    } else if (pair === 'USD-NGN') {
        res.json({ pair: 'USD-NGN', rate: 1500 });
    } else {
        res.json({ pair: 'USD-ZMW', rate: 27.50 });
    }
});

// --- Upload Route (Multer) ---
// Configure storage for specific path requested
const uploadDir = path.join(__dirname, 'apps/web/src/assets/images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Sanitize and ensure unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/v1/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return path relative to web src (for Vite to serve)
    // In dev, Vite serves /src/assets/images just fine if imported or referenced correctly.
    // However, dynamically added files might need a restart or specific handling? 
    // Actually, for a running React app, serving from public is better, but user insisted on this path.
    // We will return the absolute path or a path that the frontend can try to use.
    // For local dev, a relative path from 'src' might work if we set up an alias or if valid.
    // Let's return a relative path that CreateInvoice can use.

    // Note: React 'src' is not served statically by default in production. 
    // But for this "local demo", we will assume the user wants it there. 
    // We return a URL that the frontend can theoretically access if we serve it or if Vite picks it up.
    // To be safe, we ALSO serve this directory statically from Node so the PDF generator and Frontend can see it.

    res.json({
        url: `/src/assets/images/${req.file.filename}`,
        filename: req.file.filename
    });
});

// Serve the assets directory statically so the frontend can fetch them via the node server if needed (as proxy)
// OR simpler: The frontend uses the path. 
// Let's also serve it here to be safe for the PDF generator.
app.use('/src/assets/images', express.static(path.join(__dirname, 'apps/web/src/assets/images')));

// --- Invoice Management Routes ---

// GET: Download Transfer Receipt PDF
app.get('/v1/transfers/:ref/pdf', authenticateToken, async (req, res) => {
    try {
        const { ref } = req.params;
        console.log(`[PDF] Generating receipt for ref: ${ref}, User: ${req.user.id}`);

        // Fetch ledger entry
        const entryRes = await pool.query(`
            SELECT * FROM ledger_entries 
            WHERE transaction_reference = $1 
            AND (debit_wallet_id IN (SELECT id FROM wallets WHERE user_id = $2) 
                 OR credit_wallet_id IN (SELECT id FROM wallets WHERE user_id = $2))
        `, [ref, req.user.id]);

        if (entryRes.rows.length === 0) {
            console.warn(`[PDF] Transfer not found or access denied for Ref: ${ref}, User: ${req.user.id}`);
            return res.status(404).json({ error: 'Transfer not found or access denied' });
        }
        const transfer = entryRes.rows[0];

        // Fetch Sender and Receiver Details
        const senderRes = await pool.query(`
            SELECT u.full_name, u.email 
            FROM users u 
            JOIN wallets w ON w.user_id = u.id 
            WHERE w.id = $1
        `, [transfer.debit_wallet_id]);

        const receiverRes = await pool.query(`
            SELECT u.full_name, u.email 
            FROM users u 
            JOIN wallets w ON w.user_id = u.id 
            WHERE w.id = $1
        `, [transfer.credit_wallet_id]);

        const sender = senderRes.rows[0] || { full_name: 'Unknown Sender', email: 'N/A' };
        const receiver = receiverRes.rows[0] || { full_name: 'Unknown Receiver', email: 'N/A' };

        console.log(`[PDF] Found Sender: ${sender.full_name}, Receiver: ${receiver.full_name}`);

        // Generate PDF
        const pdfStream = await ReactPDF.renderToStream(
            React.createElement(TransferReceiptDocument, { transfer, sender, receiver })
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Receipt-${ref}.pdf`);
        pdfStream.pipe(res);
        console.log(`[PDF] Receipt stream piped successfully for Ref: ${ref}`);
    } catch (err) {
        console.error('Transfer PDF Error:', err);
        res.status(500).json({ error: 'Failed to generate receipt' });
    }
});

// --- Request Funds Routes ---

// CREATE a payment request
app.post('/v1/payment-requests', authenticateToken, async (req, res) => {
    try {
        const { recipientEmail, amount, currency, description } = req.body;
        const requesterId = req.user.id;

        // 1. Create the request in DB
        const requestRes = await pool.query(`
            INSERT INTO payment_requests (requester_id, recipient_email, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, 'PENDING')
            RETURNING *
        `, [requesterId, recipientEmail, amount, currency, description]);

        const paymentReq = requestRes.rows[0];

        // 2. Check if recipient is a FlapaPay user
        const userRes = await pool.query('SELECT id, full_name FROM users WHERE email = $1', [recipientEmail]);
        const recipientUser = userRes.rows[0];

        if (recipientUser) {
            // 3. Insert in-app notification if they are a user (using 'system' for requests)
            await pool.query(`
                INSERT INTO notifications (user_id, type, title, message, amount, metadata)
                VALUES ($1, 'system', $2, $3, $4, $5)
            `, [
                recipientUser.id,
                'Payment Request',
                `${req.user.full_name} has requested ${currency} ${amount} from you.`,
                amount.toString(),
                JSON.stringify({ requestId: paymentReq.id, type: 'PAYMENT_REQUEST' })
            ]);
        }

        // 4. Send Email Notification
        const paymentLink = `http://localhost:5173/pay-request/${paymentReq.id}`;
        resend.emails.send({
            from: 'FlapaPay <noreply@skillpulse.cloud>',
            to: [recipientEmail],
            subject: `${req.user.full_name} requested ${currency} ${amount} via FlapaPay`,
            html: renderRequestMoneyEmail({
                requesterName: req.user.full_name,
                requesterEmail: req.user.email,
                amount,
                currency,
                description,
                paymentLink
            })
        }).catch(err => console.error('Failed to send request email:', err));

        res.status(201).json(paymentReq);
    } catch (err) {
        console.error('Create Payment Request Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET list of requests (Received and Sent)
app.get('/v1/payment-requests', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;

        const sentRes = await pool.query(`
            SELECT pr.*, u.full_name as recipient_name 
            FROM payment_requests pr
            LEFT JOIN users u ON u.email = pr.recipient_email
            WHERE pr.requester_id = $1
            ORDER BY pr.created_at DESC
        `, [userId]);

        const receivedRes = await pool.query(`
            SELECT pr.*, u.full_name as requester_name 
            FROM payment_requests pr
            JOIN users u ON u.id = pr.requester_id
            WHERE pr.recipient_email = $1
            ORDER BY pr.created_at DESC
        `, [userEmail]);

        res.json({
            sent: sentRes.rows,
            received: receivedRes.rows
        });
    } catch (err) {
        console.error('Fetch Payment Requests Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUBLIC: Get Payment Request Details
app.get('/v1/public/payment-requests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const requestRes = await pool.query(`
            SELECT pr.*, u.full_name as requester_name, u.email as requester_email
            FROM payment_requests pr
            JOIN users u ON u.id = pr.requester_id
            WHERE pr.id = $1
        `, [id]);

        if (requestRes.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json(requestRes.rows[0]);
    } catch (err) {
        console.error('Fetch Public Request Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUBLIC: Create Stripe Intent for a payment request
app.post('/v1/public/payment-requests/:id/intent', async (req, res) => {
    try {
        const { id } = req.params;
        const prRes = await pool.query('SELECT amount, currency FROM payment_requests WHERE id = $1', [id]);
        if (prRes.rows.length === 0) return res.status(404).json({ error: 'Request not found' });

        const { amount, currency } = prRes.rows[0];

        // Fee for public card payments (Stripe Fee: 2.9% + 0.30)
        const stripeFee = (parseFloat(amount) * 0.029) + 0.30;
        const totalAmount = parseFloat(amount) + stripeFee;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100),
            currency: currency.toLowerCase(),
            metadata: { requestId: id, type: 'PUBLIC_REQUEST' },
        });

        res.json({ clientSecret: paymentIntent.client_secret, totalAmount: totalAmount.toFixed(2) });
    } catch (err) {
        console.error('Public Intent Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUBLIC: Confirm payment (usually called by frontend after Stripe redirect/confirmation)
app.post('/v1/public/payment-requests/:id/confirm', async (req, res) => {
    const { id } = req.params;
    const { paymentIntentId } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verify Request
        const prRes = await client.query('SELECT * FROM payment_requests WHERE id = $1 AND status = \'PENDING\' FOR UPDATE', [id]);
        if (prRes.rows.length === 0) throw new Error('Request already paid or invalid');
        const request = prRes.rows[0];

        // 2. Verify Stripe Payment (if ID provided)
        if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== 'succeeded') throw new Error('Payment not confirmed by Stripe');
        }

        const amount = parseFloat(request.amount);
        const currency = request.currency;
        const requesterId = request.requester_id;

        // 3. Credit Requester Wallet
        const walletRes = await client.query('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [requesterId, currency]);
        if (walletRes.rows.length === 0) throw new Error('Requester does not have a matching wallet');
        const targetWalletId = walletRes.rows[0].id;

        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, targetWalletId]);

        // 4. Update Request Status
        await client.query('UPDATE payment_requests SET status = \'PAID\' WHERE id = $1', [id]);

        // 5. Ledger Entry
        const ref = 'CTX-' + crypto.randomBytes(8).toString('hex').toUpperCase();
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'TRANSFER', 'COMPLETED')`,
            [ref, targetWalletId, amount, currency, `Payment request ${id} fulfilled (Public Card)`]
        );

        await client.query('COMMIT');

        // 6. Notify Requester
        try {
            const requesterRes = await pool.query('SELECT full_name, email FROM users WHERE id = $1', [requesterId]);
            const requester = requesterRes.rows[0];
            if (requester) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, title, message, amount, metadata)
                    VALUES ($1, 'payment_received', $2, $3, $4, $5)
                `, [
                    requesterId,
                    'Payment Received',
                    `Your request for ${currency} ${amount} has been paid!`,
                    amount,
                    JSON.stringify({ requestId: id, reference: ref })
                ]);

                resend.emails.send({
                    from: 'FlapaPay <noreply@skillpulse.cloud>',
                    to: [requester.email],
                    subject: `Request Paid: ${currency} ${amount} received!`,
                    html: `<p>Hello ${requester.full_name}, your payment request for <strong>${currency} ${amount}</strong> has been successfully paid via card.</p>`
                });
            }
        } catch (notifErr) { console.error('Notification error:', notifErr); }

        res.json({ success: true, reference: ref });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Public Confirm Error:', err);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PAY a payment request
app.post('/v1/payment-requests/:id/pay', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { paymentMethodId, walletId } = req.body; // paymentMethodId for stripe, walletId for balance
        const payerId = req.user.id;

        await client.query('BEGIN');

        // 1. Fetch Request
        const requestRes = await client.query('SELECT * FROM payment_requests WHERE id = $1 AND status = \'PENDING\'', [id]);
        if (requestRes.rows.length === 0) {
            throw new Error('Request not found or already paid');
        }
        const pr = requestRes.rows[0];

        // 2. Process Payment (Similar to send money logic)
        const amount = parseFloat(pr.amount);
        const currency = pr.currency;
        const requesterId = pr.requester_id;

        // --- Simplified Payment Logic (Reuse existing patterns) ---
        // For brevity in this edit, assuming balance payment for now, 
        // but it can be extended to Stripe like the other endpoints.

        if (walletId) {
            // Pay via wallet
            const payerWalletRes = await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2', [walletId, payerId]);
            if (payerWalletRes.rows.length === 0) throw new Error('Wallet not found');
            const payerWallet = payerWalletRes.rows[0];

            if (parseFloat(payerWallet.balance) < amount) {
                throw new Error('Insufficient balance');
            }

            // Debit Payer
            await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [amount, payerWallet.id]);
        } else if (paymentMethodId) {
            // Pay via Card (Stripe)
            const customerId = await getOrCreateStripeCustomer(payerId, req.user.email);

            // Stripe Fee: 2.9% + 0.30
            const stripeFee = (amount * 0.029) + 0.30;
            const totalCharge = amount + stripeFee;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalCharge * 100),
                currency: currency.toLowerCase(),
                customer: customerId,
                payment_method: paymentMethodId,
                off_session: true,
                confirm: true,
                description: `Payment for request ${id} from ${req.user.email}`,
                metadata: {
                    requestId: id,
                    target_amount: amount,
                    fee: stripeFee.toFixed(2)
                }
            });

            if (paymentIntent.status !== 'succeeded') {
                throw new Error(`Payment failed: ${paymentIntent.status}`);
            }
            console.log(`[PayRequest] Card payment succeeded for amount ${amount}`);
        } else {
            throw new Error('No payment method provided');
        }

        // 3. Credit Requester
        const requesterWalletRes = await client.query('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [requesterId, currency]);
        if (requesterWalletRes.rows.length === 0) throw new Error('Requester wallet not found');
        const requesterWalletId = requesterWalletRes.rows[0].id;

        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, requesterWalletId]);

        // 4. Record Ledger Entry
        const ref = 'PR-' + crypto.randomBytes(8).toString('hex').toUpperCase();
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, credit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'TRANSFER', 'COMPLETED')
        `, [ref, walletId || null, requesterWalletId, amount, currency, `Payment for request ${id} from ${req.user.email}`]);

        // 5. Update Request Status
        await client.query('UPDATE payment_requests SET status = \'PAID\' WHERE id = $1', [id]);

        await client.query('COMMIT');

        // 6. Notify Requester (using valid enum 'payment_received')
        await pool.query(`
            INSERT INTO notifications (user_id, type, title, message, amount, metadata)
            VALUES ($1, 'payment_received', $2, $3, $4, $5)
        `, [
            requesterId,
            'Payment Received',
            `${req.user.full_name} has paid your request for ${currency} ${amount}.`,
            amount.toString(),
            JSON.stringify({ requestId: pr.id, type: 'PAYMENT_RECEIVED' })
        ]);

        res.json({ success: true, reference: ref });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Pay Request Error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    } finally {
        client.release();
    }
});

// PUBLIC: Get Invoice Details for Payment Page
app.get('/v1/public/invoices/:id', async (req, res) => {
    try {
        const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
        if (invoiceRes.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });

        const itemsRes = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [req.params.id]);

        // Fetch merchant details (business name)
        const merchantRes = await pool.query(`
            SELECT m.business_name, u.email 
            FROM merchants m 
            JOIN users u ON m.user_id = u.id 
            WHERE u.id = $1
        `, [invoiceRes.rows[0].user_id]);

        const merchant = merchantRes.rows[0] || { business_name: 'FlapaPay Merchant' };

        res.json({ ...invoiceRes.rows[0], items: itemsRes.rows, merchant });
    } catch (err) {
        console.error('Get Public Invoice Error:', err);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// PUBLIC: Create Payment Intent for Invoice
app.post('/v1/public/invoices/:id/intent', async (req, res) => {
    const { id } = req.params;
    const { amount, email } = req.body;

    try {
        const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
        if (invoiceRes.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
        const invoice = invoiceRes.rows[0];

        if (invoice.status === 'PAID') return res.status(400).json({ error: 'Invoice already paid' });

        const remainingBalance = parseFloat(invoice.total_amount) - parseFloat(invoice.total_paid || 0);
        const paymentAmount = amount ? parseFloat(amount) : remainingBalance;

        if (paymentAmount <= 0) return res.status(400).json({ error: 'Invalid payment amount' });
        if (paymentAmount > remainingBalance + 0.01) return res.status(400).json({ error: 'Payment exceeds remaining balance' });

        // Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(paymentAmount * 100),
            currency: invoice.currency.toLowerCase(),
            metadata: {
                invoice_id: invoice.id,
                merchant_user_id: invoice.user_id,
                guest_email: email || invoice.client_email
            },
            automatic_payment_methods: { enabled: true }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Invoice Intent Error:', err);
        res.status(500).json({ error: err.message || 'Payment initiation failed' });
    }
});

// PUBLIC: Confirm Invoice Payment
app.post('/v1/public/invoices/:id/confirm', async (req, res) => {
    const { id } = req.params;
    const { paymentIntentId, amount, paymentMethod } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const invoiceRes = await client.query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [id]);
        if (invoiceRes.rows.length === 0) throw new Error('Invoice not found');
        const invoice = invoiceRes.rows[0];

        const paidAmount = parseFloat(amount);
        const newTotalPaid = parseFloat(invoice.total_paid || 0) + paidAmount;
        const isFullyPaid = newTotalPaid >= parseFloat(invoice.total_amount) - 0.01;

        // 1. Record Payment
        await client.query(`
            INSERT INTO invoice_payments (invoice_id, amount, currency, payment_method, status, transaction_reference)
            VALUES ($1, $2, $3, $4, 'COMPLETED', $5)
        `, [id, paidAmount, invoice.currency, paymentMethod || 'card', paymentIntentId]);

        // 2. Update Invoice
        await client.query(`
            UPDATE invoices 
            SET total_paid = $1, status = $2 
            WHERE id = $3
        `, [newTotalPaid, isFullyPaid ? 'PAID' : 'SENT', id]);

        // 3. Update Merchant Wallet
        const walletRes = await client.query('SELECT * FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE', [invoice.user_id, invoice.currency]);
        if (walletRes.rows.length > 0) {
            const wallet = walletRes.rows[0];
            const feeAmount = Math.round(paidAmount * 0.018 * 100) / 100; // 1.8% fee
            const netAmount = paidAmount - feeAmount;

            const ref = 'INV-PAY-' + crypto.randomBytes(4).toString('hex').toUpperCase();
            await client.query(`
                INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
                VALUES ($1, $2, $3, $4, $5, 'DEPOSIT', 'COMPLETED')
            `, [ref, wallet.id, netAmount, wallet.currency, `Payment for Invoice #${invoice.invoice_number}`]);

            await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [netAmount, wallet.id]);
        }

        await client.query('COMMIT');
        res.json({ success: true, isFullyPaid });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Invoice Confirm Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// PUBLIC: Mobile Money Initiation for Invoice (PawaPay)
app.post('/v1/public/invoices/:id/initiate-mobile', async (req, res) => {
    const { id } = req.params;
    const { amount, phoneNumber, provider } = req.body;

    try {
        const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
        if (invoiceRes.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
        const invoice = invoiceRes.rows[0];

        // Validate required fields
        if (!phoneNumber || !provider) {
            return res.status(400).json({ error: 'Phone number and provider are required' });
        }

        // Normalize Phone Number (Ensure country code, no +)
        let normalizedPhone = phoneNumber.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = (invoice.currency === 'ZMW' ? '260' : '234') + normalizedPhone.substring(1);
        } else if (!normalizedPhone.startsWith('260') && !normalizedPhone.startsWith('234')) {
            normalizedPhone = (invoice.currency === 'ZMW' ? '260' : '234') + normalizedPhone;
        }

        const depositId = crypto.randomUUID();
        const clientReferenceId = `INV-${Date.now()}`;

        // Truncate and sanitize customer message to max 22 chars (PawaPay requirement, alphanumeric + space only)
        const customerMessage = `Invoice ${invoice.invoice_number}`.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 22);

        // CORRECT PawaPay API format for deposits: payer with type MMO
        const response = await axios.post(`${PAWAPAY_BASE_URL}/v2/deposits`, {
            depositId: depositId,
            payer: {
                type: 'MMO',
                accountDetails: {
                    phoneNumber: normalizedPhone,
                    provider: provider
                }
            },
            amount: parseFloat(amount).toFixed(2),
            currency: invoice.currency,
            clientReferenceId: clientReferenceId,
            customerMessage: customerMessage,
            metadata: [
                { invoice_id: invoice.id },
                { merchant_id: invoice.user_id }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('[PawaPay] Invoice deposit initiated:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Invoice PawaPay Error Details:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to initiate mobile money payment',
            details: error.response?.data || error.message
        });
    }
});

// 1. Create Invoice
app.post('/v1/invoices', authenticateToken, async (req, res) => {
    const {
        clientName, clientEmail, clientAddress,
        invoiceNumber, invoiceDate, dueDate, currency, items,
        logoUrl, brandColor, terms, scheduledAt,
        senderName, senderAddress, senderPhone,
        taxRate, discountAmount, allowsInstallments
    } = req.body;

    // For drafts, allow minimal fields, but DB has NOT NULL constraints.
    const isDraft = !scheduledAt;
    const effectiveClientName = clientName || (isDraft ? 'Unnamed Client' : '');
    const effectiveClientEmail = clientEmail || (isDraft ? 'no-email@draft.com' : '');
    const effectiveInvoiceNumber = invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;

    // Calculate totals
    const subtotal = (items || []).reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const effectiveTaxRate = taxRate !== undefined ? parseFloat(taxRate) : 16.0;
    const effectiveDiscount = discountAmount !== undefined ? parseFloat(discountAmount) : 0;

    // Total = (Subtotal - Discount) * (1 + TaxRate/100)
    // Or is it Tax before discount? Usually Tax is on the final price after discount.
    const taxableAmount = Math.max(0, subtotal - effectiveDiscount);
    const taxAmount = taxableAmount * (effectiveTaxRate / 100);
    const totalAmount = taxableAmount + taxAmount;

    const status = scheduledAt ? 'SCHEDULED' : 'DRAFT';

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert Invoice
        const invoiceRes = await client.query(`
            INSERT INTO invoices (
                user_id, client_name, client_email, client_address, 
                invoice_number, invoice_date, due_date, currency, 
                subtotal, tax_amount, total_amount, status,
                logo_url, brand_color, terms_conditions, scheduled_at,
                sender_name, sender_address, sender_phone,
                tax_rate, discount_amount, allows_installments
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING id`,
            [
                req.user.id, effectiveClientName, effectiveClientEmail, clientAddress || '',
                effectiveInvoiceNumber, invoiceDate || new Date(), dueDate || new Date(), currency || 'USD',
                subtotal, taxAmount, totalAmount, status,
                logoUrl || '', brandColor || '#000000', terms || '', scheduledAt || null,
                senderName || '', senderAddress || '', senderPhone || '',
                effectiveTaxRate, effectiveDiscount, allowsInstallments || false
            ]
        );
        const invoiceId = invoiceRes.rows[0].id;

        // Insert Items
        for (const item of items) {
            await client.query(`
                INSERT INTO invoice_items (invoice_id, description, quantity, price, amount)
                VALUES ($1, $2, $3, $4, $5)`,
                [invoiceId, item.description, item.quantity, item.price, item.quantity * item.price]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Invoice created', id: invoiceId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create Invoice Error:', err);
        res.status(500).json({ error: 'Failed to create invoice', details: err.message });
    } finally {
        client.release();
    }
});

// 2. Update Invoice (PUT)
app.put('/v1/invoices/:id', authenticateToken, async (req, res) => {
    const invoiceId = req.params.id;
    const {
        clientName, clientEmail, clientAddress,
        invoiceNumber, invoiceDate, dueDate, currency, items,
        logoUrl, brandColor, terms, scheduledAt,
        senderName, senderAddress, senderPhone,
        taxRate, discountAmount, allowsInstallments
    } = req.body;

    // For drafts, allow minimal fields, but provide defaults for DB constraints
    const effectiveClientName = clientName || 'Unnamed Client';
    const effectiveClientEmail = clientEmail || 'no-email@draft.com';
    const effectiveInvoiceNumber = invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if invoice exists and belongs to user
        const checkRes = await client.query('SELECT id, status FROM invoices WHERE id = $1 AND user_id = $2', [invoiceId, req.user.id]);
        if (checkRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invoice not found' });
        }
        if (checkRes.rows[0].status === 'PAID') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Cannot edit a paid invoice' });
        }

        const isDraft = checkRes.rows[0].status === 'DRAFT' || checkRes.rows[0].status === 'SCHEDULED';
        const status = scheduledAt ? 'SCHEDULED' : (checkRes.rows[0].status);

        // Calculate totals
        const subtotal = (items || []).reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const effectiveTaxRate = taxRate !== undefined ? parseFloat(taxRate) : 16.0;
        const effectiveDiscount = discountAmount !== undefined ? parseFloat(discountAmount) : 0;

        const taxableAmount = Math.max(0, subtotal - effectiveDiscount);
        const taxAmount = taxableAmount * (effectiveTaxRate / 100);
        const totalAmount = taxableAmount + taxAmount;

        // Update Invoice
        const invoiceRes = await client.query(`
            UPDATE invoices SET
                client_name = $1, client_email = $2, client_address = $3,
                invoice_number = $4, invoice_date = $5, due_date = $6, currency = $7,
                subtotal = $8, tax_amount = $9, total_amount = $10, status = $11,
                logo_url = $12, brand_color = $13, terms_conditions = $14, scheduled_at = $15,
                sender_name = $16, sender_address = $17, sender_phone = $18,
                tax_rate = $19, discount_amount = $20,
                allows_installments = $21,
                updated_at = NOW()
            WHERE id = $22 AND user_id = $23`,
            [
                effectiveClientName, effectiveClientEmail, clientAddress || '',
                effectiveInvoiceNumber, invoiceDate || new Date(), dueDate || new Date(), currency || 'USD',
                subtotal, taxAmount, totalAmount, status,
                logoUrl || '', brandColor || '#000000', terms || '', scheduledAt || null,
                senderName || '', senderAddress || '', senderPhone || '',
                effectiveTaxRate, effectiveDiscount, allowsInstallments || false,
                invoiceId, req.user.id
            ]
        );

        // Replace Items (Delete all and re-insert)
        await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [invoiceId]);

        for (const item of items) {
            await client.query(`
                INSERT INTO invoice_items (invoice_id, description, quantity, price, amount)
                VALUES ($1, $2, $3, $4, $5)`,
                [invoiceId, item.description, item.quantity, item.price, item.quantity * item.price]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Invoice updated', id: invoiceId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update Invoice Error:', err);
        res.status(500).json({ error: 'Failed to update invoice' });
    } finally {
        client.release();
    }
});

// 3. Approve Invoice (Finalize)
app.post('/v1/invoices/:id/approve', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE invoices SET status = 'APPROVED' WHERE id = $1 AND user_id = $2 AND status = 'DRAFT' RETURNING *",
            [req.params.id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Invoice not found or already approved' });
        }

        res.json({ message: 'Invoice approved', invoice: result.rows[0] });
    } catch (err) {
        console.error('Approve Invoice Error:', err);
        res.status(500).json({ error: 'Failed to approve invoice' });
    }
});

// 3. Send Invoice (Email)
app.post('/v1/invoices/:id/send', authenticateToken, async (req, res) => {
    const invoiceId = req.params.id;
    const { cc, bcc, subject, body } = req.body; // New advanced fields

    try {
        // Fetch invoice details
        const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [invoiceId, req.user.id]);
        if (invoiceRes.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
        const invoice = invoiceRes.rows[0];

        // Fetch items
        const itemsRes = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
        invoice.items = itemsRes.rows;

        // Fetch Merchant Details
        const merchantRes = await pool.query(`
            SELECT m.business_name, u.email 
            FROM merchants m 
            JOIN users u ON m.user_id = u.id 
            WHERE u.id = $1
        `, [req.user.id]);
        const merchant = merchantRes.rows[0] || { business_name: 'FlapaPay Merchant', email: 'noreply@flapapay.com' };


        // Generate PDF
        const link = `http://localhost:5173/pay/inv/${invoice.id}`; // Localhost for dev
        const pdfStream = await ReactPDF.renderToStream(
            React.createElement(InvoiceDocument, { invoice, items: invoice.items, merchant, link })
        );

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of pdfStream) chunks.push(chunk);
        const pdfBuffer = Buffer.concat(chunks);

        // Send Email
        const emailOptions = {
            from: 'FlapaPay <noreply@skillpulse.cloud>', // Verified domain required
            to: [invoice.client_email],
            subject: subject || `Invoice Notification: #${invoice.invoice_number} from ${merchant.business_name}`,
            html: renderInvoiceEmail({
                merchantName: merchant.business_name,
                merchantLogo: invoice.logo_url,
                clientName: invoice.client_name,
                invoiceNumber: invoice.invoice_number,
                currency: invoice.currency,
                totalAmount: invoice.total_amount,
                paymentLink: link,
                message: body
            }),
            attachments: [
                {
                    filename: `Invoice-${invoice.invoice_number}.pdf`,
                    content: pdfBuffer,
                },
            ],
        };

        if (cc && cc.length > 0) emailOptions.cc = cc.split(',').map(e => e.trim());
        if (bcc && bcc.length > 0) emailOptions.bcc = bcc.split(',').map(e => e.trim());

        const data = await resend.emails.send(emailOptions);

        // Update status if DRAFT
        if (invoice.status === 'DRAFT') {
            await pool.query("UPDATE invoices SET status = 'SENT' WHERE id = $1", [invoiceId]);
        }

        res.json({ message: 'Invoice sent successfully', data });

    } catch (err) {
        console.error('Send Invoice Error:', err);
        res.status(500).json({ error: 'Failed to send invoice' });
    }
});

app.post('/v1/invoices/:id/remind', authenticateToken, async (req, res) => {
    const invoiceId = req.params.id;

    try {
        // Fetch invoice details
        const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [invoiceId, req.user.id]);
        if (invoiceRes.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
        const invoice = invoiceRes.rows[0];

        // Fetch items and merchant for PDF
        const itemsRes = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
        const merchantRes = await pool.query(`
            SELECT m.business_name, m.logo_url, u.email 
            FROM merchants m 
            JOIN users u ON m.user_id = u.id 
            WHERE u.id = $1
        `, [req.user.id]);
        const merchant = merchantRes.rows[0] || { business_name: 'FlapaPay Merchant' };

        // Generate PDF
        const link = `http://localhost:5173/pay/inv/${invoice.id}`;
        const pdfBuffer = await ReactPDF.renderToBuffer(
            React.createElement(InvoiceDocument, { invoice, items: itemsRes.rows, merchant, link })
        );

        // Send Reminder Email
        const data = await resend.emails.send({
            from: 'FlapaPay <noreply@skillpulse.cloud>',
            to: [invoice.client_email],
            subject: `Friendly Payment Reminder: Invoice #${invoice.invoice_number}`,
            html: renderInvoiceEmail({
                merchantName: merchant.business_name,
                merchantLogo: invoice.logo_url,
                clientName: invoice.client_name,
                invoiceNumber: invoice.invoice_number,
                currency: invoice.currency,
                totalAmount: invoice.total_amount,
                paymentLink: link,
                message: `This is a friendly reminder regarding Invoice #${invoice.invoice_number} from ${merchant.business_name}, which is currently awaiting payment.`
            }),
            attachments: [{ filename: `Invoice-${invoice.invoice_number}.pdf`, content: pdfBuffer }]
        });

        res.json({ message: 'Reminder sent successfully', messageId: data.id });
    } catch (err) {
        console.error('Reminder Error:', err);
        res.status(500).json({ error: 'Failed to send reminder', details: err.message });
    }
});

// ==========================================
// Admin CMS & Dynamic Content Routes
// ==========================================


// Calculate Read Time Helper
const calculateReadTime = (text) => {
    const wordsPerMinute = 200;
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
};

// Generate Slug Helper
const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// 1. Image Upload for CMS
app.post('/admin/content/upload', uploadBlog.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }
        const imageUrl = `/assets/images/blog/${req.file.filename}`;
        res.status(200).json({ url: imageUrl, message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Image Upload Error:', error);
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
});

// 2. Create Blog Post (Admin)
app.post('/admin/content/blog', async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, content, excerpt, author, author_role, author_image, category, image_url, tags } = req.body;

        let finalSlug = generateSlug(title);
        // Ensure slug is unique
        let slugExists = await client.query('SELECT id FROM blogs WHERE slug = $1', [finalSlug]);
        if (slugExists.rows.length > 0) {
            finalSlug = `${finalSlug}-${Date.now()}`;
        }

        const readTime = calculateReadTime(content);
        const autoExcerpt = excerpt || content.substring(0, 150) + '...';

        const result = await client.query(
            `INSERT INTO blogs 
             (title, slug, excerpt, content, author, author_role, author_image, category, image_url, read_time, tags)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [title, finalSlug, autoExcerpt, content, author, author_role || 'Contributor', author_image || '', category || 'Uncategorized', image_url, readTime, tags || []]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create Blog Error:', error);
        res.status(500).json({ message: 'Error creating blog', error: error.message });
    } finally {
        client.release();
    }
});

// 2.5 Update Blog Post (Admin)
app.put('/admin/content/blog/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { title, content, excerpt, author, author_role, author_image, category, image_url, tags } = req.body;

        let finalSlug = generateSlug(title);
        let slugExists = await client.query('SELECT id FROM blogs WHERE slug = $1 AND id != $2', [finalSlug, id]);
        if (slugExists.rows.length > 0) {
            finalSlug = `${finalSlug}-${Date.now()}`;
        }

        const readTime = calculateReadTime(content);
        const autoExcerpt = excerpt || content.substring(0, 150) + '...';

        const result = await client.query(
            `UPDATE blogs SET 
                title = $1, slug = $2, excerpt = $3, content = $4, author = $5, 
                author_role = $6, author_image = $7, category = $8, image_url = $9, 
                read_time = $10, tags = $11, updated_at = CURRENT_TIMESTAMP
             WHERE id = $12
             RETURNING *`,
            [title, finalSlug, autoExcerpt, content, author, author_role || 'Contributor', author_image || '', category || 'Uncategorized', image_url, readTime, tags || [], id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Update Blog Error:', error);
        res.status(500).json({ message: 'Error updating blog', error: error.message });
    } finally {
        client.release();
    }
});

// 3. Get All Blogs for Admin List
app.get('/admin/content/blog', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM blogs ORDER BY published_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Admin Blogs Error:', error);
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    } finally {
        client.release();
    }
});

// 4. Get Public Blogs List
app.get('/content/blog', async (req, res) => {
    const client = await pool.connect();
    try {
        const { category } = req.query;
        let query = 'SELECT id, title, slug, excerpt, author, category, image_url, read_time, published_at FROM blogs';
        const params = [];

        if (category && category !== 'All Posts') {
            query += ' WHERE category = $1';
            params.push(category);
        }
        query += ' ORDER BY published_at DESC';

        const result = await client.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Public Blogs Error:', error);
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    } finally {
        client.release();
    }
});

// 5. Get Public Blog by Slug
app.get('/content/blog/:slug', async (req, res) => {
    const client = await pool.connect();
    try {
        const { slug } = req.params;
        const result = await client.query('SELECT * FROM blogs WHERE slug = $1', [slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Fetch Single Blog Error:', error);
        res.status(500).json({ message: 'Error fetching blog', error: error.message });
    } finally {
        client.release();
    }
});

// ==========================================
// Help Articles API
// ==========================================

app.post('/admin/content/help', async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, content, excerpt, category, tags } = req.body;
        let finalSlug = generateSlug(title);
        let slugExists = await client.query('SELECT id FROM help_articles WHERE slug = $1', [finalSlug]);
        if (slugExists.rows.length > 0) finalSlug = `${finalSlug}-${Date.now()}`;
        const readTime = calculateReadTime(content);
        const autoExcerpt = excerpt || content.substring(0, 150) + '...';

        const result = await client.query(
            'INSERT INTO help_articles (title, slug, excerpt, content, category, read_time, tags) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, finalSlug, autoExcerpt, content, category || 'General', readTime, tags || []]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating help article', error: error.message });
    } finally { client.release(); }
});

app.put('/admin/content/help/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { title, content, excerpt, category, tags } = req.body;
        let finalSlug = generateSlug(title);
        let slugExists = await client.query('SELECT id FROM help_articles WHERE slug = $1 AND id != $2', [finalSlug, id]);
        if (slugExists.rows.length > 0) finalSlug = `${finalSlug}-${Date.now()}`;
        const readTime = calculateReadTime(content);
        const autoExcerpt = excerpt || content.substring(0, 150) + '...';

        const result = await client.query(
            'UPDATE help_articles SET title=$1, slug=$2, excerpt=$3, content=$4, category=$5, read_time=$6, tags=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8 RETURNING *',
            [title, finalSlug, autoExcerpt, content, category || 'General', readTime, tags || [], id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating help article', error: error.message });
    } finally { client.release(); }
});

app.get('/admin/content/help', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM help_articles ORDER BY published_at DESC');
        res.status(200).json(result.rows);
    } catch (error) { res.status(500).json({ message: 'Error fetching', error: error.message }); } finally { client.release(); }
});

app.delete('/admin/content/help/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM help_articles WHERE id = $1', [req.params.id]);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); } finally { client.release(); }
});

app.get('/content/help', async (req, res) => {
    const client = await pool.connect();
    try {
        const { search, category } = req.query;
        let query = 'SELECT * FROM help_articles WHERE 1=1';
        let values = [];
        let index = 1;

        if (search) {
            query += ` AND (title ILIKE $${index} OR content ILIKE $${index})`;
            values.push(`%${search}%`);
            index++;
        }

        if (category) {
            query += ` AND category = $${index}`;
            values.push(category);
            index++;
        }

        query += ' ORDER BY published_at DESC';

        const result = await client.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); } finally { client.release(); }
});

app.get('/content/help/:slug', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM help_articles WHERE slug = $1', [req.params.slug]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.status(200).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); } finally { client.release(); }
});

// ==========================================
// Job Postings API
// ==========================================

app.post('/admin/content/jobs', async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, department, location, type, content, requirements } = req.body;
        const description = content;
        let finalSlug = generateSlug(title);
        let slugExists = await client.query('SELECT id FROM job_postings WHERE slug = $1', [finalSlug]);
        if (slugExists.rows.length > 0) finalSlug = `${finalSlug}-${Date.now()}`;

        const reqArray = typeof requirements === 'string' ? requirements.split('\n').filter(Boolean) : requirements;

        const result = await client.query(
            'INSERT INTO job_postings (title, slug, department, location, type, description, requirements) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, finalSlug, department || 'Engineering', location || 'Remote, Global', type || 'Full-time', description, reqArray || []]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating job', error: error.message });
    } finally { client.release(); }
});

app.put('/admin/content/jobs/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { title, department, location, type, description, requirements } = req.body;
        let finalSlug = generateSlug(title);
        let slugExists = await client.query('SELECT id FROM job_postings WHERE slug = $1 AND id != $2', [finalSlug, id]);
        if (slugExists.rows.length > 0) finalSlug = `${finalSlug}-${Date.now()}`;

        const reqArray = typeof requirements === 'string' ? requirements.split('\n').filter(Boolean) : requirements;

        const result = await client.query(
            'UPDATE job_postings SET title=$1, slug=$2, department=$3, location=$4, type=$5, description=$6, requirements=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8 RETURNING *',
            [title, finalSlug, department || 'Engineering', location || 'Remote, Global', type || 'Full-time', description, reqArray || [], id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error updating job', error: error.message });
    } finally { client.release(); }
});

app.get('/admin/content/jobs', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM job_postings ORDER BY published_at DESC');
        const mapped = result.rows.map(r => ({ ...r, content: r.description }));
        res.status(200).json(mapped);
    } catch (error) { res.status(500).json({ error: error.message }); } finally { client.release(); }
});

app.delete('/admin/content/jobs/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM job_postings WHERE id = $1', [req.params.id]);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) { res.status(500).json({ error: error.message }); } finally { client.release(); }
});

app.get('/content/jobs', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, title, slug, department, location, type, description, published_at FROM job_postings ORDER BY published_at DESC');
        res.status(200).json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); } finally { client.release(); }
});

app.get('/content/jobs/:slug', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM job_postings WHERE slug = $1', [req.params.slug]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
        res.status(200).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: error.message }); } finally { client.release(); }
});

// ==========================================
// Newsletter Subscriptions
// ==========================================

// 1. Subscribe to newsletter
app.post('/api/subscribe', async (req, res) => {
    const client = await pool.connect();
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        const result = await client.query(
            'INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING id',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({ message: 'Email already subscribed' });
        }

        res.status(201).json({ message: 'Successfully subscribed to the newsletter' });
    } catch (error) {
        console.error('Subscription Error:', error);
        res.status(500).json({ message: 'Failed to subscribe', error: error.message });
    } finally {
        client.release();
    }
});

// 2. Get all subscribers (Admin)
app.get('/admin/subscribers', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM subscribers ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Subscribers Error:', error);
        res.status(500).json({ message: 'Failed to fetch subscribers', error: error.message });
    } finally {
        client.release();
    }
});

// ==========================================
// Webhook & Start Server
// ==========================================

// 4. List Invoices
app.get('/v1/invoices', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('List Invoices Error:', err);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// 5. Get Invoice Details
app.get('/v1/invoices/:id', authenticateToken, async (req, res) => {
    try {
        const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (invoiceRes.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });

        const itemsRes = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
        const paymentsRes = await pool.query('SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY created_at DESC', [req.params.id]);

        res.json({
            ...invoiceRes.rows[0],
            items: itemsRes.rows,
            payments: paymentsRes.rows
        });
    } catch (err) {
        console.error('Get Invoice Error:', err);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// --- PDF Generation Endpoint ---
app.get('/v1/invoices/:id/pdf', async (req, res) => {
    try {
        const invoiceId = req.params.id;

        // Fetch Invoice Data
        const invoiceRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
        if (invoiceRes.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
        const invoice = invoiceRes.rows[0];

        // Fetch items
        const itemsRes = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
        const items = itemsRes.rows;

        // Fetch Merchant Details
        const merchantRes = await pool.query(`
            SELECT m.business_name, u.email 
            FROM merchants m 
            JOIN users u ON m.user_id = u.id 
            WHERE u.id = $1
        `, [invoice.user_id]);
        const merchant = merchantRes.rows[0] || { business_name: 'FlapaPay Merchant' };
        const link = `http://localhost:5173/pay/inv/${invoice.id}`;

        // Generate PDF Buffer
        const pdfBuffer = await ReactPDF.renderToBuffer(
            React.createElement(InvoiceDocument, { invoice, items, merchant, link })
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Invoice-${invoice.invoice_number}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'unified-flapapay-backend' });
});

// --- Real-time Support Chat API ---

// 1. Get or Create Active Support Session
app.post('/support/session', authenticateToken, async (req, res) => {
    try {
        // Check for existing active session
        let sessionRes = await pool.query(
            `SELECT s.*, a.full_name as agent_name, a.avatar_url as agent_avatar
             FROM support_sessions s
             LEFT JOIN users a ON s.agent_id = a.id
             WHERE s.user_id = $1 AND s.status != 'closed' 
             ORDER BY s.created_at DESC LIMIT 1`,
            [req.user.id]
        );

        if (sessionRes.rows.length > 0) {
            return res.json(sessionRes.rows[0]);
        }

        // Create new session
        const newSession = await pool.query(
            `INSERT INTO support_sessions (user_id, status) VALUES ($1, 'active') RETURNING *`,
            [req.user.id]
        );
        res.json(newSession.rows[0]);
    } catch (err) {
        console.error('Error creating support session:', err);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// 2. Get Messages for Session
app.get('/support/messages/:sessionId', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const messages = await pool.query(
            `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
            [sessionId]
        );
        res.json(messages.rows);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// 3. Send Message
app.post('/support/message', authenticateToken, async (req, res) => {
    const { sessionId, content } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content required' });

    try {
        const sender = req.user.role === 'admin' ? 'agent' : 'user';

        // Insert Message
        const msgRes = await pool.query(
            `INSERT INTO chat_messages (session_id, sender, content) VALUES ($1, $2, $3) RETURNING *`,
            [sessionId, sender, content]
        );

        // Update session timestamp
        await pool.query(`UPDATE support_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);

        // If user sent it, check session status for AI
        if (sender === 'user') {
            const sessionRes = await pool.query(`SELECT status FROM support_sessions WHERE id = $1`, [sessionId]);
            const status = sessionRes.rows[0]?.status;

            if (status === 'active') {
                // Trigger AI Response asynchronously
                generateAIResponse(sessionId, content, req.user.id);
            }
        }

        res.json(msgRes.rows[0]);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// 4. Admin: Get all active support sessions
app.get('/admin/support/sessions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.*, 
                u.full_name as user_name, 
                u.email as user_email, 
                u.avatar_url as user_avatar,
                a.full_name as agent_name
            FROM support_sessions s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN users a ON s.agent_id = a.id
            WHERE s.status != 'closed'
            ORDER BY s.updated_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching admin support sessions:', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// 5. Admin: Take over a session
app.post('/admin/support/sessions/:id/takeover', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE support_sessions SET agent_id = $1, status = 'agent_active', updated_at = NOW() WHERE id = $2`,
            [req.user.id, id]
        );

        // Add a system message
        await pool.query(
            `INSERT INTO chat_messages (session_id, sender, content) VALUES ($1, 'system', $2)`,
            [id, `Agent ${req.user.full_name} has joined the chat.`]
        );

        res.json({ success: true, message: 'Session taken over' });
    } catch (err) {
        console.error('Error taking over session:', err);
        res.status(500).json({ error: 'Failed to take over session' });
    }
});

// 6. Admin: Complete session and hand back to AI
app.post('/admin/support/sessions/:id/complete', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE support_sessions SET agent_id = NULL, status = 'active', updated_at = NOW() WHERE id = $1`,
            [id]
        );

        // Add a system message and a prompt for review
        await pool.query(
            `INSERT INTO chat_messages (session_id, sender, content) VALUES ($1, 'system', $2)`,
            [id, `Agent ${req.user.full_name} has completed the support session. The AI assistant is now back online. Please let us know if you found this help useful!`]
        );

        res.json({ success: true, message: 'Session handed back to AI' });
    } catch (err) {
        console.error('Error completing session:', err);
        res.status(500).json({ error: 'Failed to complete session' });
    }
});

// 7. Admin: Close a session
app.post('/admin/support/sessions/:id/close', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            `UPDATE support_sessions SET status = 'closed', updated_at = NOW() WHERE id = $1`,
            [id]
        );

        await pool.query(
            `INSERT INTO chat_messages (session_id, sender, content) VALUES ($1, 'system', 'This support session has been closed.')`,
            [id]
        );

        res.json({ success: true, message: 'Session closed' });
    } catch (err) {
        console.error('Error closing session:', err);
        res.status(500).json({ error: 'Failed to close session' });
    }
});

async function generateAIResponse(sessionId, userMessage, userId) {
    try {
        // 1. RAG: Search for relevant knowledge in help_articles
        const keywords = userMessage.toLowerCase().split(' ').filter(w => w.length > 3);
        let context = '';
        if (keywords.length > 0) {
            const searchQuery = `
                SELECT title, content FROM help_articles 
                WHERE ${keywords.map((_, i) => `(title ILIKE $${i + 1} OR content ILIKE $${i + 1})`).join(' OR ')}
                LIMIT 3
            `;
            const searchRes = await pool.query(searchQuery, keywords.map(k => `%${k}%`));
            context = searchRes.rows.map(r => `[Article: ${r.title}]\n${r.content}`).join('\n\n');
        }

        // 2. Fetch recent context (last 5 messages)
        const contextRes = await pool.query(
            `SELECT sender, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 5`,
            [sessionId]
        );
        const history = contextRes.rows.reverse().map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        // 3. Define Fintech Workflows and System Prompt
        const systemPrompt = `
You are FlapaPay's expert fintech support assistant. Your goal is to provide accurate, natural, and helpful responses based on FlapaPay-specific documentation.

CORE WORKFLOWS:
- KYC: Direct users to "Profile -> KYC" tab. Verification takes 24-48h.
- VIRTUAL CARDS: Direct to "Cards" tab. USD (Mastercard) and ZMW (Visa) available.
- DEPOSITS: Explain PawaPay mobile money flow via "Wallets -> Deposit".
- DISPUTES: Ask for Transaction Hash from "Transactions" and use "Report Issue".

${context ? `RELEVANT DOCUMENTATION:\n${context}\n` : ''}

HANDOFF POLICY:
- If the user explicitly asks for a human, a person, or an agent.
- If the user reports a serious security issue or loss of funds that you cannot verify.
- If the user is being abusive or extremely frustrated.
- IN THESE CASES ONLY, your response MUST be exactly: HANDOFF_TO_AGENT

Be polite, professional, and keep answers concise.
        `.trim();

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: userMessage }
            ],
            max_tokens: 300
        });

        const aiText = completion.choices[0].message.content;

        if (aiText.includes('HANDOFF_TO_AGENT')) {
            // Switch to Human Agent
            await pool.query(`UPDATE support_sessions SET status = 'waiting_for_agent', updated_at = NOW() WHERE id = $1`, [sessionId]);
            await pool.query(
                `INSERT INTO chat_messages (session_id, sender, content) VALUES ($1, 'system', 'Connecting you to a human agent...')`,
                [sessionId]
            );
        } else {
            // Send AI Response
            await pool.query(
                `INSERT INTO chat_messages (session_id, sender, content) VALUES ($1, 'ai', $2)`,
                [sessionId, aiText]
            );
            await pool.query(`UPDATE support_sessions SET updated_at = NOW() WHERE id = $1`, [sessionId]);
        }
    } catch (err) {
        console.error('AI Generation Error:', err);
    }
}

// --- Notifications API ---

app.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.patch('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

app.post('/notifications/mark-all-read', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1`,
            [req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark all read' });
    }
});

// --- Payment Links Routes ---

// Create a Payment Link
app.post('/payment-links', authenticateToken, async (req, res) => {
    const { title, description, amount, currency, wallet_id, allows_mobile_money, allows_card, redirect_url } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO payment_links (user_id, wallet_id, title, description, amount, currency, allows_mobile_money, allows_card, redirect_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [req.user.id, wallet_id, title, description, amount, currency, allows_mobile_money, allows_card, redirect_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create Link Error:', err);
        res.status(500).json({ error: 'Failed to create payment link' });
    }
});

// Get User's Payment Links
app.get('/payment-links', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM payment_links WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch Links Error:', err);
        res.status(500).json({ error: 'Failed to fetch payment links' });
    }
});

// Get Public Payment Link Details (No Auth)
app.get('/public/payment-links/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Increment view count
        await pool.query('UPDATE payment_links SET views = views + 1 WHERE id = $1', [id]);

        const result = await pool.query(
            `SELECT pl.*, u.full_name as merchant_name 
             FROM payment_links pl 
             JOIN users u ON pl.user_id = u.id 
             WHERE pl.id = $1 AND pl.active = true`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment link not found or inactive' });
        }

        const link = result.rows[0];
        // Don't expose internal IDs or sensitive data if not needed
        res.json({
            id: link.id,
            title: link.title,
            description: link.description,
            amount: link.amount,
            currency: link.currency,
            merchant_name: link.merchant_name,
            allows_mobile_money: link.allows_mobile_money,
            allows_card: link.allows_card,
            redirect_url: link.redirect_url
        });
    } catch (err) {
        console.error('Public Link Error:', err);
        res.status(500).json({ error: 'Failed to fetch payment link' });
    }
});

// Public Payment Intent Endpoint (For Payment Links)
app.post('/public/payment-links/:id/intent', async (req, res) => {
    const { id } = req.params;
    const { paymentMethodId, email } = req.body;

    try {
        // 1. Fetch Link Details
        const linkRes = await pool.query('SELECT * FROM payment_links WHERE id = $1 AND active = true', [id]);
        if (linkRes.rows.length === 0) return res.status(404).json({ error: 'Link not found' });
        const link = linkRes.rows[0];

        // 2. Create Stripe Payment Intent
        let customerId = null;
        if (email) {
            const customers = await stripe.customers.list({ email: email, limit: 1 });
            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            } else {
                const newCustomer = await stripe.customers.create({ email });
                customerId = newCustomer.id;
            }
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(Number(link.amount) * 100),
            currency: link.currency.toLowerCase(),
            customer: customerId || undefined,
            metadata: {
                payment_link_id: link.id,
                wallet_id: link.wallet_id,
                merchant_user_id: link.user_id,
                guest_email: email
            },
            automatic_payment_methods: {
                enabled: true,
                // allow_redirects: 'never' // Common for card elements but PaymentElement might need it
            }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Public Intent Error:', err);
        res.status(500).json({ error: err.message || 'Payment initiation failed' });
    }
});

// Public Mobile Money Initiation (PawaPay)
app.post('/public/payment-links/:id/initiate-mobile', async (req, res) => {
    const { id } = req.params;
    const { amount, phoneNumber, provider } = req.body;

    try {
        const linkRes = await pool.query('SELECT * FROM payment_links WHERE id = $1 AND active = true', [id]);
        if (linkRes.rows.length === 0) return res.status(404).json({ error: 'Link not found' });
        const link = linkRes.rows[0];

        // Validate required fields
        if (!phoneNumber || !provider) {
            return res.status(400).json({ error: 'Phone number and provider are required' });
        }

        // Normalize Phone Number (Ensure country code, no +)
        let normalizedPhone = phoneNumber.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = (link.currency === 'ZMW' ? '260' : '234') + normalizedPhone.substring(1);
        } else if (!normalizedPhone.startsWith('260') && !normalizedPhone.startsWith('234')) {
            normalizedPhone = (link.currency === 'ZMW' ? '260' : '234') + normalizedPhone;
        }

        const depositId = crypto.randomUUID();
        const clientReferenceId = `LINK-${Date.now()}`;

        // CORRECT PawaPay API format for deposits: payer with type MMO
        const response = await axios.post(`${PAWAPAY_BASE_URL}/v2/deposits`, {
            depositId: depositId,
            payer: {
                type: 'MMO',
                accountDetails: {
                    phoneNumber: normalizedPhone,
                    provider: provider
                }
            },
            amount: amount.toString(),
            currency: link.currency,
            clientReferenceId: clientReferenceId,
            customerMessage: `Payment for ${link.title}`.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 22),
            metadata: [
                { paymentLinkId: link.id },
                { merchantId: link.user_id }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('[PawaPay] Payment link deposit initiated:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Public PawaPay Error Details:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to initiate mobile money payment',
            details: error.response?.data || error.message
        });
    }
});

// --- Reports Endpoints ---

// 1. Get Summary Data for Charts
app.get('/reports/summary', authenticateToken, async (req, res) => {
    try {
        // Daily Activity (Last 30 days)
        const dailyQuery = `
            SELECT 
                DATE_TRUNC('day', created_at) as date,
                SUM(CASE WHEN credit_wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) THEN amount ELSE 0 END) as inflow,
                SUM(CASE WHEN debit_wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) THEN amount ELSE 0 END) as outflow
            FROM ledger_entries
            WHERE (credit_wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) 
               OR debit_wallet_id IN (SELECT id FROM wallets WHERE user_id = $1))
              AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY date
            ORDER BY date ASC
        `;
        const dailyRes = await pool.query(dailyQuery, [req.user.id]);

        // Asset Distribution (Current Balances)
        const walletRes = await pool.query(
            'SELECT id, currency, balance FROM wallets WHERE user_id = $1',
            [req.user.id]
        );

        // Transaction Type Distribution
        const typeRes = await pool.query(`
            SELECT transaction_type as name, COUNT(*) as value
            FROM ledger_entries
            WHERE (credit_wallet_id IN (SELECT id FROM wallets WHERE user_id = $1) 
               OR debit_wallet_id IN (SELECT id FROM wallets WHERE user_id = $1))
            GROUP BY transaction_type
        `, [req.user.id]);

        res.json({
            dailyActivity: dailyRes.rows,
            assets: walletRes.rows,
            distribution: typeRes.rows
        });
    } catch (err) {
        console.error('Report Summary Error:', err);
        res.status(500).json({ error: 'Failed to fetch report summary' });
    }
});

// 2. Export CSV (Enhanced with Wallet Filter)
app.get('/reports/export/csv', authenticateToken, async (req, res) => {
    const { walletId } = req.query;
    try {
        let query = `
            SELECT 
                le.created_at as "Date",
                le.transaction_reference as "Reference",
                le.transaction_type as "Type",
                le.amount as "Amount",
                le.currency as "Currency",
                le.description as "Description",
                le.status as "Status"
            FROM ledger_entries le
            JOIN wallets w ON le.credit_wallet_id = w.id OR le.debit_wallet_id = w.id
            WHERE w.user_id = $1
        `;
        const params = [req.user.id];

        if (walletId) {
            query += ` AND (le.credit_wallet_id = $2 OR le.debit_wallet_id = $2)`;
            params.push(walletId);
        }

        query += ` ORDER BY le.created_at DESC`;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No transactions found' });
        }

        // Generate CSV
        const headers = Object.keys(result.rows[0]).join(',');
        const rows = result.rows.map(row =>
            Object.values(row).map(val => `"${val}"`).join(',')
        ).join('\n');
        const csv = `${headers}\n${rows}`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=flapapay_statement_${Date.now()}.csv`);
        res.send(csv);
    } catch (err) {
        console.error('CSV Export Error:', err);
        res.status(500).json({ error: 'Failed to export CSV' });
    }
});

// 3. Get Detailed Statement Data for a specific Wallet
app.get('/wallets/:id/statement', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Verify ownership
        const walletCheck = await pool.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (walletCheck.rows.length === 0) return res.status(404).json({ error: 'Wallet not found' });
        const wallet = walletCheck.rows[0];

        // Fetch transactions specifically for this wallet
        const query = `
            SELECT 
                le.*,
                CASE 
                    WHEN le.credit_wallet_id = $1 THEN 'CREDIT'
                    WHEN le.debit_wallet_id = $1 THEN 'DEBIT'
                END as flow_type
            FROM ledger_entries le
            WHERE le.credit_wallet_id = $1 OR le.debit_wallet_id = $1
            ORDER BY le.created_at DESC
        `;
        const result = await pool.query(query, [id]);

        res.json({
            wallet: wallet,
            transactions: result.rows,
            generatedAt: new Date(),
            user: { fullName: req.user.full_name, email: req.user.email }
        });
    } catch (err) {
        console.error('Statement Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch statement data' });
    }
});

// Confirm Payment & Credit Wallet
app.post('/public/payment-links/:id/confirm', async (req, res) => {
    const { id } = req.params;
    const { paymentIntentId, amount } = req.body;

    // Note: In production, verify paymentIntentId status with Stripe API to ensure it's truly 'succeeded'
    // For MVP/Demo, we trust the client's success signal but we should at least check existence if possible.

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Link & Wallet Info
        const linkRes = await client.query('SELECT * FROM payment_links WHERE id = $1', [id]);
        if (linkRes.rows.length === 0) throw new Error('Link not found');
        const link = linkRes.rows[0];

        // 2. Fetch Wallet
        const walletRes = await client.query('SELECT * FROM wallets WHERE id = $1 FOR UPDATE', [link.wallet_id]);
        if (walletRes.rows.length === 0) throw new Error('Target wallet not found');
        const wallet = walletRes.rows[0];

        // 3. Calculate Fee (1.8% Markup)
        const feeAmount = Math.round(amount * 0.018 * 100) / 100;
        const netAmount = amount - feeAmount;

        // 4. Create Ledger Entry (Credit)
        // This automatically triggers the notification via the DB trigger we built!
        const ref = 'PAY-' + crypto.randomBytes(8).toString('hex').toUpperCase();
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'DEPOSIT', 'COMPLETED')`,
            [ref, wallet.id, netAmount, wallet.currency, `Payment for ${link.title}`]
        );

        // 5. Record Fee
        if (feeAmount > 0) {
            await recordFee(client, ref, feeAmount, wallet.currency, `Processing fee for ${link.title}`);
        }

        // 6. Update Wallet Balance
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [netAmount, wallet.id]);

        // 7. Update Link Stats
        await client.query('UPDATE payment_links SET payments_count = payments_count + 1 WHERE id = $1', [id]);

        await client.query('COMMIT');

        // Return details for receipt
        res.json({ success: true, reference: ref });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Confirmation Error:', err);
        res.status(500).json({ error: 'Failed to confirm payment' });
    } finally {
        client.release();
    }
});

// --- Merchant Platform Endpoints ---

const generateApiKey = (prefix) => {
    return `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
};

async function refreshMerchantBalance(merchantId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find charges that are 'succeeded', have reached 'available_at', and haven't been 'settled'
        const chargesRes = await client.query(
            `SELECT id, amount, currency FROM charges 
             WHERE merchant_id = $1 AND status = 'succeeded' 
             AND available_at <= NOW() AND is_settled = false`,
            [merchantId]
        );

        for (const charge of chargesRes.rows) {
            const amount = parseFloat(charge.amount);
            // Move from pending to available in the balances table
            await client.query(
                `UPDATE balances SET 
                 pending_amount = pending_amount - $1,
                 available_amount = available_amount + $1,
                 updated_at = NOW()
                 WHERE merchant_id = $2`,
                [amount, merchantId]
            );

            // Mark the charge as settled
            await client.query('UPDATE charges SET is_settled = true WHERE id = $1', [charge.id]);
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Refresh Balance Error:', err);
    } finally {
        client.release();
    }
}

// --- Merchant KYC Options & Endpoints ---

app.get('/merchants/status', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM merchants WHERE user_id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.json({ complianceStatus: null });
        const m = result.rows[0];
        res.json({
            complianceStatus: m.compliance_status,
            isLiveEnabled: m.is_live_enabled,
            merchant: {
                account_id: m.account_id,
                admin_kyc_notes: m.admin_kyc_notes,
                kyc_submitted_at: m.kyc_submitted_at
            }
        });
    } catch (err) {
        console.error('Status check error:', err);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

app.get('/merchants/onboarding/draft', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT kyc_draft FROM merchants WHERE user_id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.json({});
        res.json(result.rows[0].kyc_draft || {});
    } catch (err) {
        console.error('Draft fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch draft' });
    }
});

app.post('/merchants/onboarding/draft', authenticateToken, async (req, res) => {
    try {
        // Ensure merchant exists first before attempting to update draft
        const exists = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (exists.rows.length === 0) {
            // Give them a shadow entry if they haven't explicitly created one
            const merchantId = crypto.randomUUID();
            await pool.query(
                'INSERT INTO merchants (id, user_id, business_name, compliance_status) VALUES ($1, $2, $3, $4)',
                [merchantId, req.user.id, 'Draft', 'SANDBOX_ONLY']
            );
        }
        await pool.query('UPDATE merchants SET kyc_draft = $1 WHERE user_id = $2', [JSON.stringify(req.body.payload), req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Draft save error:', err);
        res.status(500).json({ error: 'Failed to save draft' });
    }
});

app.post('/merchants/onboarding', authenticateToken, uploadKyc.any(), async (req, res) => {
    try {
        const {
            industry, subIndustry, legalName, tradingName, registeredAddress,
            businessPhone, businessEmail, businessWebsite, yearEstablished,
            expectedMonthlyVolume, businessDescription, pacraNumber, tpin,
            directors, corpShareholders, faceCapture
        } = req.body;

        // Map files to URLs (for dev: assuming local static serving at /assets/images/kyc/)
        const fileUrls = {};
        if (req.files) {
            req.files.forEach(f => {
                fileUrls[f.fieldname] = `/assets/images/kyc/${f.filename}`;
            });
        }

        // Handle possible base64 face capture passed in body directly
        let finalFaceCapture = faceCapture;
        if (faceCapture && faceCapture.startsWith('data:image')) {
            // In a real prod environment we'd extract the base64 and write to file/S3.
            // For now we'll store the base64 directly or a reference to it in the DB.
            // Passing base64 large strings in DB is not optimal for extreme scale, but works for prototyping
        }

        const kycPayload = {
            industry, subIndustry, legalName, tradingName, registeredAddress,
            businessPhone, businessEmail, businessWebsite, yearEstablished,
            expectedMonthlyVolume, businessDescription, pacraNumber, tpin,
            directors: directors ? JSON.parse(directors) : [],
            corpShareholders: corpShareholders ? JSON.parse(corpShareholders) : [],
            files: fileUrls,
            faceCapture: finalFaceCapture
        };

        await pool.query(
            `UPDATE merchants SET 
                business_name = $1, 
                pacra_number = $2, 
                tpin = $3, 
                registered_address = $4,
                kyc_payload = $5, 
                compliance_status = 'PENDING', 
                kyc_submitted_at = NOW(),
                kyc_draft = '{}'::jsonb
             WHERE user_id = $6`,
            [legalName, pacraNumber, tpin, registeredAddress, JSON.stringify(kycPayload), req.user.id]
        );

        res.json({ success: true, message: 'Onboarding submitted for review' });
    } catch (err) {
        console.error('Onboarding submit error:', err);
        res.status(500).json({ error: 'Failed to submit onboarding' });
    }
});

app.get('/admin/merchants', authenticateToken, isAdmin, async (req, res) => {
    try {
        const status = req.query.status || 'ALL';
        let query = `
            SELECT m.*, u.full_name, u.email 
            FROM merchants m 
            JOIN users u ON m.user_id = u.id
        `;
        const params = [];
        if (status !== 'ALL') {
            query += ' WHERE m.compliance_status = $1';
            params.push(status);
        }
        query += ' ORDER BY m.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Admin Fetch Merchants error:', err);
        res.status(500).json({ error: 'Failed to fetch merchants' });
    }
});

app.post('/admin/merchants/kyc/:id/review', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { decision, adminNotes } = req.body;
        const merchantId = req.params.id;

        const isLiveEnabled = decision === 'ACTIVE';

        await pool.query(
            `UPDATE merchants SET 
                compliance_status = $1, 
                is_live_enabled = $2, 
                admin_kyc_notes = $3 
             WHERE id = $4`,
            [decision, isLiveEnabled, adminNotes, merchantId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Admin Review error:', err);
        res.status(500).json({ error: 'Failed to process review' });
    }
});

app.post('/merchants/activate', authenticateToken, async (req, res) => {
    const { businessName, businessType, country } = req.body;

    try {
        // Check if already a merchant
        const existing = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Merchant account already exists' });
        }

        const merchantId = crypto.randomUUID();
        const accountId = 'ACC-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        // Create Merchant
        await pool.query(
            'INSERT INTO merchants (id, user_id, business_name, business_type, country, account_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [merchantId, req.user.id, businessName, businessType, country, accountId]
        );

        // Initialize Balance
        await pool.query(
            'INSERT INTO balances (merchant_id, pending_amount, available_amount, currency) VALUES ($1, 0, 0, $2)',
            [merchantId, 'ZMW']
        );

        // Generate Test Keys
        const pkTest = generateApiKey('pk_test');
        const skTest = generateApiKey('sk_test');

        await pool.query(
            'INSERT INTO api_keys (merchant_id, key_type, key_value) VALUES ($1, $2, $3), ($1, $4, $5)',
            [merchantId, 'test_public', pkTest, 'test_secret', skTest]
        );

        res.json({
            message: 'Merchant account activated successfully',
            merchantId: merchantId,
            keys: {
                publishable: pkTest,
                secret: skTest
            }
        });
    } catch (err) {
        console.error('Merchant Activation Error:', err);
        res.status(500).json({ error: 'Failed to activate merchant account' });
    }
});

// --- Unified API Key Middleware ---
const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
        return res.status(401).json({ error: 'Missing API Key' });
    }

    try {
        const result = await pool.query(`
            SELECT k.*, m.user_id as merchant_user_id 
            FROM api_keys k 
            JOIN merchants m ON k.merchant_id = m.id 
            WHERE k.key_value = $1 AND k.is_active = TRUE
        `, [apiKey]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid API Key' });
        }

        req.merchant = result.rows[0];
        req.isTestMode = req.merchant.key_type.startsWith('test_');
        next();
    } catch (err) {
        console.error('API Key Auth Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Unified Merchant Auth (API Key or JWT)
const authenticateMerchant = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const tokenOrKey = authHeader?.replace('Bearer ', '');

    if (!tokenOrKey) {
        return res.status(401).json({ error: 'Authentication required (API Key or Token)' });
    }

    // 1. Try API Key
    if (tokenOrKey.startsWith('pk_') || tokenOrKey.startsWith('sk_')) {
        try {
            const result = await pool.query(`
                SELECT k.*, m.user_id as merchant_user_id 
                FROM api_keys k 
                JOIN merchants m ON k.merchant_id = m.id 
                WHERE k.key_value = $1 AND k.is_active = TRUE
            `, [tokenOrKey]);

            if (result.rows.length > 0) {
                req.merchant = result.rows[0];
                req.isTestMode = req.merchant.key_type.startsWith('test_');
                return next();
            }
            return res.status(401).json({ error: 'Invalid API Key' });
        } catch (err) {
            console.error('API Key Auth Error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // 2. Try JWT Token
    try {
        const decoded = jwt.verify(tokenOrKey, JWT_SECRET);
        // Find merchant associated with this user
        const result = await pool.query(`
            SELECT m.*, m.id as merchant_id 
            FROM merchants m 
            WHERE m.user_id = $1
        `, [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Merchant account not found for this user' });
        }

        req.merchant = result.rows[0];
        req.user = { id: decoded.userId }; // Minimal user object

        // 3. Mode Selection (Default to Live if enabled, but allow header override)
        const headerMode = req.headers['x-flapapay-test-mode'];
        if (headerMode === 'true') {
            req.isTestMode = true;
        } else if (headerMode === 'false') {
            req.isTestMode = false;
        } else {
            req.isTestMode = !req.merchant.is_live_enabled;
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// --- Unified Charge API (/v1/charges) ---
app.post('/v1/charges', authenticateApiKey, async (req, res) => {
    const { amount, currency, source, description, mobile_number, provider } = req.body;

    // 1. Validation
    if (!amount || !currency || !source) {
        return res.status(400).json({ error: 'Missing required fields: amount, currency, source' });
    }

    try {
        // --- SANDBOX SIMULATION MODE ---
        // If simulated success card/number is used
        if (req.isTestMode) {

            // Validate "Simulated" Errors
            if (amount === 5001) { // Magic amount for failure
                return res.status(402).json({ error: 'Card Declined' });
            }

            // A. Create Charge Record
            const chargeId = 'ch_' + crypto.randomBytes(12).toString('hex');

            // B. Simulate Latency
            await new Promise(resolve => setTimeout(resolve, 800));

            // C. Return Standardized Response
            const responseData = {
                id: chargeId,
                object: 'charge',
                amount: amount,
                currency: currency.toUpperCase(),
                status: 'succeeded',
                source: {
                    id: source,
                    type: source.startsWith('tok_') ? 'card' : 'mobile_money',
                    details: source.startsWith('tok_') ? { brand: 'Visa', last4: '4242' } : { operator: provider || 'MTN' }
                },
                description: description,
                paid: true,
                refunded: false,
                created: Math.floor(Date.now() / 1000),
                livemode: false
            };

            // D. Split Payment Orchestration (Marketplace)
            const transfer_data = req.body.transfer_data; // { destination: 'acc_...', amount: 1000 }
            const application_fee_amount = req.body.application_fee_amount; // e.g. 50 (5%)

            let platformFee = 0;
            let merchantAmount = amount;
            let subMerchantId = null;

            // Start Ledger Transaction
            await pool.query('BEGIN');

            if (transfer_data && transfer_data.destination) {
                subMerchantId = transfer_data.destination;

                // Calculate Fee
                if (application_fee_amount) {
                    platformFee = application_fee_amount;
                } else {
                    // Default platform fee if not specified (e.g., 5%)
                    platformFee = Math.round(amount * 0.05);
                }
                merchantAmount = amount - platformFee;

                console.log(`[Connect] Split: ${merchantAmount} to ${subMerchantId}, ${platformFee} to Platform`);

                // 1. Credit Sub-merchant (Pending)
                await pool.query(
                    `INSERT INTO balances (merchant_id, pending_amount, currency) 
                     VALUES ($1, $2, $3)
                     ON CONFLICT (merchant_id) 
                     DO UPDATE SET pending_amount = balances.pending_amount + $2`,
                    [subMerchantId, merchantAmount, currency.toUpperCase()]
                );

                // 2. Credit Platform (Pending)
                await pool.query(
                    `INSERT INTO balances (merchant_id, pending_amount, currency) 
                     VALUES ($1, $2, $3)
                     ON CONFLICT (merchant_id) 
                     DO UPDATE SET pending_amount = balances.pending_amount + $2`,
                    [req.merchant.merchant_id, platformFee, currency.toUpperCase()]
                );

                // 3. Record Internal Transfer
                await pool.query(
                    `INSERT INTO transfers (source_merchant_id, destination_merchant_id, amount, currency, type, status)
                     VALUES ($1, $2, $3, $4, 'SPLIT_PAYMENT', 'COMPLETED')`,
                    [req.merchant.merchant_id, subMerchantId, merchantAmount, currency.toUpperCase()]
                );

                responseData.application_fee = platformFee;
                responseData.transfer_data = { destination: subMerchantId, amount: merchantAmount };
            }

            // Record Charge in DB (livemode = true only for live API keys)
            await pool.query(
                `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details, description, metadata, livemode)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    chargeId, req.merchant.merchant_id, amount, currency.toUpperCase(), 'succeeded',
                    source.startsWith('tok_') ? 'card' : 'mobile_money',
                    JSON.stringify(responseData.source.details),
                    description, JSON.stringify(req.body.metadata || {}), !req.isTestMode
                ]
            );

            await pool.query('COMMIT');

            // E. Dispatch Webhook (Background)
            dispatchWebhook(req.merchant.merchant_id, 'charge.succeeded', responseData);

            return res.json(responseData);
        }

        // --- PRODUCTION LOGIC (Simulation Mode) ---
        // For physical sandbox testing, we reuse the simulation logic but with livemode = true
        const chargeId = 'ch_live_' + crypto.randomBytes(12).toString('hex');
        const responseData = {
            id: chargeId,
            object: 'charge',
            amount: amount,
            currency: currency.toUpperCase(),
            status: 'succeeded',
            source: {
                id: source,
                type: source.startsWith('tok_') ? 'card' : 'mobile_money',
                details: source.startsWith('tok_') ? { brand: 'Visa', last4: '4242' } : { operator: provider || 'MTN' }
            },
            description: description,
            paid: true,
            refunded: false,
            created: Math.floor(Date.now() / 1000),
            livemode: true
        };

        const targetColumn = 'available_amount'; // Immediate for Live Simulation
        const transfer_data = req.body.transfer_data;
        const application_fee_amount = req.body.application_fee_amount;

        let platformFee = 0;
        let merchantAmount = amount;
        let subMerchantId = null;

        await pool.query('BEGIN');

        if (transfer_data && transfer_data.destination) {
            subMerchantId = transfer_data.destination;
            platformFee = application_fee_amount || Math.round(amount * 0.05);
            merchantAmount = amount - platformFee;

            // Credit Sub-merchant (Available for Simulation)
            await pool.query(
                `INSERT INTO balances (merchant_id, ${targetColumn}, currency) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (merchant_id) DO UPDATE SET ${targetColumn} = balances.${targetColumn} + $2`,
                [subMerchantId, merchantAmount, currency.toUpperCase()]
            );

            // Credit Platform (Available for Simulation)
            await pool.query(
                `INSERT INTO balances (merchant_id, ${targetColumn}, currency) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (merchant_id) DO UPDATE SET ${targetColumn} = balances.${targetColumn} + $2`,
                [req.merchant.merchant_id, platformFee, currency.toUpperCase()]
            );
        } else {
            // Direct Credit
            await pool.query(
                `INSERT INTO balances (merchant_id, ${targetColumn}, currency) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (merchant_id) DO UPDATE SET ${targetColumn} = balances.${targetColumn} + $2`,
                [req.merchant.merchant_id, amount, currency.toUpperCase()]
            );
        }

        // Record Charge as settled immediately if simulation
        await pool.query(
            `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details, description, metadata, livemode, is_settled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                chargeId, req.merchant.merchant_id, amount, currency.toUpperCase(), 'succeeded',
                source.startsWith('tok_') ? 'card' : 'mobile_money',
                JSON.stringify(responseData.source.details),
                description, JSON.stringify(req.body.metadata || {}), true, true
            ]
        );

        await pool.query('COMMIT');
        dispatchWebhook(req.merchant.merchant_id, 'charge.succeeded', responseData);
        return res.json(responseData);

    } catch (err) {
        console.error('Unified Charge Error:', err);
        res.status(500).json({ error: 'Payment processing failed' });
    }
});

// Submit Compliance Documents (Mock Upload)
app.post('/merchants/compliance', authenticateToken, async (req, res) => {
    const {
        legalName,
        pacraNumber,
        tpin,
        directorName,
        directorNRC,
        registeredAddress,
        documents
    } = req.body;

    try {
        const merchantRes = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });
        const merchantId = merchantRes.rows[0].id;

        // Update Merchant Details with comprehensive KYC
        await pool.query(
            `UPDATE merchants SET 
                compliance_status = $1, 
                business_name = $2,
                pacra_number = $3,
                tpin = $4,
                director_name = $5,
                director_nrc = $6,
                registered_address = $7
             WHERE id = $8`,
            ['PENDING', legalName, pacraNumber, tpin, directorName, directorNRC, registeredAddress, merchantId]
        );

        // Record Documents
        if (documents && Array.isArray(documents)) {
            for (const doc of documents) {
                await pool.query(
                    'INSERT INTO merchant_documents (merchant_id, document_type, file_url) VALUES ($1, $2, $3)',
                    [merchantId, doc.type, doc.fileUrl || `https://storage.flapapay.com/${merchantId}/${doc.fileName}`]
                );
            }
        }

        res.json({ success: true, message: 'Comprehensive Zambian KYC documents submitted for review' });

        // Trigger Notification for Admin (Mocked)
        console.log(`[Compliance] New KYC submission from Merchant ${merchantId}`);
    } catch (err) {
        console.error('Compliance Submission Error:', err);
        res.status(500).json({ error: 'Failed to submit documents' });
    }
});



// Roll API Key


// Mock FX Rates
const FX_RATES = {
    'ZMW': 1,
    'USD': 27.5,
    'GBP': 34.2,
    'EUR': 28.9
};

// Settlement API (Pending -> Available)
app.post('/merchants/settle', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const merchantRes = await client.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) throw new Error('Merchant not found');
        const merchantId = merchantRes.rows[0].id;

        const balanceRes = await client.query('SELECT * FROM balances WHERE merchant_id = $1 FOR UPDATE', [merchantId]);
        if (balanceRes.rows.length === 0) throw new Error('Balance record not found');
        const balance = balanceRes.rows[0];

        const pending = Number(balance.pending_amount);
        if (pending <= 0) throw new Error('No pending funds to settle');

        // Move all pending to available
        await client.query(
            'UPDATE balances SET available_amount = available_amount + $1, pending_amount = 0, last_settlement_at = NOW() WHERE merchant_id = $2',
            [pending, merchantId]
        );

        await client.query('COMMIT');
        res.json({ success: true, settledAmount: pending });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Transfer to Personal Wallet (FX Support)
app.post('/merchants/transfer-to-wallet', authenticateToken, async (req, res) => {
    const { amount, walletId, applyFX, fxRate } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const merchantRes = await client.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) throw new Error('Merchant not found');
        const merchantId = merchantRes.rows[0].id;

        const balanceRes = await client.query('SELECT * FROM balances WHERE merchant_id = $1 FOR UPDATE', [merchantId]);
        if (balanceRes.rows.length === 0) throw new Error('Merchant balance not found');
        const balance = balanceRes.rows[0];

        if (Number(balance.available_amount) < Number(amount)) throw new Error('Insufficient available balance');

        // Resolve Target Wallet and Currency
        const walletQuery = await client.query('SELECT id, currency FROM wallets WHERE id = $1 AND user_id = $2', [walletId, req.user.id]);
        if (walletQuery.rows.length === 0) throw new Error('Target wallet not found');
        const targetWallet = walletQuery.rows[0];

        // Calculate FX if requested
        const targetAmount = applyFX ? (amount / fxRate) : amount;

        // 1. Deduct from Merchant Available Balance
        await client.query('UPDATE balances SET available_amount = available_amount - $1, updated_at = NOW() WHERE merchant_id = $2', [amount, merchantId]);

        // 2. Credit Target User Wallet
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [targetAmount, walletId]);

        // 3. Record Ledger
        const ref = 'SETTLE-' + crypto.randomBytes(6).toString('hex').toUpperCase();
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'TRANSFER', 'COMPLETED')`,
            [ref, walletId, targetAmount, targetWallet.currency, `Settlement from merchant balance`]
        );

        await client.query('COMMIT');
        res.json({ success: true, transferred: targetAmount, currency: targetWallet.currency });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- Lenco Integration (Bank Accounts) ---

app.get('/merchants/lenco/banks', authenticateToken, async (req, res) => {
    const { country = 'zm' } = req.query;
    try {
        const response = await axios.get(`${LENCO_BASE_URL}/banks`, {
            params: { country },
            headers: { 'Authorization': `Bearer ${LENCO_SECRET_KEY}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Lenco Banks Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch banks', details: error.response?.data });
    }
});

app.post('/merchants/lenco/resolve', authenticateToken, async (req, res) => {
    const { accountNumber, bankId, country = 'zm' } = req.body;
    try {
        const response = await axios.post(`${LENCO_BASE_URL}/resolve/bank-account`, {
            accountNumber,
            bankId,
            country
        }, {
            headers: { 'Authorization': `Bearer ${LENCO_SECRET_KEY}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Lenco Resolve Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to resolve account', details: error.response?.data });
    }
});

app.post('/merchants/lenco/accounts', authenticateToken, async (req, res) => {
    const { accountName, accountNumber, bankId, bankName, country } = req.body;
    try {
        const merchantRes = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });
        const merchantId = merchantRes.rows[0].id;

        const result = await pool.query(
            `INSERT INTO merchant_bank_accounts (merchant_id, account_name, account_number, bank_id, bank_name, country)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [merchantId, accountName, accountNumber, bankId, bankName, country]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Lenco Account Save Error:', error);
        res.status(500).json({ error: 'Failed to save bank account' });
    }
});

app.get('/merchants/lenco/accounts', authenticateToken, async (req, res) => {
    try {
        const merchantRes = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });
        const merchantId = merchantRes.rows[0].id;

        const result = await pool.query('SELECT * FROM merchant_bank_accounts WHERE merchant_id = $1 ORDER BY created_at DESC', [merchantId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Lenco Accounts List Error:', err);
        res.status(500).json({ error: 'Failed to fetch bank accounts' });
    }
});

app.delete('/merchants/lenco/accounts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const merchantRes = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });
        const merchantId = merchantRes.rows[0].id;

        await pool.query('DELETE FROM merchant_bank_accounts WHERE id = $1 AND merchant_id = $2', [id, merchantId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Lenco Account Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete bank account' });
    }
});

app.get('/wallets', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch wallets' });
    }
});

// Wallet Withdrawal (To Bank/Mobile Money)
app.post('/wallets/withdraw', authenticateToken, async (req, res) => {
    const { walletId, amount, destinationType, destinationDetails, pin } = req.body;

    // Verify PIN
    const isPinValid = await verifyUserPin(req.user.id, pin);
    if (!isPinValid) return res.status(401).json({ error: 'Invalid security PIN' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch Wallet
        const walletRes = await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [walletId, req.user.id]);
        if (walletRes.rows.length === 0) throw new Error('Wallet not found');
        const wallet = walletRes.rows[0];

        const fee = Number(amount) * 0.035;
        const totalToDeduct = Number(amount) + fee;

        if (Number(wallet.balance) < totalToDeduct) throw new Error('Insufficient wallet balance');

        // 2. Deduct Balance (Amount + Fee)
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [totalToDeduct, walletId]);

        // 3. Record Payout
        const payoutRef = 'WTH-' + crypto.randomBytes(6).toString('hex').toUpperCase();
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'WITHDRAWAL', 'COMPLETED')`,
            [payoutRef, walletId, amount, wallet.currency, `Withdrawal to ${destinationType} (${JSON.stringify(destinationDetails)})`]
        );

        // Record Fee
        await recordFee(client, payoutRef, fee, wallet.currency, `Withdrawal Processing Fee (3.5%)`);

        // Real External Transfer Logic
        if (destinationType === 'bank_account') {
            const systemAccountId = "e24f5dee-3b7b-4fbd-835f-b75365a7c4cd";
            console.log(`[Lenco] Checking system balance for account ${systemAccountId}...`);

            try {
                // Pre-flight balance check
                const balanceRes = await axios.get(`${LENCO_BASE_URL}/accounts/${systemAccountId}/balance`, {
                    headers: { 'Authorization': `Bearer ${LENCO_SECRET_KEY}` }
                });

                const availableBalance = parseFloat(balanceRes.data.data.availableBalance);
                if (availableBalance < Number(amount)) {
                    console.error(`[Lenco] Insufficient system funds: Required ${amount}, Available ${availableBalance}`);
                    throw new Error('Withdrawal temporarily unavailable due to system liquidity. Please try again later.');
                }

                console.log(`[Lenco] Initiating bank transfer for ${amount} ${wallet.currency} to ${destinationDetails.accountNumber}`);
                await axios.post(`${LENCO_BASE_URL}/transfers/bank-account`, {
                    accountId: systemAccountId,
                    amount: Number(amount),
                    reference: payoutRef,
                    narration: `Withdrawal from FlapaPay Wallet`,
                    accountNumber: destinationDetails.accountNumber,
                    bankId: destinationDetails.bankId,
                    country: destinationDetails.country || 'ZM'
                }, {
                    headers: { 'Authorization': `Bearer ${LENCO_SECRET_KEY}` }
                });
            } catch (error) {
                console.error('[Lenco] Transfer Error:', error.response?.data || error.message);
                throw new Error(error.response?.data?.message || 'Bank transfer failed');
            }
        } else if (destinationType === 'mobile_money') {
            console.log(`[PawaPay] Initiating mobile payout for ${amount} ${wallet.currency} to ${destinationDetails.phoneNumber}`);
            // PawaPay payouts are handled by /pawapay/payout but we log here too
        }

        await client.query('COMMIT');
        res.json({ success: true, reference: payoutRef, amount, currency: wallet.currency });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- PawaPay Payouts (Direct) ---
app.post('/pawapay/payout', authenticateToken, async (req, res) => {
    const { amount, phoneNumber, provider, currency, walletId, customerMessage } = req.body;
    let payoutId;
    try {
        payoutId = crypto.randomUUID();

        // 1. Deduct from wallet first (atomically)
        const payoutRef = 'WTH-MM-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        const fee = Number(amount) * 0.035;
        const totalToDeduct = Number(amount) + fee;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const walletRes = await client.query('SELECT balance FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [walletId, req.user.id]);
            if (walletRes.rows.length === 0) throw new Error('Wallet not found');
            if (Number(walletRes.rows[0].balance) < totalToDeduct) throw new Error('Insufficient balance');

            await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [totalToDeduct, walletId]);

            // Insert ledger with PENDING status - include payoutId in description for easy lookup
            await client.query(`
                INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, amount, currency, description, transaction_type, status, metadata)
                VALUES ($1, $2, $3, $4, $5, 'WITHDRAWAL', 'PENDING', $6)`,
                [payoutRef, walletId, amount, currency, `PawaPay Payout to ${phoneNumber} (ID: ${payoutId})`, { payoutId, phoneNumber, provider }]
            );

            // Record Fee
            await recordFee(client, payoutRef, fee, currency, `Mobile Money Withdrawal Fee (3.5%)`);

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        // 2. Call PawaPay API
        // Normalize phone number: remove +, remove leading 0, ensure 260 prefix
        let normalizedPhone = phoneNumber.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '26' + normalizedPhone; // e.g. 26 + 0968554... = 260968554...
        } else if (!normalizedPhone.startsWith('260')) {
            normalizedPhone = '260' + normalizedPhone; // e.g. 260 + 968554...
        }

        // Generate client reference ID
        const clientReferenceId = `WTH-${Date.now()}`;

        // CORRECT PawaPay API format: recipient with type MMO
        const payload = {
            payoutId: payoutId,
            amount: amount.toString(),
            currency: currency || 'ZMW',
            recipient: {
                type: 'MMO',
                accountDetails: {
                    phoneNumber: normalizedPhone,
                    provider: provider
                }
            }
        };

        console.log('[PawaPay Payout] Sending Payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(`${PAWAPAY_BASE_URL}/v2/payouts`, payload, {
            headers: {
                'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('[PawaPay] Payout response:', response.data);
        res.json({ ...response.data, payoutId, clientReferenceId });
    } catch (error) {
        console.error('PawaPay Payout Error Details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                data: error.config?.data,
                headers: { ...error.config?.headers, Authorization: 'MASKED' }
            }
        });

        if (payoutId) {
            const refundClient = await pool.connect();
            try {
                await refundClient.query('BEGIN');
                const ledgerRes = await refundClient.query(
                    "SELECT debit_wallet_id, amount FROM ledger_entries WHERE transaction_type = 'WITHDRAWAL' AND status = 'PENDING' AND (metadata->>'payoutId' = $1 OR description LIKE $2) FOR UPDATE",
                    [String(payoutId), `%${payoutId}%`]
                );
                if (ledgerRes.rows.length > 0) {
                    const { debit_wallet_id, amount: origAmount } = ledgerRes.rows[0];
                    const feeToRefund = Number(origAmount) * 0.035;
                    const totalRefund = Number(origAmount) + feeToRefund;

                    await refundClient.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [totalRefund, debit_wallet_id]);
                    await refundClient.query(
                        "UPDATE ledger_entries SET status = 'FAILED' WHERE transaction_type = 'WITHDRAWAL' AND status = 'PENDING' AND (metadata->>'payoutId' = $1 OR description LIKE $2)",
                        [String(payoutId), `%${payoutId}%`]
                    );
                    console.log(`[Ledger] Updated to FAILED and Refunded ${totalRefund} to wallet ${debit_wallet_id} for payoutId:`, payoutId);
                }
                await refundClient.query('COMMIT');
            } catch (refundErr) {
                await refundClient.query('ROLLBACK');
                console.error('Failed to process refund during initiation failure:', refundErr);
            } finally {
                refundClient.release();
            }
        }

        res.status(error.response?.status || 500).json({
            error: 'Failed to initiate payout',
            details: error.response?.data
        });
    }
});

app.get('/pawapay/payout/:id', authenticateToken, async (req, res) => {
    const startTime = Date.now();
    const payoutId = req.params.id;

    try {
        console.log(`[PawaPay] Checking status for payout: ${payoutId}`);
        const response = await axios.get(`${PAWAPAY_BASE_URL}/v2/payouts/${payoutId}`, {
            headers: { 'Authorization': `Bearer ${PAWAPAY_TOKEN}` }
        });

        const responseTime = Date.now() - startTime;
        console.log(`[PawaPay] Status response received in ${responseTime}ms:`, response.data);

        // PawaPay returns: { status: "FOUND", data: { payoutId, status, ... } }
        const payoutData = response.data.data || response.data;
        const payoutStatus = payoutData.status;

        // If completed, update ledger status from PENDING to COMPLETED
        if (payoutStatus === 'COMPLETED') {
            const updateStart = Date.now();
            // Update by finding ledger entry with payoutId in metadata or description
            await pool.query(
                "UPDATE ledger_entries SET status = 'COMPLETED' WHERE transaction_type = 'WITHDRAWAL' AND status = 'PENDING' AND (metadata->>'payoutId' = $1 OR description LIKE $2)",
                [payoutId, `%${payoutId}%`]
            );
            console.log(`[Ledger] Updated to COMPLETED in ${Date.now() - updateStart}ms for:`, payoutId);
        } else if (['FAILED', 'REJECTED', 'CANCELLED'].includes(payoutStatus)) {
            const updateStart = Date.now();
            const refundClient = await pool.connect();
            try {
                await refundClient.query('BEGIN');
                const ledgerRes = await refundClient.query(
                    "SELECT debit_wallet_id, amount FROM ledger_entries WHERE transaction_type = 'WITHDRAWAL' AND status = 'PENDING' AND (metadata->>'payoutId' = $1 OR description LIKE $2) FOR UPDATE",
                    [payoutId, `%${payoutId}%`]
                );
                if (ledgerRes.rows.length > 0) {
                    const { debit_wallet_id, amount: origAmount } = ledgerRes.rows[0];
                    const feeToRefund = Number(origAmount) * 0.035;
                    const totalRefund = Number(origAmount) + feeToRefund;

                    await refundClient.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [totalRefund, debit_wallet_id]);
                    await refundClient.query(
                        "UPDATE ledger_entries SET status = 'FAILED' WHERE transaction_type = 'WITHDRAWAL' AND status = 'PENDING' AND (metadata->>'payoutId' = $1 OR description LIKE $2)",
                        [payoutId, `%${payoutId}%`]
                    );
                    console.log(`[Ledger] Updated to FAILED and Refunded ${totalRefund} to wallet ${debit_wallet_id} for payoutId:`, payoutId);
                }
                await refundClient.query('COMMIT');
            } catch (refundErr) {
                await refundClient.query('ROLLBACK');
                console.error('Failed to process refund during status check:', refundErr);
            } finally {
                refundClient.release();
            }
            console.log(`[Ledger] Processed FAILED status in ${Date.now() - updateStart}ms for:`, payoutId);
        }

        // Return the data array format expected by frontend: [{ status, ...payoutData }]
        res.json([{
            status: payoutStatus,
            ...payoutData
        }]);
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error(`[PawaPay] Status Error after ${responseTime}ms:`, error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch payout status' });
    }
});


// --- Connect / Marketplace APIs (V2 Style) ---

// 1. Create Connected Account (Unified Identity)
app.post('/v1/connect/accounts', authenticateMerchant, async (req, res) => {
    const { type, country, email, business_type, capabilities, tpin, pacra_number, business_name } = req.body;
    try {
        // Check if account already exists for this email and platform
        const existingRes = await pool.query(
            "SELECT id FROM connected_accounts WHERE email = $1 AND platform_merchant_id = $2",
            [email, req.merchant.merchant_id]
        );
        if (existingRes.rows.length > 0) {
            return res.status(400).json({
                error: 'Account already exists',
                message: 'A sub-merchant with this email is already connected to your account.'
            });
        }

        // Default capabilities based on type
        const defaultCapabilities = {
            transfers: { requested: true },
            card_payments: { requested: true }
        };

        const result = await pool.query(
            `INSERT INTO connected_accounts (platform_merchant_id, email, business_type, capabilities, requirements, metadata, tpin, pacra_number, business_name, livemode, type, country) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, type, country, email, capabilities, requirements, tpin, pacra_number, livemode`,
            [
                req.merchant.merchant_id,
                email,
                business_type || 'individual',
                JSON.stringify(capabilities || defaultCapabilities),
                JSON.stringify({ currently_due: ['business.tax_id', 'individual.id_number'], eventually_due: [] }),
                JSON.stringify({}),
                tpin || null,
                pacra_number || null,
                business_name || null,
                req.isTestMode,
                type || 'custom',
                country || 'ZM'
            ]
        );

        // Initialize Balance Ledger
        await pool.query(
            'INSERT INTO balances (merchant_id, pending_amount, available_amount, currency) VALUES ($1, 0, 0, $2)',
            [result.rows[0].id, 'ZMW']
        );

        res.json({
            id: result.rows[0].id,
            object: 'account',
            type: 'custom',
            capabilities: result.rows[0].capabilities,
            requirements: result.rows[0].requirements
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create connected account' });
    }
});

// 2. Create Account Session (For Embedded UI)
app.post('/v1/connect/account_sessions', authenticateMerchant, async (req, res) => {
    const { account } = req.body;
    try {
        if (!account) return res.status(400).json({ error: 'Account ID is required' });

        // Generate Client Secret (Mock JWT-like token)
        const client_secret = 'cass_' + crypto.randomBytes(24).toString('hex');
        const expires_at = new Date(Date.now() + 3600 * 1000); // 1 hour expiry

        await pool.query(
            `INSERT INTO account_sessions (account_id, client_secret, components, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [account, client_secret, JSON.stringify({ onboarding: { enabled: true } }), expires_at]
        );

        res.json({
            object: 'account_session',
            client_secret: client_secret,
            expires_at: Math.floor(expires_at.getTime() / 1000),
            account: account
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create account session' });
    }
});

app.get('/v1/connect/account_sessions/:secret', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM account_sessions WHERE client_secret = $1',
            [req.params.secret]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Retrieve Account Status (For State Machine)
app.get('/v1/connect/accounts/:id', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM connected_accounts WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve account' });
    }
});

// 3b. Aggregate Marketplace Stats (For Platform Owner)
app.get('/v1/connect/stats', authenticateMerchant, async (req, res) => {
    try {
        const platformMerchantId = req.merchant.merchant_id;
        const isTest = req.isTestMode;

        // 1. Total Sub-merchants
        const countRes = await pool.query(
            "SELECT COUNT(*) FROM connected_accounts WHERE platform_merchant_id = $1 AND livemode = $2",
            [platformMerchantId, !isTest]
        );

        // 2. Marketplace GMV (Total Volume processed by sub-merchants)
        const gmvRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM charges 
             WHERE status = 'succeeded' 
             AND livemode = $2
             AND destination_merchant_id IN (SELECT id FROM connected_accounts WHERE platform_merchant_id = $1)`,
            [platformMerchantId, !isTest]
        );

        // 3. Platform Revenue (Sum of application fees)
        const revenueRes = await pool.query(
            `SELECT COALESCE(SUM(application_fee_amount), 0) as total 
             FROM charges 
             WHERE merchant_id = $1 AND livemode = $2 AND application_fee_amount IS NOT NULL`,
            [platformMerchantId, !isTest]
        );

        res.json({
            totalSubMerchants: parseInt(countRes.rows[0].count),
            marketplaceGMV: parseFloat(gmvRes.rows[0].total).toFixed(2),
            platformRevenue: parseFloat(revenueRes.rows[0].total).toFixed(2),
            currency: 'ZMW'
        });
    } catch (err) {
        console.error('[Connect Stats] Error:', err);
        res.status(500).json({ error: 'Failed to fetch marketplace stats' });
    }
});

// 3c. List Sub-merchants with Volume (For Platform Owner)
app.get('/v1/connect/accounts', authenticateMerchant, async (req, res) => {
    try {
        const platformMerchantId = req.merchant.merchant_id;
        const isLive = !req.isTestMode;

        const result = await pool.query(
            `SELECT ca.id, ca.business_name, ca.email, ca.status, ca.created_at,
                    COALESCE(SUM(c.amount), 0) as total_volume,
                    COALESCE(SUM(c.application_fee_amount), 0) as total_fees
             FROM connected_accounts ca
             LEFT JOIN charges c ON ca.id = c.destination_merchant_id AND c.status = 'succeeded' AND c.livemode = $2
             WHERE ca.platform_merchant_id = $1 AND ca.livemode = $2
             GROUP BY ca.id
             ORDER BY ca.created_at DESC`,
            [platformMerchantId, isLive]
        );

        res.json(result.rows.map(row => ({
            id: row.id,
            businessName: row.business_name || 'Unnamed Business',
            email: row.email,
            status: row.status,
            volume: parseFloat(row.total_volume).toFixed(2),
            fees: parseFloat(row.total_fees).toFixed(2),
            createdAt: row.created_at
        })));
    } catch (err) {
        console.error('[List Connect Accounts] Error:', err);
        res.status(500).json({ error: 'Failed to fetch sub-merchants' });
    }
});

// 3d. Get Single Sub-merchant Stats (For Vendor Portal Reporting)
app.get('/v1/connect/accounts/:id/stats', authenticateMerchant, async (req, res) => {
    try {
        const { id } = req.params;
        const isLive = !req.isTestMode;

        // Verify account exists and matches mode
        const accountRes = await pool.query('SELECT * FROM connected_accounts WHERE id = $1 AND livemode = $2', [id, isLive]);
        if (accountRes.rows.length === 0) return res.status(404).json({ error: 'Account not found or mode mismatch' });

        // Sum volume and fees for this account
        const statsRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_volume,
                    COALESCE(SUM(application_fee_amount), 0) as total_fees,
                    COUNT(*) as count
             FROM charges 
             WHERE destination_merchant_id = $1 AND status = 'succeeded' AND livemode = $2`,
            [id, isLive]
        );

        // Get Balance
        const balanceRes = await pool.query(
            "SELECT COALESCE(available_amount, 0) as available, COALESCE(pending_amount, 0) as pending FROM balances WHERE merchant_id = $1",
            [id]
        );

        const stats = statsRes.rows[0];
        const balance = balanceRes.rows[0] || { available: 0, pending: 0 };

        res.json({
            volume: parseFloat(stats.total_volume).toFixed(2),
            fees: parseFloat(stats.total_fees).toFixed(2),
            net: (parseFloat(stats.total_volume) - parseFloat(stats.total_fees)).toFixed(2),
            transactionCount: parseInt(stats.count),
            balance: {
                available: parseFloat(balance.available).toFixed(2),
                pending: parseFloat(balance.pending).toFixed(2)
            },
            currency: 'ZMW'
        });
    } catch (err) {
        console.error('[Sub-merchant Stats] Error:', err);
        res.status(500).json({ error: 'Failed to fetch sub-merchant stats' });
    }
});

// 3e. Manage Sub-merchant Payout Methods
app.post('/v1/connect/accounts/:id/payout_methods', authenticateMerchant, async (req, res) => {
    const { id } = req.params;
    const { type, details, is_default } = req.body;

    try {
        // Verify account ownership/existence
        const accountRes = await pool.query('SELECT * FROM connected_accounts WHERE id = $1', [id]);
        if (accountRes.rows.length === 0) return res.status(404).json({ error: 'Connected account not found' });

        const result = await pool.query(
            `INSERT INTO connected_account_payout_methods (connected_account_id, type, details, is_default)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, type, JSON.stringify(details), is_default || false]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Add Payout Method] Error:', err);
        res.status(500).json({ error: 'Failed to add payout method' });
    }
});

app.get('/v1/connect/accounts/:id/payout_methods', authenticateMerchant, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM connected_account_payout_methods WHERE connected_account_id = $1 ORDER BY created_at DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[Get Payout Methods] Error:', err);
        res.status(500).json({ error: 'Failed to fetch payout methods' });
    }
});

// 4. Trigger Payout (Withdrawal to External Wallet)
app.post('/v1/connect/payouts', authenticateMerchant, async (req, res) => {
    const { account, amount, currency, destination } = req.body;
    // destination: { type: 'mobile_money', number: '260...', network: 'MTN' }

    if (!account || !amount || !destination) {
        return res.status(400).json({ error: 'Missing required fields: account, amount, destination' });
    }

    try {
        await pool.query('BEGIN');

        // Check Balance
        const balanceRes = await pool.query(
            'SELECT available_amount FROM balances WHERE merchant_id = $1 FOR UPDATE',
            [account]
        );

        if (balanceRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Account balance not found', code: 'balance_missing' });
        }

        const currentBalance = parseFloat(balanceRes.rows[0].available_amount);

        // In a real system, we'd check against available_amount. 
        // For testing/onboarding, we might allow using pending_amount or just mock positive balance if zero.
        // Let's enforce a check but allow "Simulated" massive balance for test accounts? 
        // Actually, let's just check normally.
        // NOTE: Since our split payment logic puts money in PENDING, we need a way to move it to AVAILABLE.
        // For this demo, we'll assume PENDING is liquid enough or we auto-convert in background.
        // Let's check PENDING + AVAILABLE for the demo ease.

        const totalBalanceRes = await pool.query(
            'SELECT (pending_amount + available_amount) as total FROM balances WHERE merchant_id = $1',
            [account]
        );
        const totalLiquidity = parseFloat(totalBalanceRes.rows[0].total);

        if (totalLiquidity < amount) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient funds', code: 'insufficient_funds', current_balance: totalLiquidity });
        }

        // Deduct from Ledger
        await pool.query(
            `UPDATE balances 
             SET pending_amount = pending_amount - $2 
             WHERE merchant_id = $1`,
            [account, amount]
        );

        // Record Payout Transfer
        const transferRes = await pool.query(
            `INSERT INTO transfers (source_merchant_id, destination_merchant_id, amount, currency, type, status)
             VALUES ($1, NULL, $2, $3, 'PAYOUT', 'PENDING') RETURNING id`,
            [account, amount, currency || 'ZMW']
        );

        await pool.query('COMMIT');

        // Trigger Async Payout via Mobile Money Provider (Mock)
        // In reality, this would call PawaPay/Airtel API
        console.log(`[Connect] Executing Payout ${transferRes.rows[0].id} of ${amount} to ${destination.network} (${destination.number})`);

        setTimeout(async () => {
            // Simulate Success callback
            await pool.query("UPDATE transfers SET status = 'COMPLETED' WHERE id = $1", [transferRes.rows[0].id]);
            console.log(`[Connect] Payout ${transferRes.rows[0].id} CONFIRMED`);
        }, 2000);

        res.json({
            id: transferRes.rows[0].id,
            object: 'payout',
            amount: amount,
            status: 'pending',
            destination: destination
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Payout Error:', err);
        res.status(500).json({ error: 'Payout failed' });
    }
});

// 5. Internal Transfers (Platform <-> Connected Account)
app.post('/v1/transfers', authenticateApiKey, async (req, res) => {
    const { destination, amount, currency } = req.body;

    if (!destination || !amount) {
        return res.status(400).json({ error: 'Missing destination or amount' });
    }

    try {
        await pool.query('BEGIN');

        // Check Platform Balance (Source)
        // For simplicity in this demo, we skip strict platform balance check and allow negative (credit line) 
        // or just assume infinite platform liquidity for testing.

        // Credit Destination (Sub-merchant)
        await pool.query(
            `INSERT INTO balances (merchant_id, pending_amount, currency) 
             VALUES ($1, $2, $3)
             ON CONFLICT (merchant_id) 
             DO UPDATE SET pending_amount = balances.pending_amount + $2`,
            [destination, amount, currency || 'ZMW']
        );

        // Record Transfer
        const txn = await pool.query(
            `INSERT INTO transfers (source_merchant_id, destination_merchant_id, amount, currency, type, status)
             VALUES ($1, $2, $3, $4, 'MANUAL_TRANSFER', 'COMPLETED') RETURNING id`,
            [req.merchant.merchant_id, destination, amount, currency || 'ZMW']
        );

        await pool.query('COMMIT');

        res.json({
            id: txn.rows[0].id,
            object: 'transfer',
            amount: amount,
            destination: destination,
            status: 'succeeded'
        });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Transfer Error:', err);
        res.status(500).json({ error: 'Transfer failed' });
    }
});

// Webhook Management
app.post('/merchants/webhooks', authenticateToken, async (req, res) => {
    const { url } = req.body;
    try {
        const merchantRes = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });

        const secret = 'whsec_' + crypto.randomBytes(16).toString('hex');
        await pool.query(
            'INSERT INTO webhooks (merchant_id, url, secret) VALUES ($1, $2, $3)',
            [merchantRes.rows[0].id, url, secret]
        );
        res.json({ success: true, secret });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add webhook' });
    }
});

// Helper: Dispatch Webhook with Persistence
const dispatchWebhook = async (merchantId, event, data) => {
    try {
        const webhooks = await pool.query('SELECT id, url, secret FROM webhooks WHERE merchant_id = $1 AND is_active = TRUE', [merchantId]);

        for (const wh of webhooks.rows) {
            console.log(`[Webhook] Queueing ${event} for ${wh.url}`);

            // Create log entry
            const logRes = await pool.query(
                `INSERT INTO webhook_delivery_logs (webhook_id, merchant_id, event_type, payload, status, next_retry_at) 
                 VALUES ($1, $2, $3, $4, 'PENDING', NOW()) RETURNING id`,
                [wh.id, merchantId, event, JSON.stringify(data)]
            );

            // Immediate attempt
            attemptWebhookDelivery(logRes.rows[0].id);
        }
    } catch (err) {
        console.error('Webhook Queueing Error:', err);
    }
};

const attemptWebhookDelivery = async (logId) => {
    try {
        const logRes = await pool.query(
            `SELECT l.*, w.url, w.secret 
             FROM webhook_delivery_logs l 
             JOIN webhooks w ON l.webhook_id = w.id 
             WHERE l.id = $1`, [logId]
        );

        if (logRes.rows.length === 0) return;
        const log = logRes.rows[0];

        console.log(`[Webhook] Attempting delivery to ${log.url} (Retry: ${log.retry_count})`);

        try {
            // Mocking the actual network request for now
            // In reality: 
            // const signature = crypto.createHmac('sha256', log.secret).update(JSON.stringify(log.payload)).digest('hex');
            // const res = await axios.post(log.url, log.payload, { headers: { 'X-FlapaPay-Signature': signature } });

            // Simulate 50% success rate for testing retry logic
            const isSuccess = Math.random() > 0.5;

            if (isSuccess) {
                await pool.query(
                    "UPDATE webhook_delivery_logs SET status = 'SUCCESS', response_code = 200, response_body = 'OK' WHERE id = $1",
                    [logId]
                );
                console.log(`[Webhook] Delivered successfully to ${log.url}`);
            } else {
                throw new Error('Simulated failure');
            }
        } catch (err) {
            const nextRetry = new Date(Date.now() + Math.pow(2, log.retry_count + 1) * 1000); // Exponential backoff
            await pool.query(
                `UPDATE webhook_delivery_logs 
                 SET status = 'FAILED', 
                     retry_count = retry_count + 1, 
                     next_retry_at = $1, 
                     response_code = $2, 
                     response_body = $3 
                 WHERE id = $4`,
                [nextRetry, err.response?.status || 500, err.message, logId]
            );
            console.warn(`[Webhook] Delivery failed to ${log.url}. Next retry at ${nextRetry.toISOString()}`);
        }
    } catch (err) {
        console.error('Webhook Delivery Attempt Error:', err);
    }
};

// Background Retry Worker
setInterval(async () => {
    try {
        const pendingRes = await pool.query(
            "SELECT id FROM webhook_delivery_logs WHERE status = 'FAILED' AND retry_count < 5 AND next_retry_at <= NOW()"
        );
        for (const row of pendingRes.rows) {
            attemptWebhookDelivery(row.id);
        }
    } catch (err) {
        console.error('Webhook Worker Error:', err);
    }
}, 10000); // Check every 10 seconds

// --- Automated Settlement Worker (T+2) ---
// Run settlement check every 30 seconds for demo (Stripe uses T+2 days)
setInterval(async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find unsettled charges that are due for availability
        // IMPORTANT: We only settle TEST charges or charges that weren't immediately settled
        const dueChargesRes = await client.query(
            "SELECT * FROM charges WHERE is_settled = FALSE AND livemode = FALSE AND available_at <= NOW() FOR UPDATE"
        );

        for (const charge of dueChargesRes.rows) {
            console.log(`[Settlement] Processing charge ${charge.id}...`);

            const totalAmount = parseFloat(charge.amount);
            const fee = parseFloat(charge.application_fee_amount || 0);
            const destinationId = charge.destination_merchant_id;

            if (destinationId) {
                // Split Payment Settlement
                // Platform Portion (Fee)
                await client.query(
                    `INSERT INTO balances (merchant_id, available_amount) VALUES ($1, $2)
                     ON CONFLICT (merchant_id) DO UPDATE SET available_amount = balances.available_amount + $2`,
                    [charge.merchant_id, fee]
                );
                // Sub-merchant Portion (Net)
                const netAmount = totalAmount - fee;
                await client.query(
                    `INSERT INTO balances (merchant_id, available_amount) VALUES ($1, $2)
                     ON CONFLICT (merchant_id) DO UPDATE SET available_amount = balances.available_amount + $2`,
                    [destinationId, netAmount]
                );
            } else {
                // Direct Payment Settlement (Full to Platform)
                await client.query(
                    `INSERT INTO balances (merchant_id, available_amount) VALUES ($1, $2)
                     ON CONFLICT (merchant_id) DO UPDATE SET available_amount = balances.available_amount + $2`,
                    [charge.merchant_id, totalAmount]
                );
            }

            // Mark charge as settled
            await client.query("UPDATE charges SET is_settled = TRUE WHERE id = $1", [charge.id]);
            console.log(`[Settlement] Successfully settled charge ${charge.id}`);
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Settlement Worker] Error:', err);
    } finally {
        client.release();
    }
}, 30000);

// 1. Create Checkout Session
app.post('/v1/checkout/sessions', authenticateApiKey, async (req, res) => {
    const {
        amount,
        currency,
        payment_method_types,
        success_url,
        cancel_url,
        client_reference_id,
        metadata,
        line_items,
        mode,
        transfer_data,
        application_fee_amount
    } = req.body;

    try {
        // Calculate amount from line_items if not provided directly
        let finalAmount = amount;
        if (!finalAmount && line_items) {
            finalAmount = line_items.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0);
        }

        // Allow NULL amount for dynamic payment links
        if (finalAmount && (isNaN(finalAmount) || finalAmount <= 0)) {
            return res.status(400).json({
                error: 'Invalid amount',
                message: 'The amount must be a positive integer in the smallest currency unit.',
                suggestion: 'Ensure you are sending a valid number for amount or line_items.'
            });
        }
        if (!currency) {
            return res.status(400).json({
                error: 'Missing currency',
                message: 'A three-letter ISO currency code is required (e.g., ZMW, USD).',
                suggestion: 'Add "currency": "ZMW" to your request body.'
            });
        }
        if (!success_url || !cancel_url) {
            return res.status(400).json({
                error: 'Missing redirect URLs',
                message: 'Both success_url and cancel_url are required to redirect the user after payment.',
                suggestion: 'Provide absolute URLs for redirection.'
            });
        }

        const sessionId = 'cs_test_' + crypto.randomBytes(24).toString('hex');

        await pool.query(
            `INSERT INTO checkout_sessions 
             (id, merchant_id, amount, currency, payment_method_types, success_url, cancel_url, client_reference_id, metadata, transfer_data, application_fee_amount, livemode)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                sessionId,
                req.merchant.merchant_id,
                finalAmount,
                currency.toUpperCase(),
                JSON.stringify(payment_method_types || ['card', 'mobile_money']),
                success_url,
                cancel_url,
                client_reference_id,
                JSON.stringify(metadata || {}),
                JSON.stringify(transfer_data || {}),
                application_fee_amount || null,
                !req.isTestMode
            ]
        );

        res.json({
            id: sessionId,
            object: 'checkout.session',
            url: `http://localhost:5173/checkout/${sessionId}`,
            status: 'open',
            payment_status: 'unpaid',
            amount_total: finalAmount || null,
            currency: currency.toUpperCase()
        });

    } catch (err) {
        console.error('Create Session Error:', err);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// 2. Retrieve Session (Public/Frontend)
app.get('/v1/checkout/sessions/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cs.*, m.business_name 
            FROM checkout_sessions cs 
            JOIN merchants m ON cs.merchant_id = m.id 
            WHERE cs.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });

        const session = result.rows[0];

        res.json({
            id: session.id,
            object: 'checkout.session',
            amount_total: session.amount ? parseFloat(session.amount) : null,
            currency: session.currency,
            status: session.status,
            payment_method_types: session.payment_method_types,
            merchant: {
                name: session.business_name
            },
            success_url: session.success_url,
            cancel_url: session.cancel_url,
            livemode: session.livemode
        });

    } catch (err) {
        console.error('Get Session Error:', err);
        res.status(500).json({ error: 'Failed to retrieve session' });
    }
});

// 2b. Create Stripe Intent for Card Payments
app.post('/v1/checkout/sessions/:id/intent', async (req, res) => {
    try {
        const sessionRes = await pool.query('SELECT * FROM checkout_sessions WHERE id = $1', [req.params.id]);
        if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });

        const session = sessionRes.rows[0];
        const amountToCharge = session.amount ? parseFloat(session.amount) : parseFloat(req.body.amount);

        if (!amountToCharge || isNaN(amountToCharge) || amountToCharge <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        // We are using the Stripe test instance even for Live mode right now (per user request)
        let sessionStripe = stripe;

        // Create Stripe PaymentIntent
        const intent = await sessionStripe.paymentIntents.create({
            amount: Math.round(amountToCharge * 100), // Stripe uses cents
            currency: (session.currency || 'ZMW').toLowerCase(),
            metadata: {
                checkout_session_id: session.id,
                merchant_id: session.merchant_id
            },
            automatic_payment_methods: { enabled: true },
        });

        res.json({ clientSecret: intent.client_secret });
    } catch (err) {
        console.error('Stripe Intent Error:', err);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// 2c. Initiate Mobile Money Payment (PawaPay Style)
app.post('/v1/checkout/sessions/:id/initiate-mobile', async (req, res) => {
    const { phoneNumber, provider, amount } = req.body;

    try {
        const sessionRes = await pool.query('SELECT * FROM checkout_sessions WHERE id = $1', [req.params.id]);
        if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });

        const session = sessionRes.rows[0];
        const amountToCharge = session.amount ? parseFloat(session.amount) : (amount ? parseFloat(amount) : 0);

        if (!amountToCharge || isNaN(amountToCharge) || amountToCharge <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        // Validate required fields
        if (!phoneNumber || !provider) {
            return res.status(400).json({ error: 'Phone number and provider are required' });
        }

        // Normalize Phone Number
        let normalizedPhone = phoneNumber.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = (session.currency === 'ZMW' ? '260' : '234') + normalizedPhone.substring(1);
        } else if (!normalizedPhone.startsWith('260') && !normalizedPhone.startsWith('234')) {
            normalizedPhone = (session.currency === 'ZMW' ? '260' : '234') + normalizedPhone;
        }

        const depositId = crypto.randomUUID();
        const clientReferenceId = `SESSION-${Date.now()}`;

        // CORRECT PawaPay API format for deposits
        const response = await axios.post(`${PAWAPAY_BASE_URL}/v2/deposits`, {
            depositId: depositId,
            payer: {
                type: 'MMO',
                accountDetails: {
                    phoneNumber: normalizedPhone,
                    provider: provider
                }
            },
            amount: amountToCharge.toFixed(2),
            currency: session.currency,
            clientReferenceId: clientReferenceId,
            customerMessage: `Payment for ${session.description || 'Checkout'}`.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 22),
            metadata: [
                { checkout_session_id: session.id },
                { merchant_id: session.merchant_id }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${PAWAPAY_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('[PawaPay] Checkout deposit initiated:', response.data);
        res.json({
            status: response.data.status,
            depositId: response.data.depositId,
            provider_reference: depositId,
            message: 'Please check your phone for the PIN prompt.'
        });

    } catch (err) {
        console.error('Mobile Initiation Error:', err.response?.data || err.message);
        res.status(err.response?.status || 500).json({
            error: 'Failed to initiate mobile payment',
            details: err.response?.data || err.message
        });
    }
});

// 3. Confirm/Pay Session (Called by Gateway UI)
app.post('/v1/checkout/sessions/:id/confirm', async (req, res) => {
    const { payment_method, payment_details } = req.body;
    // payment_method: 'card' or 'mobile_money'
    // payment_details: { token: 'tok_visa' } or { phone: '...', network: '...' }

    try {
        // 1. Get Session
        const sessionRes = await pool.query('SELECT * FROM checkout_sessions WHERE id = $1', [req.params.id]);
        if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Session not found' });

        const session = sessionRes.rows[0];
        if (session.status === 'complete') return res.status(400).json({ error: 'Session already paid' });

        // 2. Process Charge (Using internal API logic logic)
        // Ensure we handle splits if transfer_data exists in session

        let amount = session.amount ? parseFloat(session.amount) : parseFloat(req.body.amount);
        const currency = session.currency;
        const transfer_data = session.transfer_data; // JSONB

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        amount = parseFloat(amount.toFixed(2)); // Ensure precision and number type

        // Reuse Logic: Credit Merchant (and Split if needed)
        // Start TX
        await pool.query('BEGIN');

        // Logic similar to /v1/charges...
        // For simplicity, we just mark session complete and update balances

        let platformFee = 0;
        let merchantAmount = amount;
        let subMerchantId = null;

        const isSessionLive = session.livemode;
        const targetColumn = isSessionLive ? 'available_amount' : 'pending_amount';

        if (transfer_data && transfer_data.destination) {
            subMerchantId = transfer_data.destination;
            // Use provided application_fee_amount or fallback to 5% default
            platformFee = session.application_fee_amount ? parseFloat(session.application_fee_amount) : Math.round(amount * 0.05);
            merchantAmount = amount - platformFee;

            // Credit Sub
            await pool.query(
                `INSERT INTO balances (merchant_id, ${targetColumn}, currency) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (merchant_id) DO UPDATE SET ${targetColumn} = balances.${targetColumn} + $2`,
                [subMerchantId, merchantAmount, currency]
            );

            // Credit Platform
            await pool.query(
                `INSERT INTO balances (merchant_id, ${targetColumn}, currency) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (merchant_id) DO UPDATE SET ${targetColumn} = balances.${targetColumn} + $2`,
                [session.merchant_id, platformFee, currency]
            );

        } else {
            // Credit Platform (Direct)
            await pool.query(
                `INSERT INTO balances (merchant_id, ${targetColumn}, currency) 
                 VALUES ($1, $2, $3)
                 ON CONFLICT (merchant_id) DO UPDATE SET ${targetColumn} = balances.${targetColumn} + $2`,
                [session.merchant_id, amount, currency]
            );
        }

        // Update Session
        await pool.query("UPDATE checkout_sessions SET status = 'complete', payment_intent = $1, amount = $2 WHERE id = $3",
            ['pi_mock_' + Date.now(), amount, session.id]
        );

        // Record Charge in DB

        // Stripe-like Rolling Settlement (T+2)
        const availableAt = new Date();
        availableAt.setDate(availableAt.getDate() + 2);

        await pool.query(
            `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details, description, livemode, available_at, application_fee_amount, destination_merchant_id, is_settled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                'ch_' + crypto.randomBytes(12).toString('hex'), session.merchant_id, amount, currency, 'succeeded',
                payment_method, JSON.stringify(payment_details), 'Checkout Session ' + session.id, isSessionLive, availableAt,
                platformFee, subMerchantId, isSessionLive // Mark as settled immediately if Live
            ]
        );

        await pool.query('COMMIT');

        // Trigger Webhook
        // await dispatchWebhook(session.merchant_id, 'checkout.session.completed', { ...session, status: 'complete' });

        res.json({ status: 'succeeded', success_url: session.success_url });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Session Confirm Error:', err);
        res.status(500).json({ error: 'Payment failed' });
    }
});


// --- Admin Panel Enhancements (Phase 19) ---

// Multer Config for Image Uploads

// Ensure directory exists
const cmsUploadDir = 'C:/FlapaPay/apps/mobile/assets/images';
if (!fs.existsSync(cmsUploadDir)) {
    fs.mkdirSync(cmsUploadDir, { recursive: true });
}

const cmsStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, cmsUploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'cms-' + uniqueSuffix + path.extname(file.originalname))
    }
})

const cmsUpload = multer({ storage: cmsStorage });

// Serve Mobile Assets Statically for Admin Panel Preview
app.use('/assets/images', express.static(cmsUploadDir));

// 1. Image Upload Endpoint
app.post('/admin/upload', authenticateToken, isAdmin, cmsUpload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Return URL accessible by the frontend
    const fileUrl = `${req.protocol}://${req.get('host')}/assets/images/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
});

// 2. User Suspension
app.patch('/admin/users/:id/suspend', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userRes = await pool.query("SELECT status FROM users WHERE id = $1", [id]);

        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const currentStatus = userRes.rows[0].status || 'active';
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

        await pool.query("UPDATE users SET status = $1 WHERE id = $2", [newStatus, id]);

        res.json({ status: newStatus, message: `User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully` });
    } catch (err) {
        console.error('Suspend User Error:', err);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// 3. CMS: List Content
app.get('/admin/content/:type', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { type } = req.params;
        let table = '';

        if (type === 'blog') table = 'blog_posts';
        else if (type === 'help') table = 'help_articles';
        else if (type === 'careers') table = 'job_postings';
        else return res.status(400).json({ error: 'Invalid content type' });

        const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (err) {
        console.error('CMS List Error:', err);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// 4. Merchant Compliance
app.get('/admin/merchants', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        let queryText = "SELECT * FROM merchants";
        const queryParams = [];

        if (status && status !== 'ALL') {
            queryParams.push(status);
            queryText += " WHERE compliance_status = $1";
        }

        queryText += " ORDER BY created_at DESC";
        const result = await pool.query(queryText, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch Merchants Error:', err);
        res.status(500).json({ error: 'Failed to fetch merchants' });
    }
});

app.patch('/admin/merchants/:id/compliance', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, isLiveEnabled } = req.body;

        // Validate status if provided
        const validStatuses = ['SANDBOX_ONLY', 'PENDING', 'ACTIVE', 'REJECTED'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            "UPDATE merchants SET compliance_status = COALESCE($1, compliance_status), is_live_enabled = COALESCE($2, is_live_enabled) WHERE id = $3 RETURNING *",
            [status, isLiveEnabled, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update Merchant Compliance Error:', err);
        res.status(500).json({ error: 'Failed to update merchant status' });
    }
});

// Initialize Schema for New Features
const initAdminFeatures = async () => {
    try {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'");

        // Ensure Merchants Table has compliance and live flags
        await pool.query(`
            ALTER TABLE merchants 
            ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(20) DEFAULT 'SANDBOX_ONLY',
            ADD COLUMN IF NOT EXISTS is_live_enabled BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS account_id VARCHAR(50)
        `);

        // Ensure Balances Table has available_amount for settlement
        await pool.query(`
            ALTER TABLE balances 
            ADD COLUMN IF NOT EXISTS available_amount DECIMAL(20, 2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_settlement_at TIMESTAMP WITH TIME ZONE
        `);

        // Populate existing merchants with account_id if missing
        await pool.query("UPDATE merchants SET account_id = 'ACC-' || UPPER(LEFT(id::text, 8)) WHERE account_id IS NULL");

        // Ensure is_settled exists on charges
        await pool.query("ALTER TABLE charges ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT FALSE");

        console.log("Verified merchant and balance schema extensions.");
    } catch (err) {
        console.error("Schema Init Error:", err);
    }
};
initAdminFeatures();



// 2. Get Job Postings
app.get('/v1/content/jobs', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM job_postings WHERE is_active = TRUE ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        console.error('Jobs Error:', err);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// 2b. Get Single Job Posting
app.get('/content/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM job_postings WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Job Detail Error:', err);
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});

// 3. Get Blog Posts (with basic pagination)
app.get('/content/blog', async (req, res) => {
    try {
        const { limit = 10, offset = 0, category } = req.query;
        let queryText = "SELECT * FROM blog_posts";
        const queryParams = [];

        if (category && category !== 'All Posts') {
            queryParams.push(category);
            queryText += ` WHERE category = $${queryParams.length}`;
        }

        queryText += ` ORDER BY published_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const result = await pool.query(queryText, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Blog Error:', err);
        res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
});

// 3b. Get Single Blog Post
app.get('/content/blog/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query("SELECT * FROM blog_posts WHERE slug = $1", [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Blog Detail Error:', err);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// --- Administrative Routes ---

// 1. Get Platform Stats
app.get('/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userCount = await pool.query("SELECT COUNT(*) FROM users");
        const transactionCount = await pool.query("SELECT COUNT(*) FROM ledger_entries");
        const totalVolume = await pool.query("SELECT currency, SUM(amount) as total FROM ledger_entries GROUP BY currency");
        const helpArticles = await pool.query("SELECT COUNT(*) FROM help_articles");
        const blogPosts = await pool.query("SELECT COUNT(*) FROM blog_posts");
        const jobPostings = await pool.query("SELECT COUNT(*) FROM job_postings");

        const totalRevenue = await pool.query("SELECT currency, SUM(amount) as total FROM ledger_entries WHERE transaction_type = 'FEE' GROUP BY currency");

        res.json({
            stats: {
                users: parseInt(userCount.rows[0].count),
                transactions: parseInt(transactionCount.rows[0].count),
                volumes: totalVolume.rows,
                revenue: totalRevenue.rows,
                content: {
                    help: parseInt(helpArticles.rows[0].count),
                    blog: parseInt(blogPosts.rows[0].count),
                    jobs: parseInt(jobPostings.rows[0].count)
                }
            }
        });
    } catch (err) {
        console.error('Admin Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// 1b. Get Hourly/Daily Revenue Breakdown
app.get('/admin/revenue', authenticateToken, isAdmin, async (req, res) => {
    try {
        const period = req.query.period || 'day'; // day, hour
        const result = await pool.query(`
            SELECT 
                DATE_TRUNC($1, created_at) as time,
                currency,
                SUM(amount) as amount
            FROM ledger_entries
            WHERE transaction_type = 'FEE'
            GROUP BY time, currency
            ORDER BY time ASC
        `, [period]);

        res.json(result.rows);
    } catch (err) {
        console.error('Admin Revenue Error:', err);
        res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
});

// 2. Get All Users
app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, 
                u.email, 
                u.full_name, 
                u.role, 
                u.avatar_url,
                u.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'currency', w.currency, 
                            'balance', w.balance
                        )
                    ) FILTER (WHERE w.id IS NOT NULL), 
                    '[]'
                ) as wallets
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Admin Users Error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 2b. Get All Transactions (Global Ledger)
app.get('/admin/transactions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                l.id,
                l.transaction_reference as reference,
                l.amount,
                l.currency,
                l.transaction_type as type,
                l.description,
                l.status,
                l.created_at,
                sender.full_name as sender_name, 
                sender.email as sender_email,
                sender.avatar_url as sender_avatar,
                receiver.full_name as receiver_name,
                receiver.email as receiver_email,
                receiver.avatar_url as receiver_avatar
            FROM ledger_entries l
            LEFT JOIN wallets dw ON l.debit_wallet_id = dw.id
            LEFT JOIN users sender ON dw.user_id = sender.id
            LEFT JOIN wallets cw ON l.credit_wallet_id = cw.id
            LEFT JOIN users receiver ON cw.user_id = receiver.id
            ORDER BY l.created_at DESC 
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Admin Transactions Error:', err);
        res.status(500).json({ error: 'Failed to fetch global ledger' });
    }
});

// Admin Notifications
app.get('/admin/notifications', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50');
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch Admin Notifications Error:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.patch('/admin/notifications/read', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('UPDATE admin_notifications SET read = true WHERE read = false');
        res.json({ message: 'All marked as read' });
    } catch (err) {
        console.error('Mark Admin Notifications Read Error:', err);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

app.delete('/admin/notifications/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM admin_notifications WHERE id = $1', [req.params.id]);
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        console.error('Delete Admin Notification Error:', err);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// 2c. Dashboard Analytics & System Monitoring
app.get('/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const usersRes = await pool.query('SELECT COUNT(*) as total FROM users');
        const transactionsRes = await pool.query('SELECT COUNT(*) as total FROM ledger_entries');

        const volumeRes = await pool.query("SELECT currency, COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE transaction_type IN ('TRANSFER', 'DEPOSIT', 'CARD_FUNDING') GROUP BY currency");
        const revenueRes = await pool.query("SELECT currency, COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE transaction_type = 'FEE' GROUP BY currency");

        // Generate dense dates mapping
        const yearGrowthRes = await pool.query(`
            WITH months AS (
                SELECT generate_series(
                    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
                    DATE_TRUNC('month', CURRENT_DATE),
                    '1 month'::interval
                ) as month
            )
            SELECT 
                TO_CHAR(m.month, 'Mon YYYY') as label,
                COALESCE(SUM(l.amount), 0) as total,
                m.month as sort_date
            FROM months m
            LEFT JOIN ledger_entries l ON DATE_TRUNC('month', l.created_at) = m.month 
                AND l.transaction_type IN ('TRANSFER', 'DEPOSIT', 'CARD_FUNDING')
            GROUP BY m.month
            ORDER BY m.month ASC
        `);

        // Growth Velocity - Last 30 Days
        const monthGrowthRes = await pool.query(`
            WITH days AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    '1 day'::interval
                ) as day
            )
            SELECT 
                TO_CHAR(d.day, 'DD Mon') as label,
                COALESCE(SUM(l.amount), 0) as total,
                d.day as sort_date
            FROM days d
            LEFT JOIN ledger_entries l ON DATE_TRUNC('day', l.created_at) = d.day 
                AND l.transaction_type IN ('TRANSFER', 'DEPOSIT', 'CARD_FUNDING')
            GROUP BY d.day
            ORDER BY d.day ASC
        `);

        // Growth Velocity - Last 7 Days (Week)
        const weekGrowthRes = await pool.query(`
            WITH days AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '6 days',
                    CURRENT_DATE,
                    '1 day'::interval
                ) as day
            )
            SELECT 
                TO_CHAR(d.day, 'Dy') as label,
                COALESCE(SUM(l.amount), 0) as total,
                d.day as sort_date
            FROM days d
            LEFT JOIN ledger_entries l ON DATE_TRUNC('day', l.created_at) = d.day 
                AND l.transaction_type IN ('TRANSFER', 'DEPOSIT', 'CARD_FUNDING')
            GROUP BY d.day
            ORDER BY d.day ASC
        `);

        res.json({
            stats: {
                users: parseInt(usersRes.rows[0].total),
                transactions: parseInt(transactionsRes.rows[0].total),
                volumes: volumeRes.rows,
                revenue: revenueRes.rows,
                growth: {
                    year: yearGrowthRes.rows.map(r => ({ label: r.label, total: parseFloat(r.total) })),
                    month: monthGrowthRes.rows.map(r => ({ label: r.label, total: parseFloat(r.total) })),
                    week: weekGrowthRes.rows.map(r => ({ label: r.label, total: parseFloat(r.total) }))
                }
            }
        });
    } catch (err) {
        console.error('Admin Dashboard Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// 2d. Reverse Transaction
app.post('/admin/transactions/:id/reverse', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch original transaction
        const original = await pool.query("SELECT * FROM ledger_entries WHERE id = $1", [id]);
        if (original.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });

        const tx = original.rows[0];

        // Only reverse COMPLETED transfers or payments
        if (tx.status !== 'COMPLETED') return res.status(400).json({ error: 'Can only reverse completed transactions' });

        // 2. Create Reversal
        // Swap debit and credit wallets
        const reversalRef = `REV-${tx.transaction_reference}`;

        // If it was a transfer (has both wallets)
        if (tx.debit_wallet_id && tx.credit_wallet_id) {
            // Credit the original sender (Refund)
            await pool.query("UPDATE wallets SET balance = balance + $1 WHERE id = $2", [tx.amount, tx.debit_wallet_id]);
            // Debit the original receiver (Clawback)
            await pool.query("UPDATE wallets SET balance = balance - $1 WHERE id = $2", [tx.amount, tx.credit_wallet_id]);

            // Insert Reversal Ledger Entry
            await pool.query(`
                INSERT INTO ledger_entries (
                    transaction_reference, debit_wallet_id, credit_wallet_id, amount, currency, description, transaction_type, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             `, [
                reversalRef,
                tx.credit_wallet_id, // Now debiting the receiver
                tx.debit_wallet_id,  // Now crediting the sender
                tx.amount,
                tx.currency,
                `Reversal of ${tx.transaction_reference}`,
                'REVERSAL',
                'COMPLETED'
            ]);
        }

        res.json({ message: 'Transaction reversed successfully' });
    } catch (err) {
        console.error('Reverse Transaction Error:', err);
        res.status(500).json({ error: 'Failed to reverse transaction' });
    }
});

// 3. Update User Role
app.patch('/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

        await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
        res.json({ message: 'User role updated successfully' });
    } catch (err) {
        console.error('Update Role Error:', err);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// 4. CMS: Create Help Article
app.post('/admin/content/help', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        const result = await pool.query(
            "INSERT INTO help_articles (title, content, category, tags) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, content, category, tags || []]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Create Help Error:', err);
        res.status(500).json({ error: 'Failed to create help article' });
    }
});

// 5. CMS: Create Blog Post
app.post('/admin/content/blog', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, excerpt, content, slug, category, image_url, read_time, author } = req.body;
        const result = await pool.query(
            "INSERT INTO blog_posts (title, excerpt, content, slug, category, image_url, read_time, author) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [title, excerpt, content, slug, category, image_url, read_time, author]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Create Blog Error:', err);
        res.status(500).json({ error: 'Failed to create blog post' });
    }
});

// 6. CMS: Create Job Posting
app.post('/admin/content/jobs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, department, location, type, description, requirements } = req.body;
        const result = await pool.query(
            "INSERT INTO job_postings (title, department, location, type, description, requirements) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [title, department, location, type, description, requirements || []]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Create Job Error:', err);
        res.status(500).json({ error: 'Failed to create job posting' });
    }
});


// ============================================================
// --- MERCHANT ONBOARDING & DEVELOPER API ROUTES ---
// ============================================================

// Ensure Zambia-specific merchant schema columns exist
(async () => {
    try {
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`);
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`);
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_incorporated BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS registration_type VARCHAR(100)`);
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'business'`);
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS pacra_verified BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`);
        await pool.query(`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR(100)`);
        console.log('[Merchants] Zambia-specific schema columns ensured.');
    } catch (err) {
        console.error('[Merchants] Schema migration error:', err.message);
    }
})();

// Helper: provision default API keys for a new merchant
const provisionApiKeys = async (db, merchantId) => {
    const keys = [
        { type: 'test_public', value: generateMerchantApiKey('test_public') },
        { type: 'test_secret', value: generateMerchantApiKey('test_secret') },
        { type: 'live_public', value: generateMerchantApiKey('live_public') },
        { type: 'live_secret', value: generateMerchantApiKey('live_secret') },
    ];
    for (const k of keys) {
        await db.query(
            `INSERT INTO api_keys (merchant_id, key_type, key_value) VALUES ($1, $2, $3)`,
            [merchantId, k.type, k.value]
        );
    }
    return keys;
};

// ---- POST /merchants/register ----
// Full Zambia-first merchant onboarding. Creates user + merchant record + API keys in one transaction.
app.post('/merchants/register', async (req, res) => {
    const {
        email, password, firstName, lastName, businessName,
        country = 'Zambia', accountType = 'business',
        isIncorporated = false, registrationType,
        agreedToTerms = false
    } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (!businessName) return res.status(400).json({ error: 'Business name is required' });
    if (!firstName || !lastName) return res.status(400).json({ error: 'First name and last name are required' });
    if (!agreedToTerms) return res.status(400).json({ error: 'You must agree to the terms and conditions' });

    const passwordCheck = verifyPasswordStrength(password);
    if (!passwordCheck.isValid) return res.status(400).json({ error: passwordCheck.message });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check no duplicate email
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });

        // Create the user record with role = 'merchant'
        const passwordHash = await bcrypt.hash(password, 12);
        const fullName = `${firstName} ${lastName}`;
        const emailVerifyToken = crypto.randomBytes(32).toString('hex');

        const userResult = await client.query(
            `INSERT INTO users (email, password_hash, full_name, email_verified, created_at)
             VALUES ($1, $2, $3, false, NOW()) RETURNING id, email`,
            [email, passwordHash, fullName]
        );
        const user = userResult.rows[0];

        // Create default ZMW + USD wallets (Zambia primary currency = ZMW)
        await client.query(`INSERT INTO wallets (user_id, currency, balance) VALUES ($1, 'ZMW', 0.00)`, [user.id]);
        await client.query(`INSERT INTO wallets (user_id, currency, balance) VALUES ($1, 'USD', 0.00)`, [user.id]);

        // Determine compliance/PACRA status for Zambia
        const pacraVerified = country === 'Zambia' && isIncorporated;
        const complianceStatus = pacraVerified ? 'PENDING' : 'SANDBOX_ONLY';

        // Create the merchant record (Zambia-specific fields included)
        const merchantResult = await client.query(
            `INSERT INTO merchants (
                user_id, business_name, business_type, country, 
                first_name, last_name, email,
                is_incorporated, registration_type, account_type,
                compliance_status, is_live_enabled,
                pacra_verified, agreed_to_terms,
                email_verified, email_verify_token
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING id, business_name, compliance_status`,
            [
                user.id, businessName, accountType, country,
                firstName, lastName, email,
                isIncorporated, registrationType || null, accountType,
                complianceStatus, false,
                pacraVerified, agreedToTerms,
                false, emailVerifyToken
            ]
        );
        const merchant = merchantResult.rows[0];

        // Provision API keys
        const apiKeys = await provisionApiKeys(client, merchant.id);

        // Create a balance record for the platform balance
        await client.query(
            `INSERT INTO balances (merchant_id, currency, pending_amount, available_amount)
             VALUES ($1, 'ZMW', 0.00, 0.00)
             ON CONFLICT (merchant_id) DO NOTHING`,
            [merchant.id]
        );

        await client.query('COMMIT');

        const token = jwt.sign({ userId: user.id, email: user.email, merchantId: merchant.id }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: 'Merchant account created successfully',
            user: { id: user.id, email: user.email, fullName },
            merchant: {
                id: merchant.id,
                businessName: merchant.business_name,
                country,
                complianceStatus: merchant.compliance_status,
                isLiveEnabled: false,
            },
            // Only return test keys on registration; live keys are for after KYC
            apiKeys: {
                testPublicKey: apiKeys.find(k => k.type === 'test_public')?.value,
                testSecretKey: apiKeys.find(k => k.type === 'test_secret')?.value,
            },
            token,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Merchants] Registration Error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    } finally {
        client.release();
    }
});

// ---- POST /merchants/login ----
app.post('/merchants/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    try {
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = userRes.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // Check if a merchant record exists
        const merchantRes = await pool.query(
            `SELECT id, business_name, country, compliance_status, is_live_enabled, account_type
             FROM merchants WHERE user_id = $1`,
            [user.id]
        );

        if (merchantRes.rows.length === 0) {
            return res.status(403).json({ error: 'No merchant account found. Please register as a merchant.' });
        }

        const merchant = merchantRes.rows[0];
        const token = jwt.sign({ userId: user.id, email: user.email, merchantId: merchant.id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, fullName: user.full_name },
            merchant: {
                id: merchant.id,
                businessName: merchant.business_name,
                country: merchant.country,
                complianceStatus: merchant.compliance_status,
                isLiveEnabled: merchant.is_live_enabled,
                accountType: merchant.account_type,
            },
            token,
        });
    } catch (err) {
        console.error('[Merchants] Login Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---- GET /merchants/status ----
// Returns merchant profile + balance + activation status
app.get('/merchants/status', authenticateToken, async (req, res) => {
    try {
        const merchantRes = await pool.query(
            `SELECT m.*, u.email AS user_email, u.full_name
             FROM merchants m
             JOIN users u ON u.id = m.user_id
             WHERE m.user_id = $1`,
            [req.user.id]
        );

        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });
        const m = merchantRes.rows[0];

        const balanceRes = await pool.query(
            "SELECT * FROM balances WHERE merchant_id = $1",
            [m.id]
        );

        res.json({
            isActive: m.compliance_status === 'ACTIVE',
            isPending: m.compliance_status === 'PENDING',
            complianceStatus: m.compliance_status,
            businessName: m.business_name,
            accountId: m.account_id,
            merchant: m,
            balance: {
                available: parseFloat(balanceRes.rows[0]?.available_amount || 0).toFixed(2),
                pending: parseFloat(balanceRes.rows[0]?.pending_amount || 0).toFixed(2),
                currency: balanceRes.rows[0]?.currency || 'ZMW',
                lastSettlementAt: balanceRes.rows[0]?.last_settlement_at
            }
        });
    } catch (err) {
        console.error('[Merchants] Status Error:', err);
        res.status(500).json({ error: 'Failed to fetch merchant status', details: err.message });
    }
});



// ---- GET /merchants/onboarding/draft --- Retrieve saved progress  ----
app.get('/merchants/onboarding/draft', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT kyc_payload FROM merchants WHERE user_id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });
        res.json(result.rows[0].kyc_payload || {});
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch draft' });
    }
});

// ---- POST /merchants/onboarding/draft --- Save incremental progress  ----
app.post('/merchants/onboarding/draft', authenticateToken, async (req, res) => {
    try {
        const { payload } = req.body;
        await pool.query(
            'UPDATE merchants SET kyc_payload = $1 WHERE user_id = $2',
            [JSON.stringify(payload), req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save draft' });
    }
});

// ---- POST /merchants/onboarding --- Full KYC submission  ----
app.post('/merchants/onboarding', authenticateToken, uploadKyc.any(), async (req, res) => {
    try {
        const {
            industry, subIndustry, legalName, tradingName, registeredAddress,
            businessPhone, businessEmail, businessWebsite, yearEstablished,
            expectedMonthlyVolume, businessDescription, pacraNumber, tpin,
            directors, corpShareholders, faceCapture
        } = req.body;

        // Check if merchant record exists
        const merchantRes = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });
        const merchantId = merchantRes.rows[0].id;

        // Process files
        const fileMap = {};
        if (req.files) {
            req.files.forEach(file => {
                fileMap[file.fieldname] = `/assets/images/kyc/${file.filename}`;
            });
        }

        // Handle base64 face capture if present
        let faceCapturePath = null;
        if (faceCapture && faceCapture.startsWith('data:image')) {
            try {
                const base64Data = faceCapture.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `face-capture-${Date.now()}.jpg`;
                const fullPath = path.join('C:/FlapaPay/apps/web/public/assets/images/kyc', filename);
                fs.writeFileSync(fullPath, buffer);
                faceCapturePath = `/assets/images/kyc/${filename}`;
            } catch (err) {
                console.error('Failed to save face capture:', err);
            }
        }

        // Build kyc payload
        const kycPayload = {
            industry, subIndustry, tradingName, businessPhone, businessEmail,
            businessWebsite, yearEstablished, expectedMonthlyVolume, businessDescription,
            directors: typeof directors === 'string' ? JSON.parse(directors) : directors,
            corpShareholders: typeof corpShareholders === 'string' ? JSON.parse(corpShareholders) : corpShareholders,
            files: fileMap,
            faceCapture: faceCapturePath || faceCapture,
            submittedAt: new Date().toISOString(),
        };

        // Update merchant record with full KYC data and set status to PENDING
        await pool.query(
            `UPDATE merchants SET
                business_name = $1, pacra_number = COALESCE(pacra_number, $2), tpin = COALESCE(tpin, $3),
                registered_address = $4, kyc_payload = $5, compliance_status = 'PENDING',
                kyc_submitted_at = NOW()
             WHERE id = $6`,
            [legalName, pacraNumber, tpin, registeredAddress, JSON.stringify(kycPayload), merchantId]
        );

        // Populate merchant_documents table for queryable indexing
        for (const [fieldname, url] of Object.entries(fileMap)) {
            // Map fieldname to document_type (simple heuristic or explicit mapping)
            let docType = fieldname.toUpperCase();
            if (fieldname.startsWith('directorPassport')) docType = 'DIRECTOR_PASSPORT';
            else if (fieldname.startsWith('directorId')) docType = 'DIRECTOR_ID';
            else if (fieldname.startsWith('corpIncorp')) docType = 'CORP_INCORPORATION';
            else if (fieldname.startsWith('corpArticles')) docType = 'CORP_ARTICLES';

            await pool.query(
                `INSERT INTO merchant_documents (merchant_id, document_type, file_url, status)
                 VALUES ($1, $2, $3, 'PENDING')`,
                [merchantId, docType, url]
            );
        }

        res.json({ success: true, message: 'KYC application submitted for review' });
    } catch (err) {
        console.error('[Onboarding] Error:', err);
        res.status(500).json({ error: 'Failed to submit onboarding', details: err.message });
    }
});

// ---- GET /admin/merchants/kyc  ---- (admin only)
app.get('/admin/merchants/kyc', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const result = await pool.query(
            `SELECT m.id, m.business_name, m.pacra_number, m.tpin, m.registered_address,
                    m.compliance_status, m.kyc_payload, m.kyc_submitted_at,
                    u.email, u.full_name
             FROM merchants m
             JOIN users u ON u.id = m.user_id
             WHERE m.kyc_submitted_at IS NOT NULL
             ORDER BY m.kyc_submitted_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[Admin KYC] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ---- POST /admin/merchants/kyc/:merchantId/review ---- (admin only)
app.post('/admin/merchants/kyc/:merchantId/review', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const { decision, adminNotes } = req.body;
        const { merchantId } = req.params;

        if (!['ACTIVE', 'REJECTED', 'PENDING'].includes(decision)) {
            return res.status(400).json({ error: 'Invalid decision. Must be ACTIVE, REJECTED, or PENDING' });
        }

        await pool.query(
            `UPDATE merchants SET
                compliance_status = $1,
                admin_kyc_notes = $2,
                is_live_enabled = $3,
                kyc_reviewed_at = NOW()
             WHERE id = $4`,
            [decision, adminNotes || '', decision === 'ACTIVE' ? true : false, merchantId]
        );

        res.json({ success: true, message: `Merchant ${decision}` });
    } catch (err) {
        console.error('[Admin KYC Review] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ---- GET /merchants/profile ----
app.get('/merchants/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT m.id, m.business_name, m.country, m.compliance_status, m.is_live_enabled,
                    m.first_name, m.last_name, m.email, m.is_incorporated, m.registration_type,
                    m.account_type, m.pacra_verified, m.email_verified,
                    u.email AS user_email, u.full_name
             FROM merchants m
             JOIN users u ON u.id = m.user_id
             WHERE m.user_id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Merchant profile not found' });

        const m = result.rows[0];
        res.json({
            id: m.id,
            businessName: m.business_name,
            country: m.country,
            complianceStatus: m.compliance_status,
            isLiveEnabled: m.is_live_enabled,
            firstName: m.first_name,
            lastName: m.last_name,
            email: m.email || m.user_email,
            fullName: m.full_name,
            isIncorporated: m.is_incorporated,
            registrationType: m.registration_type,
            accountType: m.account_type,
            pacraVerified: m.pacra_verified,
            emailVerified: m.email_verified,
        });
    } catch (err) {
        console.error('[Merchants] Profile Error:', err);
        res.status(500).json({ error: 'Failed to fetch merchant profile' });
    }
});

// ---- GET /merchants/stats ----
app.get('/merchants/stats', authenticateToken, async (req, res) => {
    try {
        const merchantRes = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });
        const merchantId = merchantRes.rows[0].id;

        // Honour the mode requested from the dashboard (default: test)
        const isLive = req.query.mode === 'live';
        const periodParam = req.query.period || '30d';
        let days = 30;
        if (periodParam === '7d') days = 7;
        else if (periodParam === '90d') days = 90;

        // Sum successful charges, filtered by mode AND period
        const volumeRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
             FROM charges 
             WHERE merchant_id = $1 AND status = 'succeeded' AND livemode = $2
               AND created_at >= NOW() - INTERVAL '${days} days'`,
            [merchantId, isLive]
        );

        // Get Balance
        // Compute balance dynamically for both Test and Live mode from the 'charges' table
        // This includes settlements and fees which are now recorded as negative charges
        let availableBalance = volumeRes.rows[0].total || 0;

        const stats = [
            { label: isLive ? 'Total Volume' : 'Test Volume', value: `ZK ${parseFloat(volumeRes.rows[0].total).toFixed(2)}`, count: volumeRes.rows[0].count, change: '+0%', trend: 'up' },
            { label: isLive ? 'Available Balance' : 'Test Available Balance', value: `ZK ${parseFloat(availableBalance).toFixed(2)}`, change: '+0%', trend: 'up' },
            { label: isLive ? 'Total Transactions' : 'Test Transactions', value: volumeRes.rows[0].count.toString(), change: '+0%', trend: 'up' },
            { label: 'Success Rate', value: '100%', change: '+0%', trend: 'up' },
        ];

        // Fetch recent activity (mode-filtered)
        const recentRes = await pool.query(
            "SELECT id, amount, currency, status, payment_method, created_at FROM charges WHERE merchant_id = $1 AND livemode = $2 ORDER BY created_at DESC LIMIT 5",
            [merchantId, isLive]
        );

        // Fetch Volume by Day (Filtered)
        const historyRes = await pool.query(
            `SELECT DATE_TRUNC('day', created_at) as day, SUM(amount) as val 
             FROM charges 
             WHERE merchant_id = $1 AND status = 'succeeded' AND livemode = $2
               AND created_at >= NOW() - INTERVAL '${days} days'
             GROUP BY day ORDER BY day ASC`,
            [merchantId, isLive]
        );

        // Fetch Method Breakdown (Filtered)
        const methodRes = await pool.query(
            `SELECT payment_method as label, COUNT(*) as count 
             FROM charges 
             WHERE merchant_id = $1 AND status = 'succeeded' AND livemode = $2
               AND created_at >= NOW() - INTERVAL '${days} days'
             GROUP BY payment_method`,
            [merchantId, isLive]
        );

        res.json({
            stats,
            rawBalance: availableBalance,
            recentActivity: recentRes.rows.map(c => ({
                id: c.id,
                amount: parseFloat(c.amount).toFixed(2),
                currency: c.currency,
                status: c.status,
                method: c.payment_method,
                createdAt: c.created_at
            })),
            volumeHistory: historyRes.rows.map(r => ({
                label: new Date(r.day).toLocaleDateString('en-US', { weekday: 'short' }),
                value: parseFloat(r.val)
            })),
            methodBreakdown: methodRes.rows.map(m => ({
                label: m.label === 'card' ? 'Cards' : m.label === 'mobile_money' ? 'Mobile' : 'Other',
                count: parseInt(m.count)
            })),
            geographicData: [
                { city: 'Lusaka', percent: 58, bar: 'bg-orange-500' },
                { city: 'Copperbelt', percent: 22, bar: 'bg-blue-500' },
                { city: 'Livingstone', percent: 12, bar: 'bg-emerald-500' },
                { city: 'Other', percent: 8, bar: 'bg-purple-500' },
            ],
            cohortData: [
                { cohort: 'Oct 2024', vals: [100, 72, 55, 48, 43] },
                { cohort: 'Nov 2024', vals: [100, 68, 51, 45, null] },
                { cohort: 'Dec 2024', vals: [100, 74, 59, null, null] },
                { cohort: 'Jan 2025', vals: [100, 71, null, null, null] },
            ]
        });
    } catch (err) {
        console.error('[Merchants] Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch merchant stats', details: err.message });
    }
});

// ---- POST /merchants/transfer-to-wallet ----
// Moves funds from the merchant platform balance to a specific user wallet
app.post('/merchants/transfer-to-wallet', authenticateToken, async (req, res) => {
    const { amount, walletId, applyFX, fxRate, isTestMode } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const merchantRes = await client.query('SELECT id, compliance_status FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) throw new Error('Merchant not found');
        const merchant = merchantRes.rows[0];
        const isLive = merchant.compliance_status === 'ACTIVE' && req.body.isTestMode !== true;

        // 1. Verify Wallet Ownership
        const walletRes = await client.query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2', [walletId, req.user.id]);
        if (walletRes.rows.length === 0) throw new Error('Target wallet not found or unauthorized');
        const wallet = walletRes.rows[0];

        // Calculate 1% Fee
        const processedAmount = parseFloat(amount);
        const fee = parseFloat((processedAmount * 0.01).toFixed(2));
        const totalDeduction = processedAmount + fee;

        if (isLive) {
            // Real Money logic
            const balanceRes = await client.query('SELECT available_amount FROM balances WHERE merchant_id = $1 FOR UPDATE', [merchant.id]);
            const available = parseFloat(balanceRes.rows[0]?.available_amount || 0);

            if (available < totalDeduction) throw new Error(`Insufficient platform balance to cover amount and ${fee} ZMW fee`);

            // Deduct amount + fee from platform balance
            await client.query('UPDATE balances SET available_amount = available_amount - $1 WHERE merchant_id = $2', [totalDeduction, merchant.id]);

            // Credit Wallet (only base amount after FX)
            const creditingAmount = applyFX ? processedAmount * fxRate : processedAmount;
            await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [creditingAmount, walletId]);

            // Log settlement entry in ledger
            const ref = 'SETTLE-' + crypto.randomBytes(8).toString('hex').toUpperCase();
            await client.query(
                `INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
                 VALUES ($1, $2, $3, $4, $5, 'SETTLEMENT', 'COMPLETED')`,
                [ref, walletId, creditingAmount, wallet.currency, 'Settlement from Platform Balance']
            );

            // Log fee entry in ledger
            const feeRef = 'FEE-' + crypto.randomBytes(8).toString('hex').toUpperCase();
            await client.query(
                `INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, amount, currency, description, transaction_type, status)
                 VALUES ($1, $2, $3, $4, $5, 'SYSTEM_FEE', 'COMPLETED')`,
                [feeRef, walletId, fee, wallet.currency, '1% Platform Settlement Fee']
            );

            // Log Settlement as a negative "charge" so it appears in transactions and deducts from volume
            await client.query(
                `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details, description, metadata, livemode, is_settled)
                 VALUES ($1, $2, $3, $4, 'succeeded', 'wallet_transfer', '{}', 'Settlement to Wallet', '{}', true, true)`,
                ['ch_stl_' + crypto.randomBytes(8).toString('hex'), merchant.id, -processedAmount, 'ZMW']
            );
            await client.query(
                `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details, description, metadata, livemode, is_settled)
                 VALUES ($1, $2, $3, $4, 'succeeded', 'platform_fee', '{}', '1% Settlement Fee', '{}', true, true)`,
                ['ch_fee_' + crypto.randomBytes(8).toString('hex'), merchant.id, -fee, 'ZMW']
            );
        } else {
            // Test Mode logic 
            const creditingAmount = applyFX ? processedAmount * fxRate : processedAmount;
            await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [creditingAmount, walletId]);

            const ref = 'TEST-SETTLE-' + crypto.randomBytes(8).toString('hex').toUpperCase();
            await client.query(
                `INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status)
                 VALUES ($1, $2, $3, $4, $5, 'SETTLEMENT', 'COMPLETED')`,
                [ref, walletId, creditingAmount, wallet.currency, 'Test Settlement (Simulated)']
            );

            // Log Test Settlement & Fee into charges so volume adjusts
            await client.query(
                `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details, description, metadata, livemode, is_settled)
                 VALUES ($1, $2, $3, $4, 'succeeded', 'wallet_transfer', '{}', 'Test Settlement to Wallet', '{}', false, true)`,
                ['ch_stl_' + crypto.randomBytes(8).toString('hex'), merchant.id, -processedAmount, 'ZMW']
            );
            await client.query(
                `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details, description, metadata, livemode, is_settled)
                 VALUES ($1, $2, $3, $4, 'succeeded', 'platform_fee', '{}', '1% Test Settlement Fee', '{}', false, true)`,
                ['ch_fee_' + crypto.randomBytes(8).toString('hex'), merchant.id, -fee, 'ZMW']
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Settlement processed successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Settlement] Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ---- GET /merchants/keys ----
// Returns both test and live key pairs for the authenticated merchant
app.get('/merchants/keys', authenticateToken, async (req, res) => {
    try {
        const merchantRes = await pool.query('SELECT id FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });

        const merchantId = merchantRes.rows[0].id;
        const complianceStatus = merchantRes.rows[0].compliance_status;

        const keysRes = await pool.query(
            `SELECT key_type, key_value, is_active, created_at FROM api_keys WHERE merchant_id = $1 AND is_active = true ORDER BY created_at DESC`,
            [merchantId]
        );

        const keys = {};
        for (const row of keysRes.rows) {
            keys[row.key_type] = row.key_value;
        }

        const isApproved = complianceStatus === 'ACTIVE';

        res.json({
            test: {
                public: keys['test_public'] || '',
                secret: keys['test_secret'] || ''
            },
            live: {
                public: keys['live_public'] || 'pk_live_unprovisioned',
                secret: keys['live_secret'] || 'sk_live_unprovisioned'
            },
            isApproved
        });
    } catch (err) {
        console.error('[Merchants] Keys Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch API keys', details: err.message });
    }
});

// ---- POST /merchants/keys/roll ----
// Rotates all API keys for the authenticated merchant
app.post('/merchants/keys/roll', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const merchantRes = await client.query('SELECT id, is_live_enabled FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });

        const merchantId = merchantRes.rows[0].id;
        const { keyType, type } = req.body; // Handle both keyType and type
        const mode = keyType || type;

        // Deactivate existing keys
        const typeFilter = mode ? `AND key_type LIKE '${mode}%'` : '';
        await client.query(`UPDATE api_keys SET is_active = false WHERE merchant_id = $1 ${typeFilter}`, [merchantId]);

        // Provision new keys
        const typesToProvision = mode === 'test'
            ? [{ type: 'test_public', value: generateMerchantApiKey('test_public') }, { type: 'test_secret', value: generateMerchantApiKey('test_secret') }]
            : mode === 'live'
                ? [{ type: 'live_public', value: generateMerchantApiKey('live_public') }, { type: 'live_secret', value: generateMerchantApiKey('live_secret') }]
                : [
                    { type: 'test_public', value: generateMerchantApiKey('test_public') },
                    { type: 'test_secret', value: generateMerchantApiKey('test_secret') },
                    { type: 'live_public', value: generateMerchantApiKey('live_public') },
                    { type: 'live_secret', value: generateMerchantApiKey('live_secret') },
                ];

        for (const k of typesToProvision) {
            await client.query(
                `INSERT INTO api_keys (merchant_id, key_type, key_value) VALUES ($1, $2, $3)`,
                [merchantId, k.type, k.value]
            );
        }

        await client.query('COMMIT');

        // Return new keys in nested format
        const newKeys = {};
        for (const k of typesToProvision) { newKeys[k.type] = k.value; }

        res.json({
            message: 'API keys rotated successfully',
            test: {
                public: newKeys['test_public'] || '',
                secret: newKeys['test_secret'] || ''
            },
            live: {
                public: newKeys['live_public'] || '',
                secret: newKeys['live_secret'] || ''
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Merchants] Key Roll Error:', err);
        res.status(500).json({ error: 'Failed to rotate API keys' });
    } finally {
        client.release();
    }
});

// ---- POST /merchants/verify-email ----
// Simulated email verification (marks email as verified)
app.post('/merchants/verify-email', async (req, res) => {
    const { email } = req.body;
    if (!email || !validateEmail(email)) return res.status(400).json({ error: 'Valid email is required' });

    try {
        // In a real implementation, we'd send a token via email. Here we simulate instant verification.
        const result = await pool.query(
            `UPDATE merchants SET email_verified = true WHERE email = $1 RETURNING id`,
            [email]
        );

        if (result.rows.length === 0) {
            // Merchant not registered yet (normal during Step 2 before final submit)
            // Just acknowledge — verification confirmed pre-registration
        }

        res.json({ message: 'Email verification initiated. Check your inbox for the verification link.', simulated: true });
    } catch (err) {
        console.error('[Merchants] Verify Email Error:', err);
        res.status(500).json({ error: 'Failed to initiate email verification' });
    }
});

// ---- GET /merchants/zambia/registration-types ----
// Returns Zambia-specific business registration types (PACRA classifications)
app.get('/merchants/zambia/registration-types', (req, res) => {
    res.json({
        country: 'Zambia',
        registrationAuthority: 'PACRA (Patents and Companies Registration Agency)',
        registrationTypes: [
            { value: 'sole-proprietorship', label: 'Sole Proprietorship', description: 'Business owned and operated by one person' },
            { value: 'limited-liability', label: 'Private Limited Company (Ltd)', description: 'Most common company type in Zambia, registered with PACRA' },
            { value: 'public-company', label: 'Public Limited Company (PLC)', description: 'Listed or eligible to be listed on Lusaka Securities Exchange' },
            { value: 'partnership', label: 'Partnership', description: 'Business owned by two or more individuals' },
            { value: 'cooperative', label: 'Cooperative Society', description: 'Registered under the Cooperative Societies Act' },
            { value: 'ngo', label: 'NGO / Non-Profit', description: 'Registered under the NGO Act with PACRA' },
            { value: 'statutory-corporation', label: 'Statutory Corporation / Parastatal', description: 'Government-linked corporations' },
        ],
        currency: { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'K' },
        mobileMoney: [
            { provider: 'AIRTEL_ZMW', name: 'Airtel Money Zambia' },
            { provider: 'MTN_ZMW', name: 'MTN Mobile Money Zambia' },
            { provider: 'ZAMTEL_ZMW', name: 'Zamtel Kwacha' },
        ],
    });
});


// --- Mastercard Virtual Cards Integration ---

// Create a new Virtual Card
app.post('/v1/issuing/cards', authenticateToken, async (req, res) => {
    const { amount, currency } = req.body;

    if (!amount || amount <= 0 || !currency) {
        return res.status(400).json({ error: 'Valid amount and currency are required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Check User Wallet Balance
        const walletRes = await client.query('SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE', [req.user.id, currency]);
        if (walletRes.rows.length === 0) throw new Error(`User does not have a ${currency} wallet.`);
        const wallet = walletRes.rows[0];

        // Deduct initial load + issuance fee (e.g., $0.50 for USD, 12.50 for ZMW)
        const issuanceFee = currency === 'USD' ? 0.50 : 12.50;
        const totalToDeduct = Number(amount) + issuanceFee;

        if (Number(wallet.balance) < totalToDeduct) {
            throw new Error(`Insufficient wallet balance. You need ${totalToDeduct} ${currency} (including ${issuanceFee} fee).`);
        }

        // Deduct from wallet
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [totalToDeduct, wallet.id]);

        // 2. Register Client with Mastercard Sandbox
        console.log('[Mastercard] Registering client...');
        const mcClientRes = await MastercardCardService.createClient({
            clientType: 'INDIVIDUAL',
            personalInfo: {
                firstName: req.user.fullName?.split(' ')[0] || 'Flapa',
                lastName: req.user.fullName?.split(' ')[1] || 'User',
                dateOfBirth: '1990-01-01', // Ideally fetch from KYC
            },
            address: {
                line1: '123 FlapaPay HQ',
                city: 'Lusaka',
                postalCode: '10101',
                country: 'ZMB'
            }
        });
        const clientId = mcClientRes.clients[0].clientIdentifier;

        // 3. Create Account Contract
        console.log('[Mastercard] Creating account contract for client', clientId);
        const mcAccountRes = await MastercardCardService.createAccount({
            clientIdentifier: clientId,
            currency: currency,
            accountType: 'PREPAID'
        });
        const accountContractId = mcAccountRes.accounts[0].accountIdentifier;

        // 4. Issue the Card Contract
        console.log('[Mastercard] Issuing card for account', accountContractId);
        const mcCardRes = await MastercardCardService.createCard({
            accountIdentifier: accountContractId,
            clientIdentifier: clientId,
            cardProductClass: 'VIRTUAL', // Virtual non-plastic card
            currency: currency
        });
        const cardContractId = mcCardRes.cards[0].cardIdentifier;
        const expiryDateStr = mcCardRes.cards[0].expirationDate; // Usually "YYMM"

        // 5. Activate the Plastic
        console.log('[Mastercard] Activating card plastic', cardContractId);
        await MastercardCardService.activateCard(cardContractId);

        // 6. Fund the card via Account Credit
        if (Number(amount) > 0) {
            console.log('[Mastercard] Funding card with', amount, currency);
            await MastercardCardService.fundCard(cardContractId, amount, currency);
        }

        // 7. Store in Local DB
        const expiryMonth = expiryDateStr.substring(2, 4);
        const expiryYear = "20" + expiryDateStr.substring(0, 2);
        const last4 = '****'; // Mastercard Sandbox may not give last4 immediately without details fetch

        const dbRes = await client.query(`
            INSERT INTO virtual_cards (user_id, card_contract_id, account_contract_id, client_id, last4, amount, currency, expiry_month, expiry_year)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
        `, [req.user.id, cardContractId, accountContractId, clientId, '0000', amount, currency, expiryMonth, expiryYear]);

        // 8. Record Ledger Entries
        const txnRef = 'VCARD-ISSUE-' + dbRes.rows[0].id;
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'VIRTUAL_CARD_LOAD', 'COMPLETED')`,
            [txnRef, wallet.id, amount, currency, `Funded new virtual card`]
        );
        await recordFee(client, txnRef, issuanceFee, currency, `Virtual Card Issuance Fee`);

        await client.query('COMMIT');

        // Asynchronously try to fetch the real last4 and update
        try {
            const details = await MastercardCardService.getCardDetails(cardContractId);
            // Look for PAN in common places in MC Global Processing response
            const pan = (details.cards && details.cards[0] && details.cards[0].pan) || details.pan;
            if (pan) {
                const realLast4 = pan.slice(-4);
                await pool.query('UPDATE virtual_cards SET last4 = $1 WHERE id = $2', [realLast4, dbRes.rows[0].id]);
                dbRes.rows[0].last4 = realLast4;
                console.log('[Mastercard] Successfully updated real last4 for card', cardContractId);
            }
        } catch (e) { console.error('[Mastercard] Deferred Last4 fetch failed:', e.response?.data || e.message); }

        res.status(201).json(dbRes.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[Mastercard Virtual Card Error]:', error.response?.data || error.message);

        // Handle Sandbox-specific mocked errors gracefully
        if (error.response?.status === 401) {
            return res.status(500).json({ error: 'Mastercard Authentication Failed. Check keys/certificate.' });
        }
        res.status(500).json({ error: 'Failed to issue virtual card: ' + (error.response?.data?.errors?.[0]?.description || error.message) });
    } finally {
        client.release();
    }
});

// Fetch User's Cards
app.get('/v1/issuing/cards', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM virtual_cards WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch cards error:', err);
        res.status(500).json({ error: 'Failed to fetch virtual cards' });
    }
});

// Reveal Card Details
app.post('/v1/issuing/cards/:id/details', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { pin } = req.body;

    try {
        const isPinValid = await verifyUserPin(req.user.id, pin);
        if (!isPinValid) return res.status(401).json({ error: 'Invalid security PIN' });

        const cardRes = await pool.query('SELECT card_contract_id FROM virtual_cards WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (cardRes.rows.length === 0) return res.status(404).json({ error: 'Card not found' });

        const cardContractId = cardRes.rows[0].card_contract_id;

        // Fetch encrypted details from Mastercard
        // Note: In real prod with FLE, 'pan' and 'cvv' would arrive ciphered. 
        // Here we simulate the successful sandbox payload.
        const mcDetails = await MastercardCardService.getCardDetails(cardContractId);

        let pan = '0000000000000000';
        let cvv = '000';
        let expiry = '12/99';

        if (mcDetails.cards && mcDetails.cards[0]) {
            const cardObj = mcDetails.cards[0];
            pan = cardObj.pan || cardObj.encryptedPan || pan;
            cvv = cardObj.cvv2 || cardObj.cvv || cvv;

            if (cardObj.expirationDate) {
                // Handle YYMM or MMDDYY formats
                if (cardObj.expirationDate.length === 4) {
                    expiry = cardObj.expirationDate.substring(2, 4) + '/' + cardObj.expirationDate.substring(0, 2);
                } else {
                    expiry = cardObj.expirationDate;
                }
            }
        } else if (mcDetails.pan) {
            // Direct object response
            pan = mcDetails.pan;
            cvv = mcDetails.cvv2 || mcDetails.cvv || cvv;
            expiry = mcDetails.expirationDate || expiry;
        }

        res.json({ pan, cvv, expiry });
    } catch (error) {
        console.error('[Mastercard Details Error]:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to retrieve secure card details' });
    }
});

// Replace Card Status
app.patch('/v1/issuing/cards/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'BLOCKED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
        const cardRes = await pool.query('SELECT card_contract_id FROM virtual_cards WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (cardRes.rows.length === 0) return res.status(404).json({ error: 'Card not found' });

        const mcStatus = status === 'ACTIVE' ? 'NORMAL' : 'BLOCKED'; // Map to Mastercard's expected enums

        await MastercardCardService.updateCardStatus(cardRes.rows[0].card_contract_id, mcStatus);

        await pool.query('UPDATE virtual_cards SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update card status' });
    }
});

// Fund Card
app.post('/v1/issuing/cards/:id/fund', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const { id } = req.params;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const cardRes = await client.query('SELECT * FROM virtual_cards WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (cardRes.rows.length === 0) throw new Error('Card not found');
        const card = cardRes.rows[0];

        if (card.status !== 'ACTIVE') throw new Error('Cannot fund a blocked card');

        const walletRes = await client.query('SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE', [req.user.id, card.currency]);
        const wallet = walletRes.rows[0];

        if (Number(wallet.balance) < Number(amount)) throw new Error('Insufficient wallet balance');

        // Deduct Wallet
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [amount, wallet.id]);

        // Call Mastercard to Credit Contract
        await MastercardCardService.fundCard(card.card_contract_id, amount, card.currency);

        // Update local card balance
        await client.query('UPDATE virtual_cards SET amount = amount + $1 WHERE id = $2', [amount, card.id]);

        await client.query('COMMIT');
        res.json({ success: true, amount });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Refund (Withdraw from) Card
app.post('/v1/issuing/cards/:id/refund', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    const { id } = req.params;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const cardRes = await client.query('SELECT * FROM virtual_cards WHERE id = $1 AND user_id = $2 FOR UPDATE', [id, req.user.id]);
        if (cardRes.rows.length === 0) throw new Error('Card not found');
        const card = cardRes.rows[0];

        if (card.status !== 'ACTIVE') throw new Error('Cannot refund from a blocked card');
        if (Number(card.amount) < Number(amount)) throw new Error('Insufficient funds on virtual card');

        // Call Mastercard to Debit Contract
        await MastercardCardService.withdrawFromCard(card.card_contract_id, amount, card.currency);

        // Update local card balance
        await client.query('UPDATE virtual_cards SET amount = amount - $1 WHERE id = $2', [amount, card.id]);

        // Credit Wallet
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND currency = $3', [amount, req.user.id, card.currency]);

        await client.query('COMMIT');
        res.json({ success: true, amount });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- AI Developer Assistant Endpoint (RAG) ---
app.post('/api/ai/ask', async (req, res) => {
    const { messages, context } = req.body;
    const userQuery = messages.length > 0 ? messages[messages.length - 1].content : '';

    try {
        // RAG: Fetch relevant help articles from the database
        const articlesRes = await pool.query(
            "SELECT title, content FROM help_articles WHERE title ILIKE $1 OR content ILIKE $1 OR category ILIKE $1 LIMIT 3",
            [`%${userQuery}%`]
        );

        const dynamicContext = articlesRes.rows.length > 0
            ? articlesRes.rows.map(a => `Article: ${a.title}\nContent: ${a.content}`).join('\n\n')
            : 'General information available for FlapaPay integration.';

        // Developer documentation context
        const DEV_CONTEXT = `
FlapaPay Developer Context:
- Base API URL: https://api.flapapay.com
- Features: Checkout Sessions, Connect Accounts, Cards, Wallets, Payment Links, Website Widgets
- Auth: Bearer sk_test_... (Sandbox)
- Checkout: POST /v1/checkout/sessions (amount, currency, success_url, cancel_url)
- Connect: POST /v1/connect/accounts (type, email, business_name)
- Payment Links: POST /v1/payment-links (amount, currency, description)
- Widget Integration: <script src="https://js.flapapay.com/v1/widget.js"></script> -> FlapaPayWidget.open({ paymentLinkId })

Relevant Help Content:
${dynamicContext}
`;

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are FlapaPay's expert AI integration assistant. Help developers understand how to use the FlapaPay API. Keep answers concise, technical, and helpful. Use markdown for code blocks. \n\nContext:\n${DEV_CONTEXT}`
                },
                ...messages
            ],
            max_tokens: 400
        });

        const reply = aiResponse.choices[0].message.content;

        // Save session and messages to history
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let sessionIdRes = await client.query('SELECT id FROM ai_chat_sessions ORDER BY updated_at DESC LIMIT 1');
            let sessionId;

            if (sessionIdRes.rows.length === 0 || messages.length <= 1) {
                const newSession = await client.query(
                    "INSERT INTO ai_chat_sessions (context_type) VALUES ($1) RETURNING id",
                    [context || 'developer_docs']
                );
                sessionId = newSession.rows[0].id;
            } else {
                sessionId = sessionIdRes.rows[0].id;
                await client.query("UPDATE ai_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [sessionId]);
            }

            // Save user message
            if (messages.length > 0) {
                const lastUserMsg = messages[messages.length - 1];
                if (lastUserMsg.role === 'user') {
                    await client.query(
                        "INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
                        [sessionId, lastUserMsg.role, lastUserMsg.content]
                    );
                }
            }

            // Save AI message
            await client.query(
                "INSERT INTO ai_chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
                [sessionId, 'assistant', reply]
            );

            await client.query('COMMIT');
        } catch (dbErr) {
            await client.query('ROLLBACK');
            console.error('Failed to save chat history:', dbErr);
        } finally {
            client.release();
        }

        res.json({ reply });
    } catch (error) {
        console.error('AI Error:', error);
        res.json({ reply: "I am having trouble connecting to OpenAI. This could be due to a DNS or network issue in this environment. However, I am here as a placeholder to show the UI works! Please check Server Logs for exact details." });
    }
});
// --- Marketplace Escrow v1 API (Developer Gateway) ---

app.post('/api/v1/escrows', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { amount, currency, description, seller_email, metadata } = req.body;

        if (!amount || !currency || !seller_email) {
            return res.status(400).json({ error: 'Missing required fields: amount, currency, seller_email' });
        }

        const escrow = await EscrowService.createEscrow({
            sellerEmail: seller_email,
            amount,
            currency,
            description,
            metadata: { ...metadata, merchant_id: merchant.merchantId, environment: merchant.environment }
        }, merchant.ownerId);

        res.status(201).json(DeveloperGateway.formatResponse(escrow, merchant.environment));
    } catch (error) {
        console.error('[Marketplace API Error]:', error.message);
        const status = error.message.includes('Unauthorized') ? 401 : 400;
        res.status(status).json({ error: error.message });
    }
});

app.get('/api/v1/escrows/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM escrows WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Escrow not found' });

        const escrow = result.rows[0];
        // Ensure the merchant owns this escrow (or is a party to it)
        // For simplicity in MVP, we check if the ownerId matches, but usually marketplaces can see all their created escrows.
        // If we added a merchant_id column to escrows, we would check that.

        res.json(DeveloperGateway.formatResponse(escrow, merchant.environment));
    } catch (error) {
        const status = error.message.includes('Unauthorized') ? 401 : 400;
        res.status(status).json({ error: error.message });
    }
});

// --- FX Conversion Routes ---

app.post('/fx/quote', authenticateToken, async (req, res) => {
    const { fromCurrency, toCurrency, amount } = req.body;
    if (!fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const rates = await getExchangeRates(fromCurrency);
        const marketRate = rates[toCurrency];

        if (!marketRate) {
            return res.status(400).json({ error: `Unsupported currency pair: ${fromCurrency}/${toCurrency}` });
        }

        // Apply spread: Platform Rate is 2% lower than market rate for the user
        const platformRate = marketRate * (1 - FX_SPREAD);
        const sourceAmount = parseFloat(amount);
        const destinationAmount = sourceAmount * platformRate;
        const marketValue = sourceAmount * marketRate;
        const spreadProfit = marketValue - destinationAmount;

        const quoteId = crypto.randomUUID();
        const quote = {
            quoteId,
            fromCurrency,
            toCurrency,
            amount: sourceAmount,
            market_rate: marketRate,
            platform_rate: platformRate,
            destination_amount: destinationAmount,
            spread_profit: spreadProfit,
            expires: Date.now() + 60000 // 60s validity
        };

        FX_QUOTES.set(quoteId, quote);
        res.json(quote);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate FX quote' });
    }
});

app.post('/fx/convert', authenticateToken, async (req, res) => {
    const { quoteId, pin } = req.body;
    const quote = FX_QUOTES.get(quoteId);

    if (!quote) return res.status(400).json({ error: 'Quote not found or expired' });
    if (Date.now() > quote.expires) return res.status(400).json({ error: 'Quote has expired' });

    // Verify PIN
    const isPinValid = await verifyUserPin(req.user.id, pin);
    if (!isPinValid) return res.status(401).json({ error: 'Invalid security PIN' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Wallets
        const fromWalletRes = await client.query(
            'SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE',
            [req.user.id, quote.fromCurrency]
        );
        const toWalletRes = await client.query(
            'SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE',
            [req.user.id, quote.toCurrency]
        );

        if (fromWalletRes.rows.length === 0) throw new Error(`${quote.fromCurrency} wallet not found`);
        if (toWalletRes.rows.length === 0) throw new Error(`${quote.toCurrency} wallet not found`);

        const fromWallet = fromWalletRes.rows[0];
        const toWallet = toWalletRes.rows[0];

        if (parseFloat(fromWallet.balance) < quote.amount) {
            throw new Error('Insufficient funds in source wallet');
        }

        const ref = 'FX-' + crypto.randomBytes(8).toString('hex').toUpperCase();

        // 2. Debit Source Wallet
        await client.query(
            'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
            [quote.amount, fromWallet.id]
        );

        // 3. Credit Destination Wallet
        await client.query(
            'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
            [quote.destination_amount, toWallet.id]
        );


        // 4. Record Ledger Entry (The Swap - Split into two entries to handle dual currencies)

        // Debit Entry (Source)
        await client.query(`
            INSERT INTO ledger_entries (
                transaction_reference,
                debit_wallet_id,
                amount,
                currency,
                description,
                transaction_type,
                status
            ) VALUES ($1, $2, $3, $4, $5, 'SWAP', 'COMPLETED')`,
            [
                ref + '-D',
                fromWallet.id,
                quote.amount,
                quote.fromCurrency,
                `FX Swap: ${quote.fromCurrency} to ${quote.toCurrency}`
            ]
        );

        // Credit Entry (Destination)
        await client.query(`
            INSERT INTO ledger_entries (
                transaction_reference,
                credit_wallet_id,
                amount,
                currency,
                description,
                transaction_type,
                status
            ) VALUES ($1, $2, $3, $4, $5, 'SWAP', 'COMPLETED')`,
            [
                ref + '-C',
                toWallet.id,
                quote.destination_amount,
                quote.toCurrency,
                `FX Swap: ${quote.fromCurrency} to ${quote.toCurrency}`
            ]
        );

        // 5. Record Spread Revenue (FX Profit)
        await recordFee(client, ref + '-FX-SPREAD', quote.spread_profit, quote.toCurrency, `FX Spread Revenue from ${quote.fromCurrency}/${quote.toCurrency}`);

        await client.query('COMMIT');
        FX_QUOTES.delete(quoteId); // Consume quote

        res.json({
            success: true,
            reference: ref,
            fromAmount: quote.amount,
            fromCurrency: quote.fromCurrency,
            toAmount: quote.destination_amount,
            toCurrency: quote.toCurrency,
            rate: quote.platform_rate
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

const EscrowAgentMonitor = require('./services/EscrowAgentMonitor');

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified Server running on port ${PORT}`);

    // Start Escrow AI Agent Monitor (Check every 12 hours)
    console.log('[UnifiedServer] Initializing AI Escrow Monitor scheduler...');
    setTimeout(() => {
        console.log('[UnifiedServer] Firing initial AI Escrow evaluation...');
        EscrowAgentMonitor.evaluateTransactions()
            .then(() => console.log('[UnifiedServer] Initial AI evaluation complete.'))
            .catch(err => console.error('[UnifiedServer] Agent Init Error:', err));
    }, 5000);

    setInterval(() => {
        console.log('[UnifiedServer] Firing scheduled AI Escrow evaluation...');
        EscrowAgentMonitor.evaluateTransactions().catch(err => console.error('[UnifiedServer] Agent Monitor Error:', err));
    }, 12 * 60 * 60 * 1000);
});
