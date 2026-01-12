import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth.js';
import { User } from '../models/User.js';

/**
 * Middleware to check if user has one of the required roles
 * Must be used after authenticateToken
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Developer bypass
      if (req.user?.email === 'dev@developer.local' || process.env.DEV_BYPASS === 'true') {
        return next();
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check user role from MongoDB
      // We can either trust the token (if role is in it) or fetch fresh from DB.
      // Fetching is safer for permission changes.

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const userRole = user.role;

      // Check if user has any of the allowed roles
      // Mongo User has single role string, but allowedRoles is array
      const hasPermission = allowedRoles.includes(userRole);

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRole
        });
      }

      // Attach roles to request for convenience (mocking array for compatibility)
      (req as any).userRoles = [userRole];

      next();
    } catch (error: any) {
      console.error('[Authorization] Authorization error:', error?.message || error);
      res.status(500).json({ error: 'Failed to check permissions' });
    }
  };
}

export const requireSuperAdmin = requireRole(['super_admin']);
export const requireManager = requireRole(['super_admin', 'manager']);
export const requireAuthenticated = requireRole(['super_admin', 'manager', 'dsm']);
