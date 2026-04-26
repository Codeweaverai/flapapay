// server.js - Simplified Authentication Server
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL client configuration
const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'flapapay_db',
    user: 'postgres',
    password: '12345678',
    ssl: false
});

// Connect to database
client.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Database connection error:', err));

// JWT Secret
const JWT_SECRET = 'your_jwt_secret_key_here'; // In production, use environment variable

// Helper function to validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Helper function to verify password strength
function verifyPasswordStrength(password) {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/\d/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character' };
    }
    return { isValid: true, message: '' };
}

// SIGNUP Route
app.post('/auth/register', async (req, res) => {
    const { email, password, fullName } = req.body;

    // Input validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = verifyPasswordStrength(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
    }

    try {
        // Check if user exists
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert User
        const userResult = await client.query(
            `INSERT INTO users (email, password_hash, full_name, email_verified, password_changed_at)
             VALUES ($1, $2, $3, true, NOW())
             RETURNING id, email, created_at`,
            [email, passwordHash, fullName]
        );
        const user = userResult.rows[0];

        // Create Default Wallets (USD, NGN)
        await client.query(
            `INSERT INTO wallets (user_id, currency, balance) VALUES ($1, 'USD', 0.00)`,
            [user.id]
        );
        await client.query(
            `INSERT INTO wallets (user_id, currency, balance) VALUES ($1, 'NGN', 0.00)`,
            [user.id]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email }
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// LOGIN Route
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' } // Token valid for 24 hours
        );

        // Update last login time
        await client.query(
            `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
            [user.id]
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                emailVerified: user.email_verified
            },
            token: token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PROFILE Route (protected)
app.get('/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const userResult = await client.query(
            `SELECT id, email, full_name, phone_number, kyc_level, email_verified, last_login_at
             FROM users
             WHERE id = $1`,
            [decoded.userId]
        );

        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const walletsResult = await client.query(
            'SELECT id, currency, balance, status FROM wallets WHERE user_id = $1',
            [decoded.userId]
        );

        res.json({
            user: userResult.rows[0],
            wallets: walletsResult.rows
        });

    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// HEALTH Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'simple-auth-service' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Simple Auth Service running on http://192.168.87.152:${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST /auth/register - Register a new user');
    console.log('  POST /auth/login - Login with email and password');
    console.log('  GET  /auth/me - Get user profile (requires token)');
    console.log('  GET  /health - Health check');
});