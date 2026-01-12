import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
import { userRoles } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Middleware to check if user has one of the required roles
 * Must be used after authenticateToken and attachTenantDb middleware
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Developer bypass: allow the known developer account or when DEV_BYPASS is enabled
      if (req.user?.email === 'dev@developer.local' || process.env.DEV_BYPASS === 'true') {
        return next();
      }

      if (!req.user) {
        console.error('[Authorization] No user found in request');
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.tenantDb) {
        console.error('[Authorization] Tenant database not available for user:', req.user.email);
        return res.status(500).json({ error: 'Tenant database not available' });
      }

      // Get user roles from tenant database
      let userRolesList: string[] = [];
      try {
        const roles = await req.tenantDb
          .select()
          .from(userRoles)
          .where(eq(userRoles.userId, req.user.userId));

        userRolesList = roles.map((r: any) => r.role);
        console.log(`[Authorization] User ${req.user.email} (${req.user.userId}) has roles:`, userRolesList);
      } catch (roleError: any) {
        console.error('[Authorization] Failed to fetch user roles:', roleError?.message || roleError);
        return res.status(500).json({ 
          error: 'Failed to check permissions', 
          details: roleError?.message || 'Role query failed' 
        });
      }

      // Check if user has any of the allowed roles
      const hasPermission = allowedRoles.some(role => userRolesList.includes(role));

      if (!hasPermission) {
        console.warn(`[Authorization] User ${req.user.email} lacks required roles. Required: ${allowedRoles.join(', ')}, Has: ${userRolesList.join(', ')}`);
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRolesList
        });
      }

      // Attach roles to request for convenience
      (req as any).userRoles = userRolesList;

      next();
    } catch (error: any) {
      console.error('[Authorization] Authorization error:', error?.message || error);
      console.error('[Authorization] Full error:', error);
      res.status(500).json({ error: 'Failed to check permissions', details: error?.message || String(error) });
    }
  };
}

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Middleware to check if user is super admin or manager
 */
export const requireManager = requireRole(['super_admin', 'manager']);

/**
 * Middleware to check if user is authenticated (any role)
 */
export const requireAuthenticated = requireRole(['super_admin', 'manager', 'dsm']);
