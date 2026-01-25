// @ts-nocheck
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
import { getTenantDb } from '../services/db-connection-manager.js';
import { getTenantById } from '../services/tenant-provisioning.js';

const TENANT_DEBUG = process.env.TENANT_DEBUG === '1';
const TENANT_TIMEOUT_LOG_WINDOW_MS = Number(process.env.TENANT_TIMEOUT_LOG_WINDOW_MS || 60000);
const tenantTimeoutLastLog: Record<string, number> = {};

function logTenantTimeout(tenantId: string, timeoutMs: number) {
  if (TENANT_DEBUG) {
    console.warn(`🏢 [TENANT] ⚠️ Tenant lookup timed out after ${Math.round(timeoutMs / 1000)}s (tenant: ${tenantId})`);
    return;
  }

  const now = Date.now();
  const last = tenantTimeoutLastLog[tenantId] || 0;
  if (now - last >= TENANT_TIMEOUT_LOG_WINDOW_MS) {
    tenantTimeoutLastLog[tenantId] = now;
    console.warn(`🏢 [TENANT] ⚠️ Tenant lookup timed out after ${Math.round(timeoutMs / 1000)}s (tenant: ${tenantId})`);
  }
}

/**
 * Middleware that attaches the tenant's database connection to the request
 * Must be used after authenticateToken middleware
 */
export async function attachTenantDb(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (TENANT_DEBUG) console.log('🏢 [TENANT] Starting tenant DB attachment for:', req.path);

    // Skip if no user (for optional auth routes)
    if (!req.user) {
      if (TENANT_DEBUG) console.log('🏢 [TENANT] No user found - skipping tenant DB attachment');
      return next();
    }

    if (TENANT_DEBUG) {
      console.log('🏢 [TENANT] User found:', {
        userId: req.user.userId,
        email: req.user.email,
        tenantId: req.user.tenantId
      });
    }

    // Skip for test users
    if (req.user.userId === 'test-user-id') {
      if (TENANT_DEBUG) console.log('🏢 [TENANT] Test user detected - skipping tenant DB attachment');
      return next();
    }

    const tenantId = req.user.tenantId;

    if (!tenantId) {
      console.error('🏢 [TENANT] ERROR: No tenantId in user token');
      return res.status(400).json({
        error: 'Invalid token: missing tenant information'
      });
    }

    if (TENANT_DEBUG) console.log('🏢 [TENANT] Looking up tenant:', tenantId);

    // Timebox tenant lookup to 30 seconds
    const TENANT_LOOKUP_TIMEOUT_MS = 30000;
    const tenantLookupPromise = getTenantById(tenantId);
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => {
        logTenantTimeout(tenantId, TENANT_LOOKUP_TIMEOUT_MS);
        resolve(null);
      }, TENANT_LOOKUP_TIMEOUT_MS)
    );

    const tenant = await Promise.race([tenantLookupPromise, timeoutPromise]);

    if (!tenant) {
      console.error('🏢 [TENANT] ERROR: Tenant not found or lookup timed out:', tenantId);

      // For GET requests, allow continuing without tenant DB (routes will handle gracefully)
      if (req.method === 'GET') {
        if (TENANT_DEBUG) console.log('🏢 [TENANT] GET request - continuing without tenant DB');
        return next();
      }

      // For POST/PUT/DELETE, fail fast
      return res.status(503).json({
        error: 'Tenant lookup timed out. Please retry.'
      });
    }

    if (TENANT_DEBUG) {
      console.log('🏢 [TENANT] ✓ Tenant found:', {
        id: tenant.id,
        organizationName: tenant.organizationName,
        status: tenant.status,
        connectionStringPreview: tenant.connectionString.substring(0, 50) + '...'
      });
    }

    if (tenant.status !== 'active') {
      console.error('🏢 [TENANT] ERROR: Tenant not active:', tenant.status);
      return res.status(403).json({
        error: 'Tenant account is not active'
      });
    }

    // Attach tenant database connection to request
    if (TENANT_DEBUG) console.log('🏢 [TENANT] Attaching tenant DB connection...');
    try {
      if (!process.env.DATABASE_URL) {
        if (TENANT_DEBUG) console.log('🏢 [TENANT] Mongo mode - skipping Postgres attachment');
        (req as any).tenant = tenant;
        return next();
      }

      req.tenantDb = getTenantDb(tenant.connectionString, tenantId);
      if (TENANT_DEBUG) console.log('🏢 [TENANT] ✓ Tenant DB attached successfully');

      // Also attach tenant info for convenience
      (req as any).tenant = tenant;

      next();
    } catch (dbError: any) {
      console.error('🏢 [TENANT] Error getting tenant DB (NON-FATAL - Continuing without DB):', dbError);
      // Do NOT fail the request. Continue without DB so critical routes like feature-access can fallback gracefully.
      return next();
    }
  } catch (error) {
    console.error('🏢 [TENANT] Error in attachTenantDb middleware (NON-FATAL):', error);
    // Even in outer catch, continue!
    return next();
  }
}

/**
 * Middleware that requires a tenant database connection
 * Will return 500 if no tenant DB is attached
 */
export function requireTenantDb(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.tenantDb) {
    return res.status(500).json({
      error: 'Tenant database not available'
    });
  }
  next();
}

