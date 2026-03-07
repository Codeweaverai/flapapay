import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'flapapay_db',
    password: process.env.DB_PASSWORD || '12345678',
    port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

// Utility functions for enhanced auth
export const generateToken = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

export const hashToken = async (token: string): Promise<string> => {
    const saltRounds = 12;
    return await bcrypt.hash(token, saltRounds);
};

export const verifyPasswordStrength = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/(?=.*[0-9])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }
    
    return { isValid: true };
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isAccountLocked = (lockedUntil?: Date | null): boolean => {
    if (!lockedUntil) return false;
    return new Date() < new Date(lockedUntil);
};

export const incrementFailedAttempts = async (email: string): Promise<void> => {
    await query(
        `INSERT INTO login_attempts (email, ip_address, success) VALUES ($1, $2, false)`,
        [email, null] // In a real app, you'd get IP from request
    );
    
    // Update user's failed attempts count
    const result = await query(
        `UPDATE users 
         SET failed_login_attempts = failed_login_attempts + 1,
             locked_until = CASE 
                 WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '30 minutes'
                 ELSE locked_until
             END
         WHERE email = $1
         RETURNING failed_login_attempts, locked_until`,
        [email]
    );
    
    if (result.rows.length > 0) {
        const { failed_login_attempts, locked_until } = result.rows[0];
        
        // If account is now locked, send notification (in a real app)
        if (failed_login_attempts >= 5 && locked_until) {
            console.log(`Account ${email} has been locked until ${locked_until}`);
        }
    }
};

export const resetFailedAttempts = async (email: string): Promise<void> => {
    await query(
        `UPDATE users 
         SET failed_login_attempts = 0, locked_until = NULL
         WHERE email = $1`,
        [email]
    );
};

export const createSession = async (
    userId: string, 
    ipAddress?: string, 
    userAgent?: string
): Promise<{ token: string; refreshToken: string }> => {
    const token = generateToken(32);
    const refreshToken = generateToken(40);
    const tokenHash = await hashToken(token);
    const refreshTokenHash = await hashToken(refreshToken);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for refresh token
    
    await query(
        `INSERT INTO sessions (user_id, token, refresh_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, tokenHash, refreshTokenHash, expiresAt, ipAddress, userAgent]
    );
    
    return { token, refreshToken };
};

export const invalidateSession = async (tokenId: string): Promise<void> => {
    await query(
        `UPDATE sessions 
         SET is_active = FALSE 
         WHERE token = $1`,
        [tokenId]
    );
};

export const cleanupExpiredSessions = async (): Promise<void> => {
    await query(
        `DELETE FROM sessions 
         WHERE expires_at < NOW() OR is_active = FALSE`
    );
};

export default pool;