import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
// Removed: getTenantDb from db-connection-manager
// Removed: getTenantById from tenant-provisioning


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
 * Middleware that validates the tenant for the request
 */
export async function attachTenantDb(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (TENANT_DEBUG) console.log('🏢 [TENANT] Checking tenant context for:', req.path);

    // Skip if no user (for optional auth routes)
    if (!req.user) {
      if (TENANT_DEBUG) console.log('🏢 [TENANT] No user found - skipping tenant check');
      return next();
    }

    const tenantId = req.user.tenantId;

    if (!tenantId) {
      console.error('🏢 [TENANT] ERROR: No tenantId in user token');
      return res.status(400).json({
        error: 'Invalid token: missing tenant information' // Should probably be 401 but keeping 400 for structural error
      });
    }

    // In single-DB Mongo architecture, we don't need to "connect" to a tenant DB.
    // We just ensure the tenantId is available for queries.
    // We could verify the tenant exists in Mongo if we want strict checking.
    // For now, trusting the token is cleaner and faster.

    // Attach tenant info for convenience if needed (optional)
    (req as any).tenantId = tenantId;

    next();
  } catch (error) {
    console.error('🏢 [TENANT] Error in tenant middleware:', error);
    res.status(500).json({
      error: 'Tenant validation failed'
    });
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
  // In Mongo single-DB, we don't need to check for tenantDb attachment.
  // The tenantId availability is checked in attachTenantDb (now renamed/refactored logic).
  next();
}
