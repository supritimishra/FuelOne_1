import { Router } from 'express';
import { db } from './db.js';
import { users, userRoles, tenantUsers, tenants as tenantsTable } from '../shared/schema.js';
import { hashPassword, verifyPassword, generateToken, authenticateToken, AuthRequest } from './auth.js';
import { attachTenantDb } from './middleware/tenant.js';
import { eq, sql } from 'drizzle-orm';
import {
  provisionTenant,
  updateTenantSuperAdmin,
  registerTenantUser,
  getTenantByEmail,
  getTenantByUserEmail,
  getTenantById,
  runTenantMigrations
} from './services/tenant-provisioning.js';
import { getTenantDb } from './services/db-connection-manager.js';
import { BASIC_FEATURES } from './feature-defaults.js';

console.log('🔄 Auth routes module loading...');

export const authRouter = Router();

console.log('✅ Auth router created');

// Test endpoint
authRouter.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit');
  res.json({ message: 'Server is working! Modified' });
});

authRouter.get('/debug/constraints', async (req, res) => {
  try {
    const tenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
    const tenant = await getTenantById(tenantId);

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const tenantDb = getTenantDb(tenant.connectionString, tenantId);

    const r = await tenantDb.execute(sql`
      SELECT
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='credit_customers'
    `);

    res.json({ ok: true, constraints: r.rows });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Developer-only helper to reset dev account and mapping in local environments
// NOTE: No auth required, but only enabled when NODE_ENV !== 'production'
authRouter.post('/dev-reset', async (_req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Not allowed in production' });
    }

    const devEmail = 'dev@developer.local';
    const newPassword = 'dev123';

    // Find tenant for dev user
    const devTenant = await getTenantByUserEmail(devEmail);
    if (!devTenant) {
      return res.status(404).json({ ok: false, error: 'Developer tenant not found' });
    }

    // Ensure user exists in tenant DB and has super_admin role; set password
    const tenantDb = getTenantDb(devTenant.connectionString, devTenant.id);
    const hashed = await hashPassword(newPassword);

    // Read or create user
    let existingUser: any = null;
    try {
      const [u] = await tenantDb.select().from(users).where(sql`LOWER(${users.email}) = ${devEmail}`).limit(1);
      existingUser = u || null;
    } catch { }

    if (!existingUser) {
      const [created] = await tenantDb
        .insert(users)
        .values({ email: devEmail, username: 'dev', fullName: 'Developer', passwordHash: hashed })
        .returning();
      existingUser = created;
    } else {
      // Update password
      await tenantDb.execute(sql`UPDATE users SET password_hash = ${hashed} WHERE id = ${existingUser.id}`);
    }

    // Ensure super_admin role
    try {
      const roles = await tenantDb.select().from(userRoles).where(eq(userRoles.userId, existingUser.id));
      const hasSuper = Array.isArray(roles) && roles.some((r: any) => r.role === 'super_admin');
      if (!hasSuper) {
        await tenantDb.insert(userRoles).values({ userId: existingUser.id, role: 'super_admin' });
      }
    } catch { }

    // Ensure mapping exists in master with correct userId
    try {
      await db.insert(tenantUsers).values({ tenantId: devTenant.id, userEmail: devEmail, userId: existingUser.id }).onConflictDoUpdate({
        target: [tenantUsers.tenantId, tenantUsers.userEmail],
        set: { userId: existingUser.id }
      });
    } catch { }

    console.log('✅ Dev account reset to dev123');
    return res.json({ ok: true, email: devEmail, password: newPassword });
  } catch (error: any) {
    console.error('[DEV-RESET] Error:', error?.message || error);
    return res.status(500).json({ ok: false, error: 'Failed to reset dev account' });
  }
});

// Helper function to determine cookie domain based on environment
const getCookieDomain = () => {
  if (process.env.NODE_ENV !== 'production') return undefined;

  // For Vercel preview URLs, use .vercel.app
  if (process.env.VERCEL_URL?.includes('vercel.app')) {
    return '.vercel.app';
  }

  // For Render URLs, don't set domain (let browser handle it)
  // Render uses *.onrender.com which requires no domain setting
  if (process.env.RENDER || process.env.RENDER_URL?.includes('onrender.com')) {
    return undefined;
  }

  // For custom domains, use the specific domain from env var
  return process.env.COOKIE_DOMAIN || undefined;
};

// Register new user (creates new tenant database)
authRouter.post('/register', async (req, res) => {
  try {
    console.log('📥 Registration request received');
    const { email, username, password, fullName, organizationName } = req.body;

    console.log(`📧 Email: ${email}, Org: ${organizationName}`);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!organizationName) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    // Check if tenant already exists for this email
    console.log('🔍 Checking for existing tenant...');
    const existingTenant = await getTenantByEmail(email.toLowerCase());
    if (existingTenant) {
      return res.status(400).json({ error: 'An organization already exists for this email' });
    }

    // Step 1: Provision new tenant database
    console.log(`📦 Provisioning tenant for: ${email}`);
    let provisionResult;
    try {
      provisionResult = await provisionTenant({
        organizationName,
        superAdminEmail: email.toLowerCase(),
      });
      console.log('✅ Provisioning completed:', provisionResult);
    } catch (provisionError) {
      console.error('❌ Provisioning error:', provisionError);
      return res.status(500).json({
        error: 'Failed to provision tenant database: ' + (provisionError as Error).message
      });
    }

    if (!provisionResult.success) {
      console.error('❌ Provisioning failed:', provisionResult.error);
      return res.status(500).json({
        error: provisionResult.error || 'Failed to provision tenant database'
      });
    }

    const { tenantId, connectionString } = provisionResult;

    if (!tenantId || !connectionString) {
      return res.status(500).json({ error: 'Invalid provisioning result' });
    }

    // Step 2: Connect to the new tenant database
    const tenantDb = getTenantDb(connectionString, tenantId);

    // Step 3: Create user in tenant database
    const passwordHash = await hashPassword(password);
    const [newUser] = await tenantDb
      .insert(users)
      .values({
        email: email.toLowerCase(),
        username: username || null,
        passwordHash,
        fullName,
      })
      .returning();

    // Step 4: Assign super_admin role in tenant database
    await tenantDb.insert(userRoles).values({
      userId: newUser.id,
      role: 'super_admin',
    });

    // CRITICAL: Auto-assign features using universal helper
    // This ensures features are ALWAYS assigned to feature_access table
    // Force basic mode for new organizations (new registrations)
    try {
      const { ensureUserFeaturesAssigned } = await import('./routes/developer-mode.js');
      await ensureUserFeaturesAssigned(newUser.id, tenantId, connectionString, tenantDb, true);
    } catch (e) {
      console.error('[AUTH] Auto-assign features failed (registration):', (e as any)?.message || e);
      // Don't fail registration if feature assignment fails - user can still be created
    }

    // Step 5: Update tenant record with super admin user ID
    await updateTenantSuperAdmin(tenantId, newUser.id);

    // Step 6: Register user in tenant_users mapping (critical for Developer Mode visibility)
    const registrationSuccess = await registerTenantUser(tenantId, newUser.email, newUser.id);
    if (!registrationSuccess) {
      console.error(`⚠️ [AUTH] Failed to register user ${newUser.email} in tenant_users table - user may not appear in Developer Mode`);
      // Continue anyway - user is created, just not visible in Developer Mode yet
    } else {
      console.log(`✅ [AUTH] User ${newUser.email} registered in tenant_users mapping for Developer Mode`);
    }

    // Step 7: Generate token with tenant ID
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      tenantId: tenantId
    });

    // Set cookie and respond
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production (HTTPS required)
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production, 'lax' for development
      domain: getCookieDomain(),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log(`✅ User registered successfully in tenant: ${tenantId}`);

    res.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        organizationName,
        role: 'super_admin',
      },
      tenant: {
        id: tenantId,
        organizationName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password, tenantId: requestedTenantIdRaw } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const userInput = email.toLowerCase();

    // ==========================================
    // MONGODB AUTHENTICATION PATH
    // ==========================================
    if (!process.env.DATABASE_URL) {
      const { User, Tenant } = await import('./models.js');

      // 1. Find User
      const user = await User.findOne({
        $or: [{ email: userInput }, { username: userInput }]
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email/username or password' });
      }

      // 2. Validate Password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email/username or password' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Your account is disabled' });
      }

      // 3. Resolve Tenant (Assume Single Tenant for now or fetch from user mapping if multi-tenant implemented)
      // Since user provided Mongo URL is usually single-tenant or master, we just need a valid tenant ID.
      // We'll look for *any* active tenant or a specific one if implemented.
      // For now, let's look for a tenant related to this user if possible, or just the first active tenant.

      let tenant: any = null;
      if (requestedTenantIdRaw) {
        tenant = await Tenant.findById(requestedTenantIdRaw);
      } else {
        // Try to find a tenant this user belongs to if we had mappings.
        // For now, find the tenant where this user is super_admin or just the first one
        tenant = await Tenant.findOne({ superAdminEmail: user.email });
        if (!tenant) {
          tenant = await Tenant.findOne({ status: 'active' });
        }
      }

      if (!tenant) {
        return res.status(400).json({ error: 'No active organization found for this user' });
      }

      // 4. Generate Token
      const token = generateToken({
        userId: (user as any)._id.toString(),
        email: user.email,
        tenantId: (tenant as any)._id.toString()
      });

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction, // Use secure cookies in production (HTTPS required)
        sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production, 'lax' for development
        domain: getCookieDomain(),
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log(`✅ [MONGO] User logged in: ${user.email}`);

      return res.json({
        user: {
          id: (user as any)._id.toString(),
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          roles: user.roles,
        },
        tenant: {
          id: (tenant as any)._id.toString(),
          organizationName: tenant.organizationName,
        },
      });
    }

    // ==========================================
    // POSTGRES (LEGACY) AUTHENTICATION PATH
    // ==========================================

    // Step 1: Resolve tenant selection
    // If the email exists in multiple tenants, pick the tenant where the credentials match
    let tenant: any = null;
    const requestedTenantId = String(requestedTenantIdRaw || '').trim();

    // If explicit tenantId provided, honor it
    if (requestedTenantId) {
      try {
        const t = await getTenantById(requestedTenantId);
        if (!t) {
          return res.status(404).json({ error: 'Tenant not found' });
        }
        tenant = t;
      } catch { }
    }

    try {
      const memberships = await db
        .select({ tenantId: tenantUsers.tenantId })
        .from(tenantUsers)
        .where(eq(tenantUsers.userEmail, userInput));

      const tenantIds: string[] = (memberships || []).map((r: any) => r.tenantId);

      if (!tenant && tenantIds.length > 1) {
        // Try each tenant, collect all password matches, then prefer non-dev tenant
        const candidates: Array<{ t: any; user: any }> = [];
        for (const tenantId of tenantIds) {
          try {
            const t = await getTenantById(tenantId);
            if (!t) continue;
            const candidateDb = getTenantDb(t.connectionString, t.id);
            const [candidateUser] = await candidateDb
              .select()
              .from(users)
              .where(
                sql`LOWER(${users.email}) = ${userInput} OR LOWER(${users.username}) = ${userInput}`
              )
              .limit(1);
            if (!candidateUser) continue;
            const match = await verifyPassword(password, candidateUser.passwordHash);
            if (match) {
              candidates.push({ t, user: candidateUser });
            }
          } catch { }
        }
        if (candidates.length === 1) {
          tenant = candidates[0].t;
        } else if (candidates.length > 1) {
          const nonDev = candidates.filter(({ t }) => {
            const org = String(t.organizationName || '').toLowerCase();
            const admin = String(t.superAdminEmail || '').toLowerCase();
            return !(admin === 'dev@developer.local' || org.includes('rakhy') || org.includes('developer'));
          });
          tenant = (nonDev[0]?.t) || candidates[0].t;
        }
      }
    } catch { }

    // If still not resolved, fallback to previous single-tenant resolution
    if (!tenant) {
      tenant = await getTenantByEmail(userInput) || await getTenantByUserEmail(userInput);
    }

    // Final safety: if the only resolution points to the developer tenant (e.g., Rakhy)
    // or we still couldn't resolve, scan active tenants to find a matching password
    if (!tenant || String((tenant as any).superAdminEmail || '').toLowerCase() === 'dev@developer.local') {
      try {
        const activeTenants = await db
          .select({ id: tenantsTable.id, organizationName: tenantsTable.organizationName, superAdminEmail: tenantsTable.superAdminEmail })
          .from(tenantsTable);

        const candidates: Array<{ t: any; user: any }> = [];
        for (const tRow of activeTenants) {
          try {
            const t = await getTenantById(tRow.id as any);
            if (!t) continue;
            const candidateDb = getTenantDb(t.connectionString, t.id);
            const [candidateUser] = await candidateDb
              .select()
              .from(users)
              .where(
                sql`LOWER(${users.email}) = ${userInput} OR LOWER(${users.username}) = ${userInput}`
              )
              .limit(1);
            if (!candidateUser) continue;
            const match = await verifyPassword(password, candidateUser.passwordHash);
            if (match) {
              candidates.push({ t, user: candidateUser });
            }
          } catch { }
        }

        if (candidates.length === 1) {
          tenant = candidates[0].t;
        } else if (candidates.length > 1) {
          const nonDev = candidates.filter(({ t }) => {
            const org = String(t.organizationName || '').toLowerCase();
            const admin = String(t.superAdminEmail || '').toLowerCase();
            return !(admin === 'dev@developer.local' || org.includes('rakhy') || org.includes('developer'));
          });
          tenant = (nonDev[0]?.t) || candidates[0].t;
        }
      } catch { }
    }

    if (!tenant) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({ error: 'Organization account is not active' });
    }

    // Step 2: Connect to tenant's database
    let tenantDb;
    try {
      tenantDb = getTenantDb(tenant.connectionString, tenant.id);
    } catch (poolError: any) {
      console.error(`❌ [AUTH] Failed to initialize tenant DB pool (${tenant.id}):`, poolError);
      return res.status(500).json({ error: 'Failed to connect to organization database (Connection Init)' });
    }

    // Step 3: Find user in tenant database by email OR username
    let user;
    try {
      const [foundUser] = await tenantDb
        .select()
        .from(users)
        .where(
          sql`LOWER(${users.email}) = ${userInput} OR LOWER(${users.username}) = ${userInput}`
        )
        .limit(1);
      user = foundUser;
    } catch (dbError: any) {
      console.error(`❌ [AUTH] Failed to query tenant database (${tenant.id}):`, dbError);

      // SELF-HEALING: If table doesn't exist (42P01), try running migrations and retry
      if (dbError.code === '42P01') {
        console.log(`⚠️ [AUTH] Missing tables detected for tenant ${tenant.id}. Attempting self-repair...`);
        try {
          const success = await runTenantMigrations(tenant.connectionString);
          if (success) {
            console.log(`✅ [AUTH] Self-repair successful. Retrying login...`);
            const [retryUser] = await tenantDb
              .select()
              .from(users)
              .where(
                sql`LOWER(${users.email}) = ${userInput} OR LOWER(${users.username}) = ${userInput}`
              )
              .limit(1);
            user = retryUser;
            // If user is found now, proceed!
            if (!user) {
              console.warn(`⚠️ [AUTH] Repair succeeded but user not found. User might be missing.`);
            }
          } else {
            console.error(`❌ [AUTH] Self-repair failed.`);
            return res.status(500).json({ error: 'Organization database is corrupted and repair failed.' });
          }
        } catch (repairErr: any) {
          console.error(`❌ [AUTH] Self-repair crashed:`, repairErr);
          return res.status(500).json({ error: 'Organization database corrupted (Repair crashed).' });
        }
      } else if (dbError.code === 'ECONNREFUSED' || dbError.message?.includes('connection') || dbError.message?.includes('SSL')) {
        // Check for common connection issues
        return res.status(500).json({
          error: 'Could not connect to organization database. This may be a configuration issue.'
        });
      } else {
        throw dbError; // Re-throw other errors to be caught by main catch
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Check user status (if status column exists)
    try {
      // Use Pool directly for parameterized query
      const { Pool } = await import('pg');
      const tenantPool = new Pool({
        connectionString: tenant.connectionString,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });
      let userStatus = 'active';
      try {
        const statusResult = await tenantPool.query(
          `SELECT status FROM users WHERE id = $1`,
          [user.id]
        );
        userStatus = statusResult.rows[0]?.status || 'active';
      } finally {
        await tenantPool.end();
      }

      if (userStatus === 'suspended') {
        return res.status(403).json({ error: 'Your account has been suspended. Please contact your administrator.' });
      }

      if (userStatus === 'deleted') {
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact your administrator.' });
      }
    } catch (statusErr: any) {
      // If status column doesn't exist yet (migration not run), continue normally
      if (!statusErr.message?.includes('column "status" does not exist')) {
        console.warn('[AUTH] Failed to check user status:', statusErr.message);
      }
    }

    // Step 4: Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Step 5: Get user roles from tenant database
    const roles = await tenantDb
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, user.id));

    // Step 6: Generate token with tenant ID
    const token = generateToken({
      userId: user.id,
      email: user.email,
      tenantId: tenant.id
    });

    // Set cookie and respond
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production (HTTPS required)
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production, 'lax' for development
      domain: getCookieDomain(),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log(`✅ User logged in: ${user.email} (tenant: ${tenant.id})`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        roles: roles.map(r => r.role),
      },
      tenant: {
        id: tenant.id,
        organizationName: tenant.organizationName,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Failed to login',
      details: error?.message || String(error)
    });
  }
});

// Logout
authRouter.post('/logout', (req, res) => {
  // Clear cookie with same attributes to ensure deletion on prod domains
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: getCookieDomain(),
    path: '/',
  });
  res.json({ message: 'Logged out successfully' });
});

// Switch user (Developer/Admin only - impersonate another user)
authRouter.post('/switch-user', authenticateToken, attachTenantDb, async (req: AuthRequest, res) => {
  try {
    if (!req.user || !req.tenantDb) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if current user is super_admin
    const currentUserRoles = await req.tenantDb
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, req.user.userId));

    const isSuperAdmin = currentUserRoles.some((r: any) => r.role === 'super_admin');

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admins can switch users' });
    }

    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // Get target user from tenant database
    const [targetUser] = await req.tenantDb
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Get tenant info
    const tenant = (req as any).tenant;
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Generate new token for target user
    const token = generateToken({
      userId: targetUser.id,
      email: targetUser.email,
      tenantId: tenant.id
    });

    // Set cookie with new token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production (HTTPS required)
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-site in production, 'lax' for development
      domain: getCookieDomain(),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Get target user roles
    const targetRoles = await req.tenantDb
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, targetUser.id));

    console.log(`✅ User switched: ${req.user.email} → ${targetUser.email}`);

    res.json({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        username: targetUser.username,
        fullName: targetUser.fullName,
        roles: targetRoles.map((r: any) => r.role),
      },
      tenant: {
        id: tenant.id,
        organizationName: tenant.organizationName,
      },
    });
  } catch (error) {
    console.error('Switch user error:', error);
    res.status(500).json({ error: 'Failed to switch user' });
  }
});

// Get current user
// Get current user
authRouter.get('/me', authenticateToken, attachTenantDb, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // ==========================================
    // MONGODB MODE
    // ==========================================
    if (!process.env.DATABASE_URL) {
      const { User, Tenant } = await import('./models.js');

      // 1. Fetch Tenant via ID from token payload
      let tenant: any = null;
      try {
        if (req.user.tenantId) {
          tenant = await Tenant.findById(req.user.tenantId);
        }
      } catch (e) { }

      // 2. Fetch User via ID from token payload
      let user: any = null;
      try {
        user = await User.findById(req.user.userId);
      } catch (e) { }

      if (!user) {
        return res.status(404).json({ error: 'User not found in MongoDB' });
      }

      return res.json({
        id: (user as any)._id.toString(),
        email: user.email,
        username: user.username,
        fullName: user.fullName || user.email.split('@')[0],
        roles: user.roles || [],
        tenant: tenant ? {
          id: (tenant as any)._id.toString(),
          organizationName: tenant.organizationName
        } : null
      });
    }

    // ==========================================
    // POSTGRES MODE (LEGACY)
    // ==========================================

    // Get tenant information from attached tenant
    const tenant = (req as any).tenant;
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // If tenant DB is not available, return basic user info from token
    if (!req.tenantDb) {
      console.log('⚠️ [AUTH] Tenant DB not available, returning basic user info from token');
      return res.json({
        id: req.user.userId,
        email: req.user.email,
        username: req.user.email.split('@')[0],
        fullName: req.user.email.split('@')[0],
        roles: ['super_admin'],
        tenant: {
          id: tenant.id,
          organizationName: tenant.organizationName
        }
      });
    }

    // Get user from tenant database (already attached)
    const [user] = await req.tenantDb
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user roles from tenant database
    const roles = await req.tenantDb
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, user.id));

    res.json({
      ...user,
      roles: roles.map((r: any) => r.role),
      tenant: {
        id: tenant.id,
        organizationName: tenant.organizationName,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Change password
authRouter.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Get tenant and connect to tenant database
    const tenant = await getTenantById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantDb = getTenantDb(tenant.connectionString, tenant.id);

    // Get user from tenant database
    const [user] = await tenantDb
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update in tenant database
    const newPasswordHash = await hashPassword(newPassword);
    await tenantDb
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, user.id));

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request password reset
authRouter.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({
        ok: true,
        message: 'If an account with that email exists, we have sent password reset instructions to it.'
      });
    }

    // Generate reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store token in database
    const { passwordResetTokens } = await import('../shared/schema.js');
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: resetToken,
      expiresAt,
      used: false,
    });

    // Send email with reset link
    try {
      const { getUncachableResendClient } = await import('./resend-client.js');
      const { client, fromEmail } = await getUncachableResendClient();

      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

      await client.emails.send({
        from: fromEmail,
        to: user.email,
        subject: 'Password Reset Request - Petrol Pump Management',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hello ${user.fullName || 'User'},</p>
          <p>You requested to reset your password for your organization. Click the link below to reset it:</p>
          <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>Or copy and paste this link: ${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Continue anyway - don't reveal email sending issues
    }

    res.json({
      ok: true,
      message: 'If an account with that email exists, we have sent password reset instructions to it.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to process password reset' });
  }
});

// Reset password with token
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Find valid token
    const { passwordResetTokens } = await import('../shared/schema.js');
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (resetToken.used) {
      return res.status(400).json({ error: 'This reset token has already been used' });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ error: 'This reset token has expired' });
    }

    // Hash new password and update user
    const newPasswordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    res.json({ ok: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});
