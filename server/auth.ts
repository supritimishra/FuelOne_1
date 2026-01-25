import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const AUTH_DEBUG = process.env.AUTH_DEBUG === '1';

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
  tenantDb?: any; // Will be set by tenant middleware
  body: any; // Request body
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  const testUser = req.headers['x-test-user'];

  if (AUTH_DEBUG) {
    console.log('🔐 [AUTH] Starting authentication for:', req.path);
    console.log('🔐 [AUTH] Token source:', req.cookies?.token ? 'cookie' : req.headers.authorization ? 'header' : 'none');
    console.log('🔐 [AUTH] Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
  }

  // For TestSprite testing, allow test user
  if (testUser === 'TestSprite') {
    if (AUTH_DEBUG) console.log('🔐 [AUTH] Using TestSprite test user');
    req.user = {
      userId: 'test-user-id',
      email: 'test@testsprite.com',
      tenantId: 'test-tenant-id'
    };
    return next();
  }

  if (!token) {
    if (AUTH_DEBUG) console.log('🔐 [AUTH] No token provided - returning 401');
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Try to verify as JWT token first
  const payload = verifyToken(token);
  if (payload) {
    if (AUTH_DEBUG) {
      console.log('🔐 [AUTH] JWT verification successful');
      console.log('👤 [AUTH] Decoded user:', {
        userId: payload.userId,
        email: payload.email,
        tenantId: payload.tenantId
      });
    }

    // Check if token is blacklisted (Only if Postgres is available)
    if (process.env.DATABASE_URL) {
      try {
        const { pool: masterPool } = await import('./db.js');
        const tokenParts = token.split('.');

        // Timebox blacklist check to 3 seconds to prevent hangs
        const blacklistCheckPromise = masterPool.query(
          `SELECT 1 FROM invalidated_tokens 
           WHERE user_email = $1 
             AND expires_at > NOW() 
             AND reason = 'force_logout'
           LIMIT 1`,
          [payload.email.toLowerCase()]
        );

        const timeoutPromise = new Promise<{ rows: any[] }>((_, reject) =>
          setTimeout(() => reject(new Error('Auth DB Timeout')), 3000)
        );

        const blacklistCheck = await Promise.race([blacklistCheckPromise, timeoutPromise]);

        if (blacklistCheck.rows.length > 0) {
          if (AUTH_DEBUG) console.log('🔐 [AUTH] Token blacklisted - user was force logged out');
          return res.status(401).json({ error: 'Session expired. Please login again.' });
        }
      } catch (err: any) {
        // If blacklist check fails, log but don't block (fail-open for availability)
        console.warn('[AUTH] Failed to check token blacklist:', err?.message || err);
      }
    }

    req.user = payload;
    return next();
  }

  // If JWT verification fails, the token is invalid
  if (AUTH_DEBUG) console.log('🔐 [AUTH] JWT verification failed - token is invalid');

  return res.status(401).json({ error: 'Invalid or expired token' });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    // Try JWT verification
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
    // No fallback to Supabase tokens - only accept valid JWT tokens
  }

  next();
}

// New middleware that allows requests without authentication
export function allowUnauthenticated(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    // Try JWT verification
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
    // No fallback to Supabase tokens - only accept valid JWT tokens
  }

  // Always continue, even without authentication
  next();
}
