import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db'; // Import the updated db file
import {
    verifyPasswordStrength,
    validateEmail,
    incrementFailedAttempts,
    resetFailedAttempts,
    createSession,
    generateToken,
    hashToken
} from './utils/authUtils';
import { loginRateLimiter, checkAccountLock } from './middleware/authMiddleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// REGISTER
router.post('/register', async (req: Request, res: Response) => {
    const { email, password, fullName, phone } = req.body;

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
        const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 12; // Increased for better security
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate email verification token
        const verificationToken = generateToken(32);

        // Insert User
        await query('BEGIN');

        const userResult = await query(
            `INSERT INTO users (email, password_hash, full_name, phone_number, email_verified, password_changed_at)
             VALUES ($1, $2, $3, $4, false, NOW())
             RETURNING id, email, created_at`,
            [email, passwordHash, fullName, phone]
        );
        const user = userResult.rows[0];

        // Create Default Wallets (USD, NGN)
        await query(
            `INSERT INTO wallets (user_id, currency, balance) VALUES ($1, 'USD', 0.00)`,
            [user.id]
        );
        await query(
            `INSERT INTO wallets (user_id, currency, balance) VALUES ($1, 'NGN', 0.00)`,
            [user.id]
        );

        // Create email verification token
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours expiry

        await query(
            `INSERT INTO email_verification_tokens (user_id, token, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, verificationToken, tokenExpiry]
        );

        await query('COMMIT');

        // In a real app, send verification email here
        console.log(`Verification token for ${email}: ${verificationToken}`);
        // sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            message: 'User registered successfully. Please check your email for verification.',
            user: { id: user.id, email: user.email },
            verificationRequired: true
        });

    } catch (err) {
        await query('ROLLBACK');
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// VERIFY EMAIL
router.post('/verify-email', async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
    }

    try {
        // Find the token
        const tokenResult = await query(
            `SELECT user_id, expires_at, used 
             FROM email_verification_tokens 
             WHERE token = $1`,
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        const tokenRecord = tokenResult.rows[0];

        if (tokenRecord.used) {
            return res.status(400).json({ error: 'Verification token already used' });
        }

        if (new Date(tokenRecord.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Verification token has expired' });
        }

        // Update user as verified
        await query(
            `UPDATE users 
             SET email_verified = true, email_verified_at = NOW()
             WHERE id = $1`,
            [tokenRecord.user_id]
        );

        // Mark token as used
        await query(
            `UPDATE email_verification_tokens 
             SET used = true 
             WHERE token = $1`,
            [token]
        );

        res.json({ message: 'Email verified successfully. You can now log in.' });

    } catch (err) {
        console.error('Email verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// RESEND VERIFICATION
router.post('/resend-verification', async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const userResult = await query(
            `SELECT id, email_verified 
             FROM users 
             WHERE email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        if (user.email_verified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // Generate new verification token
        const newToken = generateToken(32);
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24);

        await query(
            `INSERT INTO email_verification_tokens (user_id, token, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, newToken, tokenExpiry]
        );

        // In a real app, send verification email here
        console.log(`New verification token for ${email}: ${newToken}`);
        // sendVerificationEmail(email, newToken);

        res.json({ message: 'Verification email sent successfully' });

    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// LOGIN
router.post('/login', loginRateLimiter, checkAccountLock, async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            // Log failed attempt even if user doesn't exist to prevent user enumeration
            await incrementFailedAttempts(email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check if account is locked
        if (new Date(user.locked_until) > new Date()) {
            return res.status(423).json({ error: 'Account is temporarily locked due to too many failed attempts' });
        }

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(401).json({ error: 'Email not verified. Please check your email for verification link.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            await incrementFailedAttempts(email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Reset failed attempts on successful login
        await resetFailedAttempts(email);

        // Update last login time
        await query(
            `UPDATE users 
             SET last_login_at = NOW()
             WHERE id = $1`,
            [user.id]
        );

        // Create session
        const { token, refreshToken } = await createSession(user.id, ipAddress, req.get('User-Agent') || '');

        res.json({
            message: 'Login successful',
            user: { 
                id: user.id, 
                email: user.email, 
                fullName: user.full_name,
                emailVerified: user.email_verified
            },
            accessToken: token,
            refreshToken: refreshToken,
            expiresIn: 900 // 15 minutes for access token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// REFRESH TOKEN
router.post('/refresh-token', async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
        // Hash the refresh token for comparison
        const hashedRefreshToken = await hashToken(refreshToken);
        
        // Find session by refresh token
        const sessionResult = await query(
            `SELECT s.*, u.id as user_id, u.email 
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.refresh_token = $1
               AND s.expires_at > NOW()
               AND s.is_active = true`,
            [hashedRefreshToken]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const session = sessionResult.rows[0];

        // Generate new tokens
        const newAccessToken = jwt.sign(
            { userId: session.user_id, email: session.email }, 
            JWT_SECRET, 
            { expiresIn: '15m' } // Short-lived access token
        );

        // Rotate refresh token
        const newRefreshToken = generateToken(40);
        const newRefreshTokenHash = await hashToken(newRefreshToken);
        
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 7); // 7 days

        await query(
            `UPDATE sessions 
             SET refresh_token = $1, expires_at = $2, last_accessed = NOW()
             WHERE id = $3`,
            [newRefreshTokenHash, newExpiry, session.id]
        );

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900 // 15 minutes
        });

    } catch (err) {
        console.error('Token refresh error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// LOGOUT
router.post('/logout', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // Invalidate the session
        // Note: We can't directly match the JWT token in the DB since it's different from the stored hash
        // In a real implementation, we'd need to store the JWT ID (jti) claim and match against it
        // For now, we'll use a different approach - invalidate all sessions for the user
        // A better approach would be to decode the JWT to get the user ID and invalidate that specific session
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        
        await query(
            `UPDATE sessions 
             SET is_active = FALSE 
             WHERE user_id = $1 AND is_active = TRUE`,
            [decoded.userId]
        );

        res.json({ message: 'Logged out successfully' });

    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ME (Profile + Wallets)
router.get('/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const userResult = await query(
            `SELECT id, email, full_name, phone_number, kyc_level, email_verified, last_login_at 
             FROM users 
             WHERE id = $1`, 
            [decoded.userId]
        );
        
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const walletsResult = await query(
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

// REQUEST PASSWORD RESET
router.post('/forgot-password', async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const userResult = await query(
            `SELECT id FROM users WHERE email = $1`, 
            [email]
        );

        if (userResult.rows.length === 0) {
            // Don't reveal if user exists to prevent enumeration
            return res.json({ message: 'If an account with this email exists, a reset link has been sent' });
        }

        const user = userResult.rows[0];

        // Generate password reset token
        const resetToken = generateToken(32);
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 1); // 1 hour expiry

        // Store the token
        await query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, resetToken, tokenExpiry]
        );

        // In a real app, send reset email here
        console.log(`Password reset token for ${email}: ${resetToken}`);
        // sendResetEmail(email, resetToken);

        res.json({ message: 'If an account with this email exists, a reset link has been sent' });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate password strength
    const passwordValidation = verifyPasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
    }

    try {
        // Find the token
        const tokenResult = await query(
            `SELECT prt.user_id, u.email
             FROM password_reset_tokens prt
             JOIN users u ON prt.user_id = u.id
             WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used = false`,
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const { user_id, email } = tokenResult.rows[0];

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await query(
            `UPDATE users 
             SET password_hash = $1, password_changed_at = NOW()
             WHERE id = $2`,
            [newPasswordHash, user_id]
        );

        // Mark token as used
        await query(
            `UPDATE password_reset_tokens 
             SET used = true 
             WHERE token = $1`,
            [token]
        );

        // Invalidate all active sessions for this user
        await query(
            `UPDATE sessions 
             SET is_active = FALSE 
             WHERE user_id = $1`,
            [user_id]
        );

        res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
