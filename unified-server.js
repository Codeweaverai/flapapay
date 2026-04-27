require('dotenv').config();
const _dbgLog = (...a) => { try { require('fs').appendFileSync('C:\\FlapaPay\\debug.log', new Date().toISOString() + ' ' + a.map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(' ') + '\n'); } catch(e){} };
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
const CybersourceService = require('./services/CybersourceService');
const { runSchedulerTick, runRetryWorker, executePayout, emitWebhookForMerchant, retryFailedWebhooks, ensureWebhookRetryColumns } = require('./services/PayoutSchedulerService');
const SubscriptionRenewalService = require('./services/SubscriptionRenewalService');
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
const {
    renderClaimFundsEmail,
    renderPendingPaymentConfirmEmail,
    renderFundsCreditedEmail,
    renderPaymentExpiredEmail,
} = require('./emails/ClaimFundsEmail');
const { InvoiceDocument } = require('./services/InvoiceGenerator');
const { renderInvoiceEmail } = require('./emails/InvoiceEmail');
const { renderRequestMoneyEmail } = require('./emails/RequestMoneyEmail');
const { renderForgotPasswordEmail } = require('./emails/ForgotPasswordEmail');

// Central email dispatcher — use this for all new email sends
const EmailService = require('./services/EmailService');

const resend = new Resend(process.env.RESEND_API_KEY);
if (process.env.RESEND_API_KEY) {
    console.log('[Resend] API Key loaded successfully');
} else {
    console.warn('[Resend] Warning: RESEND_API_KEY is missing');
}

// Canonical sender — all emails use the verified flapabay.com domain
const EMAIL_FROM = process.env.RESEND_FROM
    ? `FlapaPay <${process.env.RESEND_FROM}>`
    : 'FlapaPay <noreply@flapabay.com>';

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

// Fallback rates (USD base) updated periodically — used when live API is unavailable
const FX_FALLBACK_RATES_USD = {
    USD: 1, ZMW: 19.54, NGN: 1605.0, EUR: 0.9215, GBP: 0.7880,
    KES: 129.50, TZS: 2640.0, UGX: 3720.0, GHS: 15.80, ZAR: 18.42,
    RWF: 1310.0, MWK: 1730.0, BWP: 13.65, NAD: 18.42, SZL: 18.42,
};

const getFallbackRates = (baseCurrency) => {
    const baseToUSD = FX_FALLBACK_RATES_USD[baseCurrency];
    if (!baseToUSD) return null;
    const rates = {};
    for (const [cur, rate] of Object.entries(FX_FALLBACK_RATES_USD)) {
        rates[cur] = rate / baseToUSD;
    }
    return rates;
};

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
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`, { timeout: 5000 });

        if (response.data.result === 'success') {
            const rates = response.data.conversion_rates;
            FX_CACHE.set(baseCurrency, { rates, timestamp: now });
            return rates;
        }
        throw new Error('Exchange rate API returned non-success');
    } catch (err) {
        console.warn(`[FX] Live rate fetch failed for ${baseCurrency}: ${err.message}. Using fallback rates.`);
        // Return stale cache if available, otherwise use fallback
        if (FX_CACHE.has(baseCurrency)) {
            return FX_CACHE.get(baseCurrency).rates;
        }
        const fallback = getFallbackRates(baseCurrency);
        if (fallback) return fallback;
        throw new Error(`Unsupported base currency: ${baseCurrency}`);
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

// Override Express 5's strict default CSP with production-ready policy
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://js.stripe.com https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://www.flapapay.com wss://www.flapapay.com https://api.stripe.com https://api.stripe.com https://cloudflareinsights.com",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "worker-src 'self' blob:",
        "media-src 'self' blob:",
    ].join('; '));
    next();
});

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

// --- CyberSource: get or create TMS customer token for a FlapaPay user ---
const getOrCreateCybersourceCustomer = async (userId, email, name = '') => {
    try {
        const userRes = await pool.query('SELECT cybersource_customer_id FROM users WHERE id = $1', [userId]);
        let customerId = userRes.rows[0]?.cybersource_customer_id;
        if (!customerId) {
            customerId = await CybersourceService.tokens.createCustomer({ userId, email, name });
            await pool.query('UPDATE users SET cybersource_customer_id = $1 WHERE id = $2', [customerId, userId]);
        }
        return customerId;
    } catch (err) {
        console.error('[CyberSource] getOrCreateCybersourceCustomer error:', err.message);
        throw err;
    }
};

// --- Schema Initialization ---
const ensureSchema = async () => {
    try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS cybersource_customer_id VARCHAR(255)');
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

        // Test/Live wallet and ledger separation
        await pool.query('ALTER TABLE wallets ADD COLUMN IF NOT EXISTS livemode BOOLEAN DEFAULT TRUE');
        await pool.query('ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS livemode BOOLEAN DEFAULT TRUE');
        // Create test wallets for users who only have live wallets
        await pool.query(`
            INSERT INTO wallets (user_id, currency, balance, status, livemode)
            SELECT DISTINCT w.user_id, w.currency, 0.00, 'ACTIVE', FALSE
            FROM wallets w
            WHERE w.livemode = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM wallets tw
                WHERE tw.user_id = w.user_id
                AND tw.currency = w.currency
                AND tw.livemode = FALSE
            )
        `);

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
                amount DECIMAL(15, 2),
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
                mode VARCHAR(50) DEFAULT 'payment',
                subscription_data JSONB,
                customer_id UUID,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query('ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS application_fee_amount DECIMAL(15, 2)');
        await pool.query('ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS transfer_data JSONB');
        await pool.query('ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS payment_intent VARCHAR(255)');
        await pool.query('ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT \'payment\'');
        await pool.query('ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS subscription_data JSONB');
        await pool.query('ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS customer_id UUID');

        // Create Products Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                metadata JSONB DEFAULT '{}',
                status VARCHAR(50) DEFAULT 'active',
                merchant_id UUID REFERENCES merchants(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // Create Prices Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS prices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID REFERENCES products(id) ON DELETE CASCADE,
                amount NUMERIC NOT NULL,
                currency VARCHAR(10) NOT NULL,
                interval VARCHAR(50) NOT NULL,
                billing_interval VARCHAR(50) NOT NULL,
                interval_count INTEGER DEFAULT 1,
                trial_days INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // Create Customers Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                stripe_id VARCHAR(255),
                merchant_id UUID REFERENCES merchants(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(email, merchant_id)
            )
        `);

        // Create Subscriptions Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID REFERENCES customers(id),
                price_id UUID REFERENCES prices(id),
                status VARCHAR(50) DEFAULT 'incomplete', -- active, canceled, incomplete
                current_period_start TIMESTAMP WITH TIME ZONE,
                current_period_end TIMESTAMP WITH TIME ZONE,
                stripe_subscription_id VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // Create Sub Invoice Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sub_invoice (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                subscription_id UUID REFERENCES subscriptions(id),
                customer_id UUID REFERENCES customers(id),
                amount NUMERIC NOT NULL,
                currency VARCHAR(10) NOT NULL,
                status VARCHAR(50) DEFAULT 'open', -- paid, open, void, uncollectible
                stripe_invoice_id VARCHAR(255),
                payment_intent_id VARCHAR(255),
                due_date TIMESTAMP WITH TIME ZONE,
                paid_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
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

        // Payout Schedules (Task 1.1)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payout_schedules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
                schedule VARCHAR(20) NOT NULL DEFAULT 'daily',
                min_threshold NUMERIC(12,2) NOT NULL DEFAULT 50.00,
                currency VARCHAR(10) NOT NULL DEFAULT 'ZMW',
                enabled BOOLEAN NOT NULL DEFAULT TRUE,
                next_run_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '1 day',
                last_run_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(account_id)
            )
        `);

        // Payout Retry Log (Task 1.2)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payout_retry_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                transfer_id UUID NOT NULL,
                account_id UUID NOT NULL,
                amount NUMERIC(12,2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                payout_method JSONB,
                attempt INTEGER NOT NULL DEFAULT 1,
                error TEXT,
                next_retry_at TIMESTAMP,
                resolved BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Webhook Endpoints (Task 1.4)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS webhook_endpoints (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                events TEXT[] NOT NULL DEFAULT ARRAY['*'],
                signing_secret VARCHAR(64) NOT NULL,
                enabled BOOLEAN NOT NULL DEFAULT TRUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Webhook Delivery Log (Task 1.4)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS webhook_deliveries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
                event VARCHAR(100) NOT NULL,
                payload TEXT,
                response_status INTEGER,
                response_body TEXT,
                delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add metadata column to transfers if missing
        await pool.query('ALTER TABLE transfers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'');

        // Phase 2: Refunds table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS refunds (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                charge_id VARCHAR(100) NOT NULL,
                merchant_id UUID NOT NULL REFERENCES merchants(id),
                amount NUMERIC(15,2) NOT NULL,
                currency VARCHAR(10) NOT NULL DEFAULT 'ZMW',
                reason VARCHAR(200),
                status VARCHAR(30) NOT NULL DEFAULT 'succeeded',
                platform_fee_reversal NUMERIC(15,2) DEFAULT 0,
                sub_merchant_reversal NUMERIC(15,2) DEFAULT 0,
                destination_merchant_id UUID REFERENCES connected_accounts(id),
                livemode BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Phase 2: Connected account API keys
        await pool.query(`
            CREATE TABLE IF NOT EXISTS connected_account_api_keys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                account_id UUID NOT NULL REFERENCES connected_accounts(id) ON DELETE CASCADE,
                key_type VARCHAR(10) NOT NULL DEFAULT 'test',
                public_key VARCHAR(100) UNIQUE NOT NULL,
                secret_key_hash VARCHAR(200) NOT NULL,
                secret_key_preview VARCHAR(20) NOT NULL,
                label VARCHAR(100) DEFAULT 'Default Key',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Phase 2: Account controls columns
        await pool.query(`
            ALTER TABLE connected_accounts
            ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
            ADD COLUMN IF NOT EXISTS max_payout_amount NUMERIC(15,2) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS platform_notes TEXT
        `);

        // Connect Platform Configuration
        await pool.query(`
            CREATE TABLE IF NOT EXISTS connect_config (
                merchant_id UUID PRIMARY KEY REFERENCES merchants(id),
                platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 2.50,
                fee_collection_method VARCHAR(30) NOT NULL DEFAULT 'per_transaction',
                settlement_delay_days INTEGER NOT NULL DEFAULT 1,
                min_payout_threshold NUMERIC(12,2) NOT NULL DEFAULT 50.00,
                auto_payout_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                auto_payout_schedule VARCHAR(20) NOT NULL DEFAULT 'daily',
                currency VARCHAR(10) NOT NULL DEFAULT 'ZMW',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

        // ── Hosted Onboarding Links (Stripe account_links equivalent) ────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS onboarding_links (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token VARCHAR(64) UNIQUE NOT NULL,
                platform_merchant_id UUID REFERENCES merchants(id),
                account_id UUID REFERENCES connected_accounts(id),
                return_url TEXT,
                refresh_url TEXT,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                platform_name VARCHAR(255),
                platform_logo_url TEXT,
                platform_color VARCHAR(20) DEFAULT '#f97316',
                partial_data JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ── OTP Verifications ─────────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                onboarding_token VARCHAR(64) NOT NULL,
                purpose VARCHAR(50) NOT NULL,
                recipient VARCHAR(255) NOT NULL,
                code_hash VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                verified_at TIMESTAMP,
                attempts INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_otp_token_purpose ON otp_verifications (onboarding_token, purpose)`);

        // ── connect_invites (if not yet created) ─────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS connect_invites (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token VARCHAR(64) UNIQUE NOT NULL,
                platform_merchant_id UUID REFERENCES merchants(id),
                email VARCHAR(255),
                business_name VARCHAR(255),
                status VARCHAR(20) DEFAULT 'pending',
                used_by UUID REFERENCES connected_accounts(id),
                used_at TIMESTAMP,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ── Unclaimed Payments (Pay Anyone / PayPal-style escrow) ─────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS unclaimed_payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES users(id),
                debit_wallet_id UUID NOT NULL REFERENCES wallets(id),
                recipient_email VARCHAR(255) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                currency VARCHAR(10) NOT NULL,
                description TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                claim_token VARCHAR(64) UNIQUE NOT NULL,
                transaction_reference VARCHAR(64),
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                claimed_at TIMESTAMP,
                credited_wallet_id UUID REFERENCES wallets(id)
            )
        `);
        await pool.query(`ALTER TABLE unclaimed_payments ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(64)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_unclaimed_email ON unclaimed_payments (recipient_email, status)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_unclaimed_token ON unclaimed_payments (claim_token)`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_instruments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                cybersource_customer_id VARCHAR(255) NOT NULL,
                cybersource_instrument_id VARCHAR(255) NOT NULL UNIQUE,
                cybersource_identifier_id VARCHAR(255),
                last4 VARCHAR(4),
                brand VARCHAR(20),
                exp_month VARCHAR(2),
                exp_year VARCHAR(4),
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW()
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
    if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

    try {
        const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) return res.status(409).json({ error: 'User already exists' });

        const passwordHash = await bcrypt.hash(password, 12);
        const pinHash = (pin && pin.length === 4) ? await bcrypt.hash(pin, 12) : null;

        // Handle new registration fields (firstName, lastName, phone)
        const fullNameStr = fullName || (req.body.firstName && req.body.lastName ? `${req.body.firstName} ${req.body.lastName}` : '');
        const phone = req.body.phone || '';

        const regClient = await pool.connect();
        try {
            await regClient.query('BEGIN');

            const userResult = await regClient.query(
                `INSERT INTO users (email, password_hash, pin_hash, full_name, phone, email_verified, created_at)
                 VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING id, email, full_name`,
                [email, passwordHash, pinHash, fullNameStr, phone]
            );
            const user = userResult.rows[0];

            // Create default live and test wallets
            const zmwLive = (await regClient.query(`INSERT INTO wallets (user_id, currency, balance, livemode) VALUES ($1, 'ZMW', 0.00, true) RETURNING id`, [user.id])).rows[0];
            const usdLive = (await regClient.query(`INSERT INTO wallets (user_id, currency, balance, livemode) VALUES ($1, 'USD', 0.00, true) RETURNING id`, [user.id])).rows[0];
            await regClient.query(`INSERT INTO wallets (user_id, currency, balance, livemode) VALUES ($1, 'ZMW', 0.00, false)`, [user.id]);
            await regClient.query(`INSERT INTO wallets (user_id, currency, balance, livemode) VALUES ($1, 'USD', 0.00, false)`, [user.id]);

            const walletMap = { ZMW: zmwLive.id, USD: usdLive.id };

            // ── Auto-credit any unclaimed payments waiting for this email ──────
            const pendingPayments = await regClient.query(
                `SELECT * FROM unclaimed_payments WHERE recipient_email = $1 AND status = 'PENDING' AND expires_at > NOW()`,
                [email.toLowerCase().trim()]
            );

            const creditedPayments = [];
            for (const p of pendingPayments.rows) {
                const targetWalletId = walletMap[p.currency];
                if (!targetWalletId) continue; // currency not supported yet — skip

                // Credit new user's wallet
                await regClient.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [p.amount, targetWalletId]);

                // Complete the ledger entry — fill in credit_wallet_id and mark COMPLETED
                if (p.transaction_reference) {
                    await regClient.query(
                        `UPDATE ledger_entries
                         SET credit_wallet_id = $1, status = 'COMPLETED'
                         WHERE transaction_reference = $2 AND transaction_type = 'UNCLAIMED_TRANSFER'`,
                        [targetWalletId, p.transaction_reference]
                    );
                }

                // Mark unclaimed payment as claimed
                await regClient.query(
                    `UPDATE unclaimed_payments SET status = 'CLAIMED', claimed_at = NOW(), credited_wallet_id = $1 WHERE id = $2`,
                    [targetWalletId, p.id]
                );
                creditedPayments.push(p);
            }

            await regClient.query('COMMIT');

            // Send credited emails (non-blocking, after commit)
            for (const p of creditedPayments) {
                const senderRes = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [p.sender_id]);
                const senderInfo = senderRes.rows[0];

                // Email new user: "your funds are here"
                renderFundsCreditedEmail({
                    recipientName: user.full_name || email,
                    senderName: senderInfo?.full_name || senderInfo?.email || 'Someone',
                    amount: parseFloat(p.amount).toFixed(2),
                    currency: p.currency,
                }).then(html => {
                    resend.emails.send({
                        from: EMAIL_FROM,
                        to: [email],
                        subject: `Your funds are here — ${p.currency} ${parseFloat(p.amount).toFixed(2)} credited to your wallet`,
                        html,
                    }).catch(e => console.error('Failed to send credited email:', e));
                });

                // Notify sender that payment was claimed
                if (senderInfo) {
                    resend.emails.send({
                        from: EMAIL_FROM,
                        to: [senderInfo.email],
                        subject: `Your payment of ${p.currency} ${parseFloat(p.amount).toFixed(2)} was claimed by ${email}`,
                        html: `<p>Hello ${senderInfo.full_name || 'there'},</p>
                               <p>Your pending payment of <strong>${p.currency} ${parseFloat(p.amount).toFixed(2)}</strong> to <strong>${email}</strong> has been claimed. The funds have been credited to their new FlapaPay wallet.</p>
                               <p>— The FlapaPay Team</p>`,
                    }).catch(e => console.error('Failed to send sender claim notification:', e));
                }
            }

            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

            res.status(201).json({
                message: 'User registered successfully',
                user,
                token,
                creditedPayments: creditedPayments.length,
            });

        } catch (regErr) {
            await regClient.query('ROLLBACK');
            throw regErr;
        } finally {
            regClient.release();
        }
    } catch (err) {
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

        // No PIN set — issue a full token directly
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                defaultPaymentMethodId: user.default_payment_method_id,
                avatarUrl: user.avatar_url,
                hasPin: false
            },
            token
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
        const walletsResult = await pool.query('SELECT id, currency, balance FROM wallets WHERE user_id = $1 AND livemode = TRUE', [req.user.id]);
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
            from: EMAIL_FROM,
            to: [user.email],
            subject: 'Reset your FlapaPay password',
            html: await renderForgotPasswordEmail({
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
        const isTestMode = req.query.mode === 'test';
        const result = await pool.query(
            'SELECT * FROM wallets WHERE user_id = $1 AND livemode = $2 ORDER BY currency',
            [req.user.id, !isTestMode]
        );
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
                    from: EMAIL_FROM,
                    to: [sender.email],
                    subject: `Transfer Successful: ${currency} ${amount} sent to ${receiver.full_name}`,
                    html: await renderTransferEmail({
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
                    from: EMAIL_FROM,
                    to: [receiver.email],
                    subject: `You received ${currency} ${amount} from ${sender.full_name}`,
                    html: await renderTransferEmail({
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
                    from: EMAIL_FROM,
                    to: [sender.email],
                    subject: `Card Transfer Successful: ${currency} ${amount} sent to ${receiver.full_name}`,
                    html: await renderTransferEmail({
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
                    from: EMAIL_FROM,
                    to: [receiver.email],
                    subject: `You received ${currency} ${amount} from ${sender.full_name}`,
                    html: await renderTransferEmail({
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

// ─────────────────────────────────────────────────────────────────────────────
// PAY ANYONE — Unclaimed / Escrow Payments
// ─────────────────────────────────────────────────────────────────────────────

// POST /payments/transfer-to-unregistered
// Deducts funds from sender, creates unclaimed_payment record, sends claim email
app.post('/payments/transfer-to-unregistered', authenticateToken, async (req, res) => {
    const { debitWalletId, recipientEmail, amount, currency, description, pin } = req.body;

    if (!debitWalletId || !recipientEmail || !amount || !currency) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!recipientEmail.includes('@')) {
        return res.status(400).json({ error: 'Invalid recipient email' });
    }
    if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    // Verify PIN
    const isPinValid = await verifyUserPin(req.user.id, pin);
    if (!isPinValid) return res.status(401).json({ error: 'Invalid security PIN' });

    // Double-check recipient is actually not registered
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [recipientEmail.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Recipient already has a FlapaPay account. Use the standard transfer.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const walletRes = await client.query(
            'SELECT balance, currency FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE',
            [debitWalletId, req.user.id]
        );
        if (walletRes.rows.length === 0) throw new Error('Source wallet not found or access denied');

        const sourceWallet = walletRes.rows[0];
        if (sourceWallet.currency !== currency) throw new Error('Currency mismatch');

        const feeRate = 0.01;
        const fee = parseFloat((parseFloat(amount) * feeRate).toFixed(2));
        const totalDeduction = parseFloat(amount) + fee;

        if (parseFloat(sourceWallet.balance) < totalDeduction) {
            throw new Error(`Insufficient funds. Required: ${totalDeduction.toFixed(2)} ${currency} (incl. ${fee.toFixed(2)} fee)`);
        }

        // Generate ref first — used in both ledger and unclaimed_payments
        const ref = 'UC-' + crypto.randomBytes(8).toString('hex').toUpperCase();

        // 1. Ledger entry — PENDING, debit side only (credit_wallet_id filled on claim)
        await client.query(
            `INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, amount, currency, description, transaction_type, status)
             VALUES ($1, $2, $3, $4, $5, 'UNCLAIMED_TRANSFER', 'PENDING')`,
            [ref, debitWalletId, parseFloat(amount), currency, description || `Unclaimed transfer to ${recipientEmail.toLowerCase().trim()}`]
        );

        // 2. Deduct from sender wallet (amount + fee)
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [totalDeduction, debitWalletId]);

        // 3. Record fee
        await recordFee(client, ref + '-FEE', fee, currency, 'Unclaimed Transfer Fee');

        // 4. Create unclaimed payment record — stores the ledger ref for later claim update
        const claimToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await client.query(
            `INSERT INTO unclaimed_payments (id, sender_id, debit_wallet_id, recipient_email, amount, fee, currency, description, status, claim_token, transaction_reference, expires_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9, $10)`,
            [req.user.id, debitWalletId, recipientEmail.toLowerCase().trim(), parseFloat(amount), fee, currency, description || null, claimToken, ref, expiresAt]
        );

        await client.query('COMMIT');

        // Send emails (non-blocking)
        const sender = req.user;
        const expiresAtStr = expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const claimUrl = `${process.env.APP_URL || 'http://localhost:5173'}/claim/${claimToken}`;

        // Email to recipient
        renderClaimFundsEmail({
            senderName: sender.full_name || sender.email,
            amount: parseFloat(amount).toFixed(2),
            currency,
            description: description || null,
            claimUrl,
            expiresAt: expiresAtStr,
        }).then(html => {
            resend.emails.send({
                from: EMAIL_FROM,
                to: [recipientEmail.toLowerCase().trim()],
                subject: `You've received ${currency} ${parseFloat(amount).toFixed(2)} from ${sender.full_name || sender.email} — Claim on FlapaPay`,
                html,
            }).catch(e => console.error('Failed to send claim email:', e));
        });

        // Confirmation email to sender
        renderPendingPaymentConfirmEmail({
            senderName: sender.full_name || sender.email,
            recipientEmail: recipientEmail.toLowerCase().trim(),
            amount: parseFloat(amount).toFixed(2),
            currency,
            description: description || null,
            reference: ref,
            expiresAt: expiresAtStr,
        }).then(html => {
            resend.emails.send({
                from: EMAIL_FROM,
                to: [sender.email],
                subject: `Payment pending: ${currency} ${parseFloat(amount).toFixed(2)} to ${recipientEmail} — waiting to be claimed`,
                html,
            }).catch(e => console.error('Failed to send sender pending email:', e));
        });

        res.json({
            message: 'Payment sent. Recipient will be emailed to claim it.',
            reference: ref,
            status: 'PENDING',
            recipientEmail: recipientEmail.toLowerCase().trim(),
            expiresAt: expiresAt.toISOString(),
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Transfer to unregistered error:', err);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /payments/claim/:token  — public, no auth
// Returns payment details for the claim landing page
app.get('/payments/claim/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const result = await pool.query(
            `SELECT up.id, up.amount, up.fee, up.currency, up.description, up.status,
                    up.expires_at, up.created_at, up.recipient_email,
                    u.full_name AS sender_name
             FROM unclaimed_payments up
             JOIN users u ON up.sender_id = u.id
             WHERE up.claim_token = $1`,
            [token]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });

        const p = result.rows[0];

        if (p.status === 'CLAIMED') {
            return res.json({ status: 'CLAIMED', message: 'These funds have already been collected.' });
        }
        if (p.status === 'EXPIRED' || p.status === 'CANCELLED') {
            return res.json({ status: p.status, message: 'This payment link has expired. The sender has been refunded.' });
        }
        if (new Date(p.expires_at) < new Date()) {
            return res.json({ status: 'EXPIRED', message: 'This payment link has expired. The sender has been refunded.' });
        }

        res.json({
            status: 'PENDING',
            amount: p.amount,
            fee: p.fee,
            currency: p.currency,
            description: p.description,
            senderName: p.sender_name,
            recipientEmail: p.recipient_email,
            expiresAt: p.expires_at,
            createdAt: p.created_at,
        });
    } catch (err) {
        console.error('Claim lookup error:', err);
        res.status(500).json({ error: 'Failed to retrieve payment' });
    }
});

// POST /payments/expire-unclaimed  — internal scheduler endpoint
// Expires payments past their expiry date and refunds senders
app.post('/payments/expire-unclaimed', async (req, res) => {
    // Only allow internal calls (localhost or admin secret)
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET && req.hostname !== 'localhost') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const client = await pool.connect();
    try {
        const expired = await client.query(
            `SELECT up.*, u.email AS sender_email, u.full_name AS sender_name
             FROM unclaimed_payments up
             JOIN users u ON up.sender_id = u.id
             WHERE up.status = 'PENDING' AND up.expires_at < NOW()`
        );

        let refunded = 0;
        for (const p of expired.rows) {
            try {
                await client.query('BEGIN');
                // Refund: return amount + fee to sender wallet
                const refundAmount = parseFloat(p.amount) + parseFloat(p.fee);
                await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [refundAmount, p.debit_wallet_id]);
                await client.query(`UPDATE unclaimed_payments SET status = 'EXPIRED' WHERE id = $1`, [p.id]);
                await client.query('COMMIT');

                // Send expiry email to sender (non-blocking)
                renderPaymentExpiredEmail({
                    senderName: p.sender_name || p.sender_email,
                    recipientEmail: p.recipient_email,
                    amount: parseFloat(p.amount).toFixed(2),
                    currency: p.currency,
                    reference: p.id,
                }).then(html => {
                    resend.emails.send({
                        from: EMAIL_FROM,
                        to: [p.sender_email],
                        subject: `Payment expired — ${p.currency} ${parseFloat(p.amount).toFixed(2)} refunded to your wallet`,
                        html,
                    }).catch(e => console.error('Failed to send expiry email:', e));
                });

                refunded++;
            } catch (innerErr) {
                await client.query('ROLLBACK');
                console.error(`Failed to expire payment ${p.id}:`, innerErr);
            }
        }

        res.json({ message: `Expired and refunded ${refunded} payment(s).`, count: refunded });
    } catch (err) {
        console.error('Expire unclaimed error:', err);
        res.status(500).json({ error: 'Failed to run expiry job' });
    } finally {
        client.release();
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
            WHERE w.user_id = $1 AND le.transaction_type != 'FEE' AND w.livemode = TRUE AND le.livemode = TRUE
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
        // CyberSource Flex Microform replaces Stripe Setup Intent for card linking
        const targetOrigin = req.headers.origin || process.env.CYBERSOURCE_FLEX_TARGET_ORIGIN || 'http://localhost:5173';
        const captureContext = await CybersourceService.flex.getCaptureContext(targetOrigin);
        const csCustomerId   = await getOrCreateCybersourceCustomer(req.user.id, req.user.email, req.user.full_name || '');
        res.json({ captureContext, customerId: csCustomerId });
    } catch (err) {
        console.error('[CyberSource] Setup context error:', err.message);
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
        if (result.rows.length === 0 && query.includes('@')) {
            // Email-like query with no match — return a placeholder so the UI can offer "Pay Anyway"
            return res.json([{ id: null, email: query.toLowerCase().trim(), full_name: query.toLowerCase().trim(), avatar_url: null, registered: false }]);
        }
        res.json(result.rows.map(r => ({ ...r, registered: true })));
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// GET /users/recent-recipients — people the current user has sent money to, most recent first
app.get('/users/recent-recipients', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT ON (u.id)
                u.id,
                u.email,
                u.full_name,
                u.avatar_url,
                le.created_at AS last_sent_at
             FROM ledger_entries le
             JOIN wallets debit_w  ON le.debit_wallet_id  = debit_w.id
             JOIN wallets credit_w ON le.credit_wallet_id = credit_w.id
             JOIN users u          ON credit_w.user_id    = u.id
             WHERE debit_w.user_id       = $1
               AND le.transaction_type   = 'TRANSFER'
               AND le.status             = 'COMPLETED'
               AND u.id                 != $1
             ORDER BY u.id, le.created_at DESC`,
            [req.user.id]
        );

        // Sort by most recently sent-to and cap at 10
        const sorted = result.rows
            .sort((a, b) => new Date(b.last_sent_at) - new Date(a.last_sent_at))
            .slice(0, 10);

        res.json(sorted);
    } catch (err) {
        console.error('Recent recipients error:', err);
        res.status(500).json({ error: 'Failed to fetch recent recipients' });
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
            from: EMAIL_FROM,
            to: [recipientEmail],
            subject: `${req.user.full_name} requested ${currency} ${amount} via FlapaPay`,
            html: await renderRequestMoneyEmail({
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
                    from: EMAIL_FROM,
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
            from: EMAIL_FROM, // Verified domain required
            to: [invoice.client_email],
            subject: subject || `Invoice Notification: #${invoice.invoice_number} from ${merchant.business_name}`,
            html: await renderInvoiceEmail({
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
            from: EMAIL_FROM,
            to: [invoice.client_email],
            subject: `Friendly Payment Reminder: Invoice #${invoice.invoice_number}`,
            html: await renderInvoiceEmail({
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

// Deactivate / Delete a Payment Link
app.delete('/payment-links/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE payment_links SET active = false WHERE id = $1 AND user_id = $2 RETURNING id`,
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Link not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('Deactivate Link Error:', err);
        res.status(500).json({ error: 'Failed to deactivate link' });
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
                business_name: m.business_name,
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
            // Provision API keys for the new merchant
            if (typeof provisionApiKeys === 'function') {
                try { await provisionApiKeys(pool, merchantId); } catch (_) {}
            }
        }
        await pool.query('UPDATE merchants SET kyc_draft = $1 WHERE user_id = $2', [JSON.stringify(req.body.payload || {}), req.user.id]);
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

    // 1. Try API Key — detect by prefix OR by non-JWT structure (no dots = not a JWT)
    const looksLikeApiKey = tokenOrKey.startsWith('pk_') || tokenOrKey.startsWith('sk_') ||
        tokenOrKey.startsWith('flp_') || !tokenOrKey.includes('.');
    if (looksLikeApiKey) {
        try {
            const result = await pool.query(`
                SELECT k.*, m.user_id as merchant_user_id, m.id as merchant_id
                FROM api_keys k
                JOIN merchants m ON k.merchant_id = m.id
                WHERE k.key_value = $1 AND k.is_active = TRUE
            `, [tokenOrKey]);

            if (result.rows.length > 0) {
                req.merchant = result.rows[0];
                req.isTestMode = req.merchant.key_type.startsWith('test_') || req.merchant.key_type === 'test';
                return next();
            }
            // Not found as an API key — fall through to JWT attempt if it could be a JWT
            if (tokenOrKey.includes('.')) {
                // Could be a JWT — let the JWT block handle it
            } else {
                return res.status(401).json({ error: 'Invalid API Key' });
            }
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
            // Auto-provision a sandbox merchant record + API keys on first Connect access
            let newMerchantId = null;
            try {
                newMerchantId = crypto.randomUUID();
                // Get user info for a better default name
                const userRow = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [decoded.userId]);
                const defaultName = userRow.rows[0]?.full_name || userRow.rows[0]?.email?.split('@')[0] || 'My Business';
                await pool.query(
                    `INSERT INTO merchants (id, user_id, business_name, compliance_status, is_live_enabled)
                     VALUES ($1, $2, $3, 'SANDBOX_ONLY', false)`,
                    [newMerchantId, decoded.userId, defaultName]
                );
            } catch (_insertErr) {
                newMerchantId = null; // Merchant may have been created by a concurrent request
            }
            const reQuery = await pool.query(
                `SELECT m.*, m.id as merchant_id FROM merchants m WHERE m.user_id = $1`,
                [decoded.userId]
            );
            if (reQuery.rows.length === 0) {
                return res.status(401).json({ error: 'Merchant account not found. Please register at /merchant/dashboard first.' });
            }
            result.rows[0] = reQuery.rows[0];
            // Provision API keys if this is a new merchant (and provisionApiKeys is available)
            if (newMerchantId && typeof provisionApiKeys === 'function') {
                try { await provisionApiKeys(pool, result.rows[0].id || newMerchantId); } catch (_) {}
            }
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
        // ─── Risk Evaluation ──────────────────────────────────────────────────
        const transfer_data_prelim = req.body.transfer_data;
        const subMerchantIdPrelim = transfer_data_prelim?.destination || null;
        const tempChargeId = 'ch_' + crypto.randomBytes(12).toString('hex');
        const riskResult = await evaluateRisk({
            merchantId: req.merchant?.merchant_id || req.apiKey?.merchant_id,
            accountId: subMerchantIdPrelim,
            amount,
            currency,
            country: req.body.billing_country || null,
            chargeId: tempChargeId,
        });
        if (riskResult.blocked) {
            return res.status(402).json({
                error: 'Transaction blocked by risk rules',
                risk_events: riskResult.events,
                code: 'risk_blocked',
            });
        }
        // ─────────────────────────────────────────────────────────────────────

        // --- SANDBOX SIMULATION MODE ---
        // If simulated success card/number is used
        if (req.isTestMode) {

            // Validate "Simulated" Errors
            if (amount === 5001) { // Magic amount for failure
                return res.status(402).json({ error: 'Card Declined' });
            }

            // A. Create Charge Record
            const chargeId = tempChargeId;

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
            const transfer_data = req.body.transfer_data;
            const application_fee_amount = req.body.application_fee_amount;

            let platformFee = 0;
            let merchantAmount = amount;
            let subMerchantId = null;

            // Fetch settlement delay from platform config (default T+1)
            const cfgRes = await pool.query(
                `SELECT settlement_delay_days FROM connect_config WHERE merchant_id = $1`,
                [req.merchant.merchant_id]
            );
            const settlementDays = cfgRes.rows[0]?.settlement_delay_days ?? 1;
            const availableAt = new Date();
            availableAt.setDate(availableAt.getDate() + settlementDays);

            // Start atomic transaction — charge + balances + ledger all commit together
            const txClient = await pool.connect();
            try {
                await txClient.query('BEGIN');

                if (transfer_data && transfer_data.destination) {
                    subMerchantId = transfer_data.destination;

                    if (application_fee_amount != null) {
                        platformFee = application_fee_amount;
                    } else {
                        platformFee = Math.round(amount * 0.05);
                    }
                    merchantAmount = amount - platformFee;

                    console.log(`[Connect] Split: ${merchantAmount} to ${subMerchantId}, ${platformFee} to Platform (T+${settlementDays})`);

                    // 1. Credit Sub-merchant (Pending — held until available_at)
                    await txClient.query(
                        `INSERT INTO balances (merchant_id, pending_amount, currency)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (merchant_id) DO UPDATE SET pending_amount = balances.pending_amount + $2`,
                        [subMerchantId, merchantAmount, currency.toUpperCase()]
                    );

                    // 2. Credit Platform Commission (Pending)
                    await txClient.query(
                        `INSERT INTO balances (merchant_id, pending_amount, currency)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (merchant_id) DO UPDATE SET pending_amount = balances.pending_amount + $2`,
                        [req.merchant.merchant_id, platformFee, currency.toUpperCase()]
                    );

                    // 3. Record Internal Transfer
                    await txClient.query(
                        `INSERT INTO transfers (source_merchant_id, destination_merchant_id, amount, currency, type, status)
                         VALUES ($1, $2, $3, $4, 'SPLIT_PAYMENT', 'COMPLETED')`,
                        [req.merchant.merchant_id, subMerchantId, merchantAmount, currency.toUpperCase()]
                    );

                    responseData.application_fee = platformFee;
                    responseData.transfer_data = { destination: subMerchantId, amount: merchantAmount };

                    // 4. Ledger entry — INSIDE transaction (atomic)
                    if (platformFee > 0) {
                        await txClient.query(
                            `INSERT INTO connect_ledger (platform_merchant_id, entry_type, charge_id, account_id, amount, currency, direction, description, livemode)
                             VALUES ($1,'fee_collected',$2,$3,$4,$5,'credit',$6,$7)`,
                            [req.merchant.merchant_id, chargeId, subMerchantId,
                             platformFee, currency.toUpperCase(),
                             `Platform fee on ${currency.toUpperCase()} ${amount} charge`, false]
                        );
                    }
                    // 5. Ledger entry for sub-merchant earnings
                    await txClient.query(
                        `INSERT INTO connect_ledger (platform_merchant_id, entry_type, charge_id, account_id, amount, currency, direction, description, livemode)
                         VALUES ($1,'split_credit',$2,$3,$4,$5,'credit',$6,$7)`,
                        [req.merchant.merchant_id, chargeId, subMerchantId,
                         merchantAmount, currency.toUpperCase(),
                         `Net earnings on ${currency.toUpperCase()} ${amount} charge (T+${settlementDays})`, false]
                    );
                }

                // 6. Record Charge with available_at populated
                await txClient.query(
                    `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details,
                                         description, metadata, livemode, destination_merchant_id, application_fee_amount,
                                         available_at, is_settled)
                     VALUES ($1,$2,$3,$4,'succeeded',$5,$6,$7,$8,$9,$10,$11,$12,false)`,
                    [
                        chargeId, req.merchant.merchant_id, amount, currency.toUpperCase(),
                        source.startsWith('tok_') ? 'card' : 'mobile_money',
                        JSON.stringify(responseData.source.details),
                        description, JSON.stringify(req.body.metadata || {}), false,
                        subMerchantId || null, platformFee || null, availableAt
                    ]
                );

                await txClient.query('COMMIT');
            } catch (txErr) {
                await txClient.query('ROLLBACK');
                throw txErr;
            } finally {
                txClient.release();
            }

            // E. Dispatch Webhooks (Background — after commit)
            dispatchWebhook(req.merchant.merchant_id, 'charge.succeeded', responseData);
            if (subMerchantId) {
                dispatchWebhook(req.merchant.merchant_id, 'transaction.split.created', {
                    charge_id: chargeId,
                    total_amount: amount,
                    currency: currency.toUpperCase(),
                    platform_fee: platformFee,
                    sub_merchant_amount: merchantAmount,
                    sub_merchant_id: subMerchantId,
                    available_at: availableAt.toISOString(),
                    settlement_days: settlementDays
                });
            }

            return res.json(responseData);
        }

        // --- PRODUCTION LOGIC (Simulation Mode) ---
        // For physical sandbox testing, we reuse the simulation logic but with livemode = true
        const chargeId = 'ch_live_' + tempChargeId.slice(3); // reuse entropy from risk eval
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

        const transfer_data = req.body.transfer_data;
        const application_fee_amount = req.body.application_fee_amount;

        let platformFee = 0;
        let merchantAmount = amount;
        let subMerchantId = null;

        // Fetch settlement delay from platform config (default T+1)
        const cfgResLive = await pool.query(
            `SELECT settlement_delay_days FROM connect_config WHERE merchant_id = $1`,
            [req.merchant.merchant_id]
        );
        const settlementDaysLive = cfgResLive.rows[0]?.settlement_delay_days ?? 1;
        const availableAtLive = new Date();
        availableAtLive.setDate(availableAtLive.getDate() + settlementDaysLive);

        // Start atomic transaction — charge + balances + ledger all commit together
        const txClientLive = await pool.connect();
        try {
            await txClientLive.query('BEGIN');

            if (transfer_data && transfer_data.destination) {
                subMerchantId = transfer_data.destination;
                // Phase 3/4: per-account override → tiered schedule → platform config → 5% default
                if (application_fee_amount != null) {
                    platformFee = application_fee_amount;
                } else {
                    const overrideRes = await pool.query(
                        `SELECT fee_percent FROM connected_account_fee_overrides WHERE account_id = $1`,
                        [subMerchantId]
                    );
                    if (overrideRes.rows.length > 0) {
                        platformFee = Math.round(amount * (parseFloat(overrideRes.rows[0].fee_percent) / 100) * 100) / 100;
                    } else {
                        // Phase 4: tiered fee — get sub-merchant's cumulative volume
                        const tiersRes = await pool.query(
                            `SELECT * FROM connect_fee_tiers WHERE platform_merchant_id = $1 ORDER BY min_volume ASC`,
                            [req.merchant?.merchant_id || null]
                        );
                        if (tiersRes.rows.length > 0) {
                            const volRes = await pool.query(
                                `SELECT COALESCE(SUM(amount),0) as vol FROM charges WHERE destination_merchant_id = $1 AND status='succeeded'`,
                                [subMerchantId]
                            );
                            const cumVol = parseFloat(volRes.rows[0].vol);
                            const tier = tiersRes.rows.slice().reverse().find(t => cumVol >= parseFloat(t.min_volume));
                            const feeRate = tier ? parseFloat(tier.fee_percent) / 100 : 0.05;
                            platformFee = Math.round(amount * feeRate * 100) / 100;
                        } else {
                            const configRes = await pool.query(
                                `SELECT platform_fee_percent FROM connect_config WHERE merchant_id = $1`,
                                [req.merchant?.merchant_id || null]
                            );
                            const feeRate = configRes.rows.length > 0 ? parseFloat(configRes.rows[0].platform_fee_percent) / 100 : 0.05;
                            platformFee = Math.round(amount * feeRate * 100) / 100;
                        }
                    }
                }
                merchantAmount = amount - platformFee;

                console.log(`[Connect Live] Split: ${merchantAmount} to ${subMerchantId}, ${platformFee} to Platform (T+${settlementDaysLive})`);

                // 1. Credit Sub-merchant (Pending — held until available_at)
                await txClientLive.query(
                    `INSERT INTO balances (merchant_id, pending_amount, currency)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (merchant_id) DO UPDATE SET pending_amount = balances.pending_amount + $2`,
                    [subMerchantId, merchantAmount, currency.toUpperCase()]
                );

                // 2. Credit Platform Commission (Pending)
                await txClientLive.query(
                    `INSERT INTO balances (merchant_id, pending_amount, currency)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (merchant_id) DO UPDATE SET pending_amount = balances.pending_amount + $2`,
                    [req.merchant.merchant_id, platformFee, currency.toUpperCase()]
                );

                // 3. Record Internal Transfer
                await txClientLive.query(
                    `INSERT INTO transfers (source_merchant_id, destination_merchant_id, amount, currency, type, status)
                     VALUES ($1, $2, $3, $4, 'SPLIT_PAYMENT', 'COMPLETED')`,
                    [req.merchant.merchant_id, subMerchantId, merchantAmount, currency.toUpperCase()]
                );

                responseData.application_fee = platformFee;
                responseData.transfer_data = { destination: subMerchantId, amount: merchantAmount };

                // 4. Ledger entry for platform fee — INSIDE transaction (atomic)
                if (platformFee > 0) {
                    await txClientLive.query(
                        `INSERT INTO connect_ledger (platform_merchant_id, entry_type, charge_id, account_id, amount, currency, direction, description, livemode)
                         VALUES ($1,'fee_collected',$2,$3,$4,$5,'credit',$6,$7)`,
                        [req.merchant.merchant_id, chargeId, subMerchantId,
                         platformFee, currency.toUpperCase(),
                         `Platform fee on ${currency.toUpperCase()} ${amount} charge`, true]
                    );
                }
                // 5. Ledger entry for sub-merchant earnings
                await txClientLive.query(
                    `INSERT INTO connect_ledger (platform_merchant_id, entry_type, charge_id, account_id, amount, currency, direction, description, livemode)
                     VALUES ($1,'split_credit',$2,$3,$4,$5,'credit',$6,$7)`,
                    [req.merchant.merchant_id, chargeId, subMerchantId,
                     merchantAmount, currency.toUpperCase(),
                     `Net earnings on ${currency.toUpperCase()} ${amount} charge (T+${settlementDaysLive})`, true]
                );
            } else {
                // Direct Credit (no split) — credit available immediately
                await txClientLive.query(
                    `INSERT INTO balances (merchant_id, available_amount, currency)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (merchant_id) DO UPDATE SET available_amount = balances.available_amount + $2`,
                    [req.merchant.merchant_id, amount, currency.toUpperCase()]
                );
            }

            // 6. Record Charge with available_at populated
            await txClientLive.query(
                `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details,
                                     description, metadata, livemode, destination_merchant_id, application_fee_amount,
                                     available_at, is_settled)
                 VALUES ($1,$2,$3,$4,'succeeded',$5,$6,$7,$8,$9,$10,$11,$12,false)`,
                [
                    chargeId, req.merchant.merchant_id, amount, currency.toUpperCase(),
                    source.startsWith('tok_') ? 'card' : 'mobile_money',
                    JSON.stringify(responseData.source.details),
                    description, JSON.stringify(req.body.metadata || {}), true,
                    subMerchantId || null, platformFee || null, availableAtLive
                ]
            );

            await txClientLive.query('COMMIT');
        } catch (txErr) {
            await txClientLive.query('ROLLBACK');
            throw txErr;
        } finally {
            txClientLive.release();
        }

        // Dispatch Webhooks (Background — after commit)
        dispatchWebhook(req.merchant.merchant_id, 'charge.succeeded', responseData);
        if (subMerchantId) {
            dispatchWebhook(req.merchant.merchant_id, 'transaction.split.created', {
                charge_id: chargeId,
                total_amount: amount,
                currency: currency.toUpperCase(),
                platform_fee: platformFee,
                sub_merchant_amount: merchantAmount,
                sub_merchant_id: subMerchantId,
                available_at: availableAtLive.toISOString(),
                settlement_days: settlementDaysLive
            });
        }
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

// Transfer to Personal Wallet (no fee, test/live wallet separation)
app.post('/merchants/transfer-to-wallet', authenticateToken, async (req, res) => {
    const { amount, walletId, applyFX, fxRate, isTestMode } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const merchantRes = await client.query(
            'SELECT id, compliance_status FROM merchants WHERE user_id = $1',
            [req.user.id]
        );
        if (merchantRes.rows.length === 0) throw new Error('Merchant not found');
        const merchant = merchantRes.rows[0];
        const isLive = merchant.compliance_status === 'ACTIVE' && !isTestMode;

        // Resolve target wallet — must match livemode
        const walletQuery = await client.query(
            'SELECT id, currency, livemode FROM wallets WHERE id = $1 AND user_id = $2 AND livemode = $3',
            [walletId, req.user.id, isLive]
        );
        if (walletQuery.rows.length === 0) throw new Error('Target wallet not found or mode mismatch');
        const targetWallet = walletQuery.rows[0];

        // amount sent from frontend is in ZMW; balances table stores ngwe (× 100)
        const amountZMW = parseFloat(amount);
        const amountNgwe = Math.round(amountZMW * 100);
        const targetAmount = applyFX ? amountZMW / fxRate : amountZMW;

        if (isLive) {
            // Deduct ngwe from platform balance
            const balanceRes = await client.query(
                'SELECT available_amount FROM balances WHERE merchant_id = $1 FOR UPDATE',
                [merchant.id]
            );
            const available = parseFloat(balanceRes.rows[0]?.available_amount || 0);
            if (available < amountNgwe) throw new Error(`Insufficient balance. Available: ZMW ${(available / 100).toFixed(2)}`);

            await client.query(
                'UPDATE balances SET available_amount = available_amount - $1, updated_at = NOW() WHERE merchant_id = $2',
                [amountNgwe, merchant.id]
            );
        }
        // Test mode: no real balance deduction (simulated earnings only)

        // Credit the ZMW amount to the target wallet
        await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [targetAmount, walletId]);

        // Record ledger entry — livemode flag keeps test entries out of live ledger
        const ref = (isLive ? 'SETTLE-' : 'TEST-SETTLE-') + crypto.randomBytes(6).toString('hex').toUpperCase();
        await client.query(
            `INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status, livemode)
             VALUES ($1, $2, $3, $4, $5, 'SETTLEMENT', 'COMPLETED', $6)`,
            [ref, walletId, targetAmount, targetWallet.currency, isLive ? 'Settlement from Platform Balance' : 'Test Settlement (Simulated)', isLive]
        );

        await client.query('COMMIT');
        res.json({ success: true, transferred: targetAmount, currency: targetWallet.currency, ref });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ---- GET /merchants/test-ledger ----
// Returns test wallet ledger entries (livemode=false) for the merchant user — never mingles with live funds
app.get('/merchants/test-ledger', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const result = await pool.query(
            `SELECT le.id, le.transaction_reference, le.amount, le.currency,
                    le.description, le.transaction_type, le.status, le.created_at,
                    le.credit_wallet_id, le.debit_wallet_id,
                    cw.currency AS credit_currency, dw.currency AS debit_currency
             FROM ledger_entries le
             LEFT JOIN wallets cw ON le.credit_wallet_id = cw.id
             LEFT JOIN wallets dw ON le.debit_wallet_id = dw.id
             WHERE le.livemode = FALSE
               AND le.transaction_type != 'FEE'
               AND (
                   (cw.user_id = $1 AND cw.livemode = FALSE) OR
                   (dw.user_id = $1 AND dw.livemode = FALSE)
               )
             ORDER BY le.created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

        const summaryRes = await pool.query(
            `SELECT COALESCE(SUM(le.amount), 0) AS total_credited
             FROM ledger_entries le
             JOIN wallets cw ON le.credit_wallet_id = cw.id
             WHERE le.livemode = FALSE AND cw.user_id = $1 AND cw.livemode = FALSE`,
            [req.user.id]
        );

        res.json({
            entries: result.rows,
            total_credited: parseFloat(summaryRes.rows[0]?.total_credited || 0),
            count: result.rowCount
        });
    } catch (err) {
        console.error('[Test Ledger] Error:', err);
        res.status(500).json({ error: 'Failed to fetch test ledger' });
    }
});

// --- Lenco Integration (Bank Accounts) ---

// Public alias — used by the hosted onboarding page (no auth required)
app.get('/v1/connect/banks', async (req, res) => {
    const { country = 'zm' } = req.query;
    try {
        const response = await axios.get(`${LENCO_BASE_URL}/banks`, {
            params: { country },
            headers: { 'Authorization': `Bearer ${LENCO_SECRET_KEY}` }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch banks' });
    }
});

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
        const isTestMode = req.query.mode === 'test';
        const result = await pool.query(
            'SELECT * FROM wallets WHERE user_id = $1 AND livemode = $2 ORDER BY currency',
            [req.user.id, !isTestMode]
        );
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

        if (Number(wallet.balance) < Number(amount)) throw new Error('Insufficient wallet balance');

        // 2. Deduct Balance (no fee — withdrawals are free)
        await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [amount, walletId]);

        // 3. Record Payout
        const payoutRef = 'WTH-' + crypto.randomBytes(6).toString('hex').toUpperCase();
        await client.query(`
            INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, amount, currency, description, transaction_type, status)
            VALUES ($1, $2, $3, $4, $5, 'WITHDRAWAL', 'COMPLETED')`,
            [payoutRef, walletId, amount, wallet.currency, `Withdrawal to ${destinationType} (${JSON.stringify(destinationDetails)})`]
        );

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

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const walletRes = await client.query('SELECT balance FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE', [walletId, req.user.id]);
            if (walletRes.rows.length === 0) throw new Error('Wallet not found');
            if (Number(walletRes.rows[0].balance) < Number(amount)) throw new Error('Insufficient balance');

            await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [amount, walletId]);

            // Insert ledger with PENDING status - include payoutId in description for easy lookup
            await client.query(`
                INSERT INTO ledger_entries (transaction_reference, debit_wallet_id, amount, currency, description, transaction_type, status, metadata)
                VALUES ($1, $2, $3, $4, $5, 'WITHDRAWAL', 'PENDING', $6)`,
                [payoutRef, walletId, amount, currency, `PawaPay Payout to ${phoneNumber} (ID: ${payoutId})`, { payoutId, phoneNumber, provider }]
            );

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
                    // No fee — refund the exact amount deducted
                    const totalRefund = Number(origAmount);

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
                    // No fee — refund the exact amount deducted
                    const totalRefund = Number(origAmount);

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

        const account = result.rows[0];

        // Emit webhook event to platform
        setImmediate(() => emitWebhookForMerchant(req.merchant.merchant_id, 'account.created', {
            account_id: account.id,
            email: account.email,
            business_name: account.business_name,
            status: 'PENDING'
        }));

        res.json({
            id: account.id,
            object: 'account',
            type: 'custom',
            capabilities: account.capabilities,
            requirements: account.requirements
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

// Exchange client_secret for a scoped portal token (used by embedded components — no merchant auth needed)
app.post('/v1/connect/account_sessions/:secret/exchange', async (req, res) => {
    try {
        const { secret } = req.params;
        const sessionRes = await pool.query(
            `SELECT * FROM account_sessions WHERE client_secret = $1 AND expires_at > NOW()`,
            [secret]
        );
        if (sessionRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }
        const session = sessionRes.rows[0];
        const portalToken = crypto.randomBytes(48).toString('hex');
        await pool.query(
            `INSERT INTO submerchant_sessions (account_id, token, expires_at) VALUES ($1, $2, $3)`,
            [session.account_id, portalToken, session.expires_at]
        );
        res.json({
            portal_token: portalToken,
            account_id: session.account_id,
            components: session.components,
            expires_at: Math.floor(new Date(session.expires_at).getTime() / 1000)
        });
    } catch (err) {
        console.error('[SessionExchange] Error:', err.message);
        res.status(500).json({ error: 'Token exchange failed' });
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
            `SELECT ca.id, ca.business_name, ca.email, ca.status, ca.kyc_status,
                    ca.metadata, ca.created_at, ca.kyc_submitted_at,
                    COALESCE(SUM(c.amount), 0) as total_volume,
                    COALESCE(SUM(c.application_fee_amount), 0) as total_fees
             FROM connected_accounts ca
             LEFT JOIN charges c ON ca.id = c.destination_merchant_id AND c.status = 'succeeded' AND c.livemode = $2
             WHERE ca.platform_merchant_id = $1 AND ca.livemode = $2
             GROUP BY ca.id
             ORDER BY ca.created_at DESC`,
            [platformMerchantId, isLive]
        );

        res.json(result.rows.map(row => {
            // Resolve display name: prefer business_name, fall back to full_name in KYC payload
            const kycIdentity = row.metadata?.kyc_payload?.identity || {};
            const displayName = row.business_name
                || kycIdentity.business_name
                || kycIdentity.full_name
                || null;
            return {
                id: row.id,
                businessName: displayName,
                email: row.email,
                status: row.status,
                kyc_status: row.kyc_status,
                volume: parseFloat(row.total_volume).toFixed(2),
                fees: parseFloat(row.total_fees).toFixed(2),
                createdAt: row.created_at
            };
        }));
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

        const account = accountRes.rows[0];
        const kycPayload = account.metadata?.kyc_payload || {};
        const identity   = kycPayload.identity   || {};
        const contact    = kycPayload.contact     || {};
        const payout     = kycPayload.payout      || {};
        const displayName = account.business_name
            || identity.business_name
            || identity.full_name
            || account.email;

        res.json({
            volume: parseFloat(stats.total_volume).toFixed(2),
            fees: parseFloat(stats.total_fees).toFixed(2),
            net: (parseFloat(stats.total_volume) - parseFloat(stats.total_fees)).toFixed(2),
            transactionCount: parseInt(stats.count),
            balance: {
                available: parseFloat(balance.available).toFixed(2),
                pending: parseFloat(balance.pending).toFixed(2)
            },
            currency: 'ZMW',
            // Identity & profile
            display_name: displayName,
            business_name: account.business_name,
            email: account.email,
            country: account.country,
            account_type: kycPayload.business_info?.account_type || identity.account_type || null,
            // KYC
            kyc_status: account.kyc_status,
            kyc_submitted_at: account.kyc_submitted_at || null,
            kyc_rejection_reason: account.kyc_rejection_reason || null,
            identity,
            contact,
            payout_info: payout,
            // Account controls
            status: account.status,
            suspended_at: account.suspended_at || null,
            suspension_reason: account.suspension_reason || null,
            max_payout_amount: account.max_payout_amount ? parseFloat(account.max_payout_amount) : null,
            platform_notes: account.platform_notes || ''
        });
    } catch (err) {
        console.error('[Sub-merchant Stats] Error:', err);
        res.status(500).json({ error: 'Failed to fetch sub-merchant stats' });
    }
});

// 3d-2. Get Charges for a Connected Account (for refund UI)
app.get('/v1/connect/accounts/:id/charges', authenticateMerchant, async (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    try {
        const result = await pool.query(
            `SELECT id, amount, currency, status, payment_method, description, livemode,
                    application_fee_amount, created_at
             FROM charges
             WHERE destination_merchant_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [id, limit]
        );
        res.json(result.rows.map(r => ({
            ...r,
            amount: parseFloat(r.amount),
            application_fee_amount: r.application_fee_amount ? parseFloat(r.application_fee_amount) : null
        })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch charges' });
    }
});

// GET /v1/connect/charges — aggregate charges across all sub-merchants for the platform
app.get('/v1/connect/charges', authenticateMerchant, async (req, res) => {
    const merchantId = req.merchant.merchant_id;
    const { status, account_id, from, to } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const offset = parseInt(req.query.offset) || 0;
    const isTestMode = req.headers['x-flapapay-test-mode'] === 'true';

    const conditions = ['c.merchant_id = $1', `c.livemode = ${!isTestMode}`];
    const params = [merchantId];
    let p = 2;

    if (status) { conditions.push(`c.status = $${p++}`); params.push(status); }
    if (account_id) { conditions.push(`c.destination_merchant_id = $${p++}`); params.push(account_id); }
    if (from) { conditions.push(`c.created_at >= $${p++}`); params.push(from); }
    if (to) { conditions.push(`c.created_at <= $${p++}`); params.push(to + 'T23:59:59.999Z'); }

    const where = conditions.join(' AND ');
    try {
        const [dataRes, summaryRes, countRes] = await Promise.all([
            pool.query(
                `SELECT c.id, c.amount, c.currency, c.status, c.payment_method, c.description,
                        c.application_fee_amount, c.livemode, c.created_at,
                        c.destination_merchant_id AS account_id,
                        ca.business_name AS account_business_name
                 FROM charges c
                 LEFT JOIN connected_accounts ca ON ca.id = c.destination_merchant_id
                 WHERE ${where}
                 ORDER BY c.created_at DESC
                 LIMIT $${p} OFFSET $${p + 1}`,
                [...params, limit, offset]
            ),
            pool.query(
                `SELECT COALESCE(SUM(c.amount), 0) AS total_gmv,
                        COALESCE(SUM(c.application_fee_amount), 0) AS total_fees,
                        COUNT(*) AS total_count,
                        COUNT(*) FILTER (WHERE c.status = 'succeeded') AS succeeded_count,
                        COUNT(*) FILTER (WHERE c.status = 'refunded') AS refunded_count
                 FROM charges c WHERE ${where}`,
                params
            ),
            pool.query(`SELECT COUNT(*) FROM charges c WHERE ${where}`, params)
        ]);

        res.json({
            charges: dataRes.rows.map(r => ({
                ...r,
                amount: parseFloat(r.amount),
                application_fee_amount: r.application_fee_amount ? parseFloat(r.application_fee_amount) : null
            })),
            summary: {
                total_gmv: parseFloat(summaryRes.rows[0].total_gmv),
                total_fees: parseFloat(summaryRes.rows[0].total_fees),
                total_count: parseInt(summaryRes.rows[0].total_count),
                succeeded_count: parseInt(summaryRes.rows[0].succeeded_count),
                refunded_count: parseInt(summaryRes.rows[0].refunded_count),
            },
            total: parseInt(countRes.rows[0].count),
            limit,
            offset
        });
    } catch (err) {
        console.error('[Connect Charges] Error:', err);
        res.status(500).json({ error: 'Failed to fetch platform charges' });
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

// 4. Trigger Payout (Withdrawal to External Wallet) — real PawaPay + retry
app.post('/v1/connect/payouts', authenticateMerchant, async (req, res) => {
    const { account, amount, currency, destination } = req.body;
    // destination: { type: 'mobile_money', number: '260...', network: 'MTN' }
    //           or: { type: 'bank', accountNumber: '...', bankCode: '...' }

    if (!account || !amount || !destination) {
        return res.status(400).json({ error: 'Missing required fields: account, amount, destination' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Balance check (pending + available counts as liquid for Connect)
        const balRes = await client.query(
            'SELECT (pending_amount + available_amount) as total FROM balances WHERE merchant_id = $1 FOR UPDATE',
            [account]
        );

        if (balRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Account balance not found', code: 'balance_missing' });
        }

        const totalLiquidity = parseFloat(balRes.rows[0].total);
        if (totalLiquidity < parseFloat(amount)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient funds', code: 'insufficient_funds', current_balance: totalLiquidity });
        }

        // 2. Deduct balance atomically
        await client.query(
            'UPDATE balances SET pending_amount = pending_amount - $2 WHERE merchant_id = $1',
            [account, amount]
        );

        // 3. Record transfer
        const payoutId = crypto.randomUUID();
        const transferRes = await client.query(
            `INSERT INTO transfers (id, source_merchant_id, destination_merchant_id, amount, currency, type, status, metadata)
             VALUES ($1, $2, NULL, $3, $4, 'PAYOUT', 'PENDING', $5) RETURNING id`,
            [payoutId, account, amount, currency || 'ZMW', JSON.stringify({ destination })]
        );
        await client.query('COMMIT');

        // 4. Attempt real PawaPay disbursement asynchronously
        setImmediate(async () => {
            try {
                if (destination.type === 'mobile_money' && destination.number && destination.network) {
                    const correspondent = PawaPayService.networkToCorrespondent(destination.network);
                    const result = await PawaPayService.initiateConnectPayout(
                        payoutId, amount, currency || 'ZMW', destination.number, correspondent
                    );

                    if (result.status === 'ACCEPTED') {
                        await pool.query("UPDATE transfers SET status = 'PROCESSING' WHERE id = $1", [payoutId]);
                        console.log(`[Connect] Payout ${payoutId} ACCEPTED by PawaPay`);
                        // In production: PawaPay will POST callback to /webhooks/pawapay-payout
                        // For sandbox: simulate success after 3s
                        setTimeout(async () => {
                            await pool.query("UPDATE transfers SET status = 'COMPLETED' WHERE id = $1", [payoutId]);
                            await emitWebhookForMerchant(req.merchant.merchant_id, 'payout.completed', {
                                payout_id: payoutId, account_id: account, amount, currency, destination
                            });
                        }, 3000);
                    } else {
                        throw new Error(`PawaPay rejected: ${result.status}`);
                    }
                } else {
                    // Simulate for non-mobile-money or incomplete destination
                    setTimeout(async () => {
                        await pool.query("UPDATE transfers SET status = 'COMPLETED' WHERE id = $1", [payoutId]);
                        await emitWebhookForMerchant(req.merchant.merchant_id, 'payout.completed', {
                            payout_id: payoutId, account_id: account, amount, currency, destination
                        });
                    }, 2000);
                }
            } catch (pawaErr) {
                console.error(`[Connect] Payout ${payoutId} failed, queuing retry:`, pawaErr.message);
                await pool.query(
                    `INSERT INTO payout_retry_log (id, transfer_id, account_id, amount, currency, payout_method, attempt, error, next_retry_at)
                     VALUES ($1,$2,$3,$4,$5,$6,1,$7,NOW() + INTERVAL '30 minutes')`,
                    [crypto.randomUUID(), payoutId, account, amount, currency || 'ZMW', JSON.stringify(destination), pawaErr.message]
                );
                await pool.query("UPDATE transfers SET status = 'RETRY_QUEUED' WHERE id = $1", [payoutId]);
                await emitWebhookForMerchant(req.merchant.merchant_id, 'payout.initiated', {
                    payout_id: payoutId, account_id: account, amount, status: 'retry_queued'
                });
            }
        });

        res.json({
            id: payoutId,
            object: 'payout',
            amount: parseFloat(amount),
            currency: currency || 'ZMW',
            status: 'pending',
            destination
        });

    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[Connect Payout] Error:', err);
        res.status(500).json({ error: 'Payout failed' });
    } finally {
        client.release();
    }
});

// ─── PHASE 1: Payout Schedules ────────────────────────────────────────────────

// GET schedule for an account
app.get('/v1/connect/accounts/:id/schedule', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM payout_schedules WHERE account_id = $1',
            [req.params.id]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

// POST/PATCH — upsert schedule for an account
app.post('/v1/connect/accounts/:id/schedule', authenticateMerchant, async (req, res) => {
    const { schedule, min_threshold, currency, enabled } = req.body;
    const accountId = req.params.id;

    if (!['daily', 'weekly', 'monthly'].includes(schedule)) {
        return res.status(400).json({ error: 'schedule must be daily, weekly, or monthly' });
    }

    try {
        // Verify account belongs to this platform
        const acctRes = await pool.query(
            'SELECT id FROM connected_accounts WHERE id = $1 AND platform_merchant_id = $2',
            [accountId, req.merchant.merchant_id]
        );
        if (acctRes.rows.length === 0) return res.status(404).json({ error: 'Account not found' });

        // Calculate first run time
        const nextRun = schedule === 'daily'
            ? new Date(Date.now() + 86400000)
            : schedule === 'weekly'
                ? new Date(Date.now() + 7 * 86400000)
                : new Date(Date.now() + 30 * 86400000);

        const result = await pool.query(
            `INSERT INTO payout_schedules (account_id, schedule, min_threshold, currency, enabled, next_run_at)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (account_id) DO UPDATE SET
               schedule = EXCLUDED.schedule,
               min_threshold = EXCLUDED.min_threshold,
               currency = EXCLUDED.currency,
               enabled = EXCLUDED.enabled,
               next_run_at = CASE WHEN payout_schedules.enabled = FALSE AND EXCLUDED.enabled = TRUE
                                  THEN EXCLUDED.next_run_at
                                  ELSE payout_schedules.next_run_at END
             RETURNING *`,
            [accountId, schedule, min_threshold || 50, currency || 'ZMW', enabled !== false, nextRun]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Schedule Upsert] Error:', err);
        res.status(500).json({ error: 'Failed to save schedule' });
    }
});

// DELETE schedule
app.delete('/v1/connect/accounts/:id/schedule', authenticateMerchant, async (req, res) => {
    try {
        await pool.query('UPDATE payout_schedules SET enabled = FALSE WHERE account_id = $1', [req.params.id]);
        res.json({ disabled: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to disable schedule' });
    }
});

// ─── PHASE 1: Webhook Endpoints Management ────────────────────────────────────

// List webhook endpoints
app.get('/v1/webhooks', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, url, events, enabled, description, created_at FROM webhook_endpoints WHERE merchant_id = $1 ORDER BY created_at DESC',
            [req.merchant.merchant_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch webhooks' });
    }
});

// Register a new webhook endpoint
app.post('/v1/webhooks', authenticateMerchant, async (req, res) => {
    const { url, events, description } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });
    if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
        return res.status(400).json({ error: 'Webhook URL must use HTTPS (or localhost for testing)' });
    }

    const signingSecret = crypto.randomBytes(32).toString('hex');
    try {
        const result = await pool.query(
            `INSERT INTO webhook_endpoints (merchant_id, url, events, signing_secret, description)
             VALUES ($1,$2,$3,$4,$5) RETURNING id, url, events, description, created_at`,
            [
                req.merchant.merchant_id,
                url,
                events || ['*'],
                signingSecret,
                description || null
            ]
        );
        res.json({ ...result.rows[0], signing_secret: signingSecret });
    } catch (err) {
        res.status(500).json({ error: 'Failed to register webhook' });
    }
});

// Delete webhook endpoint
app.delete('/v1/webhooks/:id', authenticateMerchant, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM webhook_endpoints WHERE id = $1 AND merchant_id = $2',
            [req.params.id, req.merchant.merchant_id]
        );
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete webhook' });
    }
});

// Get delivery log for a webhook endpoint
app.get('/v1/webhooks/:id/events', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT wd.* FROM webhook_deliveries wd
             JOIN webhook_endpoints we ON we.id = wd.endpoint_id
             WHERE wd.endpoint_id = $1 AND we.merchant_id = $2
             ORDER BY wd.delivered_at DESC LIMIT 50`,
            [req.params.id, req.merchant.merchant_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch webhook events' });
    }
});

// Test-fire a webhook with optional event_type + custom payload (sandbox simulator)
app.post('/v1/webhooks/:id/test', authenticateMerchant, async (req, res) => {
    const { event_type, custom_payload } = req.body;
    try {
        const ep = await pool.query(
            'SELECT * FROM webhook_endpoints WHERE id = $1 AND merchant_id = $2',
            [req.params.id, req.merchant.merchant_id]
        );
        if (ep.rows.length === 0) return res.status(404).json({ error: 'Endpoint not found' });

        const endpoint = ep.rows[0];
        const eventName = event_type || 'webhook.test';
        const timestamp = Math.floor(Date.now() / 1000);

        // Build payload: use custom_payload or generate sensible default for known event types
        let defaultData = { message: 'Test event from FlapaPay Connect', timestamp: new Date().toISOString() };
        const EVENT_DEFAULTS = {
            'account.created':   { id: 'ca_test_xxx', business_name: 'Test Merchant', kyc_status: 'unverified' },
            'account.activated': { id: 'ca_test_xxx', business_name: 'Test Merchant', kyc_status: 'verified' },
            'charge.succeeded':  { id: 'ch_test_xxx', amount: 10000, currency: 'ZMW', status: 'succeeded', application_fee_amount: 250 },
            'charge.failed':     { id: 'ch_test_xxx', amount: 10000, currency: 'ZMW', status: 'failed', error: 'insufficient_funds' },
            'transfer.completed':{ id: 'tr_test_xxx', amount: 9750, currency: 'ZMW', destination: 'ca_test_xxx' },
            'payout.initiated':  { id: 'po_test_xxx', amount: 9750, currency: 'ZMW', account_id: 'ca_test_xxx', status: 'processing' },
            'payout.completed':  { id: 'po_test_xxx', amount: 9750, currency: 'ZMW', account_id: 'ca_test_xxx', status: 'completed' },
            'payout.failed':     { id: 'po_test_xxx', amount: 9750, currency: 'ZMW', account_id: 'ca_test_xxx', status: 'failed', error: 'bank_account_closed' },
            'dispute.opened':    { id: 'disp_test_xxx', charge_id: 'ch_test_xxx', amount: 10000, reason: 'fraudulent', status: 'open' },
            'dispute.closed':    { id: 'disp_test_xxx', status: 'won', resolution_notes: 'Resolved in merchant favour' },
            'kyc.approved':      { account_id: 'ca_test_xxx', kyc_status: 'verified' },
            'kyc.rejected':      { account_id: 'ca_test_xxx', kyc_status: 'rejected', reason: 'Document unclear' },
        };
        const data = custom_payload ?? (EVENT_DEFAULTS[eventName] || defaultData);
        const payload = { id: `evt_${crypto.randomBytes(8).toString('hex')}`, type: eventName, livemode: false, created: timestamp, data: { object: data } };
        const body = JSON.stringify(payload);

        // Sign with HMAC — format: t={ts},v1={sig}
        const signedPayload = `${timestamp}.${body}`;
        const sig = crypto.createHmac('sha256', endpoint.signing_secret).update(signedPayload).digest('hex');
        const sigHeader = `t=${timestamp},v1=${sig}`;
        const deliveryId = crypto.randomUUID();

        try {
            const httpRes = await axios.post(endpoint.url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-flapapay-signature': sigHeader,
                    'x-flapapay-event': eventName
                },
                timeout: 10000
            });
            await pool.query(
                `INSERT INTO webhook_deliveries (id, endpoint_id, event, payload, response_status, response_body, delivered_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
                [deliveryId, endpoint.id, eventName, body, httpRes.status, JSON.stringify(httpRes.data).slice(0, 1000)]
            );
            res.json({ success: true, response_status: httpRes.status, delivery_id: deliveryId, event_type: eventName, payload });
        } catch (httpErr) {
            await pool.query(
                `INSERT INTO webhook_deliveries (id, endpoint_id, event, payload, response_status, response_body, delivered_at) VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
                [deliveryId, endpoint.id, eventName, body, httpErr.response?.status || 0, httpErr.message]
            );
            res.json({ success: false, error: httpErr.message, response_status: httpErr.response?.status || 0, delivery_id: deliveryId, event_type: eventName });
        }
    } catch (err) {
        res.status(500).json({ error: 'Test failed' });
    }
});

// ─── PHASE 2: REFUND ENGINE ────────────────────────────────────────────────────

// POST /v1/charges/:id/refund — full or partial refund with split reversal
app.post('/v1/charges/:id/refund', authenticateMerchant, async (req, res) => {
    const { amount, reason } = req.body;
    const chargeId = req.params.id;
    const platformMerchantId = req.merchant.merchant_id;

    const client = await pool.connect();
    try {
        // 1. Fetch original charge
        const chargeRes = await client.query(
            `SELECT * FROM charges WHERE id = $1 AND merchant_id = $2`,
            [chargeId, platformMerchantId]
        );
        if (chargeRes.rows.length === 0) return res.status(404).json({ error: 'Charge not found' });
        const charge = chargeRes.rows[0];

        if (charge.status !== 'succeeded') return res.status(400).json({ error: 'Only succeeded charges can be refunded' });

        const originalAmount = parseFloat(charge.amount);
        const refundAmount = amount ? parseFloat(amount) : originalAmount;

        if (refundAmount > originalAmount) return res.status(400).json({ error: 'Refund amount exceeds charge amount' });

        // 2. Calculate split reversal
        const platformFee = charge.application_fee_amount ? parseFloat(charge.application_fee_amount) : 0;
        const feeRatio = originalAmount > 0 ? (refundAmount / originalAmount) : 1;
        const platformFeeReversal = Math.round(platformFee * feeRatio * 100) / 100;
        const subMerchantReversal = Math.round((refundAmount - platformFeeReversal) * 100) / 100;

        await client.query('BEGIN');

        // 3. Reverse sub-merchant balance if applicable
        if (charge.destination_merchant_id) {
            await client.query(
                `UPDATE balances SET available_amount = GREATEST(0, available_amount - $1) WHERE merchant_id = $2`,
                [subMerchantReversal, charge.destination_merchant_id]
            );
        }

        // 4. Reverse platform fee from platform merchant balance
        if (platformFeeReversal > 0) {
            await client.query(
                `UPDATE balances SET available_amount = GREATEST(0, available_amount - $1) WHERE merchant_id = $2`,
                [platformFeeReversal, platformMerchantId]
            );
        }

        // 5. Mark charge as refunded
        await client.query(
            `UPDATE charges SET status = $1 WHERE id = $2`,
            [refundAmount >= originalAmount ? 'refunded' : 'partially_refunded', chargeId]
        );

        // 6. Record refund
        const refundId = require('crypto').randomUUID();
        await client.query(
            `INSERT INTO refunds (id, charge_id, merchant_id, amount, currency, reason, status, platform_fee_reversal, sub_merchant_reversal, destination_merchant_id, livemode)
             VALUES ($1,$2,$3,$4,$5,$6,'succeeded',$7,$8,$9,$10)`,
            [refundId, chargeId, platformMerchantId, refundAmount, charge.currency || 'ZMW', reason || null,
             platformFeeReversal, subMerchantReversal, charge.destination_merchant_id || null, charge.livemode || false]
        );

        await client.query('COMMIT');

        // 7. Emit webhook + ledger
        const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
        await emitWebhookForMerchant(platformMerchantId, 'refund.created', {
            refund_id: refundId, charge_id: chargeId, amount: refundAmount,
            currency: charge.currency, platform_fee_reversal: platformFeeReversal,
            sub_merchant_reversal: subMerchantReversal
        });
        // Phase 4: ledger entry for refund reversal
        if (platformFeeReversal > 0) {
            pool.query(
                `INSERT INTO connect_ledger (platform_merchant_id, entry_type, charge_id, account_id, amount, currency, direction, description, livemode)
                 VALUES ($1,'refund_reversal',$2,$3,$4,$5,'debit',$6,$7)`,
                [platformMerchantId, chargeId, charge.destination_merchant_id,
                 platformFeeReversal, charge.currency || 'ZMW',
                 `Fee reversal on refund of ${charge.currency} ${refundAmount}`, charge.livemode || false]
            ).catch(() => {});
        }

        res.json({
            id: refundId, object: 'refund', charge: chargeId,
            amount: refundAmount, currency: charge.currency,
            platform_fee_reversal: platformFeeReversal,
            sub_merchant_reversal: subMerchantReversal,
            status: 'succeeded', reason
        });

    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[Refund] Error:', err.message);
        res.status(500).json({ error: 'Refund failed', details: err.message });
    } finally {
        client.release();
    }
});

// GET /v1/charges/:id/refunds — list refunds for a charge
app.get('/v1/charges/:id/refunds', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM refunds WHERE charge_id = $1 AND merchant_id = $2 ORDER BY created_at DESC`,
            [req.params.id, req.merchant.merchant_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch refunds' });
    }
});

// ─── PHASE 2: CONNECT ANALYTICS ───────────────────────────────────────────────

// GET /v1/connect/analytics?period=7d|30d|90d
app.get('/v1/connect/analytics', authenticateMerchant, async (req, res) => {
    const merchantId = req.merchant.merchant_id;
    const period = req.query.period || '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const isTest = req.headers['x-flapapay-test-mode'] === 'true';

    try {
        // Daily GMV and fee revenue over period
        const dailyRes = await pool.query(
            `SELECT DATE(created_at) as date,
                    COALESCE(SUM(amount), 0) as gmv,
                    COALESCE(SUM(application_fee_amount), 0) as fees
             FROM charges
             WHERE merchant_id = $1 AND livemode = $2 AND status = 'succeeded'
               AND created_at >= NOW() - ($3 || ' days')::INTERVAL
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [merchantId, !isTest, days]
        );

        // Daily payout volume
        const payoutRes = await pool.query(
            `SELECT DATE(created_at) as date, COALESCE(SUM(amount), 0) as volume
             FROM transfers
             WHERE source_merchant_id IN (
                 SELECT id FROM connected_accounts WHERE platform_merchant_id = $1
             ) AND type = 'PAYOUT' AND status IN ('PROCESSING','COMPLETED')
               AND created_at >= NOW() - ($2 || ' days')::INTERVAL
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [merchantId, days]
        );

        // Top sub-merchants by volume
        const topRes = await pool.query(
            `SELECT ca.id, ca.business_name,
                    COALESCE(SUM(c.amount), 0) as volume,
                    COALESCE(SUM(c.application_fee_amount), 0) as fees,
                    COUNT(c.id) as count
             FROM connected_accounts ca
             LEFT JOIN charges c ON ca.id = c.destination_merchant_id AND c.status = 'succeeded' AND c.livemode = $2
             WHERE ca.platform_merchant_id = $1
             GROUP BY ca.id, ca.business_name
             ORDER BY volume DESC
             LIMIT 10`,
            [merchantId, !isTest]
        );

        // Summary totals
        const totalRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_gmv,
                    COALESCE(SUM(application_fee_amount), 0) as total_fees,
                    COUNT(*) as total_charges
             FROM charges
             WHERE merchant_id = $1 AND livemode = $2 AND status = 'succeeded'
               AND created_at >= NOW() - ($3 || ' days')::INTERVAL`,
            [merchantId, !isTest, days]
        );

        // Refunds in period
        const refundRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_refunded, COUNT(*) as refund_count
             FROM refunds WHERE merchant_id = $1 AND created_at >= NOW() - ($2 || ' days')::INTERVAL`,
            [merchantId, days]
        );

        res.json({
            period,
            summary: {
                total_gmv: parseFloat(totalRes.rows[0].total_gmv),
                total_fees: parseFloat(totalRes.rows[0].total_fees),
                total_charges: parseInt(totalRes.rows[0].total_charges),
                total_refunded: parseFloat(refundRes.rows[0].total_refunded),
                refund_count: parseInt(refundRes.rows[0].refund_count)
            },
            daily_gmv: dailyRes.rows.map(r => ({
                date: r.date, gmv: parseFloat(r.gmv), fees: parseFloat(r.fees)
            })),
            daily_payouts: payoutRes.rows.map(r => ({
                date: r.date, volume: parseFloat(r.volume)
            })),
            top_accounts: topRes.rows.map(r => ({
                id: r.id, business_name: r.business_name,
                volume: parseFloat(r.volume), fees: parseFloat(r.fees), count: parseInt(r.count)
            }))
        });
    } catch (err) {
        console.error('[Analytics] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// ─── PHASE 2: SUB-MERCHANT API KEYS ──────────────────────────────────────────

// GET /v1/connect/accounts/:id/keys
app.get('/v1/connect/accounts/:id/keys', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, account_id, key_type, public_key, secret_key_preview, label, is_active, created_at
             FROM connected_account_api_keys
             WHERE account_id = $1 AND is_active = TRUE
             ORDER BY created_at DESC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
});

// POST /v1/connect/accounts/:id/keys — create new key pair
app.post('/v1/connect/accounts/:id/keys', authenticateMerchant, async (req, res) => {
    const { label, key_type } = req.body;
    const accountId = req.params.id;

    try {
        // Verify account belongs to platform
        const acctRes = await pool.query(
            `SELECT id FROM connected_accounts WHERE id = $1 AND platform_merchant_id = $2`,
            [accountId, req.merchant.merchant_id]
        );
        if (acctRes.rows.length === 0) return res.status(404).json({ error: 'Account not found' });

        const crypto = require('crypto');
        const type = key_type === 'live' ? 'live' : 'test';
        const prefix = type === 'live' ? 'pk_live_ca_' : 'pk_test_ca_';
        const secretPrefix = type === 'live' ? 'sk_live_ca_' : 'sk_test_ca_';

        const publicKey = prefix + crypto.randomBytes(16).toString('hex');
        const secretKeyRaw = secretPrefix + crypto.randomBytes(24).toString('hex');
        const secretKeyHash = crypto.createHash('sha256').update(secretKeyRaw).digest('hex');
        const secretKeyPreview = secretKeyRaw.slice(0, 16) + '...' + secretKeyRaw.slice(-4);

        const result = await pool.query(
            `INSERT INTO connected_account_api_keys (account_id, key_type, public_key, secret_key_hash, secret_key_preview, label)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, public_key, secret_key_preview, label, key_type, created_at`,
            [accountId, type, publicKey, secretKeyHash, secretKeyPreview, label || 'Default Key']
        );

        // Return the raw secret once (never stored in plain text)
        res.json({
            ...result.rows[0],
            secret_key: secretKeyRaw,
            warning: 'Save the secret_key — it cannot be retrieved again.'
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create API key' });
    }
});

// DELETE /v1/connect/accounts/:id/keys/:keyId — revoke key
app.delete('/v1/connect/accounts/:id/keys/:keyId', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE connected_account_api_keys SET is_active = FALSE
             WHERE id = $1 AND account_id = $2
             RETURNING id`,
            [req.params.keyId, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Key not found' });
        res.json({ deleted: true, id: req.params.keyId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to revoke key' });
    }
});

// ─── PHASE 2: ACCOUNT CONTROLS ────────────────────────────────────────────────

// PATCH /v1/connect/accounts/:id — update status, payout cap, notes
app.patch('/v1/connect/accounts/:id', authenticateMerchant, async (req, res) => {
    const { status, max_payout_amount, platform_notes } = req.body;
    const accountId = req.params.id;
    const platformMerchantId = req.merchant.merchant_id;

    try {
        const acctRes = await pool.query(
            `SELECT * FROM connected_accounts WHERE id = $1 AND platform_merchant_id = $2`,
            [accountId, platformMerchantId]
        );
        if (acctRes.rows.length === 0) return res.status(404).json({ error: 'Account not found' });

        const updates = [];
        const values = [];
        let idx = 1;

        if (status !== undefined) {
            updates.push(`status = $${idx++}`);
            values.push(status);
            if (status === 'SUSPENDED') {
                updates.push(`suspended_at = $${idx++}`);
                values.push(new Date());
            } else if (status === 'ACTIVE') {
                updates.push(`suspended_at = NULL`);
            }
        }
        if (max_payout_amount !== undefined) {
            updates.push(`max_payout_amount = $${idx++}`);
            values.push(max_payout_amount === null ? null : parseFloat(max_payout_amount));
        }
        if (platform_notes !== undefined) {
            updates.push(`platform_notes = $${idx++}`);
            values.push(platform_notes);
        }

        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

        values.push(accountId);
        const result = await pool.query(
            `UPDATE connected_accounts SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        // Emit account.updated webhook
        const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
        await emitWebhookForMerchant(platformMerchantId, 'account.updated', {
            account_id: accountId, status: result.rows[0].status,
            suspended: result.rows[0].status === 'SUSPENDED'
        });

        // Email on suspension/re-activation
        if (status === 'SUSPENDED' || status === 'ACTIVE') {
            const updAcct = result.rows[0];
            if (updAcct.email) {
                resend.emails.send({
                    from: 'FlapaPay <noreply@flapapay.com>',
                    to: [updAcct.email],
                    subject: status === 'SUSPENDED' ? 'Your FlapaPay sub-merchant account has been suspended' : 'Your FlapaPay account has been reactivated',
                    html: status === 'SUSPENDED'
                        ? `<p>Hi ${updAcct.business_name || 'there'},</p><p>Your sub-merchant account has been <strong>suspended</strong> by the platform. Payouts and new charges are paused. Please contact support for more information.</p><p>— The FlapaPay Team</p>`
                        : `<p>Hi ${updAcct.business_name || 'there'},</p><p>Good news — your sub-merchant account has been <strong>reactivated</strong>. You can resume accepting payments and receiving payouts.</p><p>— The FlapaPay Team</p>`,
                }).catch(e => console.error('[Email] Account status notification failed:', e.message));
            }
        }

        res.json({ id: accountId, status: result.rows[0].status,
            max_payout_amount: result.rows[0].max_payout_amount,
            platform_notes: result.rows[0].platform_notes,
            suspended_at: result.rows[0].suspended_at });
    } catch (err) {
        console.error('[AccountControls] Error:', err.message);
        res.status(500).json({ error: 'Failed to update account' });
    }
});

// ─── PHASE 3: KYC WORKFLOW ────────────────────────────────────────────────────

// GET /v1/connect/accounts/:id/kyc — list KYC documents
app.get('/v1/connect/accounts/:id/kyc', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT k.*, ca.kyc_status, ca.kyc_submitted_at, ca.kyc_reviewed_at, ca.kyc_rejection_reason
             FROM connected_account_kyc k
             RIGHT JOIN connected_accounts ca ON ca.id = $1
             WHERE (k.account_id = $1 OR k.account_id IS NULL)
             ORDER BY k.uploaded_at DESC`,
            [req.params.id]
        );
        // Always return account-level KYC status even if no docs yet
        const accountRes = await pool.query(
            `SELECT kyc_status, kyc_submitted_at, kyc_reviewed_at, kyc_rejection_reason FROM connected_accounts WHERE id = $1`,
            [req.params.id]
        );
        res.json({
            account: accountRes.rows[0] || {},
            documents: result.rows.filter(r => r.id)
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch KYC data' });
    }
});

// POST /v1/connect/accounts/:id/kyc — upload KYC document (base64 for now; multer path can be added)
app.post('/v1/connect/accounts/:id/kyc', authenticateMerchant, async (req, res) => {
    const { document_type, file_url, file_name } = req.body;
    const accountId = req.params.id;

    if (!document_type || !file_url) return res.status(400).json({ error: 'document_type and file_url required' });

    try {
        const result = await pool.query(
            `INSERT INTO connected_account_kyc (account_id, document_type, file_url, file_name)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [accountId, document_type, file_url, file_name || null]
        );
        // Advance KYC status to pending_review if unverified
        await pool.query(
            `UPDATE connected_accounts SET kyc_status = 'pending_review', kyc_submitted_at = NOW()
             WHERE id = $1 AND kyc_status = 'unverified'`,
            [accountId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to upload KYC document' });
    }
});

// PATCH /v1/connect/accounts/:id/kyc/:docId — review a KYC document (approve/reject)
app.patch('/v1/connect/accounts/:id/kyc/:docId', authenticateMerchant, async (req, res) => {
    const { status, rejection_reason } = req.body; // status: 'approved' | 'rejected'
    const accountId = req.params.id;
    const platformMerchantId = req.merchant.merchant_id;

    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected' });

    try {
        await pool.query(
            `UPDATE connected_account_kyc SET status=$1, rejection_reason=$2, reviewed_by=$3, reviewed_at=NOW() WHERE id=$4 AND account_id=$5`,
            [status, rejection_reason || null, platformMerchantId, req.params.docId, accountId]
        );

        // Check if all docs for account are approved — auto-verify account
        const docsRes = await pool.query(
            `SELECT status FROM connected_account_kyc WHERE account_id = $1`,
            [accountId]
        );
        const allApproved = docsRes.rows.length > 0 && docsRes.rows.every(d => d.status === 'approved');
        const anyRejected = docsRes.rows.some(d => d.status === 'rejected');

        let newKycStatus = 'pending_review';
        if (allApproved) newKycStatus = 'verified';
        else if (anyRejected && status === 'rejected') newKycStatus = 'rejected';

        await pool.query(
            `UPDATE connected_accounts SET kyc_status=$1, kyc_reviewed_at=NOW(), kyc_rejection_reason=$2 WHERE id=$3`,
            [newKycStatus, rejection_reason || null, accountId]
        );

        // Emit webhook
        const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
        if (newKycStatus === 'verified') {
            await emitWebhookForMerchant(platformMerchantId, 'account.verified', { account_id: accountId });
        } else if (newKycStatus === 'rejected') {
            await emitWebhookForMerchant(platformMerchantId, 'account.rejected', { account_id: accountId, reason: rejection_reason });
        }

        // Email notification to sub-merchant (via EmailService — noreply@flapabay.com)
        const acctEmailRes = await pool.query(`SELECT email, business_name FROM connected_accounts WHERE id = $1`, [accountId]);
        if (acctEmailRes.rows.length > 0 && acctEmailRes.rows[0].email && (newKycStatus === 'verified' || newKycStatus === 'rejected')) {
            const { email: toEmail, business_name } = acctEmailRes.rows[0];
            EmailService.sendKycUpdate(toEmail, {
                accountName: business_name || 'there',
                status: newKycStatus === 'verified' ? 'approved' : 'rejected',
                reason: rejection_reason || '',
                dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sub-merchant`,
            }).catch(e => console.error('[Email] KYC notification failed:', e.message));
        }

        // Socket.io real-time push to platform merchant dashboard
        if (newKycStatus === 'verified' || newKycStatus === 'rejected') {
            const muRes = await pool.query(`SELECT user_id FROM merchants WHERE id = $1`, [platformMerchantId]);
            if (muRes.rows.length > 0) {
                io.to(`user:${muRes.rows[0].user_id}`).emit('connect_event', {
                    type: newKycStatus === 'verified' ? 'kyc.approved' : 'kyc.rejected',
                    account_id: accountId,
                    doc_id: req.params.docId,
                    timestamp: new Date().toISOString()
                });
            }
        }

        res.json({ doc_id: req.params.docId, status, account_kyc_status: newKycStatus });
    } catch (err) {
        res.status(500).json({ error: 'Failed to review KYC document' });
    }
});

// POST /v1/connect/accounts/:id/kyc/approve-all — bulk approve all pending docs for an account
app.post('/v1/connect/accounts/:id/kyc/approve-all', authenticateMerchant, async (req, res) => {
    const accountId = req.params.id;
    const platformMerchantId = req.merchant.merchant_id;
    try {
        const verifyRes = await pool.query(
            `SELECT id FROM connected_accounts WHERE id = $1 AND platform_merchant_id = $2`,
            [accountId, platformMerchantId]
        );
        if (verifyRes.rows.length === 0) return res.status(404).json({ error: 'Account not found' });

        const updateRes = await pool.query(
            `UPDATE connected_account_kyc SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
             WHERE account_id = $2 AND status = 'pending_review'
             RETURNING id`,
            [platformMerchantId, accountId]
        );
        const approvedCount = updateRes.rows.length;

        if (approvedCount > 0) {
            await pool.query(
                `UPDATE connected_accounts SET kyc_status = 'verified', kyc_reviewed_at = NOW(), status = 'ACTIVE'
                 WHERE id = $1`,
                [accountId]
            );
            // Socket.io emit to platform merchant
            const muRes = await pool.query(`SELECT user_id FROM merchants WHERE id = $1`, [platformMerchantId]);
            if (muRes.rows.length > 0) {
                io.to(`user:${muRes.rows[0].user_id}`).emit('connect_event', {
                    type: 'kyc.approved', account_id: accountId, timestamp: new Date().toISOString()
                });
            }
            // Webhook
            const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
            await emitWebhookForMerchant(platformMerchantId, 'account.activated', { account_id: accountId });
        }

        res.json({ approved_count: approvedCount, kyc_status: approvedCount > 0 ? 'verified' : 'no_changes' });
    } catch (err) {
        console.error('[KYC Bulk Approve]', err);
        res.status(500).json({ error: 'Failed to approve documents' });
    }
});

// ─── PHASE 3: PER-ACCOUNT FEE OVERRIDES ───────────────────────────────────────

// GET /v1/connect/accounts/:id/fee-override
app.get('/v1/connect/accounts/:id/fee-override', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM connected_account_fee_overrides WHERE account_id = $1`,
            [req.params.id]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch fee override' });
    }
});

// PUT /v1/connect/accounts/:id/fee-override — upsert fee override
app.put('/v1/connect/accounts/:id/fee-override', authenticateMerchant, async (req, res) => {
    const { fee_percent, reason } = req.body;
    const accountId = req.params.id;
    const platformMerchantId = req.merchant.merchant_id;

    if (fee_percent == null || isNaN(parseFloat(fee_percent))) return res.status(400).json({ error: 'fee_percent required' });

    try {
        // Verify account belongs to platform
        const acctRes = await pool.query(
            `SELECT id FROM connected_accounts WHERE id = $1 AND platform_merchant_id = $2`,
            [accountId, platformMerchantId]
        );
        if (acctRes.rows.length === 0) return res.status(404).json({ error: 'Account not found' });

        const result = await pool.query(
            `INSERT INTO connected_account_fee_overrides (account_id, platform_merchant_id, fee_percent, reason, created_by)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (account_id) DO UPDATE SET fee_percent=$3, reason=$4, created_at=NOW()
             RETURNING *`,
            [accountId, platformMerchantId, parseFloat(fee_percent), reason || null, platformMerchantId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to set fee override' });
    }
});

// DELETE /v1/connect/accounts/:id/fee-override — remove override (revert to platform default)
app.delete('/v1/connect/accounts/:id/fee-override', authenticateMerchant, async (req, res) => {
    try {
        await pool.query(`DELETE FROM connected_account_fee_overrides WHERE account_id = $1`, [req.params.id]);
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove fee override' });
    }
});

// ─── PHASE 3: DISPUTE MANAGEMENT ──────────────────────────────────────────────

// GET /v1/connect/disputes — list all disputes for platform
app.get('/v1/connect/disputes', authenticateMerchant, async (req, res) => {
    const { status, limit = 50 } = req.query;
    const platformMerchantId = req.merchant.merchant_id;
    try {
        const params = [platformMerchantId, parseInt(limit)];
        let where = `WHERE d.merchant_id = $1`;
        if (status) { where += ` AND d.status = $3`; params.push(status); }
        const result = await pool.query(
            `SELECT d.*, ca.business_name as sub_merchant_name
             FROM disputes d
             LEFT JOIN connected_accounts ca ON ca.id = d.destination_merchant_id
             ${where} ORDER BY d.created_at DESC LIMIT $2`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch disputes' });
    }
});

// POST /v1/connect/disputes — open a dispute (platform or customer-facing)
app.post('/v1/connect/disputes', authenticateMerchant, async (req, res) => {
    const { charge_id, reason, customer_email, customer_statement, amount, currency } = req.body;
    const platformMerchantId = req.merchant.merchant_id;

    if (!charge_id || !reason) return res.status(400).json({ error: 'charge_id and reason required' });

    try {
        // Fetch charge to link sub-merchant
        const chargeRes = await pool.query(
            `SELECT amount, currency, destination_merchant_id, livemode FROM charges WHERE id = $1 AND merchant_id = $2`,
            [charge_id, platformMerchantId]
        );
        if (chargeRes.rows.length === 0) return res.status(404).json({ error: 'Charge not found' });
        const charge = chargeRes.rows[0];

        const result = await pool.query(
            `INSERT INTO disputes (charge_id, merchant_id, destination_merchant_id, amount, currency, reason, customer_email, customer_statement, livemode)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [charge_id, platformMerchantId, charge.destination_merchant_id,
             amount || charge.amount, currency || charge.currency,
             reason, customer_email || null, customer_statement || null, charge.livemode]
        );

        const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
        await emitWebhookForMerchant(platformMerchantId, 'dispute.created', {
            dispute_id: result.rows[0].id, charge_id, reason, amount: result.rows[0].amount
        });

        // Email sub-merchant about the dispute
        if (charge.destination_merchant_id) {
            const disputeAcct = await pool.query(`SELECT email, business_name FROM connected_accounts WHERE id = $1`, [charge.destination_merchant_id]);
            if (disputeAcct.rows.length > 0 && disputeAcct.rows[0].email) {
                resend.emails.send({
                    from: 'FlapaPay <noreply@flapapay.com>',
                    to: [disputeAcct.rows[0].email],
                    subject: `New dispute opened on charge ${charge_id}`,
                    html: `<p>Hi ${disputeAcct.rows[0].business_name || 'there'},</p><p>A dispute has been opened on charge <strong>${charge_id}</strong> for <strong>${result.rows[0].currency} ${result.rows[0].amount}</strong>.</p><p><strong>Reason:</strong> ${reason}</p>${customer_statement ? `<p><strong>Customer statement:</strong> ${customer_statement}</p>` : ''}<p>Please log in to your dashboard to review and respond.</p><p>— The FlapaPay Team</p>`,
                }).catch(e => console.error('[Email] Dispute notification failed:', e.message));
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create dispute' });
    }
});

// PATCH /v1/connect/disputes/:id — add evidence or resolve
app.patch('/v1/connect/disputes/:id', authenticateMerchant, async (req, res) => {
    const { status, evidence, resolution_notes } = req.body;
    const platformMerchantId = req.merchant.merchant_id;

    try {
        const disputeRes = await pool.query(`SELECT * FROM disputes WHERE id = $1 AND merchant_id = $2`, [req.params.id, platformMerchantId]);
        if (disputeRes.rows.length === 0) return res.status(404).json({ error: 'Dispute not found' });

        const updates = [];
        const values = [];
        let idx = 1;

        if (status && ['open','under_review','won','lost','closed'].includes(status)) {
            updates.push(`status = $${idx++}`); values.push(status);
            if (['won','lost','closed'].includes(status)) {
                updates.push(`resolved_at = $${idx++}`); values.push(new Date());
            }
        }
        if (evidence) { updates.push(`evidence = $${idx++}`); values.push(JSON.stringify(evidence)); }
        if (resolution_notes) { updates.push(`resolution_notes = $${idx++}`); values.push(resolution_notes); }
        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

        values.push(req.params.id);
        const result = await pool.query(
            `UPDATE disputes SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values
        );

        // Webhook on resolution
        if (['won','lost','closed'].includes(status)) {
            const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
            await emitWebhookForMerchant(platformMerchantId, 'dispute.resolved', {
                dispute_id: req.params.id, status, resolution_notes
            });
        }

        // Socket.io real-time push to platform merchant
        const muDisputeRes = await pool.query(`SELECT user_id FROM merchants WHERE id = $1`, [platformMerchantId]).catch(() => ({ rows: [] }));
        if (muDisputeRes.rows.length > 0) {
            io.to(`user:${muDisputeRes.rows[0].user_id}`).emit('connect_event', {
                type: 'dispute.updated',
                dispute_id: req.params.id,
                status: status || disputeRes.rows[0].status,
                timestamp: new Date().toISOString()
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update dispute' });
    }
});

// GET /v1/connect/disputes/:id/evidence — list evidence files for a dispute
app.get('/v1/connect/disputes/:id/evidence', authenticateMerchant, async (req, res) => {
    const platformMerchantId = req.merchant.merchant_id;
    try {
        const result = await pool.query(
            `SELECT evidence FROM disputes WHERE id = $1 AND merchant_id = $2`,
            [req.params.id, platformMerchantId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Dispute not found' });
        const evidence = result.rows[0].evidence;
        const files = Array.isArray(evidence) ? evidence : (evidence ? [evidence] : []);
        res.json({ evidence: files });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch evidence' });
    }
});

// POST /v1/connect/disputes/:id/evidence — upload an evidence file
app.post('/v1/connect/disputes/:id/evidence', authenticateMerchant, uploadKyc.single('file'), async (req, res) => {
    const platformMerchantId = req.merchant.merchant_id;
    try {
        const disputeRes = await pool.query(
            `SELECT id, evidence FROM disputes WHERE id = $1 AND merchant_id = $2`,
            [req.params.id, platformMerchantId]
        );
        if (disputeRes.rows.length === 0) return res.status(404).json({ error: 'Dispute not found' });

        if (!req.file && !req.body.file_url) return res.status(400).json({ error: 'file or file_url required' });

        const file_url = req.file ? `/assets/images/kyc/${req.file.filename}` : req.body.file_url;
        const file_name = req.file ? req.file.originalname : (req.body.file_name || 'evidence');
        const label = req.body.label || null;

        const existing = Array.isArray(disputeRes.rows[0].evidence) ? disputeRes.rows[0].evidence : [];
        const newEntry = {
            id: `ev_${crypto.randomBytes(8).toString('hex')}`,
            file_url,
            file_name,
            label,
            uploaded_at: new Date().toISOString()
        };
        const updated = [...existing, newEntry];

        await pool.query(
            `UPDATE disputes SET evidence = $1 WHERE id = $2`,
            [JSON.stringify(updated), req.params.id]
        );
        res.json(newEntry);
    } catch (err) {
        console.error('[Dispute Evidence Upload]', err);
        res.status(500).json({ error: 'Failed to upload evidence' });
    }
});

// ─── PHASE 3: BULK OPERATIONS + CSV EXPORT ────────────────────────────────────

// POST /v1/connect/bulk/payout — trigger payouts for all eligible accounts
app.post('/v1/connect/bulk/payout', authenticateMerchant, async (req, res) => {
    const { min_balance = 0, currency = 'ZMW' } = req.body;
    const platformMerchantId = req.merchant.merchant_id;

    try {
        const { executePayout } = require('./services/PayoutSchedulerService');

        const accountsRes = await pool.query(
            `SELECT ca.id, ca.status, ca.kyc_status,
                    COALESCE(b.available_amount, 0) as available
             FROM connected_accounts ca
             LEFT JOIN balances b ON b.merchant_id = ca.id
             WHERE ca.platform_merchant_id = $1
               AND ca.status = 'ACTIVE'
               AND COALESCE(b.available_amount, 0) >= $2`,
            [platformMerchantId, parseFloat(min_balance)]
        );

        const results = [];
        for (const account of accountsRes.rows) {
            const result = await executePayout(
                account.id, parseFloat(account.available), currency, platformMerchantId, null
            );
            results.push({ account_id: account.id, amount: account.available, result });
        }

        res.json({ triggered: results.length, results });
    } catch (err) {
        res.status(500).json({ error: 'Bulk payout failed', details: err.message });
    }
});

// GET /v1/connect/export/:type — CSV export (accounts | charges | payouts)
app.get('/v1/connect/export/:type', authenticateMerchant, async (req, res) => {
    const { type } = req.params;
    const platformMerchantId = req.merchant.merchant_id;
    const isTest = req.headers['x-flapapay-test-mode'] === 'true';

    try {
        let rows = [];
        let headers = [];

        if (type === 'accounts') {
            const result = await pool.query(
                `SELECT ca.id, ca.business_name, ca.email, ca.status, ca.kyc_status,
                        COALESCE(b.available_amount,0) as available_balance,
                        COALESCE(b.pending_amount,0) as pending_balance,
                        ca.created_at
                 FROM connected_accounts ca
                 LEFT JOIN balances b ON b.merchant_id = ca.id
                 WHERE ca.platform_merchant_id = $1 ORDER BY ca.created_at DESC`,
                [platformMerchantId]
            );
            headers = ['id','business_name','email','status','kyc_status','available_balance','pending_balance','created_at'];
            rows = result.rows;
        } else if (type === 'charges') {
            const result = await pool.query(
                `SELECT c.id, c.amount, c.currency, c.status, c.payment_method,
                        c.application_fee_amount, ca.business_name as sub_merchant,
                        c.created_at
                 FROM charges c
                 LEFT JOIN connected_accounts ca ON ca.id = c.destination_merchant_id
                 WHERE c.merchant_id = $1 AND c.livemode = $2
                 ORDER BY c.created_at DESC LIMIT 5000`,
                [platformMerchantId, !isTest]
            );
            headers = ['id','amount','currency','status','payment_method','application_fee_amount','sub_merchant','created_at'];
            rows = result.rows;
        } else if (type === 'payouts') {
            const result = await pool.query(
                `SELECT t.id, t.amount, t.currency, t.status, t.type,
                        ca.business_name as sub_merchant, t.created_at
                 FROM transfers t
                 LEFT JOIN connected_accounts ca ON ca.id = t.source_merchant_id
                 WHERE ca.platform_merchant_id = $1 AND t.type = 'PAYOUT'
                 ORDER BY t.created_at DESC LIMIT 5000`,
                [platformMerchantId]
            );
            headers = ['id','amount','currency','status','type','sub_merchant','created_at'];
            rows = result.rows;
        } else {
            return res.status(400).json({ error: 'type must be accounts, charges, or payouts' });
        }

        // Build CSV
        const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = [
            headers.join(','),
            ...rows.map(r => headers.map(h => escape(r[h])).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="flapapay_connect_${type}_${Date.now()}.csv"`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Export failed', details: err.message });
    }
});

// ─── PHASE 4: INVITE LINKS ────────────────────────────────────────────────────

// POST /v1/connect/invites — generate invite link
app.post('/v1/connect/invites', authenticateMerchant, async (req, res) => {
    const { email, business_name, expires_in_days = 7 } = req.body;
    const platformMerchantId = req.merchant.merchant_id;
    try {
        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + parseInt(expires_in_days) * 86400000);
        const result = await pool.query(
            `INSERT INTO connect_invites (token, platform_merchant_id, email, business_name, expires_at)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [token, platformMerchantId, email || null, business_name || null, expiresAt]
        );
        const invite = result.rows[0];

        // Send invite email if email provided (via EmailService — noreply@flapabay.com)
        if (email) {
            const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/connect/invite/${token}`;
            try {
                const platformRes = await pool.query(
                    'SELECT business_name FROM merchants WHERE id = $1',
                    [platformMerchantId]
                );
                const platformName = platformRes.rows[0]?.business_name || 'Our Platform';
                await EmailService.sendConnectInvite(email, {
                    platformName,
                    inviteUrl,
                    businessName: business_name || '',
                    expiresAt: `${expires_in_days} day${parseInt(expires_in_days) !== 1 ? 's' : ''}`,
                });
            } catch (emailErr) {
                console.warn('[Invite Email] Failed to send:', emailErr.message);
            }
        }

        res.json({
            ...invite,
            invite_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/connect/invite/${token}`
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create invite' });
    }
});

// GET /v1/connect/invites — list invites
app.get('/v1/connect/invites', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT i.*, ca.business_name as used_by_name
             FROM connect_invites i
             LEFT JOIN connected_accounts ca ON ca.id = i.used_by
             WHERE i.platform_merchant_id = $1
             ORDER BY i.created_at DESC`,
            [req.merchant.merchant_id]
        );
        // Auto-expire
        const now = new Date();
        const rows = result.rows.map(r => ({
            ...r,
            status: r.status === 'pending' && new Date(r.expires_at) < now ? 'expired' : r.status,
            invite_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/connect/invite/${r.token}`
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch invites' });
    }
});

// DELETE /v1/connect/invites/:id — revoke invite
app.delete('/v1/connect/invites/:id', authenticateMerchant, async (req, res) => {
    try {
        await pool.query(
            `UPDATE connect_invites SET status = 'revoked' WHERE id = $1 AND platform_merchant_id = $2`,
            [req.params.id, req.merchant.merchant_id]
        );
        res.json({ revoked: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to revoke invite' });
    }
});

// GET /v1/connect/invite/:token — public: validate invite token
app.get('/v1/connect/invite/:token', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT i.*, m.business_name as platform_name
             FROM connect_invites i
             JOIN merchants m ON m.id = i.platform_merchant_id
             WHERE i.token = $1`,
            [req.params.token]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Invalid invite link' });
        const invite = result.rows[0];
        if (invite.status !== 'pending') return res.status(400).json({ error: `Invite is ${invite.status}` });
        if (new Date(invite.expires_at) < new Date()) return res.status(400).json({ error: 'Invite link has expired' });
        res.json({
            valid: true,
            platform_name: invite.platform_name,
            email: invite.email,
            business_name: invite.business_name,
            expires_at: invite.expires_at
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to validate invite' });
    }
});

// POST /v1/connect/invite/:token/register — public: complete sub-merchant self-registration
app.post('/v1/connect/invite/:token/register', async (req, res) => {
    const { business_name, email, country = 'ZM', password, phone } = req.body;
    if (!business_name || !email) return res.status(400).json({ error: 'business_name and email required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Validate token
        const inviteRes = await client.query(
            `SELECT * FROM connect_invites WHERE token = $1 AND status = 'pending' AND expires_at > NOW() FOR UPDATE`,
            [req.params.token]
        );
        if (inviteRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid or expired invite link' });
        }
        const invite = inviteRes.rows[0];

        // Create connected account
        const accountId = require('crypto').randomUUID();
        const isLive = false; // New accounts start in test mode
        let passwordHash = null;
        if (password) {
            const bcrypt = require('bcrypt');
            passwordHash = await bcrypt.hash(password, 10);
        }
        await client.query(
            `INSERT INTO connected_accounts (id, platform_merchant_id, business_name, email, country, status, type, livemode, kyc_status, capabilities, requirements, password_hash)
             VALUES ($1,$2,$3,$4,$5,'PENDING','custom',$6,'unverified','{}','{"currently_due":["kyc_documents"]}',$7)`,
            [accountId, invite.platform_merchant_id, business_name, email, country, isLive, passwordHash]
        );

        // Mark invite used
        await client.query(
            `UPDATE connect_invites SET status='used', used_by=$1, used_at=NOW() WHERE id=$2`,
            [accountId, invite.id]
        );

        await client.query('COMMIT');

        // Emit webhook
        const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
        await emitWebhookForMerchant(invite.platform_merchant_id, 'account.created', {
            account_id: accountId, business_name, email, source: 'invite'
        });

        // Welcome email to sub-merchant (via EmailService — noreply@flapabay.com)
        try {
            const platformRes = await pool.query(
                'SELECT business_name FROM merchants WHERE id = $1',
                [invite.platform_merchant_id]
            );
            const platformName = platformRes.rows[0]?.business_name || 'Our Platform';
            await EmailService.sendOnboardingComplete(email, {
                accountName: business_name,
                platformName,
                dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sub-merchant`,
            });
        } catch (emailErr) {
            console.warn('[Welcome Email] Failed:', emailErr.message);
        }

        res.json({ account_id: accountId, business_name, email, status: 'PENDING', message: 'Account created successfully. Complete KYC to activate.' });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[Invite Register]', err.message);
        res.status(500).json({ error: 'Registration failed' });
    } finally {
        client.release();
    }
});

// ─── HOSTED ONBOARDING (Stripe account_links equivalent) ─────────────────────

// POST /v1/connect/onboarding_links — platform creates a hosted link for a sub-merchant
// If account_id is omitted a new connected account is auto-created (new seller flow)
app.post('/v1/connect/onboarding_links', authenticateMerchant, async (req, res) => {
    const { account_id, return_url, refresh_url, platform_branding = {} } = req.body;
    const platformMerchantId = req.merchant.merchant_id;

    try {
        let resolvedAccountId = account_id;

        if (!resolvedAccountId) {
            // Auto-create a placeholder connected account for the new seller
            const newAcct = await pool.query(
                `INSERT INTO connected_accounts
                    (platform_merchant_id, status, kyc_status, type, country, livemode,
                     capabilities, requirements)
                 VALUES ($1, 'PENDING', 'not_started', 'custom', 'ZM', FALSE,
                         '{}', '{"currently_due": ["business_name","email","kyc_documents"]}')
                 RETURNING id`,
                [platformMerchantId]
            );
            resolvedAccountId = newAcct.rows[0].id;
        } else {
            // Verify the account belongs to this platform
            const accountRes = await pool.query(
                `SELECT id FROM connected_accounts WHERE id = $1 AND platform_merchant_id = $2`,
                [resolvedAccountId, platformMerchantId]
            );
            if (accountRes.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
        }

        // Get platform name for branding defaults
        const platformRes = await pool.query(
            `SELECT business_name FROM merchants WHERE id = $1`,
            [platformMerchantId]
        );
        const defaultPlatformName = platformRes.rows[0]?.business_name || 'Our Platform';

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const result = await pool.query(
            `INSERT INTO onboarding_links
                (token, platform_merchant_id, account_id, return_url, refresh_url, expires_at,
                 platform_name, platform_logo_url, platform_color)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [
                token, platformMerchantId, resolvedAccountId,
                return_url || null, refresh_url || null, expiresAt,
                platform_branding.name || defaultPlatformName,
                platform_branding.logo_url || null,
                platform_branding.color || '#f97316'
            ]
        );

        const link = result.rows[0];
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.status(201).json({
            id: link.id,
            token: link.token,
            url: `${frontendUrl}/connect/onboarding/${token}`,
            account_id: resolvedAccountId,
            expires_at: link.expires_at,
            created: true
        });
    } catch (err) {
        console.error('[OnboardingLinks POST]', err.message);
        res.status(500).json({ error: 'Failed to create onboarding link' });
    }
});

// GET /v1/connect/onboarding/:token — public: get session state + requirements
app.get('/v1/connect/onboarding/:token', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ol.*, ca.kyc_status, ca.requirements, ca.business_name as account_business_name,
                    ca.email as account_email, ca.country as account_country
             FROM onboarding_links ol
             LEFT JOIN connected_accounts ca ON ca.id = ol.account_id
             WHERE ol.token = $1`,
            [req.params.token]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Invalid onboarding link' });
        const link = result.rows[0];

        if (link.status === 'completed') {
            return res.json({
                status: 'completed',
                return_url: link.return_url,
                message: 'Onboarding already completed'
            });
        }
        if (new Date(link.expires_at) < new Date()) {
            return res.status(400).json({
                status: 'expired',
                refresh_url: link.refresh_url,
                error: 'This onboarding link has expired'
            });
        }

        // Build requirements list
        const requirements = link.requirements || { currently_due: ['kyc_documents'] };

        res.json({
            status: link.status,
            platform_name: link.platform_name,
            platform_color: link.platform_color,
            platform_logo_url: link.platform_logo_url,
            account_id: link.account_id,
            account: {
                business_name: link.account_business_name,
                email: link.account_email,
                country: link.account_country,
                kyc_status: link.kyc_status
            },
            requirements,
            partial_data: link.partial_data || {},
            expires_at: link.expires_at
        });
    } catch (err) {
        console.error('[OnboardingGet]', err.message);
        res.status(500).json({ error: 'Failed to load onboarding session' });
    }
});

// POST /v1/connect/onboarding/:token/save — public: save step progress
app.post('/v1/connect/onboarding/:token/save', async (req, res) => {
    const { step, data } = req.body;
    if (!step || !data) return res.status(400).json({ error: 'step and data required' });

    try {
        const linkRes = await pool.query(
            `SELECT * FROM onboarding_links WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
            [req.params.token]
        );
        if (linkRes.rows.length === 0) return res.status(404).json({ error: 'Invalid or expired token' });
        const link = linkRes.rows[0];

        // Merge step data into partial_data
        const current = link.partial_data || {};
        const updated = { ...current, [step]: { ...((current[step]) || {}), ...data, saved_at: new Date().toISOString() } };

        await pool.query(
            `UPDATE onboarding_links SET partial_data = $1 WHERE token = $2`,
            [JSON.stringify(updated), req.params.token]
        );

        res.json({ saved: true, step, data: updated[step] });
    } catch (err) {
        console.error('[OnboardingSave]', err.message);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// POST /v1/connect/onboarding/:token/submit — public: final KYC submission
app.post('/v1/connect/onboarding/:token/submit', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const linkRes = await client.query(
            `SELECT * FROM onboarding_links WHERE token = $1 AND status = 'pending' AND expires_at > NOW() FOR UPDATE`,
            [req.params.token]
        );
        if (linkRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invalid or expired token' });
        }
        const link = linkRes.rows[0];
        const pd = link.partial_data || {};

        // Build KYC payload from saved step data
        const kycPayload = {
            business_info: pd.business || {},
            identity: pd.identity || {},
            payout: pd.payout || {},
            submitted_via: 'hosted_onboarding',
            submitted_at: new Date().toISOString()
        };

        // Update connected account with collected KYC data
        const { business_info, identity, payout } = kycPayload;
        await client.query(
            `UPDATE connected_accounts SET
                business_name = COALESCE($1, business_name),
                kyc_status = 'pending_review',
                requirements = '{"currently_due":[],"pending_verification":["kyc_documents"]}',
                metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
                kyc_submitted_at = NOW()
             WHERE id = $3`,
            [business_info.business_name || null, JSON.stringify({ kyc_payload: kycPayload }), link.account_id]
        );

        // Save payout method if provided
        if (payout.type) {
            const pmData = payout.type === 'mobile_money'
                ? { type: 'mobile_money', mobile_network: payout.mobile_network, mobile_number: payout.mobile_number, verified: payout.mobile_verified || false }
                : { type: 'bank_account', bank_id: payout.bank_id, bank_name: payout.bank_name, account_number: payout.bank_account_number, account_holder_name: payout.bank_resolved_name, verified: payout.bank_verified || false };

            await client.query(
                `INSERT INTO connected_account_payout_methods
                    (connected_account_id, type, details, is_default)
                 VALUES ($1,$2,$3,TRUE)
                 ON CONFLICT DO NOTHING`,
                [link.account_id, payout.type, JSON.stringify(pmData)]
            );
        }

        // Mark link as completed
        await client.query(
            `UPDATE onboarding_links SET status='completed', used_at=NOW() WHERE token=$1`,
            [req.params.token]
        );

        await client.query('COMMIT');

        // Emit webhook to platform
        await emitWebhookForMerchant(link.platform_merchant_id, 'connect.onboarding.completed', {
            account_id: link.account_id,
            platform_merchant_id: link.platform_merchant_id
        });

        // Notify platform about new KYC submission
        io.to(`merchant:${link.platform_merchant_id}`).emit('kyc.submitted', {
            account_id: link.account_id,
            message: 'A sub-merchant has completed onboarding and submitted KYC for review'
        });

        res.json({
            status: 'completed',
            account_id: link.account_id,
            return_url: link.return_url,
            message: 'Onboarding submitted successfully. Your account is under review.'
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[OnboardingSubmit]', err.message);
        res.status(500).json({ error: 'Failed to submit onboarding' });
    } finally {
        client.release();
    }
});

// POST /v1/connect/onboarding/:token/verify-otp — send or confirm email OTP
app.post('/v1/connect/onboarding/:token/verify-otp', async (req, res) => {
    const { action, email, purpose = 'mobile_money_verification', code } = req.body;
    // action: 'send' | 'confirm'

    try {
        const linkRes = await pool.query(
            `SELECT * FROM onboarding_links WHERE token = $1 AND expires_at > NOW()`,
            [req.params.token]
        );
        if (linkRes.rows.length === 0) return res.status(404).json({ error: 'Invalid or expired token' });

        if (action === 'send') {
            if (!email) return res.status(400).json({ error: 'email required' });

            // Rate-limit: max 3 sends per token+purpose in 10 minutes
            const recentRes = await pool.query(
                `SELECT COUNT(*) FROM otp_verifications
                 WHERE onboarding_token=$1 AND purpose=$2 AND created_at > NOW() - INTERVAL '10 minutes'`,
                [req.params.token, purpose]
            );
            if (parseInt(recentRes.rows[0].count) >= 3) {
                return res.status(429).json({ error: 'Too many OTP requests. Please wait 10 minutes.' });
            }

            const otpCode = EmailService.generateOtpCode().toString();
            const codeHash = crypto.createHash('sha256').update(otpCode).digest('hex');
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

            await pool.query(
                `INSERT INTO otp_verifications (onboarding_token, purpose, recipient, code_hash, expires_at)
                 VALUES ($1,$2,$3,$4,$5)`,
                [req.params.token, purpose, email, codeHash, expiresAt]
            );

            await EmailService.sendOtp(email, {
                code: otpCode,
                context: purpose === 'mobile_money_verification'
                    ? 'Mobile Money number verification'
                    : 'Account verification',
                expiresIn: 10
            });

            res.json({ sent: true, message: 'OTP sent to ' + email.replace(/(.{2}).*(@.*)/, '$1***$2') });

        } else if (action === 'confirm') {
            if (!code) return res.status(400).json({ error: 'code required' });

            const codeHash = crypto.createHash('sha256').update(String(code)).digest('hex');

            // Find valid OTP
            const otpRes = await pool.query(
                `SELECT * FROM otp_verifications
                 WHERE onboarding_token=$1 AND purpose=$2 AND verified_at IS NULL
                   AND expires_at > NOW() AND attempts < 5
                 ORDER BY created_at DESC LIMIT 1`,
                [req.params.token, purpose]
            );

            if (otpRes.rows.length === 0) {
                return res.status(400).json({ error: 'No active OTP found or OTP has expired' });
            }
            const otp = otpRes.rows[0];

            // Increment attempts
            await pool.query(
                `UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1`,
                [otp.id]
            );

            if (otp.code_hash !== codeHash) {
                const remaining = 4 - otp.attempts;
                return res.status(400).json({ error: `Incorrect code. ${remaining} attempt(s) remaining.` });
            }

            // Mark verified
            await pool.query(
                `UPDATE otp_verifications SET verified_at = NOW() WHERE id = $1`,
                [otp.id]
            );

            res.json({ verified: true, purpose });

        } else {
            res.status(400).json({ error: 'action must be "send" or "confirm"' });
        }
    } catch (err) {
        console.error('[OnboardingOTP]', err.message);
        res.status(500).json({ error: 'OTP operation failed' });
    }
});

// POST /v1/connect/onboarding/:token/verify-bank — real-time LENCO bank resolve
app.post('/v1/connect/onboarding/:token/verify-bank', async (req, res) => {
    const { bank_id, account_number, country = 'zm' } = req.body;
    if (!bank_id || !account_number) return res.status(400).json({ error: 'bank_id and account_number required' });

    try {
        const linkRes = await pool.query(
            `SELECT id FROM onboarding_links WHERE token = $1 AND expires_at > NOW()`,
            [req.params.token]
        );
        if (linkRes.rows.length === 0) return res.status(404).json({ error: 'Invalid or expired token' });

        const response = await axios.post(
            `${LENCO_BASE_URL}/resolve/bank-account`,
            { bankId: bank_id, accountNumber: account_number, country: country.toUpperCase() },
            { headers: { Authorization: `Bearer ${LENCO_SECRET_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
        );

        const data = response.data?.data || response.data;
        if (!data?.accountName) {
            return res.status(422).json({ error: 'Could not resolve account. Please check the details.' });
        }

        res.json({
            resolved: true,
            account_name: data.accountName,
            account_number: data.accountNumber || account_number,
            bank_id
        });
    } catch (err) {
        const msg = err.response?.data?.message || err.message;
        console.error('[OnboardingBankVerify]', msg);
        if (err.response?.status === 404 || err.response?.status === 422) {
            return res.status(422).json({ error: 'Account not found. Please check the account number.' });
        }
        res.status(500).json({ error: 'Bank verification failed. Please try again.' });
    }
});

// ─── PHASE 4: TIERED FEE SCHEDULES ───────────────────────────────────────────

// GET /v1/connect/fee-tiers
app.get('/v1/connect/fee-tiers', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM connect_fee_tiers WHERE platform_merchant_id = $1 ORDER BY min_volume ASC`,
            [req.merchant.merchant_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch fee tiers' });
    }
});

// PUT /v1/connect/fee-tiers — replace all tiers atomically
app.put('/v1/connect/fee-tiers', authenticateMerchant, async (req, res) => {
    const { tiers } = req.body; // [{ min_volume, max_volume, fee_percent }]
    if (!Array.isArray(tiers) || tiers.length === 0) return res.status(400).json({ error: 'tiers array required' });
    const platformMerchantId = req.merchant.merchant_id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM connect_fee_tiers WHERE platform_merchant_id = $1`, [platformMerchantId]);
        for (const tier of tiers) {
            await client.query(
                `INSERT INTO connect_fee_tiers (platform_merchant_id, min_volume, max_volume, fee_percent)
                 VALUES ($1,$2,$3,$4)`,
                [platformMerchantId, parseFloat(tier.min_volume) || 0,
                 tier.max_volume != null ? parseFloat(tier.max_volume) : null,
                 parseFloat(tier.fee_percent)]
            );
        }
        await client.query('COMMIT');
        const result = await pool.query(
            `SELECT * FROM connect_fee_tiers WHERE platform_merchant_id = $1 ORDER BY min_volume ASC`,
            [platformMerchantId]
        );
        res.json(result.rows);
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        res.status(500).json({ error: 'Failed to save fee tiers' });
    } finally {
        client.release();
    }
});

// ─── PHASE 4: CONNECT LEDGER ──────────────────────────────────────────────────

// GET /v1/connect/ledger?from=&to=&type=&limit=
app.get('/v1/connect/ledger', authenticateMerchant, async (req, res) => {
    const platformMerchantId = req.merchant.merchant_id;
    const { from, to, entry_type, limit = 100, offset = 0 } = req.query;
    try {
        const conditions = [`l.platform_merchant_id = $1`];
        const params = [platformMerchantId];
        let idx = 2;

        // Use date + time bounds so end-of-day entries are included
        if (from) { conditions.push(`l.created_at >= $${idx++}`); params.push(from + 'T00:00:00'); }
        if (to)   { conditions.push(`l.created_at <= $${idx++}`); params.push(to   + 'T23:59:59'); }
        if (entry_type) { conditions.push(`l.entry_type = $${idx++}`); params.push(entry_type); }

        const where = 'WHERE ' + conditions.join(' AND ');

        const rows = await pool.query(
            `SELECT l.*,
                COALESCE(
                    ca.business_name,
                    ca.metadata->'kyc_payload'->'identity'->>'business_name',
                    ca.metadata->'kyc_payload'->'identity'->>'full_name',
                    ca.email
                ) AS account_name
             FROM connect_ledger l
             LEFT JOIN connected_accounts ca ON ca.id = l.account_id
             ${where} ORDER BY l.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        // Summary uses same filters (no pagination)
        const summaryRes = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE 0 END), 0) AS total_credits,
                COALESCE(SUM(CASE WHEN direction='debit'  THEN amount ELSE 0 END), 0) AS total_debits,
                COUNT(*) AS total_entries
             FROM connect_ledger l ${where}`,
            params
        );

        const totalCredits = parseFloat(summaryRes.rows[0].total_credits);
        const totalDebits  = parseFloat(summaryRes.rows[0].total_debits);
        res.json({
            entries: rows.rows,
            summary: {
                total_credits: totalCredits,
                total_debits:  totalDebits,
                net_balance:   totalCredits - totalDebits,
                currency:      'ZMW',
                total_entries: parseInt(summaryRes.rows[0].total_entries)
            }
        });
    } catch (err) {
        console.error('[Ledger]', err.message);
        res.status(500).json({ error: 'Failed to fetch ledger' });
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

// --- Connect Platform Configuration ---

// GET /v1/connect/config — Fetch platform's fee & payout config
app.get('/v1/connect/config', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM connect_config WHERE merchant_id = $1',
            [req.merchant.merchant_id]
        );
        if (result.rows.length === 0) {
            // Return defaults if never configured
            return res.json({
                platform_fee_percent: 2.50,
                fee_collection_method: 'per_transaction',
                settlement_delay_days: 1,
                min_payout_threshold: 50.00,
                auto_payout_enabled: false,
                auto_payout_schedule: 'daily',
                currency: 'ZMW'
            });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Connect Config GET] Error:', err);
        res.status(500).json({ error: 'Failed to fetch connect configuration' });
    }
});

// PATCH /v1/connect/config — Save or update platform fee & payout config
app.patch('/v1/connect/config', authenticateMerchant, async (req, res) => {
    const {
        platform_fee_percent,
        fee_collection_method,
        settlement_delay_days,
        min_payout_threshold,
        auto_payout_enabled,
        auto_payout_schedule,
        currency
    } = req.body;

    // Basic validation
    if (platform_fee_percent !== undefined && (platform_fee_percent < 0 || platform_fee_percent > 20)) {
        return res.status(400).json({ error: 'platform_fee_percent must be between 0 and 20' });
    }
    if (fee_collection_method && !['per_transaction', 'monthly'].includes(fee_collection_method)) {
        return res.status(400).json({ error: 'Invalid fee_collection_method' });
    }
    if (settlement_delay_days !== undefined && ![0, 1, 2].includes(settlement_delay_days)) {
        return res.status(400).json({ error: 'settlement_delay_days must be 0, 1, or 2' });
    }
    if (auto_payout_schedule && !['daily', 'weekly', 'monthly'].includes(auto_payout_schedule)) {
        return res.status(400).json({ error: 'Invalid auto_payout_schedule' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO connect_config (
                merchant_id, platform_fee_percent, fee_collection_method,
                settlement_delay_days, min_payout_threshold,
                auto_payout_enabled, auto_payout_schedule, currency, updated_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             ON CONFLICT (merchant_id) DO UPDATE SET
                platform_fee_percent = EXCLUDED.platform_fee_percent,
                fee_collection_method = EXCLUDED.fee_collection_method,
                settlement_delay_days = EXCLUDED.settlement_delay_days,
                min_payout_threshold = EXCLUDED.min_payout_threshold,
                auto_payout_enabled = EXCLUDED.auto_payout_enabled,
                auto_payout_schedule = EXCLUDED.auto_payout_schedule,
                currency = EXCLUDED.currency,
                updated_at = NOW()
             RETURNING *`,
            [
                req.merchant.merchant_id,
                platform_fee_percent ?? 2.50,
                fee_collection_method ?? 'per_transaction',
                settlement_delay_days ?? 1,
                min_payout_threshold ?? 50.00,
                auto_payout_enabled ?? false,
                auto_payout_schedule ?? 'daily',
                currency ?? 'ZMW'
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Connect Config PATCH] Error:', err);
        res.status(500).json({ error: 'Failed to save connect configuration' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5: ON-DEMAND PAYOUT REQUESTS + STATEMENTS + SUB-MERCHANT PORTAL
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Payout Requests ─────────────────────────────────────────────────────────

// POST /v1/connect/accounts/:id/payout-request — sub-merchant requests instant payout
app.post('/v1/connect/accounts/:id/payout-request', authenticateMerchant, async (req, res) => {
    const { amount, currency = 'ZMW', note } = req.body;
    const platformMerchantId = req.merchant.merchant_id;
    const accountId = req.params.id;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
        return res.status(400).json({ error: 'Valid amount required' });

    try {
        // Verify account belongs to platform
        const acctRes = await pool.query(
            `SELECT id, status, email, business_name FROM connected_accounts WHERE id = $1 AND platform_merchant_id = $2`,
            [accountId, platformMerchantId]
        );
        if (acctRes.rows.length === 0) return res.status(404).json({ error: 'Account not found' });
        if (acctRes.rows[0].status === 'SUSPENDED') return res.status(403).json({ error: 'Account is suspended' });

        // Check available balance
        const balRes = await pool.query(
            `SELECT (pending_amount + available_amount) as total FROM balances WHERE merchant_id = $1`,
            [accountId]
        );
        const available = parseFloat(balRes.rows[0]?.total || 0);
        const requested = parseFloat(amount);
        if (requested > available)
            return res.status(400).json({ error: 'Requested amount exceeds available balance', available });

        const result = await pool.query(
            `INSERT INTO payout_requests (account_id, platform_merchant_id, amount, currency, note, livemode)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [accountId, platformMerchantId, requested, currency, note || null, false]
        );

        // Notify platform via webhook
        const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
        emitWebhookForMerchant(platformMerchantId, 'payout_request.created', {
            request_id: result.rows[0].id, account_id: accountId, amount: requested, currency
        }).catch(() => {});

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[PayoutRequest] Create error:', err.message);
        res.status(500).json({ error: 'Failed to create payout request' });
    }
});

// GET /v1/connect/payout-requests — list all pending requests for platform
app.get('/v1/connect/payout-requests', authenticateMerchant, async (req, res) => {
    const platformMerchantId = req.merchant.merchant_id;
    const { status = 'pending', limit = 50, offset = 0 } = req.query;

    try {
        const result = await pool.query(
            `SELECT pr.*, ca.business_name, ca.email as account_email
             FROM payout_requests pr
             JOIN connected_accounts ca ON ca.id = pr.account_id
             WHERE pr.platform_merchant_id = $1
               AND ($2 = 'all' OR pr.status = $2)
             ORDER BY pr.created_at DESC
             LIMIT $3 OFFSET $4`,
            [platformMerchantId, status, parseInt(limit), parseInt(offset)]
        );
        const countRes = await pool.query(
            `SELECT COUNT(*) FROM payout_requests WHERE platform_merchant_id = $1 AND ($2 = 'all' OR status = $2)`,
            [platformMerchantId, status]
        );
        res.json({ requests: result.rows, total: parseInt(countRes.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payout requests' });
    }
});

// GET /v1/connect/accounts/:id/payout-requests — list requests for a specific account
app.get('/v1/connect/accounts/:id/payout-requests', authenticateMerchant, async (req, res) => {
    const platformMerchantId = req.merchant.merchant_id;
    try {
        const result = await pool.query(
            `SELECT * FROM payout_requests
             WHERE account_id = $1 AND platform_merchant_id = $2
             ORDER BY created_at DESC LIMIT 20`,
            [req.params.id, platformMerchantId]
        );
        res.json({ requests: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payout requests' });
    }
});

// PATCH /v1/connect/payout-requests/:id — approve or deny a payout request
app.patch('/v1/connect/payout-requests/:id', authenticateMerchant, async (req, res) => {
    const { action, platform_note } = req.body;  // action: 'approve' | 'deny'
    const platformMerchantId = req.merchant.merchant_id;

    if (!['approve', 'deny'].includes(action))
        return res.status(400).json({ error: 'action must be approve or deny' });

    try {
        const reqRes = await pool.query(
            `SELECT pr.*, ca.email, ca.business_name FROM payout_requests pr
             JOIN connected_accounts ca ON ca.id = pr.account_id
             WHERE pr.id = $1 AND pr.platform_merchant_id = $2`,
            [req.params.id, platformMerchantId]
        );
        if (reqRes.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
        const request = reqRes.rows[0];
        if (request.status !== 'pending') return res.status(409).json({ error: `Request is already ${request.status}` });

        const newStatus = action === 'approve' ? 'approved' : 'denied';
        const result = await pool.query(
            `UPDATE payout_requests
             SET status = $1, platform_note = $2, reviewed_at = NOW()
             WHERE id = $3 RETURNING *`,
            [newStatus, platform_note || null, req.params.id]
        );

        // If approved → trigger immediate payout
        if (action === 'approve') {
            const { executePayout } = require('./services/PayoutSchedulerService');
            executePayout(request.account_id, parseFloat(request.amount), request.currency, platformMerchantId, null)
                .then(async (r) => {
                    if (r.status === 'completed') {
                        await pool.query(
                            `UPDATE payout_requests SET status='completed', payout_id=$1 WHERE id=$2`,
                            [r.payoutId, req.params.id]
                        );
                    } else {
                        await pool.query(
                            `UPDATE payout_requests SET status='failed' WHERE id=$2`,
                            [req.params.id]
                        );
                    }
                })
                .catch(() => {});
        }

        // Email sub-merchant about decision
        if (request.email) {
            resend.emails.send({
                from: 'FlapaPay <noreply@flapapay.com>',
                to: [request.email],
                subject: action === 'approve'
                    ? `Your payout request of ${request.currency} ${parseFloat(request.amount).toLocaleString()} has been approved`
                    : `Payout request update`,
                html: action === 'approve'
                    ? `<p>Hi ${request.business_name || 'there'},</p><p>Your payout request of <strong>${request.currency} ${parseFloat(request.amount).toLocaleString()}</strong> has been <strong>approved</strong> and is being processed. You should receive the funds shortly.</p><p>— The FlapaPay Team</p>`
                    : `<p>Hi ${request.business_name || 'there'},</p><p>Your payout request of <strong>${request.currency} ${parseFloat(request.amount).toLocaleString()}</strong> has been <strong>declined</strong>.</p>${platform_note ? `<p>Reason: ${platform_note}</p>` : ''}<p>Please contact your platform for more information.</p><p>— The FlapaPay Team</p>`,
            }).catch(() => {});
        }

        const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
        emitWebhookForMerchant(platformMerchantId, `payout_request.${newStatus}`, {
            request_id: req.params.id, account_id: request.account_id,
            amount: request.amount, currency: request.currency
        }).catch(() => {});

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[PayoutRequest] Approve/Deny error:', err.message);
        res.status(500).json({ error: 'Failed to process payout request' });
    }
});

// ─── Monthly Statements ───────────────────────────────────────────────────────

// POST /v1/connect/accounts/:id/statements/generate — generate statement for a period
app.post('/v1/connect/accounts/:id/statements/generate', authenticateMerchant, async (req, res) => {
    const platformMerchantId = req.merchant.merchant_id;
    const accountId = req.params.id;
    const { year, month } = req.body;  // e.g. year: 2025, month: 6

    if (!year || !month) return res.status(400).json({ error: 'year and month required' });

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);  // last day of month

    try {
        // Verify account
        const acctRes = await pool.query(
            `SELECT * FROM connected_accounts WHERE id = $1 AND platform_merchant_id = $2`,
            [accountId, platformMerchantId]
        );
        if (acctRes.rows.length === 0) return res.status(404).json({ error: 'Account not found' });

        // Aggregate charges
        const chargesRes = await pool.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
             FROM charges
             WHERE destination_merchant_id = $1
               AND status = 'succeeded'
               AND created_at >= $2 AND created_at < $3`,
            [accountId, periodStart, new Date(year, month, 1)]
        );
        // Aggregate refunds
        const refundsRes = await pool.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(r.amount), 0) as total
             FROM refunds r
             JOIN charges c ON c.id = r.charge_id
             WHERE c.destination_merchant_id = $1
               AND r.status = 'succeeded'
               AND r.created_at >= $2 AND r.created_at < $3`,
            [accountId, periodStart, new Date(year, month, 1)]
        );
        // Aggregate payouts disbursed
        const payoutsRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total
             FROM connect_ledger
             WHERE account_id = $1
               AND entry_type = 'payout_disbursed'
               AND created_at >= $2 AND created_at < $3`,
            [accountId, periodStart, new Date(year, month, 1)]
        );
        // Aggregate platform fees collected
        const feesRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total
             FROM connect_ledger
             WHERE account_id = $1
               AND entry_type = 'fee_collected'
               AND created_at >= $2 AND created_at < $3`,
            [accountId, periodStart, new Date(year, month, 1)]
        );

        const chargesCount = parseInt(chargesRes.rows[0].count);
        const chargesAmount = parseFloat(chargesRes.rows[0].total);
        const refundsCount = parseInt(refundsRes.rows[0].count);
        const refundsAmount = parseFloat(refundsRes.rows[0].total);
        const payoutsAmount = parseFloat(payoutsRes.rows[0].total);
        const feesAmount = parseFloat(feesRes.rows[0].total);
        const netEarnings = chargesAmount - refundsAmount - feesAmount;

        // Upsert statement
        const stmt = await pool.query(
            `INSERT INTO connect_statements
                (account_id, platform_merchant_id, period_start, period_end,
                 total_charges_count, total_charges_amount, total_refunds_count, total_refunds_amount,
                 total_payouts_amount, platform_fees_amount, net_earnings, currency)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ZMW')
             ON CONFLICT (account_id, period_start, livemode) DO UPDATE SET
                total_charges_count = EXCLUDED.total_charges_count,
                total_charges_amount = EXCLUDED.total_charges_amount,
                total_refunds_count = EXCLUDED.total_refunds_count,
                total_refunds_amount = EXCLUDED.total_refunds_amount,
                total_payouts_amount = EXCLUDED.total_payouts_amount,
                platform_fees_amount = EXCLUDED.platform_fees_amount,
                net_earnings = EXCLUDED.net_earnings
             RETURNING *`,
            [
                accountId, platformMerchantId, periodStart, periodEnd,
                chargesCount, chargesAmount, refundsCount, refundsAmount,
                payoutsAmount, feesAmount, netEarnings
            ]
        );

        res.json(stmt.rows[0]);
    } catch (err) {
        console.error('[Statement] Generate error:', err.message);
        res.status(500).json({ error: 'Failed to generate statement' });
    }
});

// GET /v1/connect/accounts/:id/statements — list statements for account
app.get('/v1/connect/accounts/:id/statements', authenticateMerchant, async (req, res) => {
    const platformMerchantId = req.merchant.merchant_id;
    try {
        const result = await pool.query(
            `SELECT s.*, ca.business_name, ca.email
             FROM connect_statements s
             JOIN connected_accounts ca ON ca.id = s.account_id
             WHERE s.account_id = $1 AND s.platform_merchant_id = $2
             ORDER BY s.period_start DESC LIMIT 24`,
            [req.params.id, platformMerchantId]
        );
        res.json({ statements: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch statements' });
    }
});

// POST /v1/connect/accounts/:id/statements/:stmtId/email — email statement to sub-merchant
app.post('/v1/connect/accounts/:id/statements/:stmtId/email', authenticateMerchant, async (req, res) => {
    const platformMerchantId = req.merchant.merchant_id;
    try {
        const stmtRes = await pool.query(
            `SELECT s.*, ca.email, ca.business_name
             FROM connect_statements s
             JOIN connected_accounts ca ON ca.id = s.account_id
             WHERE s.id = $1 AND s.platform_merchant_id = $2`,
            [req.params.stmtId, platformMerchantId]
        );
        if (stmtRes.rows.length === 0) return res.status(404).json({ error: 'Statement not found' });
        const stmt = stmtRes.rows[0];

        if (!stmt.email) return res.status(400).json({ error: 'Account has no email address' });

        const periodLabel = new Date(stmt.period_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        await resend.emails.send({
            from: 'FlapaPay <noreply@flapapay.com>',
            to: [stmt.email],
            subject: `Your FlapaPay Statement — ${periodLabel}`,
            html: `
<p>Hi ${stmt.business_name || 'there'},</p>
<p>Your statement for <strong>${periodLabel}</strong> is ready.</p>
<table style="border-collapse:collapse;width:100%;max-width:500px;font-family:sans-serif;font-size:14px;">
  <tr style="background:#f5f5f5;"><td style="padding:8px 12px;font-weight:bold;">Metric</td><td style="padding:8px 12px;font-weight:bold;text-align:right;">Amount</td></tr>
  <tr><td style="padding:8px 12px;border-top:1px solid #eee;">Total Charges (${stmt.total_charges_count})</td><td style="padding:8px 12px;text-align:right;border-top:1px solid #eee;">${stmt.currency} ${parseFloat(stmt.total_charges_amount).toLocaleString()}</td></tr>
  <tr><td style="padding:8px 12px;border-top:1px solid #eee;">Total Refunds (${stmt.total_refunds_count})</td><td style="padding:8px 12px;text-align:right;border-top:1px solid #eee;">- ${stmt.currency} ${parseFloat(stmt.total_refunds_amount).toLocaleString()}</td></tr>
  <tr><td style="padding:8px 12px;border-top:1px solid #eee;">Platform Fees</td><td style="padding:8px 12px;text-align:right;border-top:1px solid #eee;">- ${stmt.currency} ${parseFloat(stmt.platform_fees_amount).toLocaleString()}</td></tr>
  <tr><td style="padding:8px 12px;border-top:1px solid #eee;">Payouts Received</td><td style="padding:8px 12px;text-align:right;border-top:1px solid #eee;">${stmt.currency} ${parseFloat(stmt.total_payouts_amount).toLocaleString()}</td></tr>
  <tr style="background:#fffbf0;font-weight:bold;"><td style="padding:10px 12px;border-top:2px solid #f97316;">Net Earnings</td><td style="padding:10px 12px;text-align:right;border-top:2px solid #f97316;color:#f97316;">${stmt.currency} ${parseFloat(stmt.net_earnings).toLocaleString()}</td></tr>
</table>
<p>Log in to your dashboard to view full transaction details.</p>
<p>— The FlapaPay Team</p>`,
        });

        await pool.query(`UPDATE connect_statements SET emailed_at = NOW() WHERE id = $1`, [req.params.stmtId]);
        res.json({ sent: true, to: stmt.email });
    } catch (err) {
        console.error('[Statement] Email error:', err.message);
        res.status(500).json({ error: 'Failed to send statement email' });
    }
});

// ─── Sub-merchant Portal Auth ─────────────────────────────────────────────────

// POST /v1/connect/portal/login — sub-merchant logs in with email + password
app.post('/v1/connect/portal/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    try {
        const bcrypt = require('bcrypt');
        const crypto = require('crypto');

        const acctRes = await pool.query(
            `SELECT * FROM connected_accounts WHERE email = $1`,
            [email.toLowerCase().trim()]
        );
        if (acctRes.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const account = acctRes.rows[0];

        if (!account.password_hash) return res.status(401).json({ error: 'Account has no password set. Use invite link to register.' });

        const match = await bcrypt.compare(password, account.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        if (account.status === 'SUSPENDED') return res.status(403).json({ error: 'Account is suspended' });

        // Create session token
        const token = crypto.randomBytes(48).toString('hex');
        await pool.query(
            `INSERT INTO submerchant_sessions (account_id, token, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
            [account.id, token]
        );

        const { id, business_name, kyc_status, status, platform_merchant_id } = account;
        res.json({ token, account: { id, business_name, email: account.email, kyc_status, status, platform_merchant_id } });
    } catch (err) {
        console.error('[PortalLogin] Error:', err.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Middleware: authenticate sub-merchant portal session
async function authenticateSubMerchant(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.slice(7);
    try {
        const sesRes = await pool.query(
            `SELECT s.*, ca.* FROM submerchant_sessions s
             JOIN connected_accounts ca ON ca.id = s.account_id
             WHERE s.token = $1 AND s.expires_at > NOW()`,
            [token]
        );
        if (sesRes.rows.length === 0) return res.status(401).json({ error: 'Session expired or invalid' });
        req.subMerchant = sesRes.rows[0];
        next();
    } catch (err) {
        res.status(500).json({ error: 'Auth error' });
    }
}

// GET /v1/connect/portal/me — get own account details including payout methods + onboarding status
app.get('/v1/connect/portal/me', authenticateSubMerchant, async (req, res) => {
    const acct = req.subMerchant;
    try {
        const [balRes, payoutMethodsRes, onboardingRes] = await Promise.all([
            pool.query(`SELECT pending_amount, available_amount FROM balances WHERE merchant_id = $1`, [acct.account_id]),
            pool.query(`SELECT id, type, details, is_default FROM connected_account_payout_methods WHERE connected_account_id = $1 ORDER BY is_default DESC, created_at DESC`, [acct.account_id]),
            pool.query(`SELECT status, used_at, expires_at FROM onboarding_links WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1`, [acct.account_id]),
        ]);
        const balance = balRes.rows[0] || { pending_amount: 0, available_amount: 0 };
        const onboardingLink = onboardingRes.rows[0] || null;
        res.json({
            id: acct.account_id,
            business_name: acct.business_name,
            email: acct.email,
            kyc_status: acct.kyc_status,
            status: acct.status,
            platform_merchant_id: acct.platform_merchant_id,
            balance: {
                available: Math.max(parseFloat(balance.available_amount || 0), 0),
                pending: Math.max(parseFloat(balance.pending_amount || 0), 0),
            },
            payout_methods: payoutMethodsRes.rows,
            onboarding: onboardingLink ? {
                status: onboardingLink.status,
                completed: onboardingLink.status === 'completed',
            } : null,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch account' });
    }
});

// GET /v1/connect/portal/charges — own charge history
app.get('/v1/connect/portal/charges', authenticateSubMerchant, async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    try {
        const result = await pool.query(
            `SELECT id, amount, currency, status, payment_method, description, created_at
             FROM charges
             WHERE destination_merchant_id = $1
             ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [req.subMerchant.account_id, parseInt(limit), parseInt(offset)]
        );
        res.json({ charges: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch charges' });
    }
});

// GET /v1/connect/portal/payouts — own payout history
app.get('/v1/connect/portal/payouts', authenticateSubMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, amount, currency, direction, description, created_at
             FROM connect_ledger
             WHERE account_id = $1 AND entry_type = 'payout_disbursed'
             ORDER BY created_at DESC LIMIT 20`,
            [req.subMerchant.account_id]
        );
        res.json({ payouts: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payouts' });
    }
});

// GET /v1/connect/portal/statements — own statements
app.get('/v1/connect/portal/statements', authenticateSubMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM connect_statements WHERE account_id = $1 ORDER BY period_start DESC LIMIT 24`,
            [req.subMerchant.account_id]
        );
        res.json({ statements: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch statements' });
    }
});

// POST /v1/connect/portal/payout-requests — sub-merchant requests a payout
app.post('/v1/connect/portal/payout-requests', authenticateSubMerchant, async (req, res) => {
    const { amount, currency = 'ZMW', note } = req.body;
    const acct = req.subMerchant;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
        return res.status(400).json({ error: 'Valid amount required' });

    try {
        const balRes = await pool.query(
            `SELECT (pending_amount + available_amount) as total FROM balances WHERE merchant_id = $1`,
            [acct.account_id]
        );
        const available = parseFloat(balRes.rows[0]?.total || 0);
        if (parseFloat(amount) > available)
            return res.status(400).json({ error: 'Requested amount exceeds available balance', available });

        // Check for already-pending request
        const existingRes = await pool.query(
            `SELECT id FROM payout_requests WHERE account_id = $1 AND status = 'pending' LIMIT 1`,
            [acct.account_id]
        );
        if (existingRes.rows.length > 0)
            return res.status(409).json({ error: 'You already have a pending payout request' });

        const result = await pool.query(
            `INSERT INTO payout_requests (account_id, platform_merchant_id, amount, currency, note)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [acct.account_id, acct.platform_merchant_id, parseFloat(amount), currency, note || null]
        );

        const { emitWebhookForMerchant } = require('./services/PayoutSchedulerService');
        emitWebhookForMerchant(acct.platform_merchant_id, 'payout_request.created', {
            request_id: result.rows[0].id, account_id: acct.account_id, amount, currency
        }).catch(() => {});

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[PortalPayoutRequest] Error:', err.message);
        res.status(500).json({ error: 'Failed to submit payout request' });
    }
});

// GET /v1/connect/portal/payout-requests — own payout request history
app.get('/v1/connect/portal/payout-requests', authenticateSubMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM payout_requests WHERE account_id = $1 ORDER BY created_at DESC LIMIT 20`,
            [req.subMerchant.account_id]
        );
        res.json({ requests: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payout requests' });
    }
});

// GET /v1/connect/portal/kyc — sub-merchant lists their own KYC documents
app.get('/v1/connect/portal/kyc', authenticateSubMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, document_type, file_url, file_name, status, rejection_reason, uploaded_at
             FROM connected_account_kyc
             WHERE account_id = $1
             ORDER BY uploaded_at DESC`,
            [req.subMerchant.account_id]
        );
        res.json({ documents: result.rows });
    } catch (err) {
        console.error('[Portal KYC] List error:', err);
        res.status(500).json({ error: 'Failed to fetch KYC documents' });
    }
});

// POST /v1/connect/portal/kyc — sub-merchant uploads a KYC document
app.post('/v1/connect/portal/kyc', authenticateSubMerchant, uploadKyc.single('document'), async (req, res) => {
    const { document_type, file_url: bodyFileUrl, file_name: bodyFileName } = req.body;
    const accountId = req.subMerchant.account_id;

    if (!document_type) return res.status(400).json({ error: 'document_type is required' });
    if (!req.file && !bodyFileUrl) return res.status(400).json({ error: 'A document file or file_url is required' });

    const file_url = req.file ? `/assets/images/kyc/${req.file.filename}` : bodyFileUrl;
    const file_name = req.file ? req.file.originalname : (bodyFileName || null);

    try {
        const result = await pool.query(
            `INSERT INTO connected_account_kyc (account_id, document_type, file_url, file_name)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [accountId, document_type, file_url, file_name]
        );
        await pool.query(
            `UPDATE connected_accounts SET kyc_status = 'pending_review', kyc_submitted_at = NOW()
             WHERE id = $1 AND kyc_status = 'unverified'`,
            [accountId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[Portal KYC] Upload error:', err);
        res.status(500).json({ error: 'Failed to upload KYC document' });
    }
});

// POST /v1/connect/portal/payout-execute — process real payout via PawaPay (mobile) or Lenco (bank)
app.post('/v1/connect/portal/payout-execute', authenticateSubMerchant, async (req, res) => {
    const { amount, type = 'standard' } = req.body;
    const acct = req.subMerchant;
    const accountId = acct.account_id;

    const amountZmw = parseFloat(amount);
    if (!amount || isNaN(amountZmw) || amountZmw <= 0)
        return res.status(400).json({ error: 'Valid amount required' });

    // balances.available_amount is stored in ngwe (1/100 ZMW); client sends ZMW
    const amountNgwe = Math.round(amountZmw * 100);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Check balance in ngwe
        const balRes = await client.query(
            `SELECT available_amount FROM balances WHERE merchant_id = $1 FOR UPDATE`,
            [accountId]
        );
        const availableNgwe = parseFloat(balRes.rows[0]?.available_amount || 0);
        if (amountNgwe > availableNgwe)
            return res.status(400).json({ error: 'Amount exceeds available balance', available: availableNgwe / 100 });

        // 2. Get default payout method
        const pmRes = await client.query(
            `SELECT * FROM connected_account_payout_methods
             WHERE connected_account_id = $1 AND is_default = TRUE LIMIT 1`,
            [accountId]
        );
        if (pmRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No default payout method. Complete onboarding first.' });
        }
        const pm = pmRes.rows[0];
        const details = pm.details || {};

        // 3. Fee calculation in ngwe; response amounts in ZMW
        const instantFeeNgwe = type === 'instant' ? Math.round(amountNgwe * 0.02) : 0;
        const netAmountNgwe  = amountNgwe - instantFeeNgwe;
        const netAmountZmw   = netAmountNgwe / 100;
        const feeZmw         = instantFeeNgwe / 100;

        const mobileNetwork = (details.mobile_network || details.provider || '').toUpperCase();
        const mobileNumber  = details.mobile_number || details.number || '';
        const destStr = pm.type === 'mobile_money'
            ? `${mobileNetwork} ${mobileNumber}`.trim()
            : `${details.bank_name || 'Bank'} ****${String(details.account_number || '').slice(-4)}`;

        // 4. Deduct available balance (ngwe), floor at 0 to prevent negatives
        await client.query(
            `UPDATE balances
             SET available_amount = GREATEST(available_amount - $1, 0), updated_at = NOW()
             WHERE merchant_id = $2`,
            [amountNgwe, accountId]
        );

        // 5. Record in connect_ledger (amount in ngwe for consistency with charges)
        const payoutRef = 'CPO-' + crypto.randomBytes(6).toString('hex').toUpperCase();
        await client.query(
            `INSERT INTO connect_ledger
                (platform_merchant_id, entry_type, charge_id, account_id, amount, currency, direction, description, livemode)
             VALUES ($1, 'payout_disbursed', $2, $3, $4, 'ZMW', 'debit', $5, FALSE)`,
            [acct.platform_merchant_id, payoutRef, accountId, amountNgwe,
             `${type === 'instant' ? 'Instant' : 'Standard'} payout to ${destStr}`]
        );

        // 6. INSERT a new payout_requests row so history is always tracked
        await client.query(
            `INSERT INTO payout_requests (account_id, platform_merchant_id, amount, currency, status, note, livemode)
             VALUES ($1, $2, $3, 'ZMW', 'completed', $4, FALSE)`,
            [accountId, acct.platform_merchant_id, amountNgwe,
             `${type === 'instant' ? 'Instant' : 'Standard'} payout to ${destStr} — ref ${payoutRef}`]
        );

        // 7. Mark any older pending requests resolved too
        await client.query(
            `UPDATE payout_requests SET status = 'completed'
             WHERE account_id = $1 AND status = 'pending'`,
            [accountId]
        );

        await client.query('COMMIT');

        // 8. External transfer (after commit — non-fatal)
        let externalResult = { provider: pm.type, status: 'processing', reference: payoutRef };

        if (pm.type === 'mobile_money') {
            const NETWORK_PROVIDER = {
                mtn: 'MTN_MOMO_ZMB',
                airtel: 'AIRTEL_OAPI_ZMB',
                zamtel: 'ZAMTEL_ZMB',
            };
            const provider = NETWORK_PROVIDER[(mobileNetwork).toLowerCase()] || 'MTN_MOMO_ZMB';
            const pawapayId = crypto.randomUUID();
            try {
                const r = await axios.post(`${PAWAPAY_BASE_URL}/v2/payouts`, {
                    payoutId: pawapayId,
                    recipient: { type: 'MMO', accountDetails: { phoneNumber: mobileNumber, provider } },
                    amount: netAmountZmw.toFixed(2),
                    currency: 'ZMW',
                    clientReferenceId: payoutRef,
                    customerMessage: `FlapaPay Connect payout — ${acct.business_name || acct.email}`,
                    metadata: [{ orderId: payoutRef }]
                }, {
                    headers: { 'Authorization': `Bearer ${PAWAPAY_TOKEN}`, 'Content-Type': 'application/json' }
                });
                externalResult = { provider: 'pawapay', payout_id: pawapayId, status: r.data.status, reference: payoutRef };
            } catch (e) {
                console.error('[ConnectPayout][PawaPay]', e.response?.data || e.message);
                externalResult = { provider: 'pawapay', status: 'ENQUEUED', reference: payoutRef, note: 'Will retry' };
            }
        } else if (pm.type === 'bank_account') {
            const LENCO_ACCOUNT = 'e24f5dee-3b7b-4fbd-835f-b75365a7c4cd';
            try {
                await axios.post(`${LENCO_BASE_URL}/transfers/bank-account`, {
                    accountId: LENCO_ACCOUNT,
                    amount: netAmountZmw,
                    reference: payoutRef,
                    narration: `FlapaPay Connect payout — ${acct.business_name || acct.email}`,
                    accountNumber: details.account_number,
                    bankId: details.bank_id,
                    country: 'ZM'
                }, {
                    headers: { 'Authorization': `Bearer ${LENCO_SECRET_KEY}` }
                });
                externalResult = { provider: 'lenco', status: 'processing', reference: payoutRef };
            } catch (e) {
                console.error('[ConnectPayout][Lenco]', e.response?.data || e.message);
                externalResult = { provider: 'lenco', status: 'pending', reference: payoutRef, note: e.response?.data?.message || e.message };
            }
        }

        res.json({
            success: true,
            reference: payoutRef,
            amount: amountZmw,
            net_amount: netAmountZmw,
            fee: feeZmw,
            type,
            payout_method: pm.type,
            external: externalResult,
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[ConnectPayoutExecute]', err.message);
        res.status(500).json({ error: err.message || 'Payout failed' });
    } finally {
        client.release();
    }
});

// GET /v1/connect/portal/payout_methods — sub-merchant's saved payout destinations
app.get('/v1/connect/portal/payout_methods', authenticateSubMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, type, details, is_default, created_at
             FROM connected_account_payout_methods
             WHERE connected_account_id = $1
             ORDER BY is_default DESC, created_at DESC`,
            [req.subMerchant.account_id]
        );
        res.json({ payout_methods: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payout methods' });
    }
});

// GET /v1/connect/portal/analytics — server-aggregated analytics for the submerchant
app.get('/v1/connect/portal/analytics', authenticateSubMerchant, async (req, res) => {
    const { days = 30 } = req.query;
    const numDays = Math.min(parseInt(days) || 30, 365);
    const accountId = req.subMerchant.account_id;
    try {
        const [kpiRes, dailyRes, methodRes, statusRes, topRes] = await Promise.all([
            // KPI totals for current period vs previous period
            pool.query(`
                SELECT
                  COALESCE(SUM(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '${numDays} days' AND status='succeeded'), 0) AS revenue,
                  COALESCE(SUM(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '${numDays * 2} days' AND created_at < NOW() - INTERVAL '${numDays} days' AND status='succeeded'), 0) AS prev_revenue,
                  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '${numDays} days') AS tx_count,
                  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '${numDays * 2} days' AND created_at < NOW() - INTERVAL '${numDays} days') AS prev_tx_count,
                  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '${numDays} days' AND status='succeeded') AS success_count,
                  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '${numDays * 2} days' AND created_at < NOW() - INTERVAL '${numDays} days' AND status='succeeded') AS prev_success_count
                FROM charges WHERE destination_merchant_id = $1
            `, [accountId]),
            // Daily revenue for bar chart
            pool.query(`
                SELECT DATE_TRUNC('day', created_at) AS day,
                       COALESCE(SUM(amount) FILTER (WHERE status='succeeded'), 0) AS revenue,
                       COUNT(*) AS tx_count
                FROM charges
                WHERE destination_merchant_id = $1
                  AND created_at >= NOW() - INTERVAL '${numDays} days'
                GROUP BY day ORDER BY day ASC
            `, [accountId]),
            // Payment method breakdown
            pool.query(`
                SELECT payment_method, COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
                FROM charges
                WHERE destination_merchant_id = $1
                  AND created_at >= NOW() - INTERVAL '${numDays} days'
                GROUP BY payment_method ORDER BY total DESC
            `, [accountId]),
            // Status breakdown
            pool.query(`
                SELECT status, COUNT(*) AS count
                FROM charges
                WHERE destination_merchant_id = $1
                  AND created_at >= NOW() - INTERVAL '${numDays} days'
                GROUP BY status
            `, [accountId]),
            // Top 5 transactions
            pool.query(`
                SELECT id, amount, currency, status, description, payment_method, created_at
                FROM charges
                WHERE destination_merchant_id = $1 AND status = 'succeeded'
                  AND created_at >= NOW() - INTERVAL '${numDays} days'
                ORDER BY amount DESC LIMIT 5
            `, [accountId]),
        ]);

        const kpi = kpiRes.rows[0];
        const txCount = parseInt(kpi.tx_count);
        const prevTxCount = parseInt(kpi.prev_tx_count);
        const successCount = parseInt(kpi.success_count);
        const prevSuccessCount = parseInt(kpi.prev_success_count);
        const revenue = parseFloat(kpi.revenue);
        const prevRevenue = parseFloat(kpi.prev_revenue);

        res.json({
            period_days: numDays,
            kpi: {
                revenue,
                prev_revenue: prevRevenue,
                revenue_pct: prevRevenue === 0 ? 0 : ((revenue - prevRevenue) / prevRevenue) * 100,
                tx_count: txCount,
                prev_tx_count: prevTxCount,
                tx_pct: prevTxCount === 0 ? 0 : ((txCount - prevTxCount) / prevTxCount) * 100,
                success_rate: txCount === 0 ? 0 : (successCount / txCount) * 100,
                prev_success_rate: prevTxCount === 0 ? 0 : (prevSuccessCount / prevTxCount) * 100,
                avg_tx: successCount === 0 ? 0 : revenue / successCount,
                prev_avg_tx: prevSuccessCount === 0 ? 0 : prevRevenue / prevSuccessCount,
            },
            daily: dailyRes.rows.map(r => ({
                day: r.day,
                revenue: parseFloat(r.revenue),
                tx_count: parseInt(r.tx_count),
            })),
            by_method: methodRes.rows.map(r => ({
                method: r.payment_method || 'mobile_money',
                total: parseFloat(r.total),
                count: parseInt(r.count),
            })),
            by_status: statusRes.rows.map(r => ({
                status: r.status,
                count: parseInt(r.count),
            })),
            top_transactions: topRes.rows,
        });
    } catch (err) {
        console.error('[Portal Analytics]', err.message);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// POST /v1/connect/portal/onboarding_link — sub-merchant requests a new onboarding link for self-edit
app.post('/v1/connect/portal/onboarding_link', authenticateSubMerchant, async (req, res) => {
    const acct = req.subMerchant;
    try {
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        await pool.query(
            `INSERT INTO onboarding_links (platform_merchant_id, account_id, token, expires_at, return_url, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [acct.platform_merchant_id, acct.account_id, token, expiresAt, req.body.return_url || `${frontendUrl}/merchant/connect`]
        );

        res.json({
            url: `${frontendUrl}/connect/onboarding/${token}`,
            expires_at: expiresAt,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create onboarding link' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 6: RISK & FRAUD ENGINE + WEBHOOK DELIVERY DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Risk Scoring Engine ──────────────────────────────────────────────────────
// Called during charge creation. Returns { blocked, flagged, events[] }
async function evaluateRisk({ merchantId, accountId, amount, currency, country, chargeId }) {
    try {
        const rulesRes = await pool.query(
            `SELECT * FROM risk_rules WHERE merchant_id = $1 AND enabled = TRUE ORDER BY created_at ASC`,
            [merchantId]
        );
        if (rulesRes.rows.length === 0) return { blocked: false, flagged: false, events: [] };

        const events = [];
        let blocked = false;
        let flagged = false;

        for (const rule of rulesRes.rows) {
            const p = rule.parameters || {};
            let triggered = false;
            let description = '';
            let riskScore = 0;
            let metadata = {};

            if (rule.rule_type === 'max_transaction_amount') {
                if (parseFloat(amount) > parseFloat(p.amount || 0)) {
                    triggered = true;
                    riskScore = 85;
                    description = `Transaction amount ${currency} ${amount} exceeds limit of ${currency} ${p.amount}`;
                    metadata = { amount, threshold: p.amount };
                }
            } else if (rule.rule_type === 'velocity_count') {
                const windowMs = parseInt(p.window_minutes || 60) * 60 * 1000;
                const since = new Date(Date.now() - windowMs);
                const countRes = await pool.query(
                    `SELECT COUNT(*) FROM charges WHERE ${accountId ? 'destination_merchant_id = $1' : 'merchant_id = $1'} AND created_at >= $2`,
                    [accountId || merchantId, since]
                );
                const count = parseInt(countRes.rows[0].count);
                if (count >= parseInt(p.count || 10)) {
                    triggered = true;
                    riskScore = 70;
                    description = `Velocity limit: ${count} charges in ${p.window_minutes || 60} min (limit: ${p.count})`;
                    metadata = { count, limit: p.count, window_minutes: p.window_minutes };
                }
            } else if (rule.rule_type === 'velocity_amount') {
                const windowMs = parseInt(p.window_minutes || 1440) * 60 * 1000;
                const since = new Date(Date.now() - windowMs);
                const sumRes = await pool.query(
                    `SELECT COALESCE(SUM(amount),0) as total FROM charges WHERE ${accountId ? 'destination_merchant_id = $1' : 'merchant_id = $1'} AND created_at >= $2 AND status = 'succeeded'`,
                    [accountId || merchantId, since]
                );
                const total = parseFloat(sumRes.rows[0].total) + parseFloat(amount);
                if (total > parseFloat(p.amount || 0)) {
                    triggered = true;
                    riskScore = 75;
                    description = `Volume limit: ${currency} ${total.toFixed(2)} in ${p.window_minutes || 1440} min exceeds ${currency} ${p.amount}`;
                    metadata = { total: total.toFixed(2), threshold: p.amount };
                }
            } else if (rule.rule_type === 'block_country') {
                const blockedCountries = p.countries || [];
                if (country && blockedCountries.includes(country.toUpperCase())) {
                    triggered = true;
                    riskScore = 90;
                    description = `Transaction from blocked country: ${country}`;
                    metadata = { country, blocked_countries: blockedCountries };
                }
            } else if (rule.rule_type === 'require_kyc' && accountId) {
                const kycRes = await pool.query(
                    `SELECT kyc_status FROM connected_accounts WHERE id = $1`,
                    [accountId]
                );
                if (kycRes.rows.length > 0 && kycRes.rows[0].kyc_status !== 'verified') {
                    triggered = true;
                    riskScore = 60;
                    description = `Sub-merchant KYC not verified (status: ${kycRes.rows[0].kyc_status})`;
                    metadata = { kyc_status: kycRes.rows[0].kyc_status };
                }
            }

            if (triggered) {
                if (rule.operator === 'block') blocked = true;
                else flagged = true;

                // Write risk event asynchronously
                pool.query(
                    `INSERT INTO risk_events (merchant_id, rule_id, charge_id, account_id, event_type, operator, status, risk_score, description, metadata, livemode)
                     VALUES ($1,$2,$3,$4,$5,$6,'open',$7,$8,$9,FALSE)`,
                    [merchantId, rule.id, chargeId, accountId || null, rule.rule_type, rule.operator, riskScore, description, JSON.stringify(metadata)]
                ).catch(e => console.error('[Risk] Event write failed:', e.message));

                events.push({ rule_id: rule.id, rule_type: rule.rule_type, operator: rule.operator, description });
            }
        }

        return { blocked, flagged, events };
    } catch (err) {
        console.error('[Risk] Evaluation error:', err.message);
        return { blocked: false, flagged: false, events: [] };
    }
}

// ─── Risk Rules CRUD ──────────────────────────────────────────────────────────

// GET /v1/connect/risk/rules
app.get('/v1/connect/risk/rules', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM risk_rules WHERE merchant_id = $1 ORDER BY created_at ASC`,
            [req.merchant.merchant_id]
        );
        res.json({ rules: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch risk rules' });
    }
});

// POST /v1/connect/risk/rules
app.post('/v1/connect/risk/rules', authenticateMerchant, async (req, res) => {
    const { name, rule_type, operator = 'block', parameters = {}, applies_to = 'all' } = req.body;
    const VALID_TYPES = ['max_transaction_amount','velocity_count','velocity_amount','block_country','require_kyc'];
    if (!name || !rule_type) return res.status(400).json({ error: 'name and rule_type required' });
    if (!VALID_TYPES.includes(rule_type)) return res.status(400).json({ error: `rule_type must be one of: ${VALID_TYPES.join(', ')}` });
    if (!['block','flag','review'].includes(operator)) return res.status(400).json({ error: 'operator must be block, flag, or review' });
    try {
        const result = await pool.query(
            `INSERT INTO risk_rules (merchant_id, name, rule_type, operator, parameters, applies_to)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [req.merchant.merchant_id, name, rule_type, operator, JSON.stringify(parameters), applies_to]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create risk rule' });
    }
});

// PATCH /v1/connect/risk/rules/:id
app.patch('/v1/connect/risk/rules/:id', authenticateMerchant, async (req, res) => {
    const { name, operator, parameters, applies_to, enabled } = req.body;
    try {
        const existing = await pool.query(
            `SELECT * FROM risk_rules WHERE id = $1 AND merchant_id = $2`,
            [req.params.id, req.merchant.merchant_id]
        );
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });

        const result = await pool.query(
            `UPDATE risk_rules SET
                name = COALESCE($1, name),
                operator = COALESCE($2, operator),
                parameters = COALESCE($3, parameters),
                applies_to = COALESCE($4, applies_to),
                enabled = COALESCE($5, enabled),
                updated_at = NOW()
             WHERE id = $6 AND merchant_id = $7 RETURNING *`,
            [name || null, operator || null, parameters ? JSON.stringify(parameters) : null,
             applies_to || null, enabled != null ? enabled : null,
             req.params.id, req.merchant.merchant_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update risk rule' });
    }
});

// DELETE /v1/connect/risk/rules/:id
app.delete('/v1/connect/risk/rules/:id', authenticateMerchant, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM risk_rules WHERE id = $1 AND merchant_id = $2`,
            [req.params.id, req.merchant.merchant_id]
        );
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete risk rule' });
    }
});

// ─── Risk Events ──────────────────────────────────────────────────────────────

// GET /v1/connect/risk/events
app.get('/v1/connect/risk/events', authenticateMerchant, async (req, res) => {
    const { status = 'open', limit = 50, offset = 0 } = req.query;
    try {
        const result = await pool.query(
            `SELECT re.*, ca.business_name, rr.name as rule_name
             FROM risk_events re
             LEFT JOIN connected_accounts ca ON ca.id = re.account_id
             LEFT JOIN risk_rules rr ON rr.id = re.rule_id
             WHERE re.merchant_id = $1
               AND ($2 = 'all' OR re.status = $2)
             ORDER BY re.created_at DESC
             LIMIT $3 OFFSET $4`,
            [req.merchant.merchant_id, status, parseInt(limit), parseInt(offset)]
        );
        const countRes = await pool.query(
            `SELECT COUNT(*) FROM risk_events WHERE merchant_id = $1 AND ($2 = 'all' OR status = $2)`,
            [req.merchant.merchant_id, status]
        );
        res.json({ events: result.rows, total: parseInt(countRes.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch risk events' });
    }
});

// PATCH /v1/connect/risk/events/:id — review/clear/confirm fraud
app.patch('/v1/connect/risk/events/:id', authenticateMerchant, async (req, res) => {
    const { status, review_note } = req.body;
    const VALID = ['reviewed','cleared','confirmed_fraud'];
    if (!status || !VALID.includes(status)) return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });
    try {
        const result = await pool.query(
            `UPDATE risk_events
             SET status = $1, review_note = $2, reviewed_at = NOW(), reviewed_by = $3
             WHERE id = $4 AND merchant_id = $5 RETURNING *`,
            [status, review_note || null, req.merchant.email || 'platform', req.params.id, req.merchant.merchant_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update risk event' });
    }
});

// GET /v1/connect/risk/summary — KPI summary for dashboard
app.get('/v1/connect/risk/summary', authenticateMerchant, async (req, res) => {
    const merchantId = req.merchant.merchant_id;
    try {
        const [openRes, blockedRes, last24Res, rulesRes] = await Promise.all([
            pool.query(`SELECT COUNT(*) FROM risk_events WHERE merchant_id=$1 AND status='open'`, [merchantId]),
            pool.query(`SELECT COUNT(*) FROM risk_events WHERE merchant_id=$1 AND operator='block'`, [merchantId]),
            pool.query(`SELECT COUNT(*) FROM risk_events WHERE merchant_id=$1 AND created_at >= NOW() - INTERVAL '24 hours'`, [merchantId]),
            pool.query(`SELECT COUNT(*) FROM risk_rules WHERE merchant_id=$1 AND enabled=TRUE`, [merchantId]),
        ]);
        res.json({
            open_events: parseInt(openRes.rows[0].count),
            total_blocked: parseInt(blockedRes.rows[0].count),
            events_last_24h: parseInt(last24Res.rows[0].count),
            active_rules: parseInt(rulesRes.rows[0].count),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch risk summary' });
    }
});

// ─── Webhook Delivery Dashboard ───────────────────────────────────────────────

// GET /v1/webhooks/deliveries — list deliveries with optional event filter
app.get('/v1/webhooks/deliveries', authenticateMerchant, async (req, res) => {
    const { event_type, status, endpoint_id, limit = 50, offset = 0 } = req.query;
    const merchantId = req.merchant.merchant_id;
    try {
        const conditions = ['we.merchant_id = $1'];
        const values = [merchantId];
        let idx = 2;

        if (event_type) { conditions.push(`wd.event ILIKE $${idx++}`); values.push(`%${event_type}%`); }
        if (endpoint_id) { conditions.push(`wd.endpoint_id = $${idx++}`); values.push(endpoint_id); }
        if (status === 'failed') { conditions.push(`wd.response_status >= 400`); }
        else if (status === 'success') { conditions.push(`wd.response_status < 300`); }

        values.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(
            `SELECT wd.*, we.url as endpoint_url, we.description as endpoint_name
             FROM webhook_deliveries wd
             JOIN webhook_endpoints we ON we.id = wd.endpoint_id
             WHERE ${conditions.join(' AND ')}
             ORDER BY wd.delivered_at DESC
             LIMIT $${idx++} OFFSET $${idx}`,
            values
        );
        const countValues = values.slice(0, -2);
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM webhook_deliveries wd
             JOIN webhook_endpoints we ON we.id = wd.endpoint_id
             WHERE ${conditions.slice(0, -0).join(' AND ')}`,
            countValues
        );
        res.json({ deliveries: result.rows, total: parseInt(countResult.rows[0].count) });
    } catch (err) {
        console.error('[WebhookDeliveries]', err.message);
        res.status(500).json({ error: 'Failed to fetch webhook deliveries' });
    }
});

// POST /v1/webhooks/deliveries/:id/retry — retry a failed delivery
app.post('/v1/webhooks/deliveries/:id/retry', authenticateMerchant, async (req, res) => {
    const merchantId = req.merchant.merchant_id;
    try {
        const delRes = await pool.query(
            `SELECT wd.*, we.url, we.signing_secret, we.merchant_id
             FROM webhook_deliveries wd
             JOIN webhook_endpoints we ON we.id = wd.endpoint_id
             WHERE wd.id = $1 AND we.merchant_id = $2`,
            [req.params.id, merchantId]
        );
        if (delRes.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
        const delivery = delRes.rows[0];

        const payload = typeof delivery.payload === 'string' ? JSON.parse(delivery.payload) : delivery.payload;
        const body = JSON.stringify(payload);
        const sig = require('crypto').createHmac('sha256', delivery.signing_secret).update(body).digest('hex');

        let responseStatus, responseBody;
        try {
            const retryRes = await axios.post(delivery.url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'FlapaPay-Signature': `sha256=${sig}`,
                    'FlapaPay-Event': payload.event,
                    'X-FlapaPay-Retry': 'true',
                },
                timeout: 10000,
            });
            responseStatus = retryRes.status;
            responseBody = JSON.stringify(retryRes.data).slice(0, 500);
        } catch (httpErr) {
            responseStatus = httpErr.response?.status || 0;
            responseBody = httpErr.message;
        }

        // Log the retry attempt as a new delivery record
        const newDelivery = await pool.query(
            `INSERT INTO webhook_deliveries (endpoint_id, event, payload, response_status, response_body, delivered_at)
             VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
            [delivery.endpoint_id, payload.event, body, responseStatus, responseBody]
        );

        res.json({
            delivery_id: newDelivery.rows[0].id,
            response_status: responseStatus,
            success: responseStatus >= 200 && responseStatus < 300,
        });
    } catch (err) {
        console.error('[WebhookRetry]', err.message);
        res.status(500).json({ error: 'Retry failed' });
    }
});

// GET /v1/webhooks/endpoints — list endpoints for webhook delivery UI
app.get('/v1/webhooks/endpoints', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, url, description, events, enabled, created_at FROM webhook_endpoints WHERE merchant_id = $1 ORDER BY created_at DESC`,
            [req.merchant.merchant_id]
        );
        res.json({ endpoints: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch endpoints' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7 — PLATFORM EARNINGS + CONNECT NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Notification helper (called internally when events occur) ───────────
async function createPlatformNotification(merchantId, type, title, body, metadata = {}, livemode = false) {
    try {
        await pool.query(
            `INSERT INTO platform_notifications (merchant_id, type, title, body, metadata, livemode)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [merchantId, type, title, body, JSON.stringify(metadata), livemode]
        );
    } catch (err) {
        console.error('[Notification] Failed to create notification:', err.message);
    }
}

// ─── Platform Earnings ───────────────────────────────────────────────────

// GET /v1/connect/platform/earnings — aggregate platform fee income by period
app.get('/v1/connect/platform/earnings', authenticateMerchant, async (req, res) => {
    const { from, to, groupBy = 'month', currency = 'ZMW' } = req.query;
    const merchantId = req.merchant.merchant_id;
    const livemode = req.headers['x-flapapay-test-mode'] !== 'true';

    const fromDate = from || (() => { const d = new Date(); d.setMonth(d.getMonth() - 11); return d.toISOString().slice(0, 10); })();
    const toDate = to || new Date().toISOString().slice(0, 10);

    try {
        // Summary totals for the period
        const summaryRes = await pool.query(
            `SELECT
                COALESCE(SUM(CASE WHEN direction='credit' AND entry_type='fee_collected' THEN amount ELSE 0 END), 0)   AS charge_fees,
                COALESCE(SUM(CASE WHEN direction='debit'  AND entry_type='refund_reversal' THEN amount ELSE 0 END), 0) AS refund_reversals,
                COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE 0 END), 0)  AS total_credits,
                COALESCE(SUM(CASE WHEN direction='debit'  THEN amount ELSE 0 END), 0)  AS total_debits,
                COUNT(*) FILTER (WHERE entry_type='fee_collected') AS charge_count
             FROM connect_ledger
             WHERE platform_merchant_id = $1
               AND currency = $2
               AND livemode = $3
               AND created_at >= $4
               AND created_at <= ($5::date + interval '1 day')`,
            [merchantId, currency, livemode, fromDate, toDate]
        );

        // Per-period breakdown
        let truncFn;
        if (groupBy === 'day') truncFn = 'day';
        else if (groupBy === 'week') truncFn = 'week';
        else if (groupBy === 'quarter') truncFn = 'quarter';
        else truncFn = 'month';

        const breakdownRes = await pool.query(
            `SELECT
                DATE_TRUNC($1, created_at) AS period,
                COALESCE(SUM(CASE WHEN direction='credit' AND entry_type='fee_collected' THEN amount ELSE 0 END), 0) AS fee_income,
                COALESCE(SUM(CASE WHEN direction='debit' AND entry_type='payout_disbursed' THEN amount ELSE 0 END), 0) AS payouts_out,
                COUNT(*) FILTER (WHERE entry_type='fee_collected') AS transactions
             FROM connect_ledger
             WHERE platform_merchant_id = $2
               AND currency = $3
               AND livemode = $4
               AND created_at >= $5
               AND created_at <= ($6::date + interval '1 day')
             GROUP BY 1
             ORDER BY 1 ASC`,
            [truncFn, merchantId, currency, livemode, fromDate, toDate]
        );

        // Per sub-merchant breakdown
        const perAccountRes = await pool.query(
            `SELECT
                cl.account_id,
                COALESCE(
                    ca.business_name,
                    ca.metadata->'kyc_payload'->'identity'->>'business_name',
                    ca.metadata->'kyc_payload'->'identity'->>'full_name',
                    ca.email
                ) AS business_name,
                COALESCE(SUM(CASE WHEN cl.direction='credit' AND cl.entry_type='fee_collected' THEN cl.amount ELSE 0 END), 0) AS fees_earned,
                COALESCE(SUM(CASE WHEN cl.direction='debit' AND cl.entry_type='payout_disbursed' THEN cl.amount ELSE 0 END), 0) AS payouts_sent,
                COUNT(*) FILTER (WHERE cl.entry_type='fee_collected') AS transaction_count
             FROM connect_ledger cl
             LEFT JOIN connected_accounts ca ON ca.id = cl.account_id
             WHERE cl.platform_merchant_id = $1
               AND cl.currency = $2
               AND cl.livemode = $3
               AND cl.created_at >= $4
               AND cl.created_at <= ($5::date + interval '1 day')
             GROUP BY cl.account_id, ca.business_name, ca.metadata, ca.email
             ORDER BY fees_earned DESC
             LIMIT 20`,
            [merchantId, currency, livemode, fromDate, toDate]
        );

        const summary = summaryRes.rows[0];
        res.json({
            period: { from: fromDate, to: toDate, groupBy, currency },
            summary: {
                charge_fees: parseFloat(summary.charge_fees),
                refund_reversals: parseFloat(summary.refund_reversals),
                total_credits: parseFloat(summary.total_credits),
                total_debits: parseFloat(summary.total_debits),
                net_earnings: parseFloat(summary.total_credits) - parseFloat(summary.total_debits),
                transaction_count: parseInt(summary.charge_count),
            },
            breakdown: breakdownRes.rows.map(r => ({
                period: r.period,
                fee_income: parseFloat(r.fee_income),
                payouts_out: parseFloat(r.payouts_out),
                transactions: parseInt(r.transactions),
            })),
            top_accounts: perAccountRes.rows.map(r => ({
                account_id: r.account_id,
                business_name: r.business_name || r.account_id,
                fees_earned: parseFloat(r.fees_earned),
                payouts_sent: parseFloat(r.payouts_sent),
                transaction_count: parseInt(r.transaction_count),
            })),
        });
    } catch (err) {
        console.error('[Earnings] Error:', err.message);
        res.status(500).json({ error: 'Failed to load earnings data' });
    }
});

// GET /v1/connect/platform/earnings/export — CSV download
app.get('/v1/connect/platform/earnings/export', authenticateMerchant, async (req, res) => {
    const { from, to, currency = 'ZMW' } = req.query;
    const merchantId = req.merchant.merchant_id;
    const livemode = req.headers['x-flapapay-test-mode'] !== 'true';

    const fromDate = from || (() => { const d = new Date(); d.setMonth(d.getMonth() - 11); return d.toISOString().slice(0, 10); })();
    const toDate = to || new Date().toISOString().slice(0, 10);

    try {
        const result = await pool.query(
            `SELECT cl.created_at, cl.entry_type, cl.direction, cl.amount, cl.currency,
                    ca.business_name, cl.charge_id, cl.description
             FROM connect_ledger cl
             LEFT JOIN connected_accounts ca ON ca.id = cl.account_id
             WHERE cl.platform_merchant_id = $1
               AND cl.currency = $2
               AND cl.livemode = $3
               AND cl.created_at >= $4
               AND cl.created_at <= ($5::date + interval '1 day')
             ORDER BY cl.created_at DESC`,
            [merchantId, currency, livemode, fromDate, toDate]
        );

        const header = 'Date,Entry Type,Direction,Amount,Currency,Sub-Merchant,Charge ID,Description';
        const rows = result.rows.map(r =>
            [
                new Date(r.created_at).toISOString(),
                r.entry_type,
                r.direction,
                r.amount,
                r.currency,
                r.business_name || '',
                r.charge_id || '',
                (r.description || '').replace(/,/g, ';'),
            ].join(',')
        );

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="flapapay_earnings_${fromDate}_${toDate}.csv"`);
        res.send([header, ...rows].join('\n'));
    } catch (err) {
        res.status(500).json({ error: 'Export failed' });
    }
});

// ─── Connect Notifications ────────────────────────────────────────────────

// GET /v1/connect/notifications — list platform notifications
app.get('/v1/connect/notifications', authenticateMerchant, async (req, res) => {
    const { limit = 50, offset = 0, unread_only } = req.query;
    const merchantId = req.merchant.merchant_id;
    const livemode = req.headers['x-flapapay-test-mode'] !== 'true';

    try {
        // Ensure table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS platform_notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                merchant_id UUID NOT NULL,
                type VARCHAR(80) NOT NULL,
                title VARCHAR(200) NOT NULL,
                body TEXT,
                metadata JSONB NOT NULL DEFAULT '{}',
                read BOOLEAN NOT NULL DEFAULT false,
                livemode BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        const conditions = ['merchant_id = $1', 'livemode = $2'];
        const params = [merchantId, livemode];
        if (unread_only === 'true') { conditions.push('read = false'); }

        const [countRes, rows, unreadCount] = await Promise.all([
            pool.query(`SELECT COUNT(*) FROM platform_notifications WHERE ${conditions.join(' AND ')}`, params),
            pool.query(
                `SELECT * FROM platform_notifications WHERE ${conditions.join(' AND ')}
                 ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, parseInt(limit), parseInt(offset)]
            ),
            pool.query(
                `SELECT COUNT(*) FROM platform_notifications WHERE merchant_id = $1 AND livemode = $2 AND read = false`,
                [merchantId, livemode]
            )
        ]);

        res.json({
            notifications: rows.rows,
            total: parseInt(countRes.rows[0].count),
            unread_count: parseInt(unreadCount.rows[0].count),
        });
    } catch (err) {
        console.error('[Notifications]', err.message);
        res.status(500).json({ error: 'Failed to load notifications', details: err.message });
    }
});

// PATCH /v1/connect/notifications/:id/read — mark single as read
app.patch('/v1/connect/notifications/:id/read', authenticateMerchant, async (req, res) => {
    const merchantId = req.merchant.merchant_id;
    try {
        await pool.query(
            `UPDATE platform_notifications SET read = true WHERE id = $1 AND merchant_id = $2`,
            [req.params.id, merchantId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// PATCH /v1/connect/notifications/read-all — mark all as read
app.patch('/v1/connect/notifications/read-all', authenticateMerchant, async (req, res) => {
    const merchantId = req.merchant.merchant_id;
    const livemode = req.headers['x-flapapay-test-mode'] !== 'true';
    try {
        const result = await pool.query(
            `UPDATE platform_notifications SET read = true WHERE merchant_id = $1 AND livemode = $2 AND read = false`,
            [merchantId, livemode]
        );
        res.json({ updated: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// DELETE /v1/connect/notifications/:id — delete a notification
app.delete('/v1/connect/notifications/:id', authenticateMerchant, async (req, res) => {
    const merchantId = req.merchant.merchant_id;
    try {
        await pool.query(
            `DELETE FROM platform_notifications WHERE id = $1 AND merchant_id = $2`,
            [req.params.id, merchantId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Helpers for Subscription Lifecycle
async function recordSubscriptionPayment(subId, paymentIntent) {
    const subRes = await pool.query(
        "UPDATE subscriptions SET status = $1, current_period_start = NOW(), current_period_end = NOW() + INTERVAL '1 month', updated_at = NOW() WHERE id = $2 RETURNING *",
        ['active', subId]
    );
    if (subRes.rows.length === 0) throw new Error('Subscription not found');
    const subscription = subRes.rows[0];

    // Create Sub Invoice
    const invoiceRes = await pool.query(
        "INSERT INTO sub_invoice (subscription_id, customer_id, amount, currency, status, payment_intent_id, due_date, paid_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *",
        [subId, subscription.customer_id, paymentIntent.amount / 100, paymentIntent.currency.toUpperCase(), 'paid', paymentIntent.id]
    );
    const invoice = invoiceRes.rows[0];

    // Find Merchant/Owner
    const custRes = await pool.query('SELECT merchant_id FROM customers WHERE id = $1', [subscription.customer_id]);
    const merchantId = custRes.rows[0].merchant_id;

    const transactionRef = 'SUB_INV_' + invoice.id;

    // Update Wallets table
    const walletRes = await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2 AND currency = $3 RETURNING *",
        [paymentIntent.amount / 100, merchantId, paymentIntent.currency.toUpperCase()]
    );

    let walletId = null;
    if (walletRes.rows.length > 0) {
        walletId = walletRes.rows[0].id;
    } else {
        const newWallet = await pool.query(
            "INSERT INTO wallets (user_id, currency, balance, status) VALUES ($1, $2, $3, 'active') RETURNING *",
            [merchantId, paymentIntent.currency.toUpperCase(), paymentIntent.amount / 100]
        );
        walletId = newWallet.rows[0].id;
    }

    // Insert into ledger_entries
    await pool.query(
        "INSERT INTO ledger_entries (transaction_reference, credit_wallet_id, amount, currency, description, transaction_type, status) VALUES ($1, $2, $3, $4, $5, 'subscription_invoice', 'completed')",
        [transactionRef, walletId, paymentIntent.amount / 100, paymentIntent.currency.toUpperCase(), 'Subscription Payment']
    );

    // Insert into wallet_transactions
    await pool.query(
        "INSERT INTO wallet_transactions (wallet_id, amount, transaction_type, reference_type, reference_id) VALUES ($1, $2, 'credit', 'subscription_invoice', $3)",
        [walletId, paymentIntent.amount / 100, invoice.id]
    );

    // Notifications
    try {
        await pool.query(
            "INSERT INTO notifications (user_id, type, title, message) VALUES ($1, 'SUBSCRIPTION_PAID', 'Subscription Payment', $2)",
            [merchantId, `New subscription payment of ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()} received.`]
        );
    } catch (e) { console.error('Notification error', e.message); }

    return { subscription, invoice };
}

// =============================================================================
// CYBERSOURCE ENDPOINTS
// =============================================================================

// GET Flex capture context — called by LinkCard.tsx and AddMoney.tsx before card input
app.post('/v1/card-setup/context', authenticateToken, async (req, res) => {
    try {
        const targetOrigin   = req.headers.origin || process.env.CYBERSOURCE_FLEX_TARGET_ORIGIN || 'http://localhost:5173';
        const captureContext = await CybersourceService.flex.getCaptureContext(targetOrigin);
        const csCustomerId   = await getOrCreateCybersourceCustomer(req.user.id, req.user.email, req.user.full_name || '');
        res.json({
            captureContext,
            customerId: csCustomerId,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
    } catch (err) {
        console.error('[CyberSource] Card setup context error:', err.message);
        res.status(500).json({ error: 'Failed to generate card setup context' });
    }
});

// POST /v1/payment-methods — link a card via Flex transient token (replaces Stripe Setup Intent confirm)
app.post('/v1/payment-methods', authenticateToken, async (req, res) => {
    const { transientToken, transient_token, billing_address = {} } = req.body;
    const token = transientToken || transient_token;
    if (!token) return res.status(400).json({ error: 'transientToken is required' });
    try {
        const csCustomerId = await getOrCreateCybersourceCustomer(req.user.id, req.user.email, req.user.full_name || '');
        _dbgLog(`[LinkCard] customerId=${csCustomerId} tokenLen=${token.length}`);
        const instrument   = await CybersourceService.tokens.linkCard({
            customerId:      csCustomerId,
            transientToken:  token,
            billingAddress:  billing_address,
            userEmail:       req.user.email,
        });

        const existing = await pool.query(
            'SELECT id FROM payment_instruments WHERE user_id = $1', [req.user.id]
        );
        const isFirst = existing.rows.length === 0;

        await pool.query(
            `INSERT INTO payment_instruments
             (user_id, cybersource_customer_id, cybersource_instrument_id, cybersource_identifier_id,
              last4, brand, exp_month, exp_year, is_default)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (cybersource_instrument_id) DO NOTHING`,
            [
                req.user.id, csCustomerId, instrument.instrumentId,
                instrument.identifierId || null,
                instrument.last4, instrument.brand,
                instrument.expirationMonth, instrument.expirationYear,
                isFirst,
            ]
        );

        res.json({
            id:           instrument.instrumentId,
            last4:        instrument.last4,
            brand:        instrument.brand,
            exp_month:    instrument.expirationMonth,
            exp_year:     instrument.expirationYear,
            is_default:   isFirst,
        });
    } catch (err) {
        _dbgLog('[CyberSource] Link card error FULL:', err.message);
        res.status(500).json({ error: 'Failed to link card', detail: err.message });
    }
});

// GET /v1/payment-methods — list user's linked cards (replaces GET /payments/methods)
app.get('/v1/payment-methods', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cybersource_instrument_id as id, last4, brand, exp_month, exp_year, is_default
             FROM payment_instruments WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
            [req.user.id]
        );
        res.json({ instruments: result.rows });
    } catch (err) {
        console.error('[CyberSource] List cards error:', err.message);
        res.status(500).json({ error: 'Failed to fetch payment methods', detail: err.message });
    }
});

// DELETE /v1/payment-methods/:id — unlink a card
app.delete('/v1/payment-methods/:id', authenticateToken, async (req, res) => {
    try {
        const instRes = await pool.query(
            'SELECT cybersource_customer_id, cybersource_instrument_id FROM payment_instruments WHERE cybersource_instrument_id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (instRes.rows.length === 0) return res.status(404).json({ error: 'Payment method not found' });

        const { cybersource_customer_id, cybersource_instrument_id } = instRes.rows[0];
        await CybersourceService.tokens.deleteCard(cybersource_customer_id, cybersource_instrument_id);
        await pool.query('DELETE FROM payment_instruments WHERE cybersource_instrument_id = $1', [cybersource_instrument_id]);
        res.json({ deleted: true });
    } catch (err) {
        console.error('[CyberSource] Delete card error:', err.message);
        res.status(500).json({ error: 'Failed to delete payment method' });
    }
});

// POST /webhooks/cybersource — receive CyberSource event notifications
app.post('/webhooks/cybersource', express.json(), CybersourceService.webhooks.handler, async (req, res) => {
    const event = req.cybersourceEvent;
    try {
        const eventType = CybersourceService.webhooks.eventType(event);
        switch (eventType) {
            case 'payment.updated':
            case 'payment.created':
                console.log(`[CyberSource Webhook] Payment event: ${event.id} status=${event.status}`);
                break;
            case 'risk.casemanagement.order.updated':
                console.log(`[CyberSource Webhook] Risk event: ${event.id}`);
                break;
            case 'tms.tokenized.card.created':
            case 'tms.customer.updated':
                console.log(`[CyberSource Webhook] Token event: ${eventType}`);
                break;
            default:
                console.log(`[CyberSource Webhook] Unhandled event type: ${eventType}`);
        }
        res.json({ received: true });
    } catch (err) {
        console.error('[CyberSource Webhook] Handler error:', err.message);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// --- Stripe Subscription Webhooks ---
app.post('/webhooks/stripe', async (req, res) => {
    try {
        const event = req.body;
        // In production, signature verification usually happens here

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const metadata = paymentIntent.metadata;

            if (metadata && metadata.type === 'subscription_first_payment') {
                await recordSubscriptionPayment(metadata.subscription_id, paymentIntent);
            }
        }
        else if (event.type === 'invoice.payment_succeeded') {
            // Future compatibility for native Stripe Subs
        }
        else if (event.type === 'invoice.payment_failed' || event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            const metadata = paymentIntent.metadata;
            if (metadata && metadata.type === 'subscription_first_payment') {
                const subId = metadata.subscription_id;
                await pool.query("UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE id = $1", [subId]);
            }
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Stripe Webhook Error:', err);
        res.status(400).send('Webhook Error: ' + err.message);
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
        mode = 'payment',
        customer,
        customer_email,
        transfer_data,
        application_fee_amount,
        subscription_data
    } = req.body;

    try {
        let finalAmount = amount;
        let dbCustomerId = null;

        // 1. Resolve Customer if provided
        if (customer) {
            const custRes = await pool.query('SELECT id FROM customers WHERE id = $1 OR email = $1 AND merchant_id = $2', [customer, req.merchant.merchant_id]);
            if (custRes.rows.length > 0) dbCustomerId = custRes.rows[0].id;
        } else if (customer_email) {
            const custRes = await pool.query('SELECT id FROM customers WHERE email = $1 AND merchant_id = $2', [customer_email, req.merchant.merchant_id]);
            if (custRes.rows.length > 0) dbCustomerId = custRes.rows[0].id;
        }

        // 2. Handle Subscription Mode
        if (mode === 'subscription') {
            if (!line_items || line_items.length === 0) {
                return res.status(400).json({ error: 'Line items (price IDs) are required for subscription mode' });
            }
            // For now, assume single price subscription
            const priceId = line_items[0].price;
            const priceRes = await pool.query('SELECT amount, currency FROM prices WHERE id = $1', [priceId]);
            if (priceRes.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid Price ID' });
            }
            finalAmount = parseFloat(priceRes.rows[0].amount);
        } else if (!finalAmount && line_items) {
            finalAmount = line_items.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0);
        }

        // 3. Validations
        if (mode === 'payment' && (!finalAmount || isNaN(finalAmount) || finalAmount <= 0)) {
            return res.status(400).json({ error: 'Invalid amount for payment mode' });
        }
        if (!currency && mode === 'payment') {
            return res.status(400).json({ error: 'Currency is required for one-time payments' });
        }
        if (!success_url || !cancel_url) {
            return res.status(400).json({ error: 'success_url and cancel_url are required' });
        }

        const sessionId = 'cs_test_' + crypto.randomBytes(24).toString('hex');

        // Store customer_email in metadata for later use
        const sessionMetadata = {
            ...(metadata || {}),
            customer_email: customer_email || ''
        };

        await pool.query(
            `INSERT INTO checkout_sessions
             (id, merchant_id, amount, currency, payment_method_types, success_url, cancel_url, client_reference_id, metadata, transfer_data, application_fee_amount, mode, subscription_data, customer_id, livemode)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
                sessionId,
                req.merchant.merchant_id,
                finalAmount,
                (currency || 'ZMW').toUpperCase(),
                JSON.stringify(payment_method_types || ['card', 'mobile_money']),
                success_url,
                cancel_url,
                client_reference_id,
                JSON.stringify(sessionMetadata),
                JSON.stringify(transfer_data || {}),
                application_fee_amount || null,
                mode,
                JSON.stringify(subscription_data || (mode === 'subscription' ? { price: line_items[0].price } : {})),
                dbCustomerId,
                !req.isTestMode
            ]
        );

        const checkoutUrl = mode === 'subscription'
            ? `http://localhost:5173/checkout/subscription/${sessionId}`
            : `http://localhost:5173/checkout/${sessionId}`;

        res.json({
            id: sessionId,
            object: 'checkout.session',
            url: checkoutUrl,
            status: 'open',
            payment_status: 'unpaid',
            amount_total: finalAmount || null,
            currency: (currency || 'ZMW').toUpperCase(),
            mode: mode
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
            SELECT cs.*, m.business_name,
                   ca.business_name as sub_merchant_name
            FROM checkout_sessions cs
            JOIN merchants m ON cs.merchant_id = m.id
            LEFT JOIN connected_accounts ca ON ca.id = (cs.transfer_data->>'destination')::uuid
            WHERE cs.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });

        const session = result.rows[0];
        let priceInfo = null;

        if (session.mode === 'subscription' && session.subscription_data?.price) {
            const priceRes = await pool.query(`
                SELECT p.*, prod.name as product_name, prod.description as product_description
                FROM prices p
                JOIN products prod ON p.product_id = prod.id
                WHERE p.id = $1
            `, [session.subscription_data.price]);
            if (priceRes.rows.length > 0) priceInfo = priceRes.rows[0];
        }

        const transferData = session.transfer_data && Object.keys(session.transfer_data).length > 0 ? session.transfer_data : null;
        const appFee = session.application_fee_amount ? parseFloat(session.application_fee_amount) : null;
        const amountTotal = session.amount ? parseFloat(session.amount) : null;

        res.json({
            id: session.id,
            object: 'checkout.session',
            amount_total: amountTotal,
            currency: session.currency,
            status: session.status,
            payment_method_types: session.payment_method_types,
            merchant: {
                name: session.business_name
            },
            success_url: session.success_url,
            cancel_url: session.cancel_url,
            livemode: session.livemode,
            mode: session.mode,
            transfer_data: transferData,
            application_fee_amount: appFee,
            sub_merchant_name: session.sub_merchant_name || null,
            subscription_details: priceInfo ? {
                product_name: priceInfo.product_name,
                product_description: priceInfo.product_description,
                billing_interval: priceInfo.billing_interval,
                interval_count: priceInfo.interval_count,
                trial_days: priceInfo.trial_days
            } : null
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

        // CyberSource Flex Microform — generate capture context for secure card input
        const targetOrigin = req.headers.origin || process.env.CYBERSOURCE_FLEX_TARGET_ORIGIN || 'http://localhost:5173';
        const captureContext = await CybersourceService.flex.getCaptureContext(targetOrigin);

        res.json({
            captureContext,           // JWT passed to new Flex(captureContext) on frontend
            amount: amountToCharge,
            currency: session.currency || 'ZMW',
            sessionId: session.id,
        });
    } catch (err) {
        console.error('[CyberSource] Flex capture context error:', err.message);
        res.status(500).json({ error: 'Failed to generate payment context' });
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
    console.log(`[Checkout] Confirming session: ${req.params.id}`, { payment_method, payment_details });

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

        // Fetch settlement delay for this session's platform
        const settlementCfgRes = await pool.query(
            `SELECT settlement_delay_days FROM connect_config WHERE merchant_id = $1`,
            [session.merchant_id]
        );
        const settlementDelayForSession = settlementCfgRes.rows[0]?.settlement_delay_days ?? 1;
        const sessionAvailableAt = new Date();
        sessionAvailableAt.setDate(sessionAvailableAt.getDate() + settlementDelayForSession);

        // Reuse Logic: Credit Merchant (and Split if needed)
        // Start TX
        await pool.query('BEGIN');

        let platformFee = 0;
        let merchantAmount = amount;
        const csChargeId = 'ch_' + crypto.randomBytes(12).toString('hex');
        let subMerchantId = null;

        const isSessionLive = session.livemode;
        const targetColumn = isSessionLive ? 'available_amount' : 'pending_amount';

        if (transfer_data && transfer_data.destination) {
            subMerchantId = transfer_data.destination;
            // Phase 3: per-account override → platform config → 5% default
            if (session.application_fee_amount) {
                platformFee = parseFloat(session.application_fee_amount);
            } else {
                const overrideRes = await pool.query(
                    `SELECT fee_percent FROM connected_account_fee_overrides WHERE account_id = $1`, [subMerchantId]
                );
                if (overrideRes.rows.length > 0) {
                    platformFee = Math.round(amount * (parseFloat(overrideRes.rows[0].fee_percent) / 100) * 100) / 100;
                } else {
                    const cfgRes = await pool.query(
                        `SELECT platform_fee_percent FROM connect_config WHERE merchant_id = $1`, [session.merchant_id]
                    );
                    const feeRate = cfgRes.rows.length > 0 ? parseFloat(cfgRes.rows[0].platform_fee_percent) / 100 : 0.05;
                    platformFee = Math.round(amount * feeRate * 100) / 100;
                }
            }
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

            // Write ledger entries for split (fee_collected + split_credit)
            if (platformFee > 0) {
                await pool.query(
                    `INSERT INTO connect_ledger (platform_merchant_id, entry_type, charge_id, account_id, amount, currency, direction, description, livemode)
                     VALUES ($1,'fee_collected',$2,$3,$4,$5,'credit',$6,$7)`,
                    [session.merchant_id, csChargeId, subMerchantId,
                     platformFee, currency,
                     `Platform fee on checkout ${currency} ${amount}`, isSessionLive]
                );
            }
            await pool.query(
                `INSERT INTO connect_ledger (platform_merchant_id, entry_type, charge_id, account_id, amount, currency, direction, description, livemode)
                 VALUES ($1,'split_credit',$2,$3,$4,$5,'credit',$6,$7)`,
                [session.merchant_id, csChargeId, subMerchantId,
                 merchantAmount, currency,
                 `Net earnings on checkout ${currency} ${amount} (T+${settlementDelayForSession})`, isSessionLive]
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

        // --- Process Card Payment via CyberSource ---
        let finalPaymentIntentId = 'pi_mock_' + Date.now();

        if (payment_method === 'card') {
            const transientToken  = payment_details?.transientToken;
            const csCustomerId    = payment_details?.customerId;
            const legacyToken     = payment_details?.token;

            if (transientToken || csCustomerId) {
                // CyberSource path: Flex transient token or TMS customer token
                try {
                    const chargeResult = await CybersourceService.payments.sale({
                        amount,
                        currency,
                        transientToken: transientToken || undefined,
                        customerId:     csCustomerId    || undefined,
                        metadata:       { ref: `CS-SESSION-${session.id}`, merchantId: session.merchant_id },
                    });

                    if (!['AUTHORIZED', 'PENDING', 'ACCEPTED', 'COMPLETED'].includes(chargeResult.status?.toUpperCase())) {
                        await pool.query('ROLLBACK');
                        return res.status(402).json({ error: 'Card declined', code: chargeResult.status });
                    }
                    finalPaymentIntentId = chargeResult.id;
                } catch (csErr) {
                    await pool.query('ROLLBACK');
                    console.error('[CyberSource] Checkout confirm error:', csErr.message);
                    return res.status(402).json({ error: 'Card payment failed', details: csErr.message });
                }
            } else if (legacyToken === 'tok_visa') {
                // Legacy test token fallback (sandbox simulation)
                finalPaymentIntentId = 'cs_test_tok_visa_' + Date.now();
            } else {
                await pool.query('ROLLBACK');
                return res.status(400).json({ error: 'Card payment requires transientToken or customerId' });
            }
        }

        // Update Session
        await pool.query("UPDATE checkout_sessions SET status = 'complete', payment_intent = $1, amount = $2 WHERE id = $3",
            [finalPaymentIntentId, amount, session.id]
        );

        // Record charge with settlement tracking
        await pool.query(
            `INSERT INTO charges (id, merchant_id, amount, currency, status, payment_method, payment_details,
                                 description, metadata, livemode, destination_merchant_id, application_fee_amount,
                                 available_at, is_settled)
             VALUES ($1,$2,$3,$4,'succeeded',$5,$6,$7,$8,$9,$10,$11,$12,false)
             ON CONFLICT (id) DO NOTHING`,
            [
                csChargeId, session.merchant_id, amount, currency,
                payment_method || 'mobile_money',
                JSON.stringify({ payment_intent: finalPaymentIntentId }),
                session.description || `Checkout ${session.id}`,
                JSON.stringify(session.metadata || {}), isSessionLive,
                subMerchantId || null, platformFee || null, sessionAvailableAt
            ]
        );

        // --- Handle Subscription Mode ---
        if (session.mode === 'subscription' && session.subscription_data) {
            const subData = session.subscription_data;
            const priceId = subData.price;
            let customerId = session.customer_id;

            // 1. Ensure Customer exists if not already linked (e.g. guest checkout)
            if (!customerId) {
                const email = session.metadata?.customer_email || session.metadata?.email || 'guest@example.com';
                const name = session.metadata?.name || 'Guest';
                const custRes = await pool.query(
                    'INSERT INTO customers (email, name, merchant_id) VALUES ($1, $2, $3) ON CONFLICT (email, merchant_id) DO UPDATE SET name=EXCLUDED.name RETURNING id',
                    [email, name, session.merchant_id]
                );
                customerId = custRes.rows[0].id;
            }

            // 2. Fetch Price Info for interval
            const priceRes = await pool.query('SELECT billing_interval, interval_count FROM prices WHERE id = $1', [priceId]);
            if (priceRes.rows.length > 0) {
                const price = priceRes.rows[0];

                // 3. Create Subscription
                const periodStart = new Date();
                const periodEnd = new Date();
                if (price.billing_interval === 'monthly') {
                    periodEnd.setMonth(periodEnd.getMonth() + (price.interval_count || 1));
                } else if (price.billing_interval === 'yearly') {
                    periodEnd.setFullYear(periodEnd.getFullYear() + (price.interval_count || 1));
                }

                const subRes = await pool.query(
                    `INSERT INTO subscriptions (customer_id, price_id, status, current_period_start, current_period_end)
                     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [customerId, priceId, 'active', periodStart, periodEnd]
                );
                const subId = subRes.rows[0].id;

                // 4. Create Initial Invoice
                await pool.query(
                    `INSERT INTO sub_invoice (subscription_id, customer_id, amount, currency, status, paid_at)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [subId, customerId, amount, currency, 'paid', new Date()]
                );
            }
        }

        // NOTE: The authoritative charge record was already inserted above (csChargeId)
        // with correct split amounts and is_settled=false. Do NOT insert a second charge here.

        await pool.query('COMMIT');

        // Trigger Webhook
        // await dispatchWebhook(session.merchant_id, 'checkout.session.completed', { ...session, status: 'complete' });

        res.json({ status: 'succeeded', success_url: session.success_url });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Session Confirm Error Details:', {
            message: err.message,
            stack: err.stack,
            code: err.code,
            detail: err.detail
        });
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

        // Create default live and test wallets
        await client.query(`INSERT INTO wallets (user_id, currency, balance, livemode) VALUES ($1, 'ZMW', 0.00, true)`, [user.id]);
        await client.query(`INSERT INTO wallets (user_id, currency, balance, livemode) VALUES ($1, 'USD', 0.00, true)`, [user.id]);
        await client.query(`INSERT INTO wallets (user_id, currency, balance, livemode) VALUES ($1, 'ZMW', 0.00, false)`, [user.id]);
        await client.query(`INSERT INTO wallets (user_id, currency, balance, livemode) VALUES ($1, 'USD', 0.00, false)`, [user.id]);

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

// ─── ADMIN: Sub-merchant (Connected Account) KYC Review ──────────────────────

// GET /admin/sub-merchants — list all connected accounts, filterable by kyc_status
app.get('/admin/sub-merchants', authenticateToken, isAdmin, async (req, res) => {
    const { status = 'all', platform_id, search, limit = 50, offset = 0 } = req.query;
    try {
        let where = 'WHERE 1=1';
        const params = [];
        let idx = 1;

        if (status !== 'all') {
            where += ` AND ca.kyc_status = $${idx++}`;
            params.push(status);
        }
        if (platform_id) {
            where += ` AND ca.platform_merchant_id = $${idx++}`;
            params.push(platform_id);
        }
        if (search) {
            where += ` AND (ca.email ILIKE $${idx} OR ca.business_name ILIKE $${idx})`;
            params.push(`%${search}%`);
            idx++;
        }

        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(
            `SELECT ca.id, ca.business_name, ca.email, ca.status, ca.kyc_status,
                    ca.kyc_submitted_at, ca.kyc_rejection_reason, ca.country,
                    ca.metadata, ca.created_at,
                    m.business_name as platform_name, m.id as platform_id
             FROM connected_accounts ca
             JOIN merchants m ON m.id = ca.platform_merchant_id
             ${where}
             ORDER BY ca.kyc_submitted_at DESC NULLS LAST, ca.created_at DESC
             LIMIT $${idx++} OFFSET $${idx++}`,
            params
        );

        const countRes = await pool.query(
            `SELECT COUNT(*) FROM connected_accounts ca ${where}`,
            params.slice(0, -2)
        );

        res.json({
            accounts: result.rows.map(row => {
                const identity = row.metadata?.kyc_payload?.identity || {};
                const displayName = row.business_name || identity.business_name || identity.full_name || row.email;
                return { ...row, display_name: displayName };
            }),
            total: parseInt(countRes.rows[0].count)
        });
    } catch (err) {
        console.error('[Admin Sub-merchants]', err.message);
        res.status(500).json({ error: 'Failed to fetch sub-merchants' });
    }
});

// GET /admin/sub-merchants/:id — full detail for one connected account
app.get('/admin/sub-merchants/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ca.*, m.business_name as platform_name, m.id as platform_id
             FROM connected_accounts ca
             JOIN merchants m ON m.id = ca.platform_merchant_id
             WHERE ca.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' });

        const ca = result.rows[0];
        const kycPayload = ca.metadata?.kyc_payload || {};
        const identity   = kycPayload.identity   || {};
        const contact    = kycPayload.contact     || {};
        const payout     = kycPayload.payout      || {};
        const displayName = ca.business_name || identity.business_name || identity.full_name || ca.email;

        // Get payout methods
        const pmRes = await pool.query(
            'SELECT * FROM connected_account_payout_methods WHERE connected_account_id = $1',
            [ca.id]
        );

        res.json({
            id: ca.id,
            display_name: displayName,
            business_name: ca.business_name,
            email: ca.email,
            country: ca.country,
            status: ca.status,
            kyc_status: ca.kyc_status,
            kyc_submitted_at: ca.kyc_submitted_at,
            kyc_rejection_reason: ca.kyc_rejection_reason,
            platform_name: ca.platform_name,
            platform_id: ca.platform_id,
            created_at: ca.created_at,
            identity,
            contact,
            payout_info: payout,
            payout_methods: pmRes.rows,
            requirements: ca.requirements,
            suspended_at: ca.suspended_at,
            suspension_reason: ca.suspension_reason,
        });
    } catch (err) {
        console.error('[Admin Sub-merchant Detail]', err.message);
        res.status(500).json({ error: 'Failed to fetch account' });
    }
});

// POST /admin/sub-merchants/:id/kyc/approve
app.post('/admin/sub-merchants/:id/kyc/approve', authenticateToken, isAdmin, async (req, res) => {
    const { notes = '' } = req.body || {};
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const caRes = await client.query(
            'SELECT * FROM connected_accounts WHERE id = $1 FOR UPDATE',
            [req.params.id]
        );
        if (caRes.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Account not found' }); }
        const ca = caRes.rows[0];

        await client.query(
            `UPDATE connected_accounts SET
                kyc_status = 'verified',
                status = 'ACTIVE',
                kyc_reviewed_at = NOW(),
                kyc_rejection_reason = NULL,
                requirements = '{"currently_due":[],"pending_verification":[]}'
             WHERE id = $1`,
            [req.params.id]
        );

        await client.query('COMMIT');

        // Email sub-merchant
        const identity = ca.metadata?.kyc_payload?.identity || {};
        const displayName = ca.business_name || identity.business_name || identity.full_name || ca.email;
        try {
            await EmailService.sendKycUpdate(ca.email, {
                accountName: displayName,
                status: 'approved',
                dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sub-merchant`,
            });
        } catch (e) { console.warn('[KYC Approve Email]', e.message); }

        // Webhook to platform
        await emitWebhookForMerchant(ca.platform_merchant_id, 'connect.kyc.approved', {
            account_id: ca.id, business_name: displayName, email: ca.email
        });
        io.to(`merchant:${ca.platform_merchant_id}`).emit('kyc.approved', {
            account_id: ca.id, business_name: displayName
        });

        res.json({ approved: true, account_id: ca.id });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[Admin KYC Approve]', err.message);
        res.status(500).json({ error: 'Failed to approve account' });
    } finally { client.release(); }
});

// POST /admin/sub-merchants/:id/kyc/reject
app.post('/admin/sub-merchants/:id/kyc/reject', authenticateToken, isAdmin, async (req, res) => {
    const { reason = 'Your documents could not be verified. Please resubmit.' } = req.body || {};
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const caRes = await client.query(
            'SELECT * FROM connected_accounts WHERE id = $1 FOR UPDATE',
            [req.params.id]
        );
        if (caRes.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Account not found' }); }
        const ca = caRes.rows[0];

        await client.query(
            `UPDATE connected_accounts SET
                kyc_status = 'rejected',
                kyc_reviewed_at = NOW(),
                kyc_rejection_reason = $1,
                requirements = '{"currently_due":["kyc_documents"],"pending_verification":[]}'
             WHERE id = $2`,
            [reason, req.params.id]
        );

        await client.query('COMMIT');

        // Email sub-merchant
        const identity = ca.metadata?.kyc_payload?.identity || {};
        const displayName = ca.business_name || identity.business_name || identity.full_name || ca.email;
        try {
            await EmailService.sendKycUpdate(ca.email, {
                accountName: displayName,
                status: 'rejected',
                reason,
                dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sub-merchant`,
            });
        } catch (e) { console.warn('[KYC Reject Email]', e.message); }

        // Webhook + socket
        await emitWebhookForMerchant(ca.platform_merchant_id, 'connect.kyc.rejected', {
            account_id: ca.id, reason
        });
        io.to(`merchant:${ca.platform_merchant_id}`).emit('kyc.rejected', {
            account_id: ca.id, reason
        });

        res.json({ rejected: true, account_id: ca.id });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[Admin KYC Reject]', err.message);
        res.status(500).json({ error: 'Failed to reject account' });
    } finally { client.release(); }
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
        if (merchantRes.rows.length === 0) return res.json({
            stats: [
                { label: 'Test Volume', value: 'ZK 0.00', count: 0, change: '+0%', trend: 'up' },
                { label: 'Test Available Balance', value: 'ZK 0.00', change: '+0%', trend: 'up' },
                { label: 'Test Transactions', value: '0', change: '+0%', trend: 'up' },
                { label: 'Success Rate', value: '100%', change: '+0%', trend: 'up' },
            ],
            rawBalance: 0,
            recentActivity: [],
            volumeHistory: [],
            methodBreakdown: [],
            geographicData: [],
            cohortData: []
        });
        const merchantId = merchantRes.rows[0].id;

        // Honour the mode requested from the dashboard (default: test)
        const isLive = req.query.mode === 'live';
        const periodParam = req.query.period || '30d';
        let days = 30;
        if (periodParam === '7d') days = 7;
        else if (periodParam === '90d') days = 90;

        // Volume stats:
        //   gross_volume  = sum of all charge amounts (what customers paid)
        //   net_earnings  = what the merchant actually keeps:
        //                     direct charge  → full amount
        //                     marketplace    → application_fee_amount (their commission)
        const volumeRes = await pool.query(
            `SELECT
                COALESCE(SUM(amount), 0) AS gross_volume,
                COALESCE(SUM(
                    CASE WHEN destination_merchant_id IS NOT NULL
                         THEN COALESCE(application_fee_amount, 0)
                         ELSE amount
                    END
                ), 0) AS net_earnings,
                COUNT(*) AS count,
                COUNT(*) FILTER (WHERE destination_merchant_id IS NOT NULL) AS split_count,
                COUNT(*) FILTER (WHERE destination_merchant_id IS NULL) AS direct_count
             FROM charges
             WHERE merchant_id = $1 AND status = 'succeeded' AND livemode = $2
               AND created_at >= NOW() - INTERVAL '${days} days'`,
            [merchantId, isLive]
        );

        let availableBalance = 0;
        let pendingBalance = 0;
        if (isLive) {
            // Live: use real balances table (ngwe)
            const balanceRes = await pool.query(
                `SELECT COALESCE(available_amount, 0) AS available, COALESCE(pending_amount, 0) AS pending
                 FROM balances WHERE merchant_id = $1`,
                [merchantId]
            );
            availableBalance = parseFloat(balanceRes.rows[0]?.available || 0);
            pendingBalance = parseFloat(balanceRes.rows[0]?.pending || 0);
        } else {
            // Test: ALL successful test charges count as available immediately (no T+N for test mode)
            // Subtract any amounts already settled to test wallet (tracked in test ledger_entries)
            const merchantUserRes = await pool.query('SELECT user_id FROM merchants WHERE id = $1', [merchantId]);
            const merchantUserId = merchantUserRes.rows[0]?.user_id;

            const testBalRes = await pool.query(
                `SELECT
                    COALESCE(SUM(
                        CASE WHEN destination_merchant_id IS NOT NULL
                             THEN COALESCE(application_fee_amount, 0)
                             ELSE amount
                        END
                    ), 0) AS net_earned
                 FROM charges
                 WHERE merchant_id = $1 AND livemode = false AND status = 'succeeded' AND amount > 0`,
                [merchantId]
            );

            // Subtract test settlements already moved to test wallet
            const testSettledRes = await pool.query(
                `SELECT COALESCE(SUM(le.amount), 0) AS settled_out
                 FROM ledger_entries le
                 JOIN wallets w ON le.credit_wallet_id = w.id
                 WHERE le.livemode = false
                   AND le.transaction_type = 'SETTLEMENT'
                   AND w.livemode = false
                   AND w.user_id = $1`,
                [merchantUserId]
            );

            const grossEarned = parseFloat(testBalRes.rows[0]?.net_earned || 0);
            const settledOut = parseFloat(testSettledRes.rows[0]?.settled_out || 0);
            // Convert settled_out from ZMW to ngwe for consistent comparison
            availableBalance = Math.max(0, grossEarned - (settledOut * 100));
            pendingBalance = 0;
        }
        const totalBalance = availableBalance + pendingBalance;

        const grossVolume = parseFloat(volumeRes.rows[0].gross_volume);
        const netEarnings = parseFloat(volumeRes.rows[0].net_earnings);
        const stats = [
            // Net earnings = what the merchant actually keeps
            // (full amount for direct; commission only for marketplace splits)
            { label: isLive ? 'Net Earnings' : 'Test Earnings', value: `ZK ${(netEarnings / 100).toFixed(2)}`, count: parseInt(volumeRes.rows[0].count), change: '+0%', trend: 'up' },
            { label: isLive ? 'Available Balance' : 'Test Balance', value: `ZK ${(availableBalance / 100).toFixed(2)}`, change: '+0%', trend: 'up' },
            { label: isLive ? 'Volume Processed' : 'Test Volume', value: `ZK ${(grossVolume / 100).toFixed(2)}`, change: '+0%', trend: 'up' },
            { label: 'Success Rate', value: '100%', change: '+0%', trend: 'up' },
        ];

        // Fetch recent activity — always return full gross amount so the merchant sees
        // exactly what the customer paid. For marketplace splits, also return the
        // commission (application_fee_amount) they kept and how much went to the seller.
        const recentRes = await pool.query(
            `SELECT id,
                amount AS gross_amount,
                CASE WHEN destination_merchant_id IS NOT NULL
                     THEN COALESCE(application_fee_amount, 0)
                     ELSE amount
                END AS merchant_net,
                CASE WHEN destination_merchant_id IS NOT NULL
                     THEN amount - COALESCE(application_fee_amount, 0)
                     ELSE 0
                END AS submerchant_net,
                currency, status, payment_method, description, created_at,
                destination_merchant_id IS NOT NULL AS is_split,
                application_fee_amount,
                destination_merchant_id
             FROM charges
             WHERE merchant_id = $1 AND livemode = $2
             ORDER BY created_at DESC LIMIT 10`,
            [merchantId, isLive]
        );

        // Fetch Volume by Day — merchant earnings (fee for splits, full for direct)
        const historyRes = await pool.query(
            `SELECT DATE_TRUNC('day', created_at) as day,
                SUM(CASE WHEN destination_merchant_id IS NOT NULL
                         THEN COALESCE(application_fee_amount, 0)
                         ELSE amount
                    END) as val
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
            totalCount:   parseInt(volumeRes.rows[0].count || 0),
            splitCount:   parseInt(volumeRes.rows[0].split_count || 0),
            directCount:  parseInt(volumeRes.rows[0].direct_count || 0),
            rawBalance: availableBalance,        // ngwe — frontend divides by 100
            pendingBalance: pendingBalance,       // ngwe
            totalBalance: totalBalance,           // ngwe
            recentActivity: recentRes.rows.map(c => {
                const isSplit = c.is_split;
                const gross = parseFloat(c.gross_amount || 0);
                const appFee = c.application_fee_amount ? parseFloat(c.application_fee_amount) : null;
                // merchantEarning: for direct → full amount; for split → platform commission only
                const merchantEarning = isSplit ? (appFee ?? 0) : gross;
                // submerchantEarning: for split → gross minus commission; for direct → 0
                const submerchantEarning = isSplit ? (gross - (appFee ?? 0)) : 0;
                return {
                    id: c.id,
                    grossAmount: gross.toFixed(2),
                    merchantNet: merchantEarning.toFixed(2),
                    submerchantNet: submerchantEarning.toFixed(2),
                    currency: c.currency,
                    status: c.status,
                    method: c.payment_method,
                    description: c.description,
                    created_at: c.created_at,
                    isSplit,
                    // null for direct charges, commission amount for marketplace
                    applicationFee: isSplit && appFee != null ? appFee.toFixed(2) : null,
                    hasSubMerchant: isSplit,
                    chargeType: isSplit ? 'marketplace' : 'direct',
                };
            }),
            volumeHistory: historyRes.rows.map(r => ({
                label: new Date(r.day).toLocaleDateString('en-US', { weekday: 'short' }),
                value: parseFloat(r.val) / 100    // convert to ZMW for chart
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

// NOTE: /merchants/transfer-to-wallet is registered earlier in this file (canonical handler).
// This duplicate entry has been removed to avoid Express double-registration.

// ---- GET /merchants/keys ----
// Returns both test and live key pairs for the authenticated merchant
app.get('/merchants/keys', authenticateToken, async (req, res) => {
    try {
        const merchantRes = await pool.query('SELECT id, compliance_status FROM merchants WHERE user_id = $1', [req.user.id]);
        if (merchantRes.rows.length === 0) return res.json({
            test: { public: '', secret: '' },
            live: { public: '', secret: '' },
            isApproved: false
        });

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

// --- Subscription Billing API (Developer Gateway) ---

// Products
app.post('/v1/products', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { name, description, metadata } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing required field: name' });

        const result = await pool.query(
            'INSERT INTO products (name, description, metadata, merchant_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description || '', metadata || {}, merchant.merchantId]
        );
        res.status(201).json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        console.error('[v1/products] Create error:', err);
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/products', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT * FROM products WHERE merchant_id = $1 ORDER BY created_at DESC', [merchant.merchantId]);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/products/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT * FROM products WHERE id = $1 AND merchant_id = $2', [req.params.id, merchant.merchantId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.patch('/v1/products/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { name, description, status, metadata } = req.body;
        const result = await pool.query(
            'UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status), metadata = COALESCE($4, metadata), updated_at = NOW() WHERE id = $5 AND merchant_id = $6 RETURNING *',
            [name, description, status, metadata, req.params.id, merchant.merchantId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.delete('/v1/products/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('DELETE FROM products WHERE id = $1 AND merchant_id = $2 RETURNING id', [req.params.id, merchant.merchantId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(DeveloperGateway.formatResponse({ deleted: true, id: req.params.id }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Prices
app.post('/v1/prices', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { product_id, amount, currency, interval, interval_count, trial_days } = req.body;
        if (!product_id || !amount || !currency || !interval) return res.status(400).json({ error: 'Missing req fields' });

        const prodCheck = await pool.query('SELECT id FROM products WHERE id = $1 AND merchant_id = $2', [product_id, merchant.merchantId]);
        if (prodCheck.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

        const result = await pool.query(
            'INSERT INTO prices (product_id, amount, currency, interval, billing_interval, interval_count, trial_days) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [product_id, amount, currency.toUpperCase(), interval, interval, interval_count || 1, trial_days || 0]
        );
        res.status(201).json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        console.error('[v1/prices] Create error:', err);
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/prices', async (req, res) => {
    try {
        const { product_id } = req.query;
        let query = 'SELECT * FROM prices';
        let params = [];
        if (product_id) {
            query += ' WHERE product_id = $1';
            params.push(product_id);
        }
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[v1/prices] Fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/v1/prices/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT p.* FROM prices p JOIN products pr ON p.product_id = pr.id WHERE p.id = $1 AND pr.merchant_id = $2', [req.params.id, merchant.merchantId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Price not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Customers
app.post('/v1/customers', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { email, name } = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email' });

        let stripeCustomerId = null;
        try {
            const stripeCust = await stripe.customers.create({ email, name, metadata: { merchant_id: merchant.merchantId } });
            stripeCustomerId = stripeCust.id;
        } catch (e) { console.error('Stripe cust err', e.message); }

        const result = await pool.query(
            'INSERT INTO customers (email, name, stripe_id, merchant_id) VALUES ($1, $2, $3, $4) ON CONFLICT (email, merchant_id) DO UPDATE SET name = $2 RETURNING *',
            [email, name || '', stripeCustomerId, merchant.merchantId]
        );
        res.status(201).json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/customers', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT * FROM customers WHERE merchant_id = $1 ORDER BY created_at DESC', [merchant.merchantId]);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/customers/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT * FROM customers WHERE id = $1 AND merchant_id = $2', [req.params.id, merchant.merchantId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.patch('/v1/customers/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { name, phone, mobile_money_provider } = req.body;
        const result = await pool.query(
            `UPDATE customers
             SET name                  = COALESCE($1, name),
                 phone                 = COALESCE($2, phone),
                 mobile_money_provider = COALESCE($3, mobile_money_provider),
                 updated_at            = NOW()
             WHERE id = $4 AND merchant_id = $5 RETURNING *`,
            [name, phone, mobile_money_provider, req.params.id, merchant.merchantId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Subscriptions
app.post('/v1/subscriptions', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { customer_id, price_id } = req.body;

        const custCheck = await pool.query('SELECT id, stripe_id FROM customers WHERE id = $1 AND merchant_id = $2', [customer_id, merchant.merchantId]);
        if (custCheck.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });

        const priceCheck = await pool.query('SELECT p.* FROM prices p JOIN products pr ON p.product_id = pr.id WHERE p.id = $1 AND pr.merchant_id = $2', [price_id, merchant.merchantId]);
        if (priceCheck.rows.length === 0) return res.status(404).json({ error: 'Price not found' });

        const price = priceCheck.rows[0];
        const customer = custCheck.rows[0];

        // Determine trial end
        const trialDays = parseInt(price.trial_days) || 0;
        const trialStatus = trialDays > 0 ? 'trialing' : 'incomplete';
        const now = new Date();
        const periodStart = now;
        const periodEnd = trialDays > 0
            ? new Date(now.getTime() + trialDays * 86400 * 1000)
            : now; // will be advanced on first payment

        const subInsert = await pool.query(`
            INSERT INTO subscriptions
              (customer_id, price_id, status, merchant_id, livemode,
               current_period_start, current_period_end, trial_end)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
        `, [customer_id, price_id, trialStatus, merchant.merchantId,
            merchant.environment === 'live',
            periodStart, periodEnd,
            trialDays > 0 ? periodEnd : null]);
        const subscription = subInsert.rows[0];

        // Emit webhook
        setImmediate(() => emitWebhookForMerchant(merchant.merchantId, 'subscription.created', {
            id: subscription.id, customer_id, price_id,
            status: trialStatus, livemode: subscription.livemode,
            current_period_end: periodEnd,
        }));

        // In sandbox, auto-activate if no trial — create payment intent for first charge
        let clientSecret = null;
        try {
            const amountInCents = Math.round(parseFloat(price.amount) * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: price.currency.toLowerCase(),
                customer: customer.stripe_id || undefined,
                setup_future_usage: 'off_session',
                metadata: {
                    subscription_id: subscription.id,
                    merchant_id: merchant.merchantId,
                    price_id: price.id,
                    type: 'subscription_first_payment'
                }
            });
            clientSecret = paymentIntent.client_secret;
        } catch (_stripeErr) {
            // Stripe unavailable (sandbox without keys) — auto-activate
            if (!subscription.livemode) {
                const fakePI = { id: 'pi_sandbox_' + crypto.randomUUID().replace(/-/g,'').slice(0,24), amount: Math.round(parseFloat(price.amount) * 100), currency: price.currency.toUpperCase() };
                await recordSubscriptionPayment(subscription.id, fakePI).catch(() => {});
            }
        }

        res.status(201).json(DeveloperGateway.formatResponse({
            ...subscription,
            client_secret: clientSecret,
        }, merchant.environment));

    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/subscriptions', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { customer_id } = req.query;
        // Use merchant_id directly from subscriptions table (with fallback to customers join)
        let query = `SELECT s.* FROM subscriptions s 
                     WHERE s.merchant_id = $1 
                     OR (s.merchant_id IS NULL AND s.customer_id IN (SELECT id FROM customers WHERE merchant_id = $1))`;
        let params = [merchant.merchantId];
        if (customer_id) {
            query += ` AND s.customer_id = $2`;
            params.push(customer_id);
        }
        query += ' ORDER BY s.created_at DESC';
        const result = await pool.query(query, params);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Dedicated endpoint for subscription invoices — MUST be before /:id routes
app.get('/v1/subscriptions/invoices', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { subscription_id } = req.query;

        let query = `SELECT si.*, c.email as customer_email, c.name as customer_name
                     FROM public.sub_invoice si
                     LEFT JOIN customers c ON si.customer_id = c.id
                     WHERE si.merchant_id = $1`;
        let params = [merchant.merchantId];
        if (subscription_id) {
            query += ` AND si.subscription_id = $2`;
            params.push(subscription_id);
        }
        query += ' ORDER BY si.created_at DESC';

        const result = await pool.query(query, params);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        console.error('[v1/subscriptions/invoices] Error:', err.message);
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Get single subscription invoice by ID — MUST be before /:id routes
app.get('/v1/subscriptions/invoices/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const query = `SELECT i.*, c.email as customer_email, c.name as customer_name,
                              s.id as subscription_id, s.status as subscription_status, s.price_id,
                              p.amount as price_amount, p.currency as price_currency, p.interval,
                              pr.name as product_name, pr.id as product_id
                       FROM sub_invoice i
                       LEFT JOIN customers c ON i.customer_id = c.id
                       LEFT JOIN subscriptions s ON i.subscription_id = s.id
                       LEFT JOIN prices p ON s.price_id = p.id
                       LEFT JOIN products pr ON p.product_id = pr.id
                       WHERE i.merchant_id = $1 AND i.id = $2`;
        const result = await pool.query(query, [merchant.merchantId, req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/subscriptions/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('SELECT s.* FROM subscriptions s JOIN customers c ON s.customer_id = c.id WHERE s.id = $1 AND c.merchant_id = $2', [req.params.id, merchant.merchantId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.post('/v1/subscriptions/:id/cancel', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query('UPDATE subscriptions s SET status = $1, updated_at = NOW() FROM customers c WHERE s.customer_id = c.id AND s.id = $2 AND c.merchant_id = $3 RETURNING s.*', ['canceled', req.params.id, merchant.merchantId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.post('/v1/payment-intents', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { amount, currency, customer_id } = req.body;

        let stripeCustomerId;
        if (customer_id) {
            const custCheck = await pool.query('SELECT stripe_id FROM customers WHERE id = $1 AND merchant_id = $2', [customer_id, merchant.merchantId]);
            if (custCheck.rows.length > 0) stripeCustomerId = custCheck.rows[0].stripe_id;
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(amount) * 100),
            currency: currency.toLowerCase(),
            customer: stripeCustomerId,
            metadata: { merchant_id: merchant.merchantId }
        });

        res.status(201).json(DeveloperGateway.formatResponse(paymentIntent, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/invoices', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { subscription_id, customer_id } = req.query;
        let query = `SELECT i.*, c.email as customer_email, c.name as customer_name 
                     FROM sub_invoice i 
                     JOIN customers c ON i.customer_id = c.id 
                     WHERE c.merchant_id = $1`;
        let params = [merchant.merchantId];
        let paramCount = 2;
        if (subscription_id) {
            query += ` AND i.subscription_id = $${paramCount++}`;
            params.push(subscription_id);
        }
        if (customer_id) {
            query += ` AND i.customer_id = $${paramCount++}`;
            params.push(customer_id);
        }
        query += ' ORDER BY i.created_at DESC';
        const result = await pool.query(query, params);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});


app.post('/v1/subscriptions/:id/activate', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const subId = req.params.id;

        // Verify sub belongs to merchant
        const subCheck = await pool.query(
            "SELECT s.*, pr.amount, pr.currency FROM subscriptions s JOIN prices p ON s.price_id = p.id JOIN products pr ON p.product_id = pr.id WHERE s.id = $1 AND pr.merchant_id = $2",
            [subId, merchant.merchantId]
        );
        if (subCheck.rows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
        const sub = subCheck.rows[0];

        // Simulate Stripe Payment Intent
        const paymentIntent = {
            id: 'pi_sim_' + crypto.randomBytes(8).toString('hex'),
            amount: sub.amount * 100,
            currency: sub.currency.toLowerCase()
        };

        const result = await recordSubscriptionPayment(subId, paymentIntent);
        res.json(DeveloperGateway.formatResponse({ success: true, ...result }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /v1/subscriptions/:id  — plan change with proration
// ─────────────────────────────────────────────────────────────────────────────
// Calculates unused days credit on the old plan and creates an immediate
// proration invoice charged against (new_amount − credit).
app.patch('/v1/subscriptions/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { price_id } = req.body;
        if (!price_id) return res.status(400).json({ error: 'price_id is required' });

        // Load subscription + old price
        const subRes = await pool.query(
            `SELECT s.*, p.amount AS old_amount, p.currency AS old_currency,
                    p.interval AS old_interval, p.billing_interval AS old_billing_interval,
                    p.interval_count AS old_interval_count
             FROM subscriptions s
             JOIN prices p ON s.price_id = p.id
             WHERE s.id = $1
               AND (s.merchant_id = $2 OR s.customer_id IN (SELECT id FROM customers WHERE merchant_id = $2))`,
            [req.params.id, merchant.merchantId]
        );
        if (!subRes.rows.length) return res.status(404).json({ error: 'Subscription not found' });
        const sub = subRes.rows[0];

        if (['canceled'].includes(sub.status)) {
            return res.status(400).json({ error: 'Cannot change plan on a canceled subscription' });
        }

        // Validate new price belongs to this merchant
        const newPriceRes = await pool.query(
            `SELECT p.* FROM prices p JOIN products pr ON p.product_id = pr.id
             WHERE p.id = $1 AND pr.merchant_id = $2`,
            [price_id, merchant.merchantId]
        );
        if (!newPriceRes.rows.length) return res.status(404).json({ error: 'New price not found' });
        const newPrice = newPriceRes.rows[0];

        // ── Proration calculation ────────────────────────────────────────────
        const now            = new Date();
        const periodStart    = new Date(sub.current_period_start);
        const periodEnd      = new Date(sub.current_period_end);
        const totalMs        = periodEnd - periodStart;
        const remainingMs    = Math.max(0, periodEnd - now);
        const usedRatio      = totalMs > 0 ? remainingMs / totalMs : 0;

        const oldAmount       = parseFloat(sub.old_amount);
        const newAmount       = parseFloat(newPrice.amount);
        const unusedCredit    = parseFloat((oldAmount * usedRatio).toFixed(2));
        const prorationCharge = parseFloat(Math.max(0, newAmount - unusedCredit).toFixed(2));

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Update subscription to new price, reset period from now
            const intervalUnit = (newPrice.billing_interval || newPrice.interval || 'month').toLowerCase();
            const intervalCount = parseInt(newPrice.interval_count) || 1;
            const unit = intervalUnit.startsWith('day')  ? 'days'
                       : intervalUnit.startsWith('week') ? 'weeks'
                       : intervalUnit.startsWith('year') ? 'years'
                       : 'months';

            const updRes = await client.query(
                `UPDATE subscriptions
                 SET price_id             = $1,
                     current_period_start = NOW(),
                     current_period_end   = NOW() + INTERVAL '${intervalCount} ${unit}',
                     updated_at           = NOW()
                 WHERE id = $2 RETURNING *`,
                [price_id, sub.id]
            );
            const updSub = updRes.rows[0];

            // Create proration invoice
            const invoiceNumber = 'PROR-' + Date.now().toString(36).toUpperCase();
            const invRes = await client.query(
                `INSERT INTO sub_invoice
                   (subscription_id, customer_id, merchant_id, amount, currency, status,
                    period_start, period_end, invoice_number, attempt_count, livemode, discount_amount)
                 VALUES ($1,$2,$3,$4,$5,'open', NOW(), $6, $7, 0, $8, $9) RETURNING *`,
                [sub.id, sub.customer_id, merchant.merchantId, prorationCharge, newPrice.currency,
                 updSub.current_period_end, invoiceNumber, updSub.livemode, unusedCredit]
            );
            const proroInvoice = invRes.rows[0];

            // Auto-pay proration in sandbox
            if (!updSub.livemode) {
                const mRes = await client.query('SELECT user_id FROM merchants WHERE id=$1', [merchant.merchantId]);
                if (mRes.rows.length && prorationCharge > 0) {
                    const userId = mRes.rows[0].user_id;
                    await client.query(
                        `INSERT INTO wallets (user_id, currency, balance)
                         VALUES ($1,$2,$3)
                         ON CONFLICT (user_id, currency) DO UPDATE SET balance = wallets.balance + $3, updated_at=NOW()`,
                        [userId, newPrice.currency, prorationCharge]
                    );
                }
                await client.query(`UPDATE sub_invoice SET status='paid', paid_at=NOW() WHERE id=$1`, [proroInvoice.id]);
            }

            await client.query('COMMIT');

            setImmediate(() => emitWebhookForMerchant(merchant.merchantId, 'subscription.plan_changed', {
                subscription_id: sub.id,
                old_price_id:    sub.price_id,
                new_price_id:    price_id,
                proration_credit: unusedCredit,
                proration_charge: prorationCharge,
            }));

            res.json(DeveloperGateway.formatResponse({
                ...updRes.rows[0],
                proration: {
                    unused_credit:    unusedCredit,
                    charged:          prorationCharge,
                    invoice_id:       proroInvoice.id,
                    invoice_number:   invoiceNumber,
                },
            }, merchant.environment));

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/subscriptions/:id/pause  &  POST /v1/subscriptions/:id/resume
// ─────────────────────────────────────────────────────────────────────────────
app.post('/v1/subscriptions/:id/pause', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        // pause_at defaults to now; caller may pass a future timestamp
        const pauseAt = req.body.pause_at ? new Date(req.body.pause_at) : new Date();

        const result = await pool.query(
            `UPDATE subscriptions
             SET pause_at   = $1,
                 resumed_at = NULL,
                 updated_at = NOW()
             WHERE id = $2
               AND (merchant_id = $3 OR customer_id IN (SELECT id FROM customers WHERE merchant_id = $3))
               AND status NOT IN ('canceled')
             RETURNING *`,
            [pauseAt, req.params.id, merchant.merchantId]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Subscription not found or already canceled' });

        setImmediate(() => emitWebhookForMerchant(merchant.merchantId, 'subscription.paused', {
            subscription_id: req.params.id, pause_at: pauseAt,
        }));

        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.post('/v1/subscriptions/:id/resume', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);

        const result = await pool.query(
            `UPDATE subscriptions
             SET pause_at    = NULL,
                 resumed_at  = NOW(),
                 updated_at  = NOW()
             WHERE id = $1
               AND (merchant_id = $2 OR customer_id IN (SELECT id FROM customers WHERE merchant_id = $2))
               AND status NOT IN ('canceled')
             RETURNING *`,
            [req.params.id, merchant.merchantId]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Subscription not found or already canceled' });

        setImmediate(() => emitWebhookForMerchant(merchant.merchantId, 'subscription.resumed', {
            subscription_id: req.params.id, resumed_at: new Date(),
        }));

        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Coupon CRUD  — POST / GET / GET:id / DELETE
// ─────────────────────────────────────────────────────────────────────────────
app.post('/v1/coupons', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { code, name, amount_off, percent_off, duration, duration_in_months,
                max_redemptions, valid_until } = req.body;

        if (!code) return res.status(400).json({ error: 'code is required' });
        if (!amount_off && !percent_off) return res.status(400).json({ error: 'Either amount_off or percent_off is required' });
        if (amount_off && percent_off) return res.status(400).json({ error: 'Provide either amount_off or percent_off, not both' });
        if (percent_off && (parseFloat(percent_off) <= 0 || parseFloat(percent_off) > 100)) {
            return res.status(400).json({ error: 'percent_off must be between 1 and 100' });
        }

        const result = await pool.query(
            `INSERT INTO coupons
               (merchant_id, code, name, amount_off, percent_off, currency, duration,
                duration_in_months, max_redemptions, valid_until)
             VALUES ($1, UPPER($2), $3, $4, $5, 'ZMW', $6, $7, $8, $9)
             RETURNING *`,
            [merchant.merchantId, code, name || code,
             amount_off || null, percent_off || null,
             duration || 'once', duration_in_months || null,
             max_redemptions || null, valid_until || null]
        );
        res.status(201).json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'A coupon with that code already exists' });
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/coupons', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { active } = req.query;
        let query  = 'SELECT * FROM coupons WHERE merchant_id = $1';
        const params = [merchant.merchantId];
        if (active !== undefined) { query += ' AND active = $2'; params.push(active === 'true'); }
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/coupons/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        // Allow lookup by UUID or by code
        const result = await pool.query(
            `SELECT * FROM coupons WHERE merchant_id = $1 AND (id::text = $2 OR UPPER(code) = UPPER($2))`,
            [merchant.merchantId, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Coupon not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.patch('/v1/coupons/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { active, name, max_redemptions, valid_until } = req.body;
        const result = await pool.query(
            `UPDATE coupons
             SET active          = COALESCE($1, active),
                 name            = COALESCE($2, name),
                 max_redemptions = COALESCE($3, max_redemptions),
                 valid_until     = COALESCE($4, valid_until)
             WHERE id = $5 AND merchant_id = $6 RETURNING *`,
            [active, name, max_redemptions, valid_until, req.params.id, merchant.merchantId]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Coupon not found' });
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.delete('/v1/coupons/:id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        // Soft-delete: deactivate so existing subscription discounts are unaffected
        const result = await pool.query(
            `UPDATE coupons SET active = FALSE WHERE id = $1 AND merchant_id = $2 RETURNING id`,
            [req.params.id, merchant.merchantId]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Coupon not found' });
        res.json(DeveloperGateway.formatResponse({ deleted: true, id: req.params.id }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/subscriptions/:id/discounts  — apply a coupon to a subscription
// DELETE /v1/subscriptions/:id/discounts/:discount_id  — remove a discount
// ─────────────────────────────────────────────────────────────────────────────
app.post('/v1/subscriptions/:id/discounts', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { coupon_code } = req.body;
        if (!coupon_code) return res.status(400).json({ error: 'coupon_code is required' });

        // Verify subscription belongs to merchant
        const subRes = await pool.query(
            `SELECT s.* FROM subscriptions s
             WHERE s.id = $1
               AND (s.merchant_id = $2 OR s.customer_id IN (SELECT id FROM customers WHERE merchant_id = $2))`,
            [req.params.id, merchant.merchantId]
        );
        if (!subRes.rows.length) return res.status(404).json({ error: 'Subscription not found' });

        // Look up coupon
        const couponRes = await pool.query(
            `SELECT * FROM coupons
             WHERE merchant_id = $1 AND UPPER(code) = UPPER($2) AND active = TRUE
               AND (valid_until IS NULL OR valid_until > NOW())
               AND (max_redemptions IS NULL OR redemption_count < max_redemptions)`,
            [merchant.merchantId, coupon_code]
        );
        if (!couponRes.rows.length) return res.status(404).json({ error: 'Coupon not found, expired, or exhausted' });
        const coupon = couponRes.rows[0];

        // Calculate discount amount for display (on current price)
        const priceRes = await pool.query('SELECT amount FROM prices WHERE id = $1', [subRes.rows[0].price_id]);
        const currentAmount = priceRes.rows.length ? parseFloat(priceRes.rows[0].amount) : 0;
        const discountAmount = coupon.amount_off
            ? Math.min(parseFloat(coupon.amount_off), currentAmount)
            : currentAmount * (parseFloat(coupon.percent_off) / 100);

        // Set expires_at for repeating coupons
        let expiresAt = null;
        if (coupon.duration === 'once') {
            // expires after one use — handled by consumeDiscounts
        } else if (coupon.duration === 'repeating' && coupon.duration_in_months) {
            expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + coupon.duration_in_months);
        }

        // Insert discount
        const discRes = await pool.query(
            `INSERT INTO subscription_discounts
               (subscription_id, coupon_id, discount_amount, expires_at)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.params.id, coupon.id, discountAmount.toFixed(2), expiresAt]
        );

        // Increment coupon redemption count
        await pool.query('UPDATE coupons SET redemption_count = redemption_count + 1 WHERE id = $1', [coupon.id]);

        res.status(201).json(DeveloperGateway.formatResponse({
            ...discRes.rows[0],
            coupon: { code: coupon.code, name: coupon.name, amount_off: coupon.amount_off, percent_off: coupon.percent_off },
        }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/subscriptions/:id/discounts', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query(
            `SELECT sd.*, c.code, c.name AS coupon_name, c.amount_off, c.percent_off, c.duration
             FROM subscription_discounts sd
             JOIN coupons c ON sd.coupon_id = c.id
             WHERE sd.subscription_id = $1
               AND c.merchant_id = $2
             ORDER BY sd.applied_at DESC`,
            [req.params.id, merchant.merchantId]
        );
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.delete('/v1/subscriptions/:id/discounts/:discount_id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query(
            `DELETE FROM subscription_discounts sd
             USING coupons c
             WHERE sd.id = $1 AND sd.subscription_id = $2 AND sd.coupon_id = c.id AND c.merchant_id = $3
             RETURNING sd.id`,
            [req.params.discount_id, req.params.id, merchant.merchantId]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Discount not found' });
        res.json(DeveloperGateway.formatResponse({ deleted: true, id: req.params.discount_id }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Billing Settings  GET / PUT  /v1/billing/settings
// ─────────────────────────────────────────────────────────────────────────────
app.get('/v1/billing/settings', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query(
            'SELECT * FROM merchant_billing_settings WHERE merchant_id = $1',
            [merchant.merchantId]
        );
        const defaults = {
            merchant_id: merchant.merchantId,
            dunning_days: [0, 3, 7],
            max_dunning_attempts: 3,
            trial_reminder_days: 3,
            payment_failed_email: true,
            trial_ending_email: true,
            receipt_email: true,
            cancelation_email: true,
        };
        res.json(DeveloperGateway.formatResponse(result.rows[0] || defaults, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.put('/v1/billing/settings', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const {
            dunning_days, max_dunning_attempts, trial_reminder_days,
            payment_failed_email, trial_ending_email, receipt_email, cancelation_email,
        } = req.body;

        if (dunning_days && (!Array.isArray(dunning_days) || dunning_days.some(d => typeof d !== 'number'))) {
            return res.status(400).json({ error: 'dunning_days must be an array of numbers, e.g. [0,3,7]' });
        }

        const result = await pool.query(
            `INSERT INTO merchant_billing_settings
               (merchant_id, dunning_days, max_dunning_attempts, trial_reminder_days,
                payment_failed_email, trial_ending_email, receipt_email, cancelation_email)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (merchant_id) DO UPDATE SET
               dunning_days          = COALESCE($2, merchant_billing_settings.dunning_days),
               max_dunning_attempts  = COALESCE($3, merchant_billing_settings.max_dunning_attempts),
               trial_reminder_days   = COALESCE($4, merchant_billing_settings.trial_reminder_days),
               payment_failed_email  = COALESCE($5, merchant_billing_settings.payment_failed_email),
               trial_ending_email    = COALESCE($6, merchant_billing_settings.trial_ending_email),
               receipt_email         = COALESCE($7, merchant_billing_settings.receipt_email),
               cancelation_email     = COALESCE($8, merchant_billing_settings.cancelation_email),
               updated_at            = NOW()
             RETURNING *`,
            [merchant.merchantId,
             dunning_days || null, max_dunning_attempts || null, trial_reminder_days || null,
             payment_failed_email ?? null, trial_ending_email ?? null,
             receipt_email ?? null, cancelation_email ?? null]
        );
        res.json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/subscriptions/:id/payment-method  — update customer's mobile money
// ─────────────────────────────────────────────────────────────────────────────
app.post('/v1/subscriptions/:id/payment-method', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { phone, mobile_money_provider } = req.body;
        if (!phone) return res.status(400).json({ error: 'phone is required' });

        // Verify subscription belongs to merchant
        const subRes = await pool.query(
            `SELECT s.customer_id FROM subscriptions s
             WHERE s.id = $1 AND (s.merchant_id = $2 OR s.customer_id IN (SELECT id FROM customers WHERE merchant_id = $2))`,
            [req.params.id, merchant.merchantId]
        );
        if (!subRes.rows.length) return res.status(404).json({ error: 'Subscription not found' });

        const result = await pool.query(
            `UPDATE customers SET phone=$1, mobile_money_provider=$2, updated_at=NOW()
             WHERE id=$3 AND merchant_id=$4 RETURNING id, email, name, phone, mobile_money_provider`,
            [phone, mobile_money_provider || 'MTN', subRes.rows[0].customer_id, merchant.merchantId]
        );
        res.json(DeveloperGateway.formatResponse({ updated: true, customer: result.rows[0] }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/analytics/subscriptions  — MRR, ARR, churn, growth, 12-month forecast
// ─────────────────────────────────────────────────────────────────────────────
app.get('/v1/analytics/subscriptions', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const mid = merchant.merchantId;

        const [subsRes, invoiceRes, newRes, canceledRes, recentRes] = await Promise.all([
            // All active subscriptions with their monthly equivalent
            pool.query(`
                SELECT s.id, p.amount, p.currency,
                       CASE p.interval
                           WHEN 'day'   THEN p.amount * 30
                           WHEN 'week'  THEN p.amount * 4
                           WHEN 'year'  THEN p.amount / 12
                           ELSE p.amount
                       END AS monthly_amount
                FROM subscriptions s
                JOIN prices p ON s.price_id = p.id
                WHERE s.status = 'active'
                  AND (s.merchant_id = $1 OR s.customer_id IN (SELECT id FROM customers WHERE merchant_id = $1))
            `, [mid]),

            // Revenue last 30 days (paid invoices)
            pool.query(`
                SELECT COALESCE(SUM(amount), 0) AS total_30d,
                       COALESCE(SUM(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) AS revenue_30d,
                       COALESCE(SUM(amount) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),  0) AS revenue_7d
                FROM sub_invoice WHERE merchant_id=$1 AND status='paid'
            `, [mid]),

            // New subscriptions this month
            pool.query(`
                SELECT COUNT(*) AS count FROM subscriptions
                WHERE (merchant_id=$1 OR customer_id IN (SELECT id FROM customers WHERE merchant_id=$1))
                  AND created_at >= DATE_TRUNC('month', NOW())
                  AND status != 'canceled'
            `, [mid]),

            // Canceled this month
            pool.query(`
                SELECT COUNT(*) AS count FROM subscriptions
                WHERE (merchant_id=$1 OR customer_id IN (SELECT id FROM customers WHERE merchant_id=$1))
                  AND canceled_at >= DATE_TRUNC('month', NOW())
                  AND status = 'canceled'
            `, [mid]),

            // Last 12 months revenue for forecast
            pool.query(`
                SELECT DATE_TRUNC('month', created_at) AS month,
                       SUM(amount) AS revenue,
                       COUNT(*) AS invoice_count
                FROM sub_invoice
                WHERE merchant_id=$1 AND status='paid'
                  AND created_at >= NOW() - INTERVAL '12 months'
                GROUP BY 1 ORDER BY 1
            `, [mid]),
        ]);

        const activeSubs  = subsRes.rows;
        const totalSubs   = activeSubs.length;
        const mrr         = activeSubs.reduce((s, r) => s + parseFloat(r.monthly_amount), 0);
        const arr         = mrr * 12;
        const revenue30d  = parseFloat(invoiceRes.rows[0].revenue_30d);
        const newThisMonth = parseInt(newRes.rows[0].count);
        const canceledThisMonth = parseInt(canceledRes.rows[0].count);

        // All subscription counts for churn rate
        const totalAllRes = await pool.query(
            `SELECT COUNT(*) FROM subscriptions WHERE merchant_id=$1 OR customer_id IN (SELECT id FROM customers WHERE merchant_id=$1)`,
            [mid]
        );
        const totalAll   = parseInt(totalAllRes.rows[0].count) || 1;
        const churnRate  = totalAll > 0 ? parseFloat((canceledThisMonth / totalAll * 100).toFixed(2)) : 0;

        // Average revenue per subscriber
        const avgRevenue = totalSubs > 0 ? parseFloat((mrr / totalSubs).toFixed(2)) : 0;

        // 12-month forecast: use average of last 3 months growth
        const recentMonths = recentRes.rows.slice(-3);
        const avgGrowth = recentMonths.length >= 2
            ? recentMonths.reduce((sum, m, i) => {
                if (i === 0) return 0;
                const prev = parseFloat(recentMonths[i-1].revenue);
                const curr = parseFloat(m.revenue);
                return sum + (prev > 0 ? (curr - prev) / prev : 0);
              }, 0) / Math.max(1, recentMonths.length - 1)
            : 0;

        const forecast = [];
        let projectedMrr = mrr;
        for (let i = 1; i <= 12; i++) {
            projectedMrr = projectedMrr * (1 + avgGrowth);
            const d = new Date();
            d.setMonth(d.getMonth() + i);
            forecast.push({
                month: d.toISOString().slice(0, 7),
                projected_mrr: parseFloat(projectedMrr.toFixed(2)),
            });
        }

        res.json(DeveloperGateway.formatResponse({
            mrr:                  parseFloat(mrr.toFixed(2)),
            arr:                  parseFloat(arr.toFixed(2)),
            active_subscriptions: totalSubs,
            new_this_month:       newThisMonth,
            canceled_this_month:  canceledThisMonth,
            churn_rate:           churnRate,
            avg_revenue_per_subscriber: avgRevenue,
            revenue_last_30d:     revenue30d,
            mrr_growth_rate:      parseFloat((avgGrowth * 100).toFixed(2)),
            monthly_revenue:      recentRes.rows.map(r => ({
                month: r.month?.toISOString?.().slice(0,7) || r.month,
                revenue: parseFloat(r.revenue),
                invoice_count: parseInt(r.invoice_count),
            })),
            forecast_12m: forecast,
        }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /v1/analytics/churn-cohorts
// ─────────────────────────────────────────────────────────────────────────────
app.get('/v1/analytics/churn-cohorts', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const mid = merchant.merchantId;

        const cohortsRes = await pool.query(`
            WITH cohort_base AS (
                SELECT
                    id,
                    DATE_TRUNC('month', created_at)  AS cohort_month,
                    DATE_TRUNC('month', canceled_at) AS cancel_month,
                    status
                FROM subscriptions
                WHERE merchant_id = $1
                   OR customer_id IN (SELECT id FROM customers WHERE merchant_id = $1)
            ),
            cohort_sizes AS (
                SELECT cohort_month, COUNT(*) AS total_subscribed
                FROM cohort_base GROUP BY 1
            ),
            survived AS (
                SELECT
                    cohort_month,
                    EXTRACT(MONTH FROM AGE(
                        COALESCE(cancel_month, DATE_TRUNC('month', NOW())),
                        cohort_month
                    )) AS months_survived,
                    COUNT(*) AS count
                FROM cohort_base GROUP BY 1, 2
            )
            SELECT
                cs.cohort_month,
                cs.total_subscribed,
                COALESCE(s1.count, 0)  AS retained_1m,
                COALESCE(s3.count, 0)  AS retained_3m,
                COALESCE(s6.count, 0)  AS retained_6m,
                COALESCE(s12.count, 0) AS retained_12m
            FROM cohort_sizes cs
            LEFT JOIN survived s1  ON s1.cohort_month  = cs.cohort_month AND s1.months_survived >= 1
            LEFT JOIN survived s3  ON s3.cohort_month  = cs.cohort_month AND s3.months_survived >= 3
            LEFT JOIN survived s6  ON s6.cohort_month  = cs.cohort_month AND s6.months_survived >= 6
            LEFT JOIN survived s12 ON s12.cohort_month = cs.cohort_month AND s12.months_survived >= 12
            WHERE cs.cohort_month >= NOW() - INTERVAL '12 months'
            ORDER BY cs.cohort_month DESC
        `, [mid]);

        res.json(DeveloperGateway.formatResponse(cohortsRes.rows.map(r => ({
            month:            r.cohort_month?.toISOString?.().slice(0,7) || r.cohort_month,
            subscribed:       parseInt(r.total_subscribed),
            retained_1m:      parseInt(r.retained_1m),
            retained_3m:      parseInt(r.retained_3m),
            retained_6m:      parseInt(r.retained_6m),
            retained_12m:     parseInt(r.retained_12m),
            retention_rate_1m: r.total_subscribed > 0 ? parseFloat((r.retained_1m / r.total_subscribed * 100).toFixed(1)) : 0,
        })), merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Usage-based billing  — Meters + Usage reporting
// ─────────────────────────────────────────────────────────────────────────────
app.post('/v1/meters', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { name, key, unit, aggregation } = req.body;
        if (!name || !key) return res.status(400).json({ error: 'name and key are required' });
        const result = await pool.query(
            `INSERT INTO billing_meters (merchant_id, name, key, unit, aggregation)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [merchant.merchantId, name, key.toLowerCase().replace(/[^a-z0-9_]/g,'_'),
             unit || 'unit', aggregation || 'sum']
        );
        res.status(201).json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Meter key already exists' });
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

app.get('/v1/meters', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const result = await pool.query(
            'SELECT * FROM billing_meters WHERE merchant_id=$1 ORDER BY created_at DESC',
            [merchant.merchantId]
        );
        res.json(DeveloperGateway.formatResponse(result.rows, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Report usage for a metered subscription
app.post('/v1/usage', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const { subscription_id, meter_key, quantity, idempotency_key } = req.body;
        if (!subscription_id || !meter_key || quantity == null) {
            return res.status(400).json({ error: 'subscription_id, meter_key, and quantity are required' });
        }

        // Verify subscription + meter belong to merchant
        const [subRes, meterRes] = await Promise.all([
            pool.query(
                `SELECT s.id FROM subscriptions s WHERE s.id=$1 AND (s.merchant_id=$2 OR s.customer_id IN (SELECT id FROM customers WHERE merchant_id=$2))`,
                [subscription_id, merchant.merchantId]
            ),
            pool.query('SELECT id FROM billing_meters WHERE merchant_id=$1 AND key=$2', [merchant.merchantId, meter_key]),
        ]);
        if (!subRes.rows.length)  return res.status(404).json({ error: 'Subscription not found' });
        if (!meterRes.rows.length) return res.status(404).json({ error: 'Meter not found' });

        const result = await pool.query(
            `INSERT INTO billing_usage (subscription_id, meter_id, quantity, idempotency_key)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (idempotency_key) DO UPDATE SET quantity = $3
             RETURNING *`,
            [subscription_id, meterRes.rows[0].id, quantity, idempotency_key || null]
        );
        res.status(201).json(DeveloperGateway.formatResponse(result.rows[0], merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Get usage for a subscription's current billing period
app.get('/v1/usage/:subscription_id', async (req, res) => {
    try {
        const merchant = await DeveloperGateway.authenticate(req.headers.authorization);
        const subRes = await pool.query(
            `SELECT s.current_period_start, s.current_period_end FROM subscriptions s
             WHERE s.id=$1 AND (s.merchant_id=$2 OR s.customer_id IN (SELECT id FROM customers WHERE merchant_id=$2))`,
            [req.params.subscription_id, merchant.merchantId]
        );
        if (!subRes.rows.length) return res.status(404).json({ error: 'Subscription not found' });
        const { current_period_start, current_period_end } = subRes.rows[0];

        const usage = await pool.query(`
            SELECT m.key, m.name, m.unit, m.aggregation,
                   CASE m.aggregation
                       WHEN 'sum'    THEN SUM(u.quantity)
                       WHEN 'max'    THEN MAX(u.quantity)
                       WHEN 'latest' THEN (SELECT quantity FROM billing_usage WHERE meter_id=m.id AND subscription_id=$1 ORDER BY recorded_at DESC LIMIT 1)
                       ELSE SUM(u.quantity)
                   END AS total
            FROM billing_meters m
            LEFT JOIN billing_usage u
              ON u.meter_id = m.id AND u.subscription_id=$1
                 AND u.recorded_at >= $2 AND u.recorded_at < $3
            WHERE m.merchant_id=$4
            GROUP BY m.id, m.key, m.name, m.unit, m.aggregation
        `, [req.params.subscription_id, current_period_start, current_period_end, merchant.merchantId]);

        res.json(DeveloperGateway.formatResponse({
            subscription_id:       req.params.subscription_id,
            period_start:          current_period_start,
            period_end:            current_period_end,
            meters:                usage.rows,
        }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Customer Self-Service Portal  — session creation + public endpoints
// ─────────────────────────────────────────────────────────────────────────────
const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET || 'flapa_portal_secret_change_in_prod';
const PORTAL_TTL_HOURS  = 24;

// Merchant creates a portal session for a customer
app.post('/v1/customer-portal/sessions', async (req, res) => {
    try {
        const merchant     = await DeveloperGateway.authenticate(req.headers.authorization);
        const { customer_id, return_url } = req.body;
        if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });

        const custRes = await pool.query(
            'SELECT id, email, name FROM customers WHERE id=$1 AND merchant_id=$2',
            [customer_id, merchant.merchantId]
        );
        if (!custRes.rows.length) return res.status(404).json({ error: 'Customer not found' });

        const expiresAt = new Date(Date.now() + PORTAL_TTL_HOURS * 3600 * 1000);
        const token     = jwt.sign(
            { customer_id, merchant_id: merchant.merchantId, type: 'portal' },
            PORTAL_JWT_SECRET,
            { expiresIn: `${PORTAL_TTL_HOURS}h` }
        );

        await pool.query(
            `INSERT INTO customer_portal_sessions (merchant_id, customer_id, token, expires_at)
             VALUES ($1,$2,$3,$4)`,
            [merchant.merchantId, customer_id, token, expiresAt]
        );

        const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscriptions/portal/${token}`;
        res.status(201).json(DeveloperGateway.formatResponse({ url: portalUrl, token, expires_at: expiresAt }, merchant.environment));
    } catch (err) {
        res.status(err.message.includes('Unauthorized') ? 401 : 400).json({ error: err.message });
    }
});

// Public portal — load customer data from token (no merchant auth needed)
app.get('/v1/portal/:token', async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, PORTAL_JWT_SECRET);
        const session = await pool.query(
            'SELECT * FROM customer_portal_sessions WHERE token=$1 AND expires_at > NOW()',
            [req.params.token]
        );
        if (!session.rows.length) return res.status(401).json({ error: 'Portal session expired or invalid' });

        const [custRes, subsRes] = await Promise.all([
            pool.query('SELECT id, email, name, phone, mobile_money_provider FROM customers WHERE id=$1', [decoded.customer_id]),
            pool.query(`
                SELECT s.id, s.status, s.current_period_end, s.pause_at, s.trial_end,
                       p.amount, p.currency, p.interval,
                       pr.name AS product_name
                FROM subscriptions s
                JOIN prices p ON s.price_id = p.id
                JOIN products pr ON p.product_id = pr.id
                WHERE s.customer_id=$1 AND s.status NOT IN ('canceled')
                ORDER BY s.created_at DESC
            `, [decoded.customer_id]),
        ]);

        if (!custRes.rows.length) return res.status(404).json({ error: 'Customer not found' });

        res.json({
            customer:      custRes.rows[0],
            subscriptions: subsRes.rows,
            merchant_id:   decoded.merchant_id,
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired portal token' });
    }
});

// Portal — get invoices
app.get('/v1/portal/:token/invoices', async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, PORTAL_JWT_SECRET);
        const session = await pool.query('SELECT id FROM customer_portal_sessions WHERE token=$1 AND expires_at > NOW()', [req.params.token]);
        if (!session.rows.length) return res.status(401).json({ error: 'Portal session expired' });

        const invoices = await pool.query(
            `SELECT si.*, pr.name AS product_name
             FROM sub_invoice si
             LEFT JOIN subscriptions s  ON si.subscription_id = s.id
             LEFT JOIN prices p         ON s.price_id = p.id
             LEFT JOIN products pr      ON p.product_id = pr.id
             WHERE si.customer_id=$1 ORDER BY si.created_at DESC LIMIT 50`,
            [decoded.customer_id]
        );
        res.json({ invoices: invoices.rows });
    } catch (err) {
        res.status(401).json({ error: 'Invalid portal token' });
    }
});

// Portal — update payment method
app.put('/v1/portal/:token/payment-method', async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, PORTAL_JWT_SECRET);
        const session = await pool.query('SELECT id FROM customer_portal_sessions WHERE token=$1 AND expires_at > NOW()', [req.params.token]);
        if (!session.rows.length) return res.status(401).json({ error: 'Portal session expired' });

        const { phone, mobile_money_provider } = req.body;
        if (!phone) return res.status(400).json({ error: 'phone is required' });

        await pool.query(
            'UPDATE customers SET phone=$1, mobile_money_provider=$2, updated_at=NOW() WHERE id=$3',
            [phone, mobile_money_provider || 'MTN', decoded.customer_id]
        );
        res.json({ updated: true });
    } catch (err) {
        res.status(401).json({ error: 'Invalid portal token' });
    }
});

// Portal — cancel subscription
app.post('/v1/portal/:token/subscriptions/:sub_id/cancel', async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, PORTAL_JWT_SECRET);
        const session = await pool.query('SELECT id FROM customer_portal_sessions WHERE token=$1 AND expires_at > NOW()', [req.params.token]);
        if (!session.rows.length) return res.status(401).json({ error: 'Portal session expired' });

        const result = await pool.query(
            `UPDATE subscriptions SET status='canceled', canceled_at=NOW(), updated_at=NOW()
             WHERE id=$1 AND customer_id=$2 RETURNING id`,
            [req.params.sub_id, decoded.customer_id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Subscription not found' });
        res.json({ canceled: true, subscription_id: req.params.sub_id });
    } catch (err) {
        res.status(401).json({ error: 'Invalid portal token' });
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
            return res.status(400).json({
                error: `Unsupported currency pair: ${fromCurrency}/${toCurrency}`
            });
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
        console.error('[FX Quote] Error:', err.message, err.stack?.split('\n')[1]);
        res.status(500).json({ error: 'Failed to generate FX quote', details: err.message });
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
const cron = require('node-cron');

// Auto-create Phase 7 tables if not present (safe with IF NOT EXISTS)
pool.query(`
    CREATE TABLE IF NOT EXISTS platform_notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL,
        type        VARCHAR(80)  NOT NULL,
        title       VARCHAR(200) NOT NULL,
        body        TEXT,
        metadata    JSONB        NOT NULL DEFAULT '{}',
        read        BOOLEAN      NOT NULL DEFAULT false,
        livemode    BOOLEAN      NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_platform_notif_merchant ON platform_notifications(merchant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_platform_notif_unread   ON platform_notifications(merchant_id, read) WHERE read = false;

    CREATE TABLE IF NOT EXISTS platform_earnings_cache (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id      UUID NOT NULL,
        period_start     DATE NOT NULL,
        period_end       DATE NOT NULL,
        period_type      VARCHAR(20) NOT NULL DEFAULT 'month',
        total_fees       NUMERIC(18,4) NOT NULL DEFAULT 0,
        charge_fees      NUMERIC(18,4) NOT NULL DEFAULT 0,
        payout_fees      NUMERIC(18,4) NOT NULL DEFAULT 0,
        refund_reversals NUMERIC(18,4) NOT NULL DEFAULT 0,
        currency         VARCHAR(10)   NOT NULL DEFAULT 'ZMW',
        livemode         BOOLEAN       NOT NULL DEFAULT false,
        computed_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        UNIQUE (merchant_id, period_start, period_type, currency, livemode)
    );
    CREATE INDEX IF NOT EXISTS idx_platform_earnings_merchant ON platform_earnings_cache(merchant_id, period_start DESC);
`).then(() => console.log('[Init] Phase 7 tables ready.')).catch(err => console.error('[Init] Phase 7 table error:', err.message));

// Serve React SPA for all non-API routes
const FRONTEND_DIST = path.join(__dirname, 'apps/web/dist');
if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
    app.use((req, res) => {
        res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified Server running on port ${PORT}`);

    // ── Connect Payout Scheduler — every hour ─────────────────────────────────
    cron.schedule('0 * * * *', () => {
        console.log('[Cron] Running Connect Payout Scheduler tick...');
        runSchedulerTick().catch(err => console.error('[Cron] Scheduler error:', err.message));
    });

    // ── Connect Payout Retry Worker — every 30 min ────────────────────────────
    cron.schedule('*/30 * * * *', () => {
        console.log('[Cron] Running Payout Retry Worker...');
        runRetryWorker().catch(err => console.error('[Cron] Retry Worker error:', err.message));
    });

    // ── Split Payment Settlement Worker — every hour ──────────────────────────
    // Moves pending balance → available for all connected accounts where available_at <= NOW()
    // and fires transaction.split.available webhooks
    cron.schedule('15 * * * *', async () => {
        console.log('[Cron] Running Split Payment Settlement Worker...');
        try {
            // Find all unsettled charges that are now available
            const dueRes = await pool.query(
                `SELECT c.id, c.merchant_id, c.destination_merchant_id, c.amount, c.currency, c.livemode
                 FROM charges c
                 WHERE c.is_settled = false
                   AND c.available_at IS NOT NULL
                   AND c.available_at <= NOW()
                   AND c.status = 'succeeded'`
            );
            console.log(`[Settlement] ${dueRes.rows.length} charges ready to settle.`);
            for (const charge of dueRes.rows) {
                const merchantId = charge.destination_merchant_id || charge.merchant_id;
                await refreshMerchantBalance(merchantId);
                // Also refresh platform merchant if split
                if (charge.destination_merchant_id && charge.destination_merchant_id !== charge.merchant_id) {
                    await refreshMerchantBalance(charge.merchant_id);
                }
                // Fire transaction.split.available webhook after settlement
                if (charge.destination_merchant_id) {
                    dispatchWebhook(charge.merchant_id, 'transaction.split.available', {
                        charge_id: charge.id,
                        sub_merchant_id: charge.destination_merchant_id,
                        amount: parseFloat(charge.amount),
                        currency: charge.currency,
                        settled_at: new Date().toISOString(),
                        livemode: charge.livemode
                    });
                }
            }
        } catch (err) {
            console.error('[Cron] Settlement Worker error:', err.message);
        }
    });

    console.log('[UnifiedServer] Connect Payout Scheduler & Retry Worker initialized');

    // ── Subscription Billing Engine ───────────────────────────────────────────
    SubscriptionRenewalService.setWebhookEmitter(emitWebhookForMerchant);
    SubscriptionRenewalService.ensureTables()
        .then(() => console.log('[Billing] Subscription billing tables ready'))
        .catch(err => console.error('[Billing] Table setup error:', err.message));

    // Renewal: every hour, on the hour
    cron.schedule('5 * * * *', () => {
        console.log('[Cron] Running Subscription Renewal engine...');
        SubscriptionRenewalService.processRenewals()
            .catch(err => console.error('[Cron] Renewal error:', err.message));
    });

    // Dunning: every 15 minutes
    cron.schedule('*/15 * * * *', () => {
        SubscriptionRenewalService.processDunning()
            .catch(err => console.error('[Cron] Dunning error:', err.message));
    });

    // Trial finalization: every 30 minutes
    cron.schedule('*/30 * * * *', () => {
        SubscriptionRenewalService.finalizeTrials()
            .catch(err => console.error('[Cron] Trial finalization error:', err.message));
    });

    // Pending PawaPay deposits: every 5 minutes — settles in-flight STK push payments
    cron.schedule('*/5 * * * *', () => {
        SubscriptionRenewalService.checkPendingDeposits()
            .catch(err => console.error('[Cron] Pending deposits check error:', err.message));
    });

    // Webhook auto-retry: every 5 minutes — exponential backoff, max 5 attempts
    ensureWebhookRetryColumns()
        .then(() => console.log('[Billing] Webhook retry columns ready'))
        .catch(err => console.error('[Billing] Webhook column setup error:', err.message));

    cron.schedule('*/5 * * * *', () => {
        retryFailedWebhooks()
            .catch(err => console.error('[Cron] Webhook retry error:', err.message));
    });

    // Trial ending soon reminder: daily at 09:00 (sends 3-day warning emails)
    cron.schedule('0 9 * * *', () => {
        SubscriptionRenewalService.checkTrialEndingSoon()
            .catch(err => console.error('[Cron] Trial reminder error:', err.message));
    });

    // ── Unclaimed Payment Expiry — daily at 02:00 ─────────────────────────────
    cron.schedule('0 2 * * *', async () => {
        console.log('[Cron] Running unclaimed payment expiry job...');
        try {
            const expired = await pool.query(
                `SELECT up.*, u.email AS sender_email, u.full_name AS sender_name
                 FROM unclaimed_payments up
                 JOIN users u ON up.sender_id = u.id
                 WHERE up.status = 'PENDING' AND up.expires_at < NOW()`
            );
            let count = 0;
            for (const p of expired.rows) {
                const c = await pool.connect();
                try {
                    await c.query('BEGIN');
                    const refundAmount = parseFloat(p.amount) + parseFloat(p.fee);
                    await c.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [refundAmount, p.debit_wallet_id]);
                    await c.query(`UPDATE unclaimed_payments SET status = 'EXPIRED' WHERE id = $1`, [p.id]);
                    await c.query('COMMIT');
                    count++;
                    renderPaymentExpiredEmail({
                        senderName: p.sender_name || p.sender_email,
                        recipientEmail: p.recipient_email,
                        amount: parseFloat(p.amount).toFixed(2),
                        currency: p.currency,
                        reference: p.id,
                    }).then(html => {
                        resend.emails.send({
                            from: EMAIL_FROM,
                            to: [p.sender_email],
                            subject: `Payment expired — ${p.currency} ${parseFloat(p.amount).toFixed(2)} refunded to your wallet`,
                            html,
                        }).catch(e => console.error('[Cron] Expiry email error:', e));
                    });
                } catch (e) {
                    await c.query('ROLLBACK');
                    console.error('[Cron] Failed to expire payment:', p.id, e);
                } finally {
                    c.release();
                }
            }
            console.log(`[Cron] Expired ${count} unclaimed payment(s).`);
        } catch (err) {
            console.error('[Cron] Unclaimed expiry error:', err.message);
        }
    });

    console.log('[UnifiedServer] Subscription Billing Engine initialized');

    // ── Escrow AI Agent Monitor (Check every 12 hours) ────────────────────────
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
