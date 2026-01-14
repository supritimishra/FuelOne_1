import { Router } from 'express';
import { AuthRequest, hashPassword } from '../auth.js';
import { users, userRoles } from '../../shared/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { requireSuperAdmin } from '../middleware/authorize.js';
import { authenticateToken } from '../auth.js';
import { attachTenantDb } from '../middleware/tenant.js';
import { registerTenantUser } from '../services/tenant-provisioning.js';

export const userManagementRouter = Router();

// Apply authentication and tenant middleware to all routes
userManagementRouter.use(authenticateToken);
userManagementRouter.use(attachTenantDb);

/**
 * GET /api/users - List all users in the tenant
 * Accessible by: super_admin, manager
 */
userManagementRouter.get('/', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantDb) {
      return res.status(500).json({ error: 'Tenant database not available' });
    }

    // Get all users with their roles
    const allUsers = await req.tenantDb
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        fullName: users.fullName,
        createdAt: users.createdAt,
      })
      .from(users);

    // Get roles for all users
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user: any) => {
        const roles = await req.tenantDb
          .select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, user.id));

        return {
          ...user,
          roles: roles.map((r: any) => r.role),
        };
      })
    );

    res.json({ users: usersWithRoles });
  } catch (error) {
    console.error('Failed to list users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * POST /api/users - Add a new user to the tenant
 * Accessible by: super_admin only
 */
userManagementRouter.post('/', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantDb || !req.user) {
      return res.status(500).json({ error: 'Tenant database not available' });
    }

    const { email, username, password, fullName, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate role - allow super_admin for developers
    const validRoles = ['super_admin', 'manager', 'dsm'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Allowed roles: super_admin, manager, dsm' 
      });
    }

    // Check if user already exists in tenant database
    const existingUsers = await req.tenantDb
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists in your organization' });
    }

    // Check username if provided
    if (username) {
      const existingUsername = await req.tenantDb
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUsername.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Create user in tenant database
    const passwordHash = await hashPassword(password);
    const [newUser] = await req.tenantDb
      .insert(users)
      .values({
        email: email.toLowerCase(),
        username: username || null,
        passwordHash,
        fullName,
      })
      .returning();

    // Assign role in tenant database
    await req.tenantDb.insert(userRoles).values({
      userId: newUser.id,
      role,
    });

    // Register user in tenant_users mapping (master database)
    await registerTenantUser(req.user.tenantId, newUser.email, newUser.id);

    // CRITICAL: Auto-assign features using universal helper
    // This ensures features are ALWAYS assigned to feature_access table
    try {
      const { getTenantById } = await import('../services/tenant-provisioning.js');
      const tenant = await getTenantById(req.user.tenantId);
      if (tenant && tenant.connectionString) {
        const { ensureUserFeaturesAssigned } = await import('./developer-mode.js');
        await ensureUserFeaturesAssigned(newUser.id, req.user.tenantId, tenant.connectionString, req.tenantDb, false);
      }
    } catch (e) {
      console.warn('[USER MGMT] Auto-assign features failed:', (e as any)?.message || e);
      // Don't fail user creation if feature assignment fails - user can still be created
    }

    console.log(`✅ User created: ${newUser.email} with role ${role} in tenant ${req.user.tenantId}`);

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        fullName: newUser.fullName,
        role,
      },
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /api/users/:id/role - Update user's role
 * Accessible by: super_admin only
 */
userManagementRouter.put('/:id/role', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantDb || !req.user) {
      return res.status(500).json({ error: 'Tenant database not available' });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['super_admin', 'manager', 'dsm'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Allowed roles: super_admin, manager, dsm' 
      });
    }

    // Prevent user from changing their own role
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    // Check if user exists
    const [user] = await req.tenantDb
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete existing roles
    await req.tenantDb
      .delete(userRoles)
      .where(eq(userRoles.userId, id));

    // Assign new role
    await req.tenantDb.insert(userRoles).values({
      userId: id,
      role,
    });

    console.log(`✅ User role updated: ${user.email} -> ${role}`);

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error('Failed to update user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * DELETE /api/users/:id - Remove user from tenant (soft delete by removing roles)
 * Accessible by: super_admin only
 */
userManagementRouter.delete('/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantDb || !req.user) {
      return res.status(500).json({ error: 'Tenant database not available' });
    }

    const { id } = req.params;

    // Prevent user from deleting themselves
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if user exists
    const [user] = await req.tenantDb
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user roles (soft delete approach)
    await req.tenantDb
      .delete(userRoles)
      .where(eq(userRoles.userId, id));

    // Optionally, you could also delete the user record completely:
    // await req.tenantDb
    //   .delete(users)
    //   .where(eq(users.id, id));

    console.log(`✅ User deactivated: ${user.email}`);

    res.json({
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/users/:id - Get specific user details
 * Accessible by: super_admin, manager
 */
userManagementRouter.get('/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantDb) {
      return res.status(500).json({ error: 'Tenant database not available' });
    }

    const { id } = req.params;

    // Get user
    const [user] = await req.tenantDb
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        fullName: users.fullName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get roles
    const roles = await req.tenantDb
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, id));

    res.json({
      ...user,
      roles: roles.map((r: any) => r.role),
    });
  } catch (error) {
    console.error('Failed to get user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});
