import { Request, Response, NextFunction } from 'express';
import { query, isAccountLocked, incrementFailedAttempts, resetFailedAttempts } from '../utils/authUtils';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// Rate limiting middleware for login attempts
export const loginRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;
    const ip = req.ip;

    // Check recent failed attempts from this IP
    const ipAttemptResult = await query(
        `SELECT COUNT(*) as count 
         FROM login_attempts 
         WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '15 minutes'`,
        [ip]
    );

    const ipAttempts = parseInt(ipAttemptResult.rows[0].count);

    if (ipAttempts > 10) {
        return res.status(429).json({ error: 'Too many login attempts from this IP. Please try again later.' });
    }

    // Check recent failed attempts for this email
    const emailAttemptResult = await query(
        `SELECT COUNT(*) as count 
         FROM login_attempts 
         WHERE email = $1 AND success = false AND created_at > NOW() - INTERVAL '15 minutes'`,
        [email]
    );

    const emailAttempts = parseInt(emailAttemptResult.rows[0].count);

    if (emailAttempts > 5) {
        return res.status(429).json({ error: 'Too many login attempts for this email. Please try again later.' });
    }

    next();
};

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; iat: number; exp: number };
        
        // Check if user exists and is not locked
        const userResult = await query(
            `SELECT id, email, locked_until, email_verified 
             FROM users 
             WHERE id = $1 AND email_verified = true`,
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'User not found or not verified' });
        }

        const user = userResult.rows[0];
        
        if (isAccountLocked(user.locked_until)) {
            return res.status(401).json({ error: 'Account is temporarily locked' });
        }

        // Update last accessed time for session
        // In a real app, you'd also verify the session exists and is valid
        
        (req as any).user = user;
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Middleware to check if account is locked
export const checkAccountLock = async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email || req.query.email;

    if (email) {
        const userResult = await query(
            `SELECT locked_until, email_verified 
             FROM users 
             WHERE email = $1`,
            [email]
        );

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            
            if (isAccountLocked(user.locked_until)) {
                return res.status(423).json({ error: 'Account is temporarily locked due to too many failed attempts. Please try again later.' });
            }
            
            if (!user.email_verified) {
                return res.status(401).json({ error: 'Email not verified. Please check your email for verification link.' });
            }
        }
    }

    next();
};