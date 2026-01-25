import { Router } from "express";
import { AuthRequest, authenticateToken } from "../auth.js";
import { attachTenantDb } from "../middleware/tenant.js";
import { requireSuperAdmin } from "../middleware/authorize.js";
import { featurePermissions, userFeatureAccess, users, tenantUsers, userRoles } from "../../shared/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { db as masterDb, pool as masterPool } from "../db.js";
import { getTenantById, provisionTenant } from "../services/tenant-provisioning.js";
import { getTenantDb, getTenantPool } from "../services/db-connection-manager.js";
import { hashPassword } from "../auth.js";
import { userRoles as userRolesTable } from "../../shared/schema.js";

interface DeveloperModeFeaturePayload {
  featureKey: string;
  allowed: boolean;
}

export const developerModeRouter = Router();

developerModeRouter.use(authenticateToken);
developerModeRouter.use(attachTenantDb);

// List all distinct users across all tenants (from master DB) with their memberships
developerModeRouter.get("/master-users", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    console.log('[DeveloperMode] GET /master-users - Fetching all users across tenants...');
    // Pull all tenant memberships from master DB using pool directly for raw SQL
    const sql = `
      SELECT
        LOWER(tu.user_email) AS user_email,
        tu.user_id,
        tu.tenant_id,
        COALESCE(t.organization_name, '') AS organization_name
      FROM tenant_users tu
      LEFT JOIN tenants t ON t.id = tu.tenant_id
      ORDER BY LOWER(tu.user_email), t.organization_name
    `;
    const result = await masterPool.query(sql);
    const rows = Array.isArray(result?.rows) ? result.rows : [];
    console.log(`[DeveloperMode] Found ${rows.length} tenant_user records`);

    // Group memberships by user_email
    const byEmail = new Map<string, any[]>();
    for (const r of rows) {
      const email = String(r.user_email || '').toLowerCase().trim();
      if (!email) {
        console.warn(`[DeveloperMode] Skipping row with empty email:`, r);
        continue;
      }
      if (!byEmail.has(email)) byEmail.set(email, []);
      byEmail.get(email)!.push({
        tenantId: r.tenant_id,
        organizationName: r.organization_name || 'Unknown Organization',
        userId: r.user_id,
      });
    }

    console.log(`[DeveloperMode] Grouped into ${byEmail.size} distinct emails`);

    const includeTest = String((req.query as any)?.includeTest || '').toLowerCase() === '1' || String((req.query as any)?.includeTest || '').toLowerCase() === 'true';

    // List of fake/test accounts to exclude from Developer Mode (used only when includeTest=false)
    const EXCLUDED_EMAILS = new Set([
      'dev@developer.local', // Developer account (already handled, but include for completeness)
      'admin@gmail.com',
      'admin@mystation.com',
      'admin@newstation.com',
      'admin@station.local',
      'admin@teststation.com',
      'dependencytest@test.com',
      'smoketest@test.com',
      'test@fixedstation.com',
      'test@tenanttest.com',
      'testuser@test.com',
    ]);

    // List of fake/test usernames to exclude (ONLY if they match exactly as standalone or with test domains)
    // Note: We check for exact matches to avoid excluding legitimate users like "rickh5054@gmail.com"
    const EXCLUDED_EXACT_USERNAMES = new Set([
      'dev',
      'ay',
      'test',
      'admin',
      'smoketest',
      'dependencytest',
    ]);

    // "rick" is special - only exclude if it's exactly "rick" not "rickh5054" or similar
    const EXCLUDED_USERNAME_EXACT = 'rick';

    // Test domains that indicate fake accounts
    const TEST_DOMAINS = ['test.com', 'teststation.com', 'tenanttest.com', 'fixedstation.com'];

    // Build response of distinct users with memberships, filtering out fake/test accounts
    const users = Array.from(byEmail.entries())
      .filter(([email]) => {
        if (includeTest) return true; // do not exclude anything in debug mode
        const emailLower = email.toLowerCase().trim();

        // Exclude if email is in exclusion list
        if (EXCLUDED_EMAILS.has(emailLower)) {
          console.log(`[DeveloperMode] Excluding ${emailLower} (in EXCLUDED_EMAILS)`);
          return false;
        }

        // Parse email parts
        const [emailPrefix, emailDomain] = emailLower.split('@');
        if (!emailDomain) {
          // Invalid email format, exclude it
          return false;
        }

        // Exclude if username matches exactly AND domain is a test domain
        if (EXCLUDED_EXACT_USERNAMES.has(emailPrefix)) {
          if (TEST_DOMAINS.some(domain => emailDomain.includes(domain))) {
            console.log(`[DeveloperMode] Excluding ${emailLower} (exact username match with test domain)`);
            return false;
          }
        }

        // Special handling for "rick" - only exclude if it's exactly "rick" (not "rickh5054", etc.)
        if (emailPrefix === EXCLUDED_USERNAME_EXACT && emailDomain.includes('test')) {
          console.log(`[DeveloperMode] Excluding ${emailLower} (exact "rick" with test domain)`);
          return false;
        }

        // Exclude very short usernames (like "ay") unless they're legitimate (have proper domains)
        if (emailPrefix.length <= 2 && TEST_DOMAINS.some(domain => emailDomain.includes(domain))) {
          console.log(`[DeveloperMode] Excluding ${emailLower} (very short username with test domain)`);
          return false;
        }

        return true;
      })
      .map(([email, memberships]) => ({
        email,
        username: null,
        fullName: null,
        memberships,
      }));

    console.log(`[DeveloperMode] Returning ${users.length} distinct users${includeTest ? ' (includeTest=true)' : ' (excluding dev and test accounts)'}`);
    res.json({ ok: true, users });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to list master users:', msg);
    res.status(500).json({ ok: false, error: 'Failed to load users from master database' });
  }
});

// Upsert a specific tenant_users mapping for an email into a tenant
developerModeRouter.post("/tenant-users/map", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { tenantId, email } = req.body || {};
    const userEmail = String(email || '').trim().toLowerCase();
    const targetTenantId = String(tenantId || '').trim();

    if (!userEmail || !targetTenantId) {
      return res.status(400).json({ ok: false, error: 'tenantId and email are required' });
    }

    const tenant = await getTenantById(targetTenantId);
    if (!tenant) {
      return res.status(404).json({ ok: false, error: 'Tenant not found' });
    }

    // Find user id in tenant DB by email
    const tenantDb = getTenantDb(tenant.connectionString, targetTenantId);
    const [u] = await tenantDb.select({ id: users.id }).from(users).where(eq(users.email, userEmail)).limit(1);
    if (!u) {
      return res.status(404).json({ ok: false, error: 'User not found in target tenant database' });
    }

    await masterPool.query(
      `INSERT INTO tenant_users (tenant_id, user_email, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, user_email)
       DO UPDATE SET user_id = EXCLUDED.user_id`,
      [targetTenantId, userEmail, u.id]
    );

    return res.json({ ok: true, message: 'Mapping upserted', tenantId: targetTenantId, email: userEmail, userId: u.id });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to upsert tenant_users mapping:', msg);
    return res.status(500).json({ ok: false, error: 'Failed to upsert mapping', details: msg });
  }
});

// Create user in a specific tenant (Developer Mode)
developerModeRouter.post("/tenants/:tenantId/users", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { email, username, fullName, password, role } = req.body || {};

    if (!tenantId) return res.status(400).json({ ok: false, error: 'tenantId is required' });
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password are required' });
    const validRoles = ['super_admin', 'manager', 'dsm'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ ok: false, error: 'Invalid role. Allowed roles: super_admin, manager, dsm' });
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant) return res.status(404).json({ ok: false, error: 'Tenant not found' });

    const tenantDb = getTenantDb(tenant.connectionString, tenantId);

    // Ensure email unique in target tenant
    const existing = await tenantDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, String(email).toLowerCase()))
      .limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ ok: false, error: 'User with this email already exists in the selected organization' });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const [newUser] = await tenantDb
      .insert(users)
      .values({
        email: String(email).toLowerCase(),
        username: username || null,
        passwordHash,
        fullName: fullName || null,
      })
      .returning();

    // Assign role
    await tenantDb.insert(userRolesTable).values({ userId: newUser.id, role });

    // Register mapping in master
    await masterPool.query(
      `INSERT INTO tenant_users (tenant_id, user_email, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, user_email) DO UPDATE SET user_id = EXCLUDED.user_id`,
      [tenantId, String(email).toLowerCase(), newUser.id]
    );

    // CRITICAL: Auto-assign features using universal helper
    // This ensures features are ALWAYS assigned to feature_access table
    await ensureUserFeaturesAssigned(newUser.id, tenantId, tenant.connectionString, tenantDb, false);

    return res.status(201).json({ ok: true, user: { id: newUser.id, email: newUser.email, username: newUser.username, fullName: newUser.fullName, role } });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to create user in tenant:', msg);
    return res.status(500).json({ ok: false, error: 'Failed to create user in tenant', details: msg });
  }
});

// Delete a specific tenant_users mapping (email in a tenant)
developerModeRouter.delete("/tenant-users/map", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { tenantId, email } = req.body || {};
    const userEmail = String(email || '').trim().toLowerCase();
    const targetTenantId = String(tenantId || '').trim();

    if (!userEmail || !targetTenantId) {
      return res.status(400).json({ ok: false, error: 'tenantId and email are required' });
    }

    const result = await masterPool.query(
      `DELETE FROM tenant_users WHERE tenant_id = $1 AND LOWER(user_email) = $2`,
      [targetTenantId, userEmail]
    );

    return res.json({ ok: true, message: 'Mapping deleted', tenantId: targetTenantId, email: userEmail, rowCount: result.rowCount || 0 });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to delete tenant_users mapping:', msg);
    return res.status(500).json({ ok: false, error: 'Failed to delete mapping', details: msg });
  }
});

// Auto-map an email to the best-fit tenant by scanning tenant DBs
developerModeRouter.post("/tenant-users/auto-map", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { email } = req.body || {};
    const userEmail = String(email || '').trim().toLowerCase();
    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'email is required' });
    }

    // Get all active tenants from master
    const tenantsResult = await masterPool.query(
      `SELECT id, organization_name, super_admin_email, connection_string FROM tenants WHERE status = 'active'`
    );
    const allTenants: Array<{ id: string; organization_name: string; super_admin_email: string; connection_string: string }> = tenantsResult.rows || [];

    const matches: Array<{ tenantId: string; org: string; admin: string }> = [];
    for (const t of allTenants) {
      try {
        const tdb = getTenantDb(t.connection_string, t.id);
        const rows = await tdb
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, userEmail))
          .limit(1);
        if (rows && rows.length > 0) {
          matches.push({ tenantId: t.id, org: t.organization_name || '', admin: (t.super_admin_email || '').toLowerCase() });
        }
      } catch (e) {
        // ignore tenant errors and continue
      }
    }

    if (matches.length === 0) {
      return res.status(404).json({ ok: false, error: 'Email not found in any active tenant users table' });
    }

    // Prefer non-dev tenant
    const nonDev = matches.filter(m => {
      const org = m.org.toLowerCase();
      return !(m.admin === 'dev@developer.local' || org.includes('rakhy') || org.includes('developer'));
    });
    const chosen = (nonDev[0] || matches[0]);

    // Find the user id in chosen tenant
    const chosenTenant = await getTenantById(chosen.tenantId);
    if (!chosenTenant) {
      return res.status(404).json({ ok: false, error: 'Chosen tenant not found' });
    }
    const chosenDb = getTenantDb(chosenTenant.connectionString, chosenTenant.id);
    const [u] = await chosenDb.select({ id: users.id }).from(users).where(eq(users.email, userEmail)).limit(1);
    if (!u) {
      return res.status(404).json({ ok: false, error: 'User not found in chosen tenant database' });
    }

    // Upsert mapping for chosen tenant
    await masterPool.query(
      `INSERT INTO tenant_users (tenant_id, user_email, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, user_email)
       DO UPDATE SET user_id = EXCLUDED.user_id`,
      [chosen.tenantId, userEmail, u.id]
    );

    // Remove mapping to Rakhy (dev) if different from chosen
    const DEV_TENANT_ID = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    let removedDev = 0;
    if (chosen.tenantId !== DEV_TENANT_ID) {
      const del = await masterPool.query(
        `DELETE FROM tenant_users WHERE tenant_id = $1 AND LOWER(user_email) = $2`,
        [DEV_TENANT_ID, userEmail]
      );
      removedDev = del.rowCount || 0;
    }

    return res.json({ ok: true, mappedTenantId: chosen.tenantId, removedDev });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to auto-map tenant_users:', msg);
    return res.status(500).json({ ok: false, error: 'Failed to auto-map user', details: msg });
  }
});

// System Health Dashboard - Basic system statistics
developerModeRouter.get("/system-health", requireSuperAdmin, async (_req: AuthRequest, res) => {
  try {
    console.log('[DeveloperMode] GET /system-health - Fetching system health stats...');

    // Check database connection
    let databaseStatus: 'connected' | 'error' = 'error';
    try {
      await masterPool.query('SELECT 1');
      databaseStatus = 'connected';
    } catch (dbError: any) {
      console.error('[DeveloperMode] Database connection test failed:', dbError?.message || dbError);
      databaseStatus = 'error';
    }

    // List of fake/test accounts to exclude
    const EXCLUDED_EMAILS = new Set([
      'dev@developer.local',
      'admin@gmail.com',
      'admin@mystation.com',
      'admin@newstation.com',
      'admin@station.local',
      'admin@teststation.com',
      'dependencytest@test.com',
      'smoketest@test.com',
      'test@fixedstation.com',
      'test@tenanttest.com',
      'testuser@test.com',
    ]);

    const EXCLUDED_EXACT_USERNAMES = new Set([
      'dev',
      'ay',
      'test',
      'admin',
      'smoketest',
      'dependencytest',
    ]);

    // Count total tenants (active only, excluding test organizations)
    let totalTenants = 0;
    try {
      const tenantsResult = await masterPool.query(`
        SELECT 
          id,
          organization_name,
          super_admin_email,
          status
        FROM tenants 
        WHERE status = 'active'
      `);

      // Filter out test/fake tenants
      const validTenants = tenantsResult.rows.filter((row: any) => {
        const orgName = (row.organization_name || '').toLowerCase();
        const adminEmail = (row.super_admin_email || '').toLowerCase();

        // Exclude if admin email is in excluded list
        if (EXCLUDED_EMAILS.has(adminEmail)) {
          return false;
        }

        // Exclude if organization name suggests test account
        const orgNameLower = orgName.toLowerCase();
        if (orgNameLower.includes('test') || orgNameLower.includes('fake') ||
          orgNameLower.includes('demo') || orgNameLower.includes('sample')) {
          // Check if it's a legitimate tenant (like "TestStation" might be real)
          // Only exclude obvious test names
          if (orgNameLower === 'test' || orgNameLower === 'teststation' ||
            orgNameLower === 'test tenant' || orgNameLower === 'fake tenant') {
            return false;
          }
        }

        return true;
      });

      totalTenants = validTenants.length;
      console.log(`[DeveloperMode] Total tenants: ${tenantsResult.rows.length} raw, ${totalTenants} after filtering`);
    } catch (err: any) {
      console.error('[DeveloperMode] Failed to count tenants:', err?.message || err);
    }

    // Count total distinct users across all tenants (excluding test accounts)
    let totalUsers = 0;
    try {
      const usersResult = await masterPool.query(`
        SELECT DISTINCT LOWER(user_email) as user_email
        FROM tenant_users
      `);

      // Filter out test/fake users
      const validUsers = usersResult.rows.filter((row: any) => {
        const email = (row.user_email || '').toLowerCase().trim();
        if (!email) return false;

        // Exclude specific emails
        if (EXCLUDED_EMAILS.has(email)) {
          return false;
        }

        // Extract username from email
        const username = email.split('@')[0].toLowerCase();
        const domain = email.split('@')[1]?.toLowerCase() || '';

        // Exclude if username is in excluded list AND domain is test-like
        if (EXCLUDED_EXACT_USERNAMES.has(username)) {
          // Only exclude if domain suggests it's a test account
          if (domain.includes('test') || domain === 'station.local' ||
            domain === 'mystation.com' || domain === 'newstation.com' ||
            domain === 'fixedstation.com' || domain === 'tenanttest.com') {
            return false;
          }
        }

        // Special handling for "rick" - only exclude if it's exactly "rick" with test domain
        if (username === 'rick' && (domain.includes('test') || domain === 'station.local')) {
          return false;
        }

        // Exclude very short usernames (<=2 chars) with test domains
        if (username.length <= 2 && (domain.includes('test') || domain === 'station.local')) {
          return false;
        }

        return true;
      });

      totalUsers = validUsers.length;
      console.log(`[DeveloperMode] Total users: ${usersResult.rows.length} raw, ${totalUsers} after filtering`);
    } catch (err: any) {
      console.error('[DeveloperMode] Failed to count users:', err?.message || err);
    }

    // Last sync time - use current timestamp for now (can be enhanced later with actual sync logs)
    const lastSyncTime = new Date().toISOString();

    console.log(`[DeveloperMode] System Health: ${totalTenants} tenants, ${totalUsers} users, DB: ${databaseStatus}`);

    res.json({
      ok: true,
      totalTenants,
      totalUsers,
      databaseStatus,
      lastSyncTime,
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to fetch system health:', msg);
    console.error('[DeveloperMode] Full error:', error);
    res.status(500).json({ ok: false, error: 'Failed to load system health data', details: msg });
  }
});

// Tenant Management - List all tenants with user counts
developerModeRouter.get("/tenants", requireSuperAdmin, async (_req: AuthRequest, res) => {
  try {
    console.log('[DeveloperMode] GET /tenants - Fetching all tenants...');

    // List of fake/test accounts to exclude
    const EXCLUDED_EMAILS = new Set([
      'dev@developer.local',
      'admin@gmail.com',
      'admin@mystation.com',
      'admin@newstation.com',
      'admin@station.local',
      'admin@teststation.com',
      'dependencytest@test.com',
      'smoketest@test.com',
      'test@fixedstation.com',
      'test@tenanttest.com',
      'testuser@test.com',
    ]);

    const sql = `
      SELECT 
        t.id,
        t.organization_name,
        t.super_admin_email,
        t.created_at,
        t.status,
        COUNT(DISTINCT tu.user_email) as user_count
      FROM tenants t
      LEFT JOIN tenant_users tu ON tu.tenant_id = t.id
      WHERE t.status = 'active'
      GROUP BY t.id, t.organization_name, t.super_admin_email, t.created_at, t.status
      ORDER BY t.organization_name
    `;

    const result = await masterPool.query(sql);
    const rows = Array.isArray(result?.rows) ? result.rows : [];

    // Filter out test/fake tenants
    const validTenants = rows
      .filter((row: any) => {
        const orgName = (row.organization_name || '').toLowerCase();
        const adminEmail = (row.super_admin_email || '').toLowerCase();

        // Exclude if admin email is in excluded list
        if (EXCLUDED_EMAILS.has(adminEmail)) {
          return false;
        }

        // Exclude if organization name suggests test account
        const orgNameLower = orgName.toLowerCase();
        if (orgNameLower.includes('test') || orgNameLower.includes('fake') ||
          orgNameLower.includes('demo') || orgNameLower.includes('sample') ||
          orgNameLower.includes('smoke') || orgNameLower.includes('dependency')) {
          // Only exclude obvious test names
          if (orgNameLower.includes('test') || orgNameLower.includes('smoke') ||
            orgNameLower.includes('dependency') || orgNameLower === 'test station' ||
            orgNameLower === 'test company' || orgNameLower === 'test tenant') {
            return false;
          }
        }

        // Exclude generic/orphaned organization names
        if (orgNameLower === 'my organization' || orgNameLower === 'orgadmin' ||
          orgNameLower === 'station one' || orgNameLower === 'my petrol station') {
          // Check if it has a legitimate admin email (not test)
          if (EXCLUDED_EMAILS.has(adminEmail) || !adminEmail || adminEmail.includes('test')) {
            return false;
          }
        }

        return true;
      })
      .map((row: any) => ({
        id: row.id,
        organizationName: row.organization_name,
        createdAt: row.created_at,
        userCount: parseInt(row.user_count || '0', 10),
      }));

    console.log(`[DeveloperMode] Found ${rows.length} active tenants (raw), ${validTenants.length} after filtering`);
    res.json({ ok: true, tenants: validTenants });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to list tenants:', msg);
    console.error('[DeveloperMode] Full error:', error);
    res.status(500).json({ ok: false, error: 'Failed to load tenants', details: msg });
  }
});

// Create a new tenant (organization) - Developer Mode only
developerModeRouter.post("/tenants", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const body: any = req.body || {};
    // Accept multiple aliases to be robust against client typos/casing
    const orgRaw = body.organizationName ?? body.organization ?? body.orgName ?? body.org;
    const superAdminEmailRaw = body.superAdminEmail ?? body.adminEmail ?? body.email ?? body.super_admin_email;
    const superAdminPasswordRaw = body.superAdminPassword ?? body.adminPassword ?? body.password ?? body.super_admin_password;
    const superAdminUsernameRaw = body.superAdminUsername ?? body.username ?? body.super_admin_username;
    const superAdminFullNameRaw = body.superAdminFullName ?? body.fullName ?? body.super_admin_full_name;
    const org = String(orgRaw ?? '').trim();
    const adminEmail = String(superAdminEmailRaw ?? '').trim().toLowerCase();

    console.log('[DeveloperMode] /tenants payload received:', {
      organizationName: org,
      superAdminEmail: adminEmail,
      rawKeys: Object.keys(body || {})
    });

    if (!org) {
      return res.status(400).json({ ok: false, error: 'organizationName is required' });
    }
    if (!adminEmail) {
      return res.status(400).json({ ok: false, error: 'superAdminEmail is required' });
    }
    // Basic email format check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail)) {
      return res.status(400).json({ ok: false, error: 'superAdminEmail is invalid' });
    }

    // Run provisioning with a timeout fallback to avoid gateway timeouts
    const TIMEOUT_MS = 6000;
    const provisionPromise = provisionTenant({ organizationName: org, superAdminEmail: adminEmail });
    const timeoutPromise = new Promise<"TIMEOUT">((resolve) => setTimeout(() => resolve("TIMEOUT"), TIMEOUT_MS));

    const result = await Promise.race([provisionPromise as any, timeoutPromise]);

    if (result === "TIMEOUT") {
      // Let provisioning continue in background; return 202 to inform frontend to poll
      return res.status(202).json({ ok: true, provisioning: true, message: 'Provisioning started. Please wait a moment and refresh organizations.' });
    }

    let tenant: any = null;
    const prov = result as any;
    if (!prov?.success) {
      return res.status(400).json({ ok: false, error: prov?.error || 'Provisioning failed' });
    }
    const { getTenantById } = await import('../services/tenant-provisioning.js');
    tenant = await getTenantById(prov.tenantId);
    if (!tenant) {
      return res.status(500).json({ ok: false, error: 'Failed to create tenant' });
    }

    // Ensure super admin exists in tenant, set password when provided, give super_admin role,
    // and map in master immediately so it appears in Registered Users
    try {
      const tenantDb = getTenantDb(tenant.connectionString, tenant.id);
      // Find super admin user id in tenant DB
      let superUserId: string | null = null;
      try {
        const [superUser] = await tenantDb
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, adminEmail))
          .limit(1);
        superUserId = superUser?.id || null;
      } catch { }

      // Create if missing
      if (!superUserId) {
        const { hashPassword } = await import('../auth.js');
        const passwordHash = await hashPassword(String(superAdminPasswordRaw || 'Temp123!'));
        const [created] = await tenantDb
          .insert(users)
          .values({
            email: adminEmail,
            username: (superAdminUsernameRaw ? String(superAdminUsernameRaw) : adminEmail.split('@')[0]),
            fullName: (superAdminFullNameRaw ? String(superAdminFullNameRaw) : 'Super Admin'),
            passwordHash,
          })
          .returning();
        superUserId = created?.id || null;
      }

      // Ensure role
      if (superUserId) {
        try {
          const existingRoles = await tenantDb.select().from(userRoles).where(eq(userRoles.userId, superUserId));
          if (!Array.isArray(existingRoles) || !existingRoles.some((r: any) => r.role === 'super_admin')) {
            await tenantDb.insert(userRoles).values({ userId: superUserId, role: 'super_admin' });
          }
        } catch { }

        // Optionally update username/fullName if provided now and missing
        try {
          const updates: Record<string, any> = {};
          if (superAdminUsernameRaw) updates['username'] = String(superAdminUsernameRaw);
          if (superAdminFullNameRaw) updates['fullName'] = String(superAdminFullNameRaw);
          if (Object.keys(updates).length > 0) {
            await (tenantDb as any).update(users).set(updates).where(eq(users.id, superUserId));
          }
        } catch { }

        // Map to master
        await masterPool.query(
          `INSERT INTO tenant_users (tenant_id, user_email, user_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (tenant_id, user_email)
           DO UPDATE SET user_id = EXCLUDED.user_id`,
          [tenant.id, adminEmail, superUserId]
        );

        // CRITICAL: Auto-assign features to super admin (force basic mode for new org)
        await ensureUserFeaturesAssigned(superUserId, tenant.id, tenant.connectionString, tenantDb, true);

        console.log(`[DeveloperMode] ✅ Ensured super admin ${adminEmail} exists, mapped, and assigned features for tenant ${tenant.id}`);
      } else {
        console.warn(`[DeveloperMode] ⚠️ Could not upsert or find super admin in tenant DB to map: ${adminEmail}`);
      }
    } catch (mapErr: any) {
      console.warn('[DeveloperMode] ⚠️ Failed to map super admin to master:', mapErr?.message || mapErr);
    }

    return res.status(201).json({ ok: true, tenant: { id: tenant.id, organizationName: tenant.organizationName }, superAdminEmail: adminEmail });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to create tenant:', msg);
    return res.status(500).json({ ok: false, error: 'Failed to create tenant', details: msg });
  }
});

// Get users for a specific tenant
developerModeRouter.get("/tenants/:tenantId/users", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    console.log(`[DeveloperMode] GET /tenants/${tenantId}/users - Fetching users for tenant...`);

    const sql = `
      SELECT 
        tu.user_email,
        tu.user_id,
        tu.created_at
      FROM tenant_users tu
      WHERE tu.tenant_id = $1
      ORDER BY LOWER(tu.user_email)
    `;

    const result = await masterPool.query(sql, [tenantId]);
    const rows = Array.isArray(result?.rows) ? result.rows : [];

    const users = rows.map((row: any) => ({
      email: row.user_email,
      userId: row.user_id,
      createdAt: row.created_at,
    }));

    console.log(`[DeveloperMode] Found ${users.length} users in tenant ${tenantId}`);
    res.json({ ok: true, users });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error(`[DeveloperMode] Failed to list users for tenant ${req.params.tenantId}:`, msg);
    res.status(500).json({ ok: false, error: 'Failed to load tenant users' });
  }
});

// Sync tenant users into master tenant_users (backfill newly created users)
developerModeRouter.post("/sync-tenant-users", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const body: any = req.body || {};
    const tenantId = String(body.tenantId || req.user?.tenantId || '').trim();

    if (!tenantId) {
      return res.status(400).json({ ok: false, error: 'tenantId is required' });
    }

    console.log(`[DeveloperMode] POST /sync-tenant-users - Syncing tenant ${tenantId} to master tenant_users...`);

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({ ok: false, error: 'Tenant not found' });
    }

    const tenantDb = getTenantDb(tenant.connectionString, tenantId);

    // Load all users from tenant DB
    const tenantUsersList = await tenantDb
      .select({ id: users.id, email: users.email })
      .from(users);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const u of tenantUsersList) {
      const email = String(u.email || '').toLowerCase().trim();
      if (!email) { skipped++; continue; }

      // Upsert into master tenant_users
      const result = await masterPool.query(
        `INSERT INTO tenant_users (tenant_id, user_email, user_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id, user_email)
         DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING (xmax = 0) AS inserted`,
        [tenantId, email, u.id]
      );

      const wasInserted = Boolean(result.rows?.[0]?.inserted);
      if (wasInserted) inserted++; else updated++;
    }

    console.log(`[DeveloperMode] ✅ Sync complete for tenant ${tenantId}: inserted=${inserted}, updated=${updated}, skipped=${skipped}`);
    return res.json({ ok: true, tenantId, inserted, updated, skipped, total: tenantUsersList.length });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to sync tenant users:', msg);
    return res.status(500).json({ ok: false, error: 'Failed to sync tenant users', details: msg });
  }
});

// Get audit logs
developerModeRouter.get("/audit-logs", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String((req.query as any)?.userEmail || '').trim().toLowerCase();
    const limit = Math.min(parseInt(String((req.query as any)?.limit || '50'), 10), 100); // Max 100, default 50

    console.log(`[DeveloperMode] GET /audit-logs - userEmail=${userEmail || 'all'}, limit=${limit}`);

    let sql: string;
    let params: any[];

    if (userEmail) {
      sql = `
        SELECT 
          developer_email,
          target_user_email,
          feature_key,
          action,
          created_at
        FROM developer_audit_logs
        WHERE LOWER(target_user_email) = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      params = [userEmail, limit];
    } else {
      sql = `
        SELECT 
          developer_email,
          target_user_email,
          feature_key,
          action,
          created_at
        FROM developer_audit_logs
        ORDER BY created_at DESC
        LIMIT $1
      `;
      params = [limit];
    }

    const result = await masterPool.query(sql, params);
    const rows = Array.isArray(result?.rows) ? result.rows : [];

    const logs = rows.map((row: any) => ({
      developerEmail: row.developer_email,
      targetUserEmail: row.target_user_email,
      featureKey: row.feature_key,
      action: row.action,
      createdAt: row.created_at,
    }));

    console.log(`[DeveloperMode] Found ${logs.length} audit log entries`);
    res.json({ ok: true, logs });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to load audit logs:', msg);

    // Check if table doesn't exist
    if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('42P01')) {
      console.warn('[DeveloperMode] developer_audit_logs table does not exist - migration may not have been run');
      return res.json({ ok: true, logs: [] }); // Return empty array instead of error
    }

    res.status(500).json({ ok: false, error: 'Failed to load audit logs' });
  }
});

export async function loadFeatureCatalog(tenantDb: any, tenantId?: string) {
  try {
    // Check if table exists first
    await tenantDb.execute(sql.raw(`SELECT 1 FROM feature_permissions LIMIT 1`));

    // Check if the id column is UUID or TEXT - if TEXT, migrate it
    if (tenantId) {
      try {
        // Ensure all defined features exist in the table
        const { BASIC_FEATURES, ADVANCED_FEATURES } = await import('../feature-defaults.js');
        const allDefaults = [...BASIC_FEATURES, ...ADVANCED_FEATURES];
        await ensureFeaturePermissionsForKeys(tenantDb, allDefaults, tenantId);

        const tenant = await getTenantById(tenantId);
        if (tenant && tenant.connectionString) {
          const pool = getTenantPool(tenant.connectionString, tenantId);
          const colCheck = await pool.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'feature_permissions' AND column_name = 'id'
          `);

          if (colCheck.rows.length > 0 && colCheck.rows[0].data_type !== 'uuid') {
            console.warn(`[DeveloperMode] feature_permissions.id is ${colCheck.rows[0].data_type}, not UUID. Migrating to UUID...`);
            // Get all existing data first
            const existingData = await pool.query(`
              SELECT feature_key, label, description, feature_group, default_enabled 
              FROM feature_permissions
            `);

            // Drop and recreate with UUID
            await pool.query(`DROP TABLE IF EXISTS user_feature_access CASCADE`);
            await pool.query(`DROP TABLE IF EXISTS feature_permissions CASCADE`);
            await pool.query(`
              CREATE TABLE feature_permissions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                feature_key TEXT UNIQUE NOT NULL,
                label TEXT NOT NULL,
                description TEXT,
                feature_group TEXT NOT NULL,
                default_enabled BOOLEAN NOT NULL DEFAULT false
              )
            `);

            // Reinsert data with new UUIDs
            for (const row of existingData.rows) {
              const safeKey = String(row.feature_key || '').replace(/'/g, "''");
              const safeLabel = String(row.label || '').replace(/'/g, "''");
              const safeDesc = String(row.description || '').replace(/'/g, "''");
              const safeGroup = String(row.feature_group || '').replace(/'/g, "''");
              await pool.query(`
                INSERT INTO feature_permissions (feature_key, label, description, feature_group, default_enabled)
                VALUES ('${safeKey}', '${safeLabel}', '${safeDesc}', '${safeGroup}', ${row.default_enabled ? 'true' : 'false'})
                ON CONFLICT (feature_key) DO NOTHING
              `);
            }

            // Recreate user_feature_access table
            await pool.query(`
              CREATE TABLE IF NOT EXISTS user_feature_access (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                feature_id UUID NOT NULL REFERENCES feature_permissions(id) ON DELETE CASCADE,
                allowed BOOLEAN NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, feature_id)
              )
            `);

            console.log(`[DeveloperMode] ✅ Successfully migrated feature_permissions to UUID schema`);
          }
        }
      } catch (migrateErr: any) {
        console.warn(`[DeveloperMode] Could not check/migrate feature_permissions schema: ${migrateErr?.message || migrateErr}`);
      }
    }

    const rows = await tenantDb
      .select({
        id: featurePermissions.id,
        featureKey: featurePermissions.featureKey,
        label: featurePermissions.label,
        description: featurePermissions.description,
        featureGroup: featurePermissions.featureGroup,
        defaultEnabled: featurePermissions.defaultEnabled,
      })
      .from(featurePermissions);
    if (rows.length === 0) {
      console.warn(`[DeveloperMode] feature_permissions table empty. Seeding defaults...`);
      throw new Error('empty_feature_permissions');
    }
    console.log(`[DeveloperMode] Loaded ${rows.length} feature catalog row(s) from feature_permissions`);
    return rows.sort((a: any, b: any) => {
      const groupA = (a.featureGroup || '').toLowerCase();
      const groupB = (b.featureGroup || '').toLowerCase();
      if (groupA === groupB) {
        return a.label.localeCompare(b.label);
      }
      return groupA.localeCompare(groupB);
    });
  } catch (tableError: any) {
    const errorMsg = String(tableError?.message || tableError || '');
    const errorCode = (tableError?.cause && typeof tableError.cause === 'object') ? (tableError.cause as any).code : undefined;
    console.warn("Feature permissions table missing, empty, or error accessing. Seeding/Synthesizing defaults...", { errorMsg, errorCode });
    try {
      const { BASIC_FEATURES, ADVANCED_FEATURES } = await import('../feature-defaults.js');
      const defaultRows: Array<Record<string, any>> = [];
      for (const fk of BASIC_FEATURES) {
        defaultRows.push({
          featureKey: fk,
          label: fk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          description: 'Basic feature',
          featureGroup: 'basic',
          defaultEnabled: true,
        });
      }
      for (const fk of ADVANCED_FEATURES) {
        defaultRows.push({
          featureKey: fk,
          label: fk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          description: 'Advanced feature',
          featureGroup: 'advanced',
          defaultEnabled: false,
        });
      }

      // If Mongo-only mode or ANY error, return synthesized features immediately without trying to write to DB
      // This ensures resilience against DB failures
      if (true) { // Always return synthesized defaults on error
        console.log("[DeveloperMode] Returning synthesized features due to error/missing table.");
        return defaultRows.sort((a: any, b: any) => {
          const groupA = (a.featureGroup || '').toLowerCase();
          const groupB = (b.featureGroup || '').toLowerCase();
          if (groupA === groupB) {
            return a.label.localeCompare(b.label);
          }
          return groupA.localeCompare(groupB);
        });
      }

      // Unreachable code below but kept for structural compatibility if needed by future edits
      return defaultRows;
    } catch (seedErr: any) {
      console.error('[DeveloperMode] Failed to seed feature catalog:', seedErr?.message || seedErr);
      return [];
    }

    // Fallback for any other error: return empty array or defaults instead of throwing
    console.error('[DeveloperMode] loadFeatureCatalog critical failure:', errorMsg);
    // Try to return basic defaults if possible even here
    try {
      const { BASIC_FEATURES, ADVANCED_FEATURES } = await import('../feature-defaults.js');
      const defaultRows: Array<Record<string, any>> = [];
      // ... build defaults ...
      // Simplified fallback
      return BASIC_FEATURES.map(fk => ({ featureKey: fk, label: fk, featureGroup: 'basic', defaultEnabled: true }));
    } catch {
      return [];
    }
  }

}



function titleCaseFeatureKey(featureKey: string): string {
  return featureKey
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * CRITICAL: Universal feature assignment helper
 * Ensures features are ALWAYS assigned to feature_access table (primary schema)
 * Also assigns to user_feature_access if it exists (legacy schema)
 * Detects tenant mode and assigns advanced features accordingly
 * 
 * @param userId - The user ID to assign features to
 * @param tenantId - The tenant ID
 * @param connectionString - The tenant database connection string
 * @param tenantDb - Optional Drizzle tenant DB (for legacy schema writes)
 * @param forceBasicMode - If true, only assign basic features (for new orgs)
 * @returns Promise that resolves when features are assigned
 */
export async function ensureUserFeaturesAssigned(
  userId: string,
  tenantId: string,
  connectionString: string,
  tenantDb?: any,
  forceBasicMode: boolean = false
): Promise<void> {
  try {
    const { BASIC_FEATURES, ADVANCED_FEATURES } = await import('../feature-defaults.js');
    const { getTenantPool } = await import('../services/db-connection-manager.js');
    const pool = getTenantPool(connectionString, tenantId);
    const safeUserId = String(userId).replace(/'/g, "''");

    // Ensure feature_access table exists (CRITICAL - primary schema)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS feature_access (
          user_id UUID NOT NULL,
          feature_key TEXT NOT NULL,
          allowed BOOLEAN NOT NULL DEFAULT false,
          updated_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (user_id, feature_key)
        )
      `);
    } catch (createErr: any) {
      if (!createErr?.message?.includes('already exists')) {
        console.warn(`[FeatureAssignment] Could not create feature_access table:`, createErr?.message || createErr);
      }
    }

    // Detect tenant mode (unless forced to basic)
    let tenantHasAdvancedMode = false;
    if (!forceBasicMode) {
      try {
        const modeCheck = await pool.query(`
          SELECT COUNT(DISTINCT u.id) as user_count,
                 COUNT(DISTINCT CASE WHEN fa.feature_key = ANY(ARRAY[${ADVANCED_FEATURES.map(f => `'${f.replace(/'/g, "''")}'`).join(',')}]) AND fa.allowed = true THEN u.id END) as advanced_users
          FROM users u
          LEFT JOIN feature_access fa ON fa.user_id = u.id
          WHERE u.id != '${safeUserId}'
        `);
        const userCount = parseInt(modeCheck.rows[0]?.user_count || '0');
        const advancedUsers = parseInt(modeCheck.rows[0]?.advanced_users || '0');
        tenantHasAdvancedMode = userCount > 0 && advancedUsers > 0 && (advancedUsers / userCount) >= 0.5;
        console.log(`[FeatureAssignment] Tenant mode for ${userId}: ${userCount} existing users, ${advancedUsers} with advanced, mode=${tenantHasAdvancedMode ? 'ADVANCED' : 'BASIC'}`);
      } catch (modeErr: any) {
        console.warn(`[FeatureAssignment] Could not detect tenant mode:`, modeErr?.message || modeErr);
        tenantHasAdvancedMode = false;
      }
    }

    // Assign BASIC features (always enabled)
    for (const fk of BASIC_FEATURES) {
      const safeFk = fk.replace(/'/g, "''");
      try {
        await pool.query(`
          INSERT INTO feature_access (user_id, feature_key, allowed, updated_at)
          VALUES ('${safeUserId}', '${safeFk}', true, now())
          ON CONFLICT (user_id, feature_key)
          DO UPDATE SET allowed = true, updated_at = now()
        `);
      } catch (err: any) {
        console.warn(`[FeatureAssignment] Failed to assign basic feature ${fk}:`, err?.message || err);
      }
    }

    // Assign ADVANCED features based on tenant mode
    for (const fk of ADVANCED_FEATURES) {
      const safeFk = fk.replace(/'/g, "''");
      const allowed = tenantHasAdvancedMode;
      try {
        await pool.query(`
          INSERT INTO feature_access (user_id, feature_key, allowed, updated_at)
          VALUES ('${safeUserId}', '${safeFk}', ${allowed ? 'true' : 'false'}, now())
          ON CONFLICT (user_id, feature_key)
          DO UPDATE SET allowed = ${allowed ? 'true' : 'false'}, updated_at = now()
        `);
      } catch (err: any) {
        console.warn(`[FeatureAssignment] Failed to assign advanced feature ${fk}:`, err?.message || err);
      }
    }

    console.log(`[FeatureAssignment] ✅ Assigned features to user ${userId} in tenant ${tenantId} (basic: enabled, advanced: ${tenantHasAdvancedMode ? 'enabled' : 'disabled'})`);

    // Also try to write to user_feature_access (legacy schema) if it exists and tenantDb is provided
    if (tenantDb) {
      try {
        // Check if user_feature_access exists
        await tenantDb.execute(sql.raw(`SELECT 1 FROM user_feature_access LIMIT 1`));

        // Load catalog to get feature IDs
        const catalog = await loadFeatureCatalog(tenantDb, tenantId);
        if (catalog.length > 0) {
          const allFeatures = [...BASIC_FEATURES, ...ADVANCED_FEATURES];
          const values: any[] = [];

          for (const fk of allFeatures) {
            const feature = catalog.find((f: any) => f.featureKey?.toLowerCase() === fk.toLowerCase());
            if (feature) {
              const allowed = BASIC_FEATURES.includes(fk) ? true : tenantHasAdvancedMode;
              values.push({
                userId: userId,
                featureId: feature.id,
                allowed: allowed
              });
            }
          }

          if (values.length > 0) {
            try {
              await tenantDb.insert(userFeatureAccess).values(values);
              console.log(`[FeatureAssignment] ✅ Also wrote ${values.length} features to user_feature_access (legacy schema)`);
            } catch (insertErr: any) {
              const errorMsg = String(insertErr?.message || insertErr || '');
              if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation') && !errorMsg.includes('42P01')) {
                console.warn(`[FeatureAssignment] Could not write to user_feature_access:`, errorMsg);
              }
            }
          }
        }
      } catch (legacyErr: any) {
        // user_feature_access doesn't exist - that's fine, we're using feature_access
        console.log(`[FeatureAssignment] user_feature_access not available, using feature_access only`);
      }
    }
  } catch (error: any) {
    console.error(`[FeatureAssignment] CRITICAL: Failed to assign features to user ${userId}:`, error?.message || error);
    // Don't throw - we want user creation to succeed even if feature assignment fails
    // Features can be assigned manually later
  }
}

async function ensureFeaturePermissionsForKeys(tenantDb: any, featureKeys: string[], tenantId: string) {
  if (!Array.isArray(featureKeys) || featureKeys.length === 0) {
    return;
  }

  const normalized = Array.from(new Set(
    featureKeys
      .map((key) => (key || '').toString().trim().toLowerCase())
      .filter((key) => key.length > 0)
  ));

  if (normalized.length === 0) {
    return;
  }

  // Get the pool using tenantId - first get the connection string from the tenant record
  const tenant = await getTenantById(tenantId);
  if (!tenant || !tenant.connectionString) {
    throw new Error(`Cannot get pool for tenant ${tenantId}: tenant not found or missing connection string`);
  }
  const pool = getTenantPool(tenant.connectionString, tenantId);

  // Ensure table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feature_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      feature_key TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      feature_group TEXT NOT NULL,
      default_enabled BOOLEAN NOT NULL DEFAULT false
    )
  `);

  try {
    const existingRows = await tenantDb
      .select({ featureKey: featurePermissions.featureKey })
      .from(featurePermissions);

    const existingKeys = new Set(
      Array.isArray(existingRows)
        ? existingRows.map((row: any) => String(row.featureKey || '').toLowerCase())
        : []
    );

    const missingKeys = normalized.filter((key) => !existingKeys.has(key));

    if (missingKeys.length === 0) {
      return;
    }

    for (const key of missingKeys) {
      const safeKey = String(key).replace(/'/g, "''");
      const safeLabel = titleCaseFeatureKey(key).replace(/'/g, "''");
      const safeDesc = 'Auto-added feature'.replace(/'/g, "''");
      const safeGroup = 'custom'.replace(/'/g, "''");
      await pool.query(`
        INSERT INTO feature_permissions (id, feature_key, label, description, feature_group, default_enabled)
        VALUES (gen_random_uuid(), '${safeKey}', '${safeLabel}', '${safeDesc}', '${safeGroup}', false)
        ON CONFLICT (feature_key) DO NOTHING
      `);
    }
  } catch (ensureErr: any) {
    console.error('[DeveloperMode] Failed to ensure feature permissions for keys:', ensureErr?.message || ensureErr);
    throw ensureErr;
  }
}

async function buildUserFeatureSnapshot(tenantDb: any, userId: string, tenantId?: string) {
  const catalog = await loadFeatureCatalog(tenantDb, tenantId);

  if (catalog.length === 0) {
    return [];
  }

  let overrides: any[] = [];

  // Try user_feature_access (legacy schema) first
  try {
    await tenantDb.execute(sql.raw(`SELECT 1 FROM user_feature_access LIMIT 1`));
    overrides = await tenantDb
      .select()
      .from(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, userId));
    console.log(`[DeveloperMode] buildUserFeatureSnapshot: Found ${overrides.length} overrides in user_feature_access`);
  } catch (tableError: any) {
    const errorMsg = String(tableError?.message || tableError || '');
    if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('42P01')) {
      console.warn("[DeveloperMode] buildUserFeatureSnapshot: user_feature_access table not found, will try feature_access");
    } else {
      console.warn("[DeveloperMode] buildUserFeatureSnapshot: Error querying user_feature_access:", errorMsg);
    }
  }

  // Also check feature_access table (new schema) - this is the primary source now
  try {
    if (tenantId) {
      const { getTenantPool } = await import('../services/db-connection-manager.js');
      const { getTenantById } = await import('../services/tenant-provisioning.js');
      const tenant = await getTenantById(tenantId);
      if (tenant && tenant.connectionString) {
        const pool = getTenantPool(tenant.connectionString, tenantId);
        const safeUserId = String(userId).replace(/'/g, "''");

        // Check if feature_access table exists
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema='public' AND table_name='feature_access'
          ) AS exists
        `);
        const tableExists = Boolean(tableCheck.rows?.[0]?.exists);

        if (tableExists) {
          const faResult = await pool.query(`
            SELECT feature_key, allowed 
            FROM feature_access 
            WHERE user_id = '${safeUserId}'
          `);

          // Map feature_access rows to feature_permissions IDs
          const faOverrides: any[] = [];
          for (const row of faResult.rows) {
            const feature = catalog.find((f: any) => f.featureKey?.toLowerCase() === row.feature_key?.toLowerCase());
            if (feature) {
              faOverrides.push({
                featureId: feature.id,
                userId: userId,
                allowed: row.allowed,
                source: 'feature_access'
              });
            }
          }

          if (faOverrides.length > 0) {
            console.log(`[DeveloperMode] buildUserFeatureSnapshot: Found ${faOverrides.length} overrides in feature_access table`);
            // feature_access takes precedence - replace any existing overrides for the same features
            const faFeatureIds = new Set(faOverrides.map((o: any) => o.featureId));
            overrides = overrides.filter((o: any) => !faFeatureIds.has(o.featureId));
            overrides.push(...faOverrides);
          }
        }
      }
    }
  } catch (faError: any) {
    const errorMsg = String(faError?.message || faError || '');
    console.warn(`[DeveloperMode] buildUserFeatureSnapshot: Error loading from feature_access:`, errorMsg);
  }

  const overrideMap = new Map<string, any>();
  overrides.forEach((row: any) => {
    overrideMap.set(row.featureId, row);
  });

  return catalog.map((feature: any) => {
    const override = overrideMap.get(feature.id);
    // CRITICAL: If override exists, use override.allowed (even if false!)
    // Only fallback to defaultEnabled if NO override exists
    const allowed = override !== undefined
      ? Boolean(override.allowed)
      : Boolean(feature.defaultEnabled);
    const isOverride = override !== undefined
      ? Boolean(override.allowed) !== Boolean(feature.defaultEnabled)
      : false;

    return {
      id: feature.id,
      featureKey: feature.featureKey,
      label: feature.label,
      featureGroup: feature.featureGroup,
      description: feature.description,
      defaultEnabled: Boolean(feature.defaultEnabled),
      allowed, // This should be false if override.allowed is false
      isOverride,
    };
  });
}

developerModeRouter.get("/features", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantDb) {
      return res.status(500).json({ ok: false, error: "Tenant database not available" });
    }

    const catalog = await loadFeatureCatalog(req.tenantDb, req.user?.tenantId);
    res.json({ ok: true, features: catalog });
  } catch (error: any) {
    console.error("Failed to load feature catalog", error);
    // Return empty array instead of error to prevent UI blocking
    res.json({ ok: true, features: [] });
  }
});

developerModeRouter.get("/users/:userId/features", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const requestedTenantId = String((req.query as any)?.tenantId || '').trim();
    if (!req.tenantDb && !requestedTenantId) {
      return res.status(500).json({ ok: false, error: "Tenant database not available" });
    }

    const { userId } = req.params;

    // FIRST: Find user in developer's tenant to get their email
    let userRecord = null;
    if (req.tenantDb) {
      [userRecord] = await req.tenantDb
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    }

    // If not found in dev tenant (or dev tenant DB unavailable), but we have a target tenant, try to find it there
    if (!userRecord && requestedTenantId) {
      try {
        const targetTenant = await getTenantById(requestedTenantId);
        if (targetTenant) {
          const targetDb = getTenantDb(targetTenant.connectionString, requestedTenantId);
          [userRecord] = await targetDb
            .select({ id: users.id, email: users.email })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        }
      } catch (e) {
        console.warn('[DeveloperMode] Failed to lookup user in requested tenant:', e);
      }
    }

    if (!userRecord) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const userEmail = userRecord.email.toLowerCase();
    const devTenantId = req.user?.tenantId;
    console.log(`[DeveloperMode] GET user features for ${userEmail} requestedTenantId=${requestedTenantId || 'none'}`);

    // Check if this email exists in a different tenant
    const allTenantUsers = await masterDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    // If tenantId is explicitly requested, use it directly
    if (requestedTenantId) {
      const specified = allTenantUsers.find((tu: any) => tu.tenantId === requestedTenantId);
      if (!specified) {
        return res.status(404).json({ ok: false, error: `User not found in tenant ${requestedTenantId}` });
      }

      const targetTenant = await getTenantById(specified.tenantId);
      if (!targetTenant) {
        return res.status(404).json({ ok: false, error: "Tenant not found" });
      }

      const targetTenantDb = getTenantDb(targetTenant.connectionString, specified.tenantId);
      let targetUserId = specified.userId;

      // Verify user exists in that tenant DB
      [userRecord] = await targetTenantDb
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (!userRecord) {
        console.warn(`[DeveloperMode] ⚠️ Mapping userId ${targetUserId} not found in tenant ${specified.tenantId}. Attempting lookup by email...`);
        const fallbackEmail = (userEmail || specified.userEmail || '').toLowerCase();
        if (fallbackEmail) {
          const [fallbackUser] = await targetTenantDb
            .select({ id: users.id, email: users.email })
            .from(users)
            .where(eq(users.email, fallbackEmail))
            .limit(1);
          if (fallbackUser) {
            userRecord = fallbackUser;
            targetUserId = fallbackUser.id;
            console.log(`[DeveloperMode] ✅ Resolved user by email ${fallbackEmail} in tenant ${specified.tenantId}. Updating master mapping...`);
            try {
              await masterPool.query(
                `INSERT INTO tenant_users (tenant_id, user_email, user_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (tenant_id, user_email)
                 DO UPDATE SET user_id = EXCLUDED.user_id`,
                [specified.tenantId, fallbackEmail, fallbackUser.id]
              );
            } catch (mapErr: any) {
              console.warn('[DeveloperMode] ⚠️ Failed to update master mapping after fallback:', mapErr?.message || mapErr);
            }
          }
        }

        if (!userRecord) {
          console.error(`[DeveloperMode] ❌ User ${targetUserId} / ${fallbackEmail || 'unknown email'} NOT FOUND in tenant ${specified.tenantId}`);
          return res.status(404).json({ ok: false, error: "User not found in tenant database" });
        }
      }

      const assignments = await buildUserFeatureSnapshot(targetTenantDb, targetUserId, specified.tenantId);
      return res.json({ ok: true, user: userRecord, features: assignments });
    }

    // Filter out dev's tenant
    const nonDevTenants = allTenantUsers.filter((tu: any) => tu.tenantId !== devTenantId);

    let actualTenantUser = nonDevTenants.length > 0 ? nonDevTenants[0] : undefined;

    // If multiple non-dev tenants, try to find the one that matches the organization name
    if (nonDevTenants.length > 1) {
      for (const tu of nonDevTenants) {
        try {
          const tenantInfo = await getTenantById(tu.tenantId);
          if (tenantInfo) {
            const orgNameLower = tenantInfo.organizationName?.toLowerCase() || '';
            const emailUsername = userEmail.split('@')[0].toLowerCase();

            if (orgNameLower.includes(emailUsername) || emailUsername.includes(orgNameLower.replace(/\s+/g, ''))) {
              actualTenantUser = tu;
              break;
            }
          }
        } catch (e) {
          // Continue to next tenant
        }
      }

      if (!actualTenantUser && nonDevTenants.length > 0) {
        actualTenantUser = nonDevTenants[0];
      }
    }

    let targetTenantDb = req.tenantDb;
    let targetUserId = userId;

    // If user exists in a different tenant, use that tenant
    if (actualTenantUser) {
      const targetTenant = await getTenantById(actualTenantUser.tenantId);

      if (!targetTenant) {
        return res.status(404).json({ ok: false, error: "Tenant not found" });
      }

      targetTenantDb = getTenantDb(targetTenant.connectionString, actualTenantUser.tenantId);
      console.log(`[DeveloperMode] GET selected tenant ${actualTenantUser.tenantId} (${targetTenant.organizationName}) for user mapping ${actualTenantUser.userId}`);
      targetUserId = actualTenantUser.userId;

      [userRecord] = await targetTenantDb
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (!userRecord) {
        return res.status(404).json({ ok: false, error: "User not found in tenant database" });
      }
    }

    const assignments = await buildUserFeatureSnapshot(targetTenantDb, targetUserId, actualTenantUser?.tenantId || req.user?.tenantId);
    res.json({ ok: true, user: userRecord, features: assignments });
  } catch (error) {
    console.error("Failed to load user feature assignments", error);
    res.status(500).json({ ok: false, error: "Failed to load user feature assignments" });
  }
});

developerModeRouter.put("/users/:userId/features", requireSuperAdmin, async (req: AuthRequest, res) => {
  let errorContextTargetTenantId: string | null = req.user?.tenantId ?? null;
  let errorContextTargetUserId: string | null = (req.params as any)?.userId ?? null;
  let errorContextPayload: any = req.body?.features;

  try {
    const requestedTenantId = String((req.query as any)?.tenantId || '').trim();
    if (!req.tenantDb && !requestedTenantId) {
      return res.status(500).json({ ok: false, error: "Tenant database not available" });
    }

    const { userId } = req.params;
    errorContextTargetUserId = userId;
    const devUserId = req.user?.userId || 'unknown';
    const devTenantId = req.user?.tenantId || 'unknown';

    console.log(`[DeveloperMode] ========== PUT /users/:userId/features ==========`);
    console.log(`[DeveloperMode] Developer: userId=${devUserId}, tenantId=${devTenantId}`);
    console.log(`[DeveloperMode] Target user: userId=${userId}`);

    // FIRST: Support both UUID userId and email in path param
    // If param looks like an email or not a UUID, resolve via email
    const idParam = String(userId || '').trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const looksLikeEmail = idParam.includes('@');
    const looksLikeUuid = uuidRegex.test(idParam);

    let masterUserEntries = [] as any[];
    if (looksLikeEmail && !looksLikeUuid) {
      const emailLower = idParam.toLowerCase();
      console.log(`[DeveloperMode] Parameter is email; resolving from master by email: ${emailLower}`);
      masterUserEntries = await masterDb
        .select()
        .from(tenantUsers)
        .where(eq(tenantUsers.userEmail, emailLower));
    } else {
      // Default: path param is a UUID userId
      masterUserEntries = await masterDb
        .select()
        .from(tenantUsers)
        .where(eq(tenantUsers.userId, idParam));
    }

    console.log(`[DeveloperMode] Found ${masterUserEntries.length} master mapping(s) for param=${idParam}`);

    let userRecord: { id: string; email: string } | null = null;
    let userEmail: string | null = null;
    let allTenantUsers: any[] = [];

    // If found in master table, use that to get email and find all tenants
    if (masterUserEntries.length > 0) {
      const masterEntry = masterUserEntries[0];
      userEmail = masterEntry.userEmail.toLowerCase();
      console.log(`[DeveloperMode] Found user in master table: ${userEmail} (tenantId: ${masterEntry.tenantId})`);

      // Get all tenants for this email
      allTenantUsers = await masterDb
        .select()
        .from(tenantUsers)
        .where(eq(tenantUsers.userEmail, String(userEmail)));

      // Try to fetch userRecord from the tenant specified in master entry
      try {
        const masterTenant = await getTenantById(masterEntry.tenantId);
        if (masterTenant) {
          const masterTenantDb = getTenantDb(masterTenant.connectionString, masterEntry.tenantId);
          [userRecord] = await masterTenantDb
            .select({ id: users.id, email: users.email })
            .from(users)
            .where(eq(users.id, masterEntry.userId))
            .limit(1);
          if (userRecord) {
            console.log(`[DeveloperMode] ✅ Found userRecord from master tenant: ${userRecord.email}`);
          }
        }
      } catch (e) {
        console.warn(`[DeveloperMode] Could not fetch userRecord from master tenant:`, e);
      }
    } else {
      if (!req.tenantDb) {
        return res.status(404).json({ ok: false, error: "User not found (and tenant DB unavailable)" });
      }
      // Fallback: Try to find user in developer's tenant to get their email
      [userRecord] = await req.tenantDb
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userRecord) {
        console.error(`[DeveloperMode] ❌ User ${userId} NOT FOUND in dev's tenant OR master table`);
        return res.status(404).json({ ok: false, error: "User not found" });
      }

      userEmail = userRecord.email.toLowerCase();
      console.log(`[DeveloperMode] Found user in dev's tenant: ${userEmail} (id: ${userId})`);

      // Get all tenants for this email
      allTenantUsers = await masterDb
        .select()
        .from(tenantUsers)
        .where(eq(tenantUsers.userEmail, String(userEmail)));
    }

    if (!userEmail) {
      console.error(`[DeveloperMode] ❌ Could not determine user email for userId=${userId}`);
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    console.log(`[DeveloperMode] Found ${allTenantUsers.length} tenant(s) for ${userEmail}`);

    // Declare variables at function scope
    let targetTenantDb = req.tenantDb;
    let targetTenantId = devTenantId;
    let targetUserId = userId;
    errorContextTargetTenantId = targetTenantId;

    // If tenantId is explicitly requested, use it directly
    if (requestedTenantId) {
      const specified = allTenantUsers.find((tu: any) => tu.tenantId === requestedTenantId);
      if (!specified) {
        return res.status(404).json({ ok: false, error: `User not found in tenant ${requestedTenantId}` });
      }

      const targetTenant = await getTenantById(specified.tenantId);
      if (!targetTenant) {
        return res.status(404).json({ ok: false, error: "Tenant not found" });
      }

      targetTenantDb = getTenantDb(targetTenant.connectionString, specified.tenantId);
      targetTenantId = specified.tenantId;
      targetUserId = specified.userId;
      errorContextTargetTenantId = targetTenantId;
      errorContextTargetUserId = targetUserId;

      // Verify user exists in that tenant DB
      [userRecord] = await targetTenantDb
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (!userRecord) {
        console.warn(`[DeveloperMode] ⚠️ Mapping userId ${targetUserId} not found in tenant ${targetTenantId}. Attempting lookup by email...`);
        const fallbackEmail = (userEmail || specified.userEmail || '').toLowerCase();
        if (fallbackEmail) {
          const [fallbackUser] = await targetTenantDb
            .select({ id: users.id, email: users.email })
            .from(users)
            .where(eq(users.email, fallbackEmail))
            .limit(1);
          if (fallbackUser) {
            userRecord = fallbackUser;
            targetUserId = fallbackUser.id;
            console.log(`[DeveloperMode] ✅ Resolved user by email ${fallbackEmail} in tenant ${targetTenantId}. Updating master mapping...`);
            try {
              await masterPool.query(
                `INSERT INTO tenant_users (tenant_id, user_email, user_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (tenant_id, user_email)
                 DO UPDATE SET user_id = EXCLUDED.user_id`,
                [targetTenantId, fallbackEmail, fallbackUser.id]
              );
            } catch (mapErr: any) {
              console.warn('[DeveloperMode] ⚠️ Failed to update master mapping after fallback:', mapErr?.message || mapErr);
            }
          }
        }

        if (!userRecord) {
          console.error(`[DeveloperMode] ❌ User ${targetUserId} / ${fallbackEmail || 'unknown email'} NOT FOUND in tenant ${targetTenantId}`);
          return res.status(404).json({ ok: false, error: "User not found in tenant database" });
        }
      }

      const featurePayload: DeveloperModeFeaturePayload[] = Array.isArray((req.body as any)?.features)
        ? (req.body as any).features
        : [];

      if (featurePayload.length === 0) {
        let catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);
        if (catalog.length === 0) {
          await ensureFeaturePermissionsForKeys(targetTenantDb, [], targetTenantId);
          catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);
          if (catalog.length === 0) {
            console.warn('[DeveloperMode] Feature catalog still empty after ensureFeaturePermissionsForKeys');
            return res.json({ ok: true, user: userRecord, features: [] });
          }
        }

        // Delete existing feature overrides using raw SQL
        try {
          const pool = (targetTenantDb as any).client as import('pg').Pool;
          const safeUserId = String(targetUserId).replace(/'/g, "''");
          await pool.query(`
            DELETE FROM user_feature_access
            WHERE user_id = '${safeUserId}'
          `);
        } catch (deleteErr: any) {
          const errorMsg = String(deleteErr?.message || deleteErr || '');
          if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('42P01')) {
            console.warn('[DeveloperMode] user_feature_access table does not exist, skipping delete');
          } else {
            throw deleteErr;
          }
        }

        const values = catalog.map((feature: any) => ({
          userId: targetUserId,
          featureId: feature.id,
          allowed: false,
        }));

        if (values.length > 0) {
          await targetTenantDb.insert(userFeatureAccess).values(values);
          console.log(`[DeveloperMode] Disabled all ${values.length} features for user ${targetUserId} in tenant ${targetTenantId}`);

          // Audit logging for bulk disable
          try {
            const developerEmail = req.user?.email || 'unknown@developer.local';
            const targetUserEmail = userRecord.email.toLowerCase();

            for (const feature of catalog) {
              await masterPool.query(
                `INSERT INTO developer_audit_logs (developer_email, target_user_email, feature_key, action)
                 VALUES ($1, $2, $3, 'disabled')`,
                [developerEmail, targetUserEmail, feature.featureKey]
              );
            }
            console.log(`[DeveloperMode] ✅ Logged ${catalog.length} audit entries (bulk disabled) for ${targetUserEmail}`);
          } catch (auditError: any) {
            console.error('[DeveloperMode] ⚠️ Failed to log audit entry:', auditError?.message || auditError);
          }
        }

        const assignments = await buildUserFeatureSnapshot(targetTenantDb, targetUserId, targetTenantId);
        return res.json({ ok: true, user: userRecord, features: assignments });
      }

      // Handle non-empty payload with explicit tenantId
      // Process the feature payload similar to the main path
      let catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);
      if (catalog.length === 0) {
        await ensureFeaturePermissionsForKeys(targetTenantDb, featurePayload.map((item) => item?.featureKey || ''), targetTenantId);
        catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);
        if (catalog.length === 0) {
          return res.status(500).json({ ok: false, error: "Failed to prepare feature catalog for tenant" });
        }
      }

      let catalogByKey = new Map<string, any>();
      catalog.forEach((feature: any) => catalogByKey.set(String(feature.featureKey || '').toLowerCase(), feature));

      const missingKeys = Array.from(new Set(
        featurePayload
          .map((item) => (item?.featureKey || '').trim().toLowerCase())
          .filter((key) => key.length > 0)
      )).filter((key) => !catalogByKey.has(key));

      if (missingKeys.length > 0) {
        await ensureFeaturePermissionsForKeys(targetTenantDb, missingKeys, targetTenantId);
        catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);
        catalogByKey = new Map<string, any>();
        catalog.forEach((feature: any) => catalogByKey.set(String(feature.featureKey || '').toLowerCase(), feature));
      }

      const values: { userId: string; featureId: string; allowed: boolean }[] = [];
      for (const item of featurePayload) {
        if (!item || typeof item.featureKey !== "string") {
          return res.status(400).json({ ok: false, error: "Each entry must include a featureKey string" });
        }
        if (typeof item.allowed !== "boolean") {
          return res.status(400).json({ ok: false, error: "Each entry must include a boolean allowed flag" });
        }
        const normalizedKey = item.featureKey.trim().toLowerCase();
        const feature = catalogByKey.get(normalizedKey);
        if (!feature) {
          return res.status(400).json({ ok: false, error: `Unknown feature key after ensure: ${item.featureKey}` });
        }
        // Validate that feature.id is a valid UUID format
        const featureId = String(feature.id || '').trim();
        if (!featureId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(featureId)) {
          console.error(`[DeveloperMode] Invalid feature ID format for ${item.featureKey}: ${featureId}`);
          return res.status(500).json({ ok: false, error: `Invalid feature ID format for ${item.featureKey}. Please ensure feature_permissions table uses UUID id column.` });
        }
        values.push({ userId: targetUserId, featureId, allowed: item.allowed });
      }

      // Delete existing feature overrides using raw SQL to avoid parameterized query issues
      try {
        const tenant = await getTenantById(targetTenantId);
        if (!tenant || !tenant.connectionString) {
          throw new Error(`Cannot get pool for tenant ${targetTenantId}: tenant not found or missing connection string`);
        }
        const pool = getTenantPool(tenant.connectionString, targetTenantId);
        const safeUserId = String(targetUserId).replace(/'/g, "''");
        console.log(`[DeveloperMode] Deleting existing feature overrides for user ${targetUserId} in tenant ${targetTenantId}`);
        await pool.query(`
          DELETE FROM user_feature_access
          WHERE user_id = '${safeUserId}'
        `);
        console.log(`[DeveloperMode] Successfully deleted existing feature overrides`);
      } catch (deleteErr: any) {
        const errorMsg = String(deleteErr?.message || deleteErr || '');
        const errorCode = (deleteErr?.cause && typeof deleteErr.cause === 'object') ? (deleteErr.cause as any).code : undefined;
        console.error(`[DeveloperMode] Error deleting feature overrides:`, {
          message: errorMsg,
          code: errorCode,
          userId: targetUserId,
          tenantId: targetTenantId,
          fullError: deleteErr
        });
        if (errorCode === '42P01' || errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
          console.warn('[DeveloperMode] user_feature_access table does not exist, skipping delete');
        } else {
          console.error('[DeveloperMode] Unexpected error during delete, re-throwing:', deleteErr);
          throw deleteErr;
        }
      }

      // If values.length === 0, all features are disabled - clear feature_access entries too
      if (values.length === 0) {
        try {
          const tenant = await getTenantById(targetTenantId);
          if (tenant && tenant.connectionString) {
            const pool = getTenantPool(tenant.connectionString, targetTenantId);
            const hasFa = await pool.query(`SELECT 1 FROM feature_access LIMIT 1`).then(() => true).catch(() => false);
            if (hasFa) {
              const safeUserId = String(targetUserId).replace(/'/g, "''");
              await pool.query(`DELETE FROM feature_access WHERE user_id = '${safeUserId}'`);
              console.log(`[DeveloperMode] Cleared all feature_access entries for user ${targetUserId} (all features disabled)`);
            }
          }
        } catch (clearErr: any) {
          console.warn(`[DeveloperMode] ⚠️ Could not clear feature_access:`, clearErr?.message || clearErr);
        }
      }

      if (values.length > 0) {
        // Check if user_feature_access table exists before trying to insert
        let hasUfa = false;
        try {
          const tenant = await getTenantById(targetTenantId);
          if (tenant && tenant.connectionString) {
            const pool = getTenantPool(tenant.connectionString, targetTenantId);
            const tableCheck = await pool.query(`
              SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema='public' AND table_name='user_feature_access'
              ) AS exists
            `);
            hasUfa = Boolean(tableCheck.rows?.[0]?.exists);
          }
        } catch (checkErr: any) {
          console.warn(`[DeveloperMode] Could not check user_feature_access table:`, checkErr?.message || checkErr);
        }

        // Only insert into user_feature_access if table exists
        if (hasUfa) {
          try {
            console.log(`[DeveloperMode] Inserting ${values.length} feature overrides into user_feature_access for user ${targetUserId}`);
            await targetTenantDb.insert(userFeatureAccess).values(values);
            console.log(`[DeveloperMode] Successfully inserted feature overrides into user_feature_access`);
          } catch (insertErr: any) {
            const errorMsg = String(insertErr?.message || insertErr || '');
            const errorCode = (insertErr?.cause && typeof insertErr.cause === 'object') ? (insertErr.cause as any).code : undefined;
            if (errorCode === '42P01' || errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
              console.warn(`[DeveloperMode] user_feature_access table does not exist, skipping insert (will use feature_access only)`);
              hasUfa = false; // Mark as not available for future operations
            } else {
              console.error(`[DeveloperMode] Error inserting feature overrides:`, {
                message: errorMsg,
                code: errorCode,
                userId: targetUserId,
                tenantId: targetTenantId,
                valuesCount: values.length,
                fullError: insertErr
              });
              // Don't throw - continue to feature_access write
            }
          }
        } else {
          console.log(`[DeveloperMode] user_feature_access table does not exist, skipping insert (will use feature_access only)`);
        }

        // CRITICAL: Always write to feature_access table (primary schema)
        // This ensures the save works even if user_feature_access doesn't exist
        try {
          const tenant = await getTenantById(targetTenantId);
          if (!tenant || !tenant.connectionString) {
            console.warn(`[DeveloperMode] Cannot get pool for feature_access: tenant ${targetTenantId} not found`);
          } else {
            const pool = getTenantPool(tenant.connectionString, targetTenantId);

            // Ensure feature_access table exists
            try {
              await pool.query(`
                CREATE TABLE IF NOT EXISTS feature_access (
                  user_id UUID NOT NULL,
                  feature_key TEXT NOT NULL,
                  allowed BOOLEAN NOT NULL DEFAULT false,
                  updated_at TIMESTAMP DEFAULT NOW(),
                  PRIMARY KEY (user_id, feature_key)
                )
              `);
            } catch (createErr: any) {
              // Table might already exist, that's fine
              if (!createErr?.message?.includes('already exists')) {
                console.warn(`[DeveloperMode] Could not create feature_access table:`, createErr?.message || createErr);
              }
            }

            const safeUserId = String(targetUserId).replace(/'/g, "''");

            // Write all features to feature_access
            for (const val of values) {
              const feature = catalog.find((c: any) => c.id === val.featureId);
              if (feature?.featureKey) {
                const safeFk = String(feature.featureKey).replace(/'/g, "''");
                try {
                  await pool.query(`
                    INSERT INTO feature_access (user_id, feature_key, allowed, updated_at)
                    VALUES ('${safeUserId}', '${safeFk}', ${val.allowed ? 'true' : 'false'}, now())
                    ON CONFLICT (user_id, feature_key)
                    DO UPDATE SET allowed = EXCLUDED.allowed, updated_at = EXCLUDED.updated_at
                  `);
                } catch (insertErr: any) {
                  console.warn(`[DeveloperMode] Failed to insert ${safeFk} into feature_access:`, insertErr?.message || insertErr);
                }
              }
            }
            console.log(`[DeveloperMode] ✅ Successfully wrote ${values.length} features to feature_access table`);
          }
        } catch (mirrorErr: any) {
          console.error(`[DeveloperMode] ⚠️ CRITICAL: Could not write to feature_access:`, mirrorErr?.message || mirrorErr);
          // If we can't write to feature_access, we have a serious problem
          // But don't throw - let the request continue and return success
          // The error is logged so we know about it
        }
      }

      console.log(`[DeveloperMode] Building user feature snapshot for user ${targetUserId}`);
      let assignments;
      try {
        assignments = await buildUserFeatureSnapshot(targetTenantDb, targetUserId, targetTenantId);
        console.log(`[DeveloperMode] Successfully built snapshot: ${assignments.length} features`);
      } catch (snapshotErr: any) {
        console.error(`[DeveloperMode] Error building user feature snapshot:`, {
          message: snapshotErr?.message || snapshotErr,
          userId: targetUserId,
          tenantId: targetTenantId,
          fullError: snapshotErr
        });
        throw snapshotErr;
      }

      return res.json({ ok: true, user: userRecord, features: assignments });
    }

    // Log all tenants for debugging
    allTenantUsers.forEach((tu: any, idx: number) => {
      console.log(`[DeveloperMode]   Tenant ${idx + 1}: tenantId=${tu.tenantId}, userId=${tu.userId}, isDevTenant=${tu.tenantId === devTenantId}`);
    });

    // Find the tenant that's NOT the dev's tenant (that's the actual user)
    // If multiple tenants exist, prefer the one that matches the organization name pattern
    // (e.g., if email is jay@gmail.com, prefer tenant named "Jay")
    const nonDevTenants = allTenantUsers.filter((tu: any) => tu.tenantId !== devTenantId);

    console.log(`[DeveloperMode] Found ${nonDevTenants.length} non-dev tenant(s) for ${userEmail}`);

    let actualTenantUser = nonDevTenants.length > 0 ? nonDevTenants[0] : undefined;

    // If multiple non-dev tenants, try to find the one that matches the email domain or username
    if (nonDevTenants.length > 1) {
      // Get tenant info to check organization names
      for (const tu of nonDevTenants) {
        try {
          const tenantInfo = await getTenantById(tu.tenantId);
          if (tenantInfo) {
            const orgNameLower = tenantInfo.organizationName?.toLowerCase() || '';
            const emailUsername = userEmail.split('@')[0].toLowerCase();

            console.log(`[DeveloperMode] Checking tenant ${tu.tenantId}: orgName="${orgNameLower}", emailUsername="${emailUsername}"`);

            // If organization name matches the email username, use this tenant
            if (orgNameLower.includes(emailUsername) || emailUsername.includes(orgNameLower.replace(/\s+/g, ''))) {
              console.log(`[DeveloperMode] ✅ Matched tenant by organization name: ${tenantInfo.organizationName}`);
              actualTenantUser = tu;
              break;
            }
          }
        } catch (e) {
          console.warn(`[DeveloperMode] Failed to get tenant info for ${tu.tenantId}:`, e);
        }
      }

      // If no match found, use the first non-dev tenant
      if (!actualTenantUser && nonDevTenants.length > 0) {
        actualTenantUser = nonDevTenants[0];
        console.log(`[DeveloperMode] Using first non-dev tenant: ${actualTenantUser.tenantId}`);
      }
    }

    // If user exists in a different tenant, use that tenant instead
    // OR if we found user via master table, use that entry
    if (actualTenantUser || (masterUserEntries.length > 0 && !userRecord)) {
      // Use actualTenantUser if found, otherwise use the first master entry
      const tenantUserEntry = actualTenantUser || masterUserEntries[0];

      console.log(`[DeveloperMode] ✅ User ${userEmail} found in tenant: ${tenantUserEntry.tenantId}`);
      targetTenantId = tenantUserEntry.tenantId;

      console.log(`[DeveloperMode] ✅ Found user in master database:`);
      console.log(`[DeveloperMode]   Email: ${tenantUserEntry.userEmail}`);
      console.log(`[DeveloperMode]   Tenant ID: ${targetTenantId}`);
      console.log(`[DeveloperMode]   User ID in tenant DB: ${tenantUserEntry.userId}`);

      // Get tenant info and connect to that tenant's database
      const targetTenant = await getTenantById(targetTenantId);
      if (!targetTenant) {
        console.error(`[DeveloperMode] ❌ Tenant ${targetTenantId} not found`);
        return res.status(404).json({ ok: false, error: "Tenant not found" });
      }

      console.log(`[DeveloperMode] ✅ Found tenant: ${targetTenant.organizationName}`);

      // Connect to target tenant's database
      targetTenantDb = getTenantDb(targetTenant.connectionString, targetTenantId);

      // Get user record from target tenant
      [userRecord] = await targetTenantDb
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, tenantUserEntry.userId))
        .limit(1);

      if (!userRecord) {
        console.error(`[DeveloperMode] ❌ User ${tenantUserEntry.userId} NOT FOUND in tenant ${targetTenantId}`);
        return res.status(404).json({ ok: false, error: "User not found in tenant database" });
      }

      targetUserId = tenantUserEntry.userId; // Use the user ID from the tenant database
      errorContextTargetTenantId = targetTenantId;
      errorContextTargetUserId = targetUserId;
      console.log(`[DeveloperMode] ✅ Found user in target tenant: ${userRecord.email} (id: ${targetUserId})`);
      console.log(`[DeveloperMode] ✅ Saving permissions to CORRECT tenant: ${targetTenantId} (${targetTenant.organizationName})`);
    } else {
      // User only exists in dev's tenant - ensure we have userRecord
      if (!userRecord) {
        // Final fallback: try to get user from dev's tenant
        [userRecord] = await req.tenantDb
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!userRecord) {
          console.error(`[DeveloperMode] ❌ User ${userId} NOT FOUND anywhere`);
          return res.status(404).json({ ok: false, error: "User not found" });
        }
      }
      console.log(`[DeveloperMode] ✅ User only exists in dev's tenant: ${userRecord.email} (id: ${userRecord.id})`);
      console.log(`[DeveloperMode] Saving permissions to dev's tenant: ${devTenantId}`);
    }

    const payload: DeveloperModeFeaturePayload[] = Array.isArray(req.body?.features)
      ? req.body.features
      : [];
    errorContextPayload = payload;

    // CRITICAL: If payload is empty, it means ALL features are disabled
    // We need to explicitly save ALL features with allowed: false
    if (payload.length === 0) {
      // Get all features from catalog (from target tenant)
      let catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);

      if (catalog.length === 0) {
        await ensureFeaturePermissionsForKeys(targetTenantDb, [], targetTenantId);
        catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);
        if (catalog.length === 0) {
          console.warn('[DeveloperMode] No feature catalog available even after ensureFeaturePermissionsForKeys');
          return res.json({ ok: true, user: userRecord, features: [] });
        }
      }

      // Delete all existing overrides first (from target tenant) using raw SQL
      try {
        const safeUserId = String(targetUserId).replace(/'/g, "''");
        await targetTenantDb.execute(`
          DELETE FROM user_feature_access
          WHERE user_id = '${safeUserId}'
        `);
      } catch (deleteErr: any) {
        const errorMsg = String(deleteErr?.message || deleteErr || '');
        if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('42P01')) {
          console.warn('[DeveloperMode] user_feature_access table does not exist, skipping delete');
        } else {
          throw deleteErr;
        }
      }

      // Insert ALL features with allowed: false
      const values = catalog.map((feature: any) => ({
        userId: targetUserId,
        featureId: feature.id,
        allowed: false, // Explicitly disable all features
      }));

      if (values.length > 0) {
        await targetTenantDb.insert(userFeatureAccess).values(values);
        console.log(`[DeveloperMode] Disabled all ${values.length} features for user ${targetUserId} in tenant ${targetTenantId}`);

        // CRITICAL: Also write to feature_access table (new schema) if it exists
        try {
          const hasFa = await targetTenantDb.execute(`SELECT 1 FROM feature_access LIMIT 1`).then(() => true).catch(() => false);
          if (hasFa) {
            console.log(`[DeveloperMode] Mirroring ${catalog.length} disabled features to feature_access table...`);
            const safeUserId = String(targetUserId).replace(/'/g, "''");
            for (const feature of catalog) {
              const safeFk = String(feature.featureKey).replace(/'/g, "''");
              const tenant = await getTenantById(targetTenantId);
              if (tenant && tenant.connectionString) {
                const pool = getTenantPool(tenant.connectionString, targetTenantId);
                await pool.query(`
                  INSERT INTO feature_access (user_id, feature_key, allowed, updated_at)
                  VALUES ('${safeUserId}', '${safeFk}', false, now())
                  ON CONFLICT (user_id, feature_key)
                  DO UPDATE SET allowed = false, updated_at = EXCLUDED.updated_at
                `);
              }
            }
            console.log(`[DeveloperMode] ✅ Mirrored disabled features to feature_access table`);
          }
        } catch (mirrorErr: any) {
          console.warn(`[DeveloperMode] ⚠️ Could not mirror to feature_access:`, mirrorErr?.message || mirrorErr);
        }

        // Audit logging for bulk disable
        try {
          const developerEmail = req.user?.email || 'unknown@developer.local';
          const targetUserEmail = userRecord.email.toLowerCase();

          for (const feature of catalog) {
            await masterPool.query(
              `INSERT INTO developer_audit_logs (developer_email, target_user_email, feature_key, action)
               VALUES ($1, $2, $3, 'disabled')`,
              [developerEmail, targetUserEmail, feature.featureKey]
            );
          }
          console.log(`[DeveloperMode] ✅ Logged ${catalog.length} audit entries (bulk disabled) for ${targetUserEmail}`);
        } catch (auditError: any) {
          console.error('[DeveloperMode] ⚠️ Failed to log audit entry:', auditError?.message || auditError);
        }
      }

      const assignments = await buildUserFeatureSnapshot(targetTenantDb, targetUserId, targetTenantId);
      return res.json({ ok: true, user: userRecord, features: assignments });
    }

    // Get catalog from target tenant
    let catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);

    if (catalog.length === 0) {
      await ensureFeaturePermissionsForKeys(targetTenantDb, payload.map((item) => item?.featureKey || ''), targetTenantId);
      catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);
      if (catalog.length === 0) {
        return res.status(500).json({ ok: false, error: "Failed to prepare feature catalog for tenant" });
      }
    }

    let catalogByKey = new Map<string, any>();
    catalog.forEach((feature: any) => {
      catalogByKey.set(String(feature.featureKey || '').toLowerCase(), feature);
    });

    const missingKeys = Array.from(new Set(
      payload
        .map((item) => (item?.featureKey || '').trim().toLowerCase())
        .filter((key) => key.length > 0)
    )).filter((key) => !catalogByKey.has(key));

    if (missingKeys.length > 0) {
      await ensureFeaturePermissionsForKeys(targetTenantDb, missingKeys, targetTenantId);
      catalog = await loadFeatureCatalog(targetTenantDb, targetTenantId);
      catalogByKey = new Map<string, any>();
      catalog.forEach((feature: any) => catalogByKey.set(String(feature.featureKey || '').toLowerCase(), feature));
    }

    const values: { userId: string; featureId: string; allowed: boolean }[] = [];

    for (const item of payload) {
      if (!item || typeof item.featureKey !== "string") {
        return res.status(400).json({ ok: false, error: "Each entry must include a featureKey string" });
      }

      if (typeof item.allowed !== "boolean") {
        return res.status(400).json({ ok: false, error: "Each entry must include a boolean allowed flag" });
      }

      const normalizedKey = item.featureKey.trim().toLowerCase();
      const feature = catalogByKey.get(normalizedKey);

      if (!feature) {
        return res.status(400).json({ ok: false, error: `Unknown feature key: ${item.featureKey}` });
      }

      values.push({
        userId: targetUserId, // Use target user ID
        featureId: feature.id,
        allowed: item.allowed,
      });
    }

    // Delete all existing overrides for this user first (from target tenant) using raw SQL
    try {
      const safeUserId = String(targetUserId).replace(/'/g, "''");
      await targetTenantDb.execute(`
        DELETE FROM user_feature_access
        WHERE user_id = '${safeUserId}'
      `);
    } catch (deleteErr: any) {
      const errorMsg = String(deleteErr?.message || deleteErr || '');
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('42P01')) {
        console.warn('[DeveloperMode] user_feature_access table does not exist, skipping delete');
      } else {
        throw deleteErr;
      }
    }

    console.log(`[DeveloperMode] Deleted existing overrides for user ${targetUserId} in tenant ${targetTenantId}`);

    if (values.length > 0) {
      await targetTenantDb.insert(userFeatureAccess).values(values);
      console.log(`[DeveloperMode] ✅ Inserted ${values.length} feature overrides for user ${targetUserId} (${userRecord.email}) in tenant ${targetTenantId}`);

      // CRITICAL: Also write to feature_access table (new schema) if it exists
      try {
        const hasFa = await targetTenantDb.execute(`SELECT 1 FROM feature_access LIMIT 1`).then(() => true).catch(() => false);
        if (hasFa) {
          console.log(`[DeveloperMode] Mirroring ${values.length} features to feature_access table...`);
          for (const val of values) {
            // Find feature key from catalog
            const feature = catalog.find((c: any) => c.id === val.featureId);
            if (feature?.featureKey) {
              const safeFk = String(feature.featureKey).replace(/'/g, "''");
              const safeUserId = String(targetUserId).replace(/'/g, "''");
              const tenant = await getTenantById(targetTenantId);
              if (tenant && tenant.connectionString) {
                const pool = getTenantPool(tenant.connectionString, targetTenantId);
                await pool.query(`
                  INSERT INTO feature_access (user_id, feature_key, allowed, updated_at)
                  VALUES ('${safeUserId}', '${safeFk}', ${val.allowed ? 'true' : 'false'}, now())
                  ON CONFLICT (user_id, feature_key)
                  DO UPDATE SET allowed = EXCLUDED.allowed, updated_at = EXCLUDED.updated_at
                `);
              }
            }
          }
          console.log(`[DeveloperMode] ✅ Mirrored features to feature_access table`);
        }
      } catch (mirrorErr: any) {
        console.warn(`[DeveloperMode] ⚠️ Could not mirror to feature_access:`, mirrorErr?.message || mirrorErr);
      }

      // Log how many are enabled vs disabled
      const enabledCount = values.filter(v => v.allowed).length;
      const disabledCount = values.filter(v => !v.allowed).length;
      console.log(`[DeveloperMode] User ${targetUserId} (${userRecord.email}): ${enabledCount} enabled, ${disabledCount} disabled`);

      // Check dashboard specifically
      const dashboardValue = values.find(v => {
        const feature = catalog.find((c: any) => c.featureKey?.toLowerCase() === 'dashboard');
        return feature && v.featureId === feature.id;
      });
      if (dashboardValue) {
        console.log(`[DeveloperMode] 🔍 Dashboard override saved: allowed=${dashboardValue.allowed}`);
      }
    } else {
      console.warn(`[DeveloperMode] WARNING: No values to insert for user ${targetUserId} - payload was empty`);
    }

    const assignments = await buildUserFeatureSnapshot(targetTenantDb, targetUserId, targetTenantId);

    // Log the assignments that will be returned
    const assignmentEnabledCount = assignments.filter((a: any) => a.allowed).length;
    const assignmentDisabledCount = assignments.filter((a: any) => !a.allowed).length;
    console.log(`[DeveloperMode] buildUserFeatureSnapshot for ${targetUserId} (${userRecord.email}): ${assignments.length} total, ${assignmentEnabledCount} enabled, ${assignmentDisabledCount} disabled`);

    // Check dashboard in response
    const dashboardInResponse = assignments.find((a: any) => a.featureKey?.toLowerCase() === 'dashboard');
    if (dashboardInResponse) {
      console.log(`[DeveloperMode] 🔍 Dashboard in response: allowed=${dashboardInResponse.allowed}`);
    }

    console.log(`[DeveloperMode] ===========================================`);

    // Audit logging: Log all feature changes to master database
    try {
      const developerEmail = req.user?.email || 'unknown@developer.local';
      const targetUserEmail = userRecord.email.toLowerCase();

      // Log each feature change
      for (const item of payload) {
        const action = item.allowed ? 'enabled' : 'disabled';
        await masterPool.query(
          `INSERT INTO developer_audit_logs (developer_email, target_user_email, feature_key, action)
           VALUES ($1, $2, $3, $4)`,
          [developerEmail, targetUserEmail, item.featureKey, action]
        );
      }

      console.log(`[DeveloperMode] ✅ Logged ${payload.length} audit entries for ${targetUserEmail}`);
    } catch (auditError: any) {
      // Don't fail the request if audit logging fails, but log the error
      console.error('[DeveloperMode] ⚠️ Failed to log audit entry:', auditError?.message || auditError);
    }

    res.json({ ok: true, user: userRecord, features: assignments });
  } catch (error: any) {
    console.error("Failed to update user feature assignments", {
      message: error?.message || String(error),
      stack: error?.stack,
      targetTenantId: errorContextTargetTenantId ?? 'unknown',
      targetUserId: errorContextTargetUserId ?? 'unknown',
      payload: errorContextPayload,
    });
    res.status(500).json({
      ok: false,
      error: "Failed to update user feature assignments",
      details: error?.message || String(error),
    });
  }
});

// ========================================
// User Management Endpoints
// ========================================

// Delete user (cross-tenant, hard delete)
developerModeRouter.delete("/users/:email", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String(req.params.email || '').trim().toLowerCase();
    const developerEmail = req.user?.email || 'unknown@developer.local';

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    // Prevent deleting dev account
    if (userEmail === 'dev@developer.local') {
      return res.status(400).json({ ok: false, error: 'Cannot delete developer account' });
    }

    console.log(`[DeveloperMode] DELETE /users/${userEmail} - Starting deletion...`);

    // Find user in master tenant_users table
    const tenantUserRecords = await masterDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    if (tenantUserRecords.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found in any tenant' });
    }

    // Delete from each tenant the user belongs to
    const deletionResults: Array<{ tenantId: string; status: string; error?: string }> = [];
    for (const tenantUser of tenantUserRecords) {
      try {
        const tenant = await getTenantById(tenantUser.tenantId);
        if (!tenant) {
          console.warn(`[DeveloperMode] Tenant ${tenantUser.tenantId} not found, skipping`);
          continue;
        }

        const targetTenantDb = getTenantDb(tenant.connectionString, tenantUser.tenantId);

        // Check if user exists in tenant DB
        const [userRecord] = await targetTenantDb
          .select({ id: users.id, email: users.email })
          .from(users)
          .where(eq(users.id, tenantUser.userId))
          .limit(1);

        if (userRecord) {
          // Delete user roles first (cascade should handle this, but doing explicitly)
          await targetTenantDb
            .delete(userRoles)
            .where(eq(userRoles.userId, tenantUser.userId));

          // Delete user feature access (use Pool directly for parameterized query)
          const { Pool } = await import('pg');
          const tenantPool = new Pool({
            connectionString: tenant.connectionString,
            ssl: { rejectUnauthorized: false },
            max: 1,
          });
          try {
            await tenantPool.query(
              `DELETE FROM user_feature_access WHERE user_id = $1`,
              [tenantUser.userId]
            );
          } finally {
            await tenantPool.end();
          }

          // Delete user record
          await targetTenantDb
            .delete(users)
            .where(eq(users.id, tenantUser.userId));

          deletionResults.push({ tenantId: tenantUser.tenantId, status: 'deleted' });
          console.log(`[DeveloperMode] ✅ Deleted user from tenant ${tenantUser.tenantId}`);
        }
      } catch (err: any) {
        console.error(`[DeveloperMode] Failed to delete from tenant ${tenantUser.tenantId}:`, err?.message || err);
        deletionResults.push({ tenantId: tenantUser.tenantId, status: 'error', error: err?.message });
      }
    }

    // Delete from master tenant_users table
    await masterDb
      .delete(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    // Delete retention policy if exists
    await masterPool.query(
      `DELETE FROM user_retention_policies WHERE user_email = $1`,
      [userEmail]
    );

    // Log to audit
    await masterPool.query(
      `INSERT INTO developer_audit_logs (developer_email, target_user_email, action, created_at)
       VALUES ($1, $2, 'user_deleted', NOW())`,
      [developerEmail, userEmail]
    );

    console.log(`[DeveloperMode] ✅ User ${userEmail} deleted from ${deletionResults.filter(r => r.status === 'deleted').length} tenant(s)`);

    res.json({
      ok: true,
      message: `User ${userEmail} deleted successfully`,
      deletedFromTenants: deletionResults.filter(r => r.status === 'deleted').length,
      results: deletionResults,
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to delete user:', msg);
    res.status(500).json({ ok: false, error: 'Failed to delete user', details: msg });
  }
});

// Reset user password (generate temporary password)
developerModeRouter.post("/users/:email/reset-password", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String(req.params.email || '').trim().toLowerCase();
    const developerEmail = req.user?.email || 'unknown@developer.local';

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    // Prevent resetting dev account password
    if (userEmail === 'dev@developer.local') {
      return res.status(400).json({ ok: false, error: 'Cannot reset developer account password' });
    }

    console.log(`[DeveloperMode] POST /users/${userEmail}/reset-password - Resetting password...`);

    // Find user in master tenant_users
    const tenantUserRecords = await masterDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    if (tenantUserRecords.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found in any tenant' });
    }

    // Generate secure random password (8-12 chars, alphanumeric)
    const generatePassword = () => {
      const length = 10;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const tempPassword = generatePassword();
    const { hashPassword } = await import('../auth.js');
    const hashedPassword = await hashPassword(tempPassword);

    // Update password in all tenants user belongs to
    for (const tenantUser of tenantUserRecords) {
      try {
        const tenant = await getTenantById(tenantUser.tenantId);
        if (!tenant) continue;

        const targetTenantDb = getTenantDb(tenant.connectionString, tenantUser.tenantId);

        // Use Pool directly for parameterized query
        const { Pool } = await import('pg');
        const tenantPool = new Pool({
          connectionString: tenant.connectionString,
          ssl: { rejectUnauthorized: false },
          max: 1,
        });
        try {
          await tenantPool.query(
            `UPDATE users SET password_hash = $1 WHERE id = $2`,
            [hashedPassword, tenantUser.userId]
          );
        } finally {
          await tenantPool.end();
        }

        console.log(`[DeveloperMode] ✅ Password reset in tenant ${tenantUser.tenantId}`);
      } catch (err: any) {
        console.error(`[DeveloperMode] Failed to reset password in tenant ${tenantUser.tenantId}:`, err?.message);
      }
    }

    // Log to audit
    await masterPool.query(
      `INSERT INTO developer_audit_logs (developer_email, target_user_email, action, created_at)
       VALUES ($1, $2, 'password_reset', NOW())`,
      [developerEmail, userEmail]
    );

    console.log(`[DeveloperMode] ✅ Password reset for ${userEmail}`);

    res.json({
      ok: true,
      message: 'Password reset successfully',
      temporaryPassword: tempPassword, // Show only once
      userEmail: userEmail,
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to reset password:', msg);
    res.status(500).json({ ok: false, error: 'Failed to reset password', details: msg });
  }
});

// Change user password (set new password directly)
developerModeRouter.put("/users/:email/password", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String(req.params.email || '').trim().toLowerCase();
    const { newPassword } = req.body;
    const developerEmail = req.user?.email || 'unknown@developer.local';

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: 'New password is required and must be at least 6 characters' });
    }

    // Prevent changing dev account password
    if (userEmail === 'dev@developer.local') {
      return res.status(400).json({ ok: false, error: 'Cannot change developer account password' });
    }

    console.log(`[DeveloperMode] PUT /users/${userEmail}/password - Changing password...`);

    // Find user in master tenant_users
    const tenantUserRecords = await masterDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    if (tenantUserRecords.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found in any tenant' });
    }

    console.log(`[DeveloperMode] User ${userEmail} exists in ${tenantUserRecords.length} tenant(s)`);
    tenantUserRecords.forEach((tu: any, index: number) => {
      console.log(`[DeveloperMode]   Tenant ${index + 1}: ${tu.tenantId}`);
    });

    const { hashPassword } = await import('../auth.js');
    const hashedPassword = await hashPassword(newPassword);

    // Update password in all tenants in parallel with per-tenant timeout
    // Use very aggressive timeouts to ensure response before frontend timeout
    const results: Array<{ tenantId: string; success: boolean; error?: string }> = [];
    const TENANT_TIMEOUT_MS = 5000; // 5 seconds per tenant (reduced from 8s)
    const OVERALL_TIMEOUT_MS = 8000; // 8 seconds overall (reduced from 12s to respond before frontend 20s timeout)

    console.log(`[DeveloperMode] Updating password for ${tenantUserRecords.length} tenant(s) in parallel...`);

    const updatePromises = tenantUserRecords.map(async (tenantUser: any) => {
      const tenantId = tenantUser.tenantId;
      const startTime = Date.now();

      try {
        // Set a per-tenant timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout after ${TENANT_TIMEOUT_MS}ms`)), TENANT_TIMEOUT_MS);
        });

        const updatePromise = (async () => {
          const tenant = await getTenantById(tenantId);
          if (!tenant) {
            throw new Error('Tenant not found');
          }

          // Use raw pg Pool instead of Drizzle for parameterized UPDATE
          const { Pool } = await import('pg');
          const tenantPool = new Pool({
            connectionString: tenant.connectionString,
            ssl: { rejectUnauthorized: false },
            max: 1, // Single connection for this operation
          });

          try {
            await tenantPool.query(
              `UPDATE users SET password_hash = $1 WHERE id = $2`,
              [hashedPassword, tenantUser.userId]
            );

            const duration = Date.now() - startTime;
            console.log(`[DeveloperMode] ✅ Password changed in tenant ${tenantId} (${duration}ms)`);
            return { tenantId, success: true };
          } finally {
            await tenantPool.end();
          }
        })();

        // Race between update and timeout
        const result = await Promise.race([updatePromise, timeoutPromise]);
        return result;
      } catch (err: any) {
        const duration = Date.now() - startTime;
        const errorMsg = err?.message || String(err || 'Unknown error');
        console.error(`[DeveloperMode] ❌ Failed to change password in tenant ${tenantId} (${duration}ms):`, errorMsg);
        return { tenantId, success: false, error: errorMsg };
      }
    });

    // Wait for all tenant updates (with timeouts) to complete
    // Set an overall timeout of 12 seconds to prevent gateway timeouts (server has 30s timeout, frontend has 20s)

    try {
      // Use Promise.allSettled with a timeout wrapper
      const timeoutWrapper = new Promise((resolve) => {
        setTimeout(() => resolve('TIMEOUT'), OVERALL_TIMEOUT_MS);
      });

      const raceResult = await Promise.race([
        Promise.allSettled(updatePromises),
        timeoutWrapper,
      ]);

      if (raceResult === 'TIMEOUT') {
        console.warn(`[DeveloperMode] ⚠️  Overall timeout (${OVERALL_TIMEOUT_MS}ms) reached. Responding with timeout status...`);
        // Immediately return timeout response - don't wait for partial results
        // This ensures we respond before the frontend timeout (20s) and server timeout (30s)
        const successCount = results.filter(r => r.success).length;
        return res.status(504).json({
          ok: false,
          error: 'Request timed out',
          message: `Password change operation timed out after ${OVERALL_TIMEOUT_MS}ms. ${successCount > 0 ? `Partially completed: ${successCount} tenant(s) updated.` : 'No tenants were updated.'}`,
          userEmail: userEmail,
          updatedInTenants: successCount,
          totalTenants: tenantUserRecords.length,
          timeout: true,
        });
      } else if (Array.isArray(raceResult)) {
        raceResult.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            const tenantId = tenantUserRecords[index]?.tenantId || 'unknown';
            results.push({ tenantId, success: false, error: result.reason?.message || 'Promise rejected' });
            console.error(`[DeveloperMode] ❌ Tenant update promise rejected for ${tenantId}:`, result.reason);
          }
        });
      }
    } catch (error: any) {
      console.error(`[DeveloperMode] ❌ Error during tenant updates:`, error?.message || error);
      // Ensure we have at least some results
      if (results.length === 0) {
        tenantUserRecords.forEach((tu: any) => {
          results.push({ tenantId: tu.tenantId, success: false, error: error?.message || 'Unknown error' });
        });
      }
    }

    // Check if at least one tenant was updated successfully
    const successCount = results.filter(r => r.success).length;
    if (successCount === 0) {
      const errorDetails = results.map(r => `Tenant ${r.tenantId}: ${r.error || 'Unknown error'}`).join('; ');
      console.error(`[DeveloperMode] ❌ Failed to change password in all tenants: ${errorDetails}`);
      return res.status(500).json({
        ok: false,
        error: 'Failed to change password in all tenants',
        details: errorDetails
      });
    }

    // Log to audit (only if at least one tenant succeeded)
    try {
      await masterPool.query(
        `INSERT INTO developer_audit_logs (developer_email, target_user_email, action, created_at)
         VALUES ($1, $2, 'password_changed', NOW())`,
        [developerEmail, userEmail]
      );
    } catch (auditErr: any) {
      console.error(`[DeveloperMode] ⚠️  Failed to log audit entry (non-critical):`, auditErr?.message);
      // Don't fail the request if audit logging fails
    }

    console.log(`[DeveloperMode] ✅ Password changed for ${userEmail} in ${successCount} of ${results.length} tenant(s)`);

    res.json({
      ok: true,
      message: `Password changed successfully in ${successCount} tenant(s)`,
      userEmail: userEmail,
      updatedInTenants: successCount,
      totalTenants: results.length,
      ...(successCount < results.length ? { warnings: results.filter(r => !r.success).map(r => `Tenant ${r.tenantId}: ${r.error}`) } : {}),
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to change password:', msg);
    res.status(500).json({ ok: false, error: 'Failed to change password', details: msg });
  }
});

// Suspend/Activate user account
developerModeRouter.put("/users/:email/status", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String(req.params.email || '').trim().toLowerCase();
    const { status } = req.body; // 'active' | 'suspended' | 'deleted'
    const developerEmail = req.user?.email || 'unknown@developer.local';

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    if (!status || !['active', 'suspended', 'deleted'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'Valid status is required: active, suspended, or deleted' });
    }

    // Prevent modifying dev account
    if (userEmail === 'dev@developer.local') {
      return res.status(400).json({ ok: false, error: 'Cannot modify developer account status' });
    }

    console.log(`[DeveloperMode] PUT /users/${userEmail}/status - Setting status to ${status}...`);

    // Find user in master tenant_users
    const tenantUserRecords = await masterDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    if (tenantUserRecords.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found in any tenant' });
    }

    // Update status in all tenants
    for (const tenantUser of tenantUserRecords) {
      try {
        const tenant = await getTenantById(tenantUser.tenantId);
        if (!tenant) continue;

        const targetTenantDb = getTenantDb(tenant.connectionString, tenantUser.tenantId);

        // Update user status (use Pool directly for parameterized query)
        const { Pool } = await import('pg');
        const tenantPool = new Pool({
          connectionString: tenant.connectionString,
          ssl: { rejectUnauthorized: false },
          max: 1,
        });
        try {
          await tenantPool.query(
            `UPDATE users SET status = $1 WHERE id = $2`,
            [status, tenantUser.userId]
          );
        } finally {
          await tenantPool.end();
        }

        console.log(`[DeveloperMode] ✅ Status updated to ${status} in tenant ${tenantUser.tenantId}`);
      } catch (err: any) {
        console.error(`[DeveloperMode] Failed to update status in tenant ${tenantUser.tenantId}:`, err?.message);
      }
    }

    // Log to audit
    await masterPool.query(
      `INSERT INTO developer_audit_logs (developer_email, target_user_email, action, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [developerEmail, userEmail, `status_set_to_${status}`]
    );

    console.log(`[DeveloperMode] ✅ Status set to ${status} for ${userEmail}`);

    res.json({
      ok: true,
      message: `User status updated to ${status}`,
      userEmail: userEmail,
      status: status,
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to update user status:', msg);
    res.status(500).json({ ok: false, error: 'Failed to update user status', details: msg });
  }
});

// Force logout user (invalidate all tokens)
developerModeRouter.post("/users/:email/force-logout", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String(req.params.email || '').trim().toLowerCase();
    const developerEmail = req.user?.email || 'unknown@developer.local';

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    // Prevent forcing logout of dev account
    if (userEmail === 'dev@developer.local') {
      return res.status(400).json({ ok: false, error: 'Cannot force logout developer account' });
    }

    console.log(`[DeveloperMode] POST /users/${userEmail}/force-logout - Forcing logout...`);

    // Find user in master tenant_users to get tenant info
    const tenantUserRecords = await masterDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    if (tenantUserRecords.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found in any tenant' });
    }

    // Since we use stateless JWT tokens, we need to invalidate by storing token signatures
    // We'll use a simple approach: store user_email + current timestamp in blacklist
    // This forces re-authentication for any new requests
    // Note: Existing tokens will still work until they expire, but new logins will be required

    // For now, we'll blacklist the user's email with a far-future expiry
    // In a real implementation, you'd extract JWT signatures from cookies/sessions
    // For this implementation, we'll store a marker that indicates all tokens for this user should be invalid

    // Store invalidation marker in invalidated_tokens table
    // Use a special token_signature format: `user_logout_${userEmail}_${timestamp}`
    const invalidationMarker = `user_logout_${userEmail}_${Date.now()}`;
    const maxExpiry = new Date();
    maxExpiry.setFullYear(maxExpiry.getFullYear() + 10); // 10 years in future (effectively forever)

    await masterPool.query(
      `INSERT INTO invalidated_tokens (token_signature, user_email, tenant_id, expires_at, reason, invalidated_at)
       VALUES ($1, $2, $3, $4, 'force_logout', NOW())`,
      [invalidationMarker, userEmail, tenantUserRecords[0].tenantId, maxExpiry]
    );

    // Log to audit
    await masterPool.query(
      `INSERT INTO developer_audit_logs (developer_email, target_user_email, action, created_at)
       VALUES ($1, $2, 'force_logout', NOW())`,
      [developerEmail, userEmail]
    );

    console.log(`[DeveloperMode] ✅ Force logout initiated for ${userEmail}`);

    res.json({
      ok: true,
      message: 'User logout forced successfully. User will need to login again.',
      userEmail: userEmail,
      note: 'Existing tokens remain valid until expiry. User must login again for new sessions.',
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to force logout:', msg);
    res.status(500).json({ ok: false, error: 'Failed to force logout', details: msg });
  }
});

// ========================================
// Data Retention & Backup Endpoints
// ========================================

// Set retention policy for a user
developerModeRouter.put("/users/:email/retention-policy", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String(req.params.email || '').trim().toLowerCase();
    const { retentionDays } = req.body; // null = forever, or 1, 7, 15, 30, 90, 180, 365, 730, 1825
    const developerEmail = req.user?.email || 'unknown@developer.local';

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    // Validate retentionDays
    const validDays = [1, 7, 15, 30, 90, 180, 365, 730, 1825];
    if (retentionDays !== null && (!Number.isInteger(retentionDays) || !validDays.includes(retentionDays))) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid retention period. Valid values: 1, 7, 15, 30, 90, 180, 365, 730, 1825, or null (forever)'
      });
    }

    console.log(`[DeveloperMode] PUT /users/${userEmail}/retention-policy - Setting retention to ${retentionDays === null ? 'forever' : retentionDays + ' days'}...`);

    // Find user in master tenant_users to get tenant info
    const tenantUserRecords = await masterDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    if (tenantUserRecords.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found in any tenant' });
    }

    // Use the first tenant (or primary tenant) for the policy
    const primaryTenant = tenantUserRecords[0];

    // Calculate expires_at
    let expiresAt: Date | null = null;
    if (retentionDays !== null) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + retentionDays);
    }

    // Upsert retention policy
    await masterPool.query(
      `INSERT INTO user_retention_policies (user_email, tenant_id, retention_period_days, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (user_email, tenant_id) 
       DO UPDATE SET 
         retention_period_days = EXCLUDED.retention_period_days,
         expires_at = EXCLUDED.expires_at,
         updated_at = NOW()`,
      [userEmail, primaryTenant.tenantId, retentionDays, expiresAt]
    );

    // Log to audit
    await masterPool.query(
      `INSERT INTO developer_audit_logs (developer_email, target_user_email, action, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [developerEmail, userEmail, `retention_policy_set_${retentionDays === null ? 'forever' : retentionDays + '_days'}`]
    );

    console.log(`[DeveloperMode] ✅ Retention policy set for ${userEmail}`);

    res.json({
      ok: true,
      message: `Retention policy set to ${retentionDays === null ? 'forever' : retentionDays + ' days'}`,
      userEmail: userEmail,
      retentionDays: retentionDays,
      expiresAt: expiresAt?.toISOString() || null,
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to set retention policy:', msg);
    res.status(500).json({ ok: false, error: 'Failed to set retention policy', details: msg });
  }
});

// Get retention policy for a user
developerModeRouter.get("/users/:email/retention-policy", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String(req.params.email || '').trim().toLowerCase();

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    const result = await masterPool.query(
      `SELECT 
        retention_period_days,
        expires_at,
        created_at,
        updated_at
       FROM user_retention_policies
       WHERE user_email = $1
       LIMIT 1`,
      [userEmail]
    );

    if (result.rows.length === 0) {
      return res.json({
        ok: true,
        policy: null,
        message: 'No retention policy set for this user',
      });
    }

    const policy = result.rows[0];
    const expiresAt = policy.expires_at ? new Date(policy.expires_at) : null;
    const daysRemaining = expiresAt && expiresAt > new Date()
      ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      ok: true,
      policy: {
        retentionDays: policy.retention_period_days,
        expiresAt: expiresAt?.toISOString() || null,
        daysRemaining: daysRemaining,
        createdAt: policy.created_at,
        updatedAt: policy.updated_at,
      },
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to get retention policy:', msg);
    res.status(500).json({ ok: false, error: 'Failed to get retention policy', details: msg });
  }
});

// Get retention status for all users
developerModeRouter.get("/retention-status", requireSuperAdmin, async (_req: AuthRequest, res) => {
  try {
    const result = await masterPool.query(`
      SELECT 
        urp.user_email,
        urp.retention_period_days,
        urp.expires_at,
        CASE 
          WHEN urp.expires_at IS NULL THEN 'forever'
          WHEN urp.expires_at < NOW() THEN 'expired'
          WHEN urp.expires_at < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
          ELSE 'active'
        END as status
      FROM user_retention_policies urp
      ORDER BY 
        CASE 
          WHEN urp.expires_at IS NULL THEN 1
          WHEN urp.expires_at < NOW() THEN 2
          WHEN urp.expires_at < NOW() + INTERVAL '7 days' THEN 3
          ELSE 4
        END,
        urp.expires_at ASC
    `);

    const policies = result.rows.map((row: any) => {
      const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
      const daysRemaining = expiresAt && expiresAt > new Date()
        ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        userEmail: row.user_email,
        retentionDays: row.retention_period_days,
        expiresAt: expiresAt?.toISOString() || null,
        daysRemaining: daysRemaining,
        status: row.status,
      };
    });

    res.json({
      ok: true,
      policies: policies,
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to get retention status:', msg);
    res.status(500).json({ ok: false, error: 'Failed to get retention status', details: msg });
  }
});

// Helper function to export all user-related data
async function exportUserData(userEmail: string, tenantId: string, dateRange?: { fromDate?: string; toDate?: string }): Promise<any> {
  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const tenantDb = getTenantDb(tenant.connectionString, tenantId);

    // Find user in tenant database
    const tenantUserRecords = await masterDb
      .select()
      .from(tenantUsers)
      .where(and(
        eq(tenantUsers.userEmail, userEmail),
        eq(tenantUsers.tenantId, tenantId)
      ));

    if (tenantUserRecords.length === 0) {
      throw new Error('User not found in tenant');
    }

    const userId = tenantUserRecords[0].userId;

    // Get user record
    const [user] = await tenantDb
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found in tenant database');
    }

    // Build date filter for date range queries
    let dateFilter = '';
    const dateParams: any[] = [];
    if (dateRange?.fromDate || dateRange?.toDate) {
      const conditions: string[] = [];
      if (dateRange.fromDate) {
        conditions.push(`created_at >= $${dateParams.length + 1}`);
        dateParams.push(dateRange.fromDate);
      }
      if (dateRange.toDate) {
        conditions.push(`created_at <= $${dateParams.length + 1}`);
        dateParams.push(dateRange.toDate + ' 23:59:59'); // End of day
      }
      dateFilter = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    }

    const userData: any = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
      roles: [],
      featurePermissions: [],
      activityLogs: [],
      userLogs: [],
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'developer-mode',
        dateRange: dateRange || null,
        tenantId: tenantId,
        tenantName: tenant.organizationName,
      },
    };

    // Get user roles
    try {
      const roles = await tenantDb
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
      userData.roles = roles;
    } catch (err: any) {
      console.warn('[Export] Failed to export roles:', err.message);
    }

    // Get feature permissions
    try {
      const featureAccess = await tenantDb
        .select()
        .from(userFeatureAccess)
        .where(eq(userFeatureAccess.userId, userId));
      userData.featurePermissions = featureAccess;
    } catch (err: any) {
      console.warn('[Export] Failed to export feature permissions:', err.message);
    }

    // Get activity logs (if table exists and has user_id column)
    try {
      let activityLogsQuery = `SELECT * FROM activity_logs WHERE user_id = $1`;
      const activityParams = [userId];

      if (dateFilter && dateRange) {
        // Add date filter if provided
        activityLogsQuery += dateFilter.replace('created_at', 'created_at').replace('$1', `$${activityParams.length + 1}`);
        if (dateRange.fromDate) activityParams.push(dateRange.fromDate);
        if (dateRange.toDate) activityParams.push(dateRange.toDate + ' 23:59:59');
      }

      // Use Pool directly for dynamic parameterized query
      const { Pool } = await import('pg');
      const tenantPool = new Pool({
        connectionString: tenant.connectionString,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });
      try {
        const activityResult = await tenantPool.query(activityLogsQuery, activityParams);
        userData.activityLogs = activityResult.rows || [];
      } finally {
        await tenantPool.end();
      }
    } catch (err: any) {
      // Table might not exist or have different structure
      console.warn('[Export] Failed to export activity logs:', err.message);
    }

    // Get user logs (if table exists)
    try {
      let userLogsQuery = `SELECT * FROM user_logs WHERE user_id = $1`;
      const userLogsParams = [userId];

      if (dateFilter && dateRange) {
        userLogsQuery += dateFilter.replace('created_at', 'created_at').replace('$1', `$${userLogsParams.length + 1}`);
        if (dateRange.fromDate) userLogsParams.push(dateRange.fromDate);
        if (dateRange.toDate) userLogsParams.push(dateRange.toDate + ' 23:59:59');
      }

      // Use Pool directly for dynamic parameterized query
      const { Pool } = await import('pg');
      const tenantPool = new Pool({
        connectionString: tenant.connectionString,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });
      try {
        const userLogsResult = await tenantPool.query(userLogsQuery, userLogsParams);
        userData.userLogs = userLogsResult.rows || [];
      } finally {
        await tenantPool.end();
      }
    } catch (err: any) {
      console.warn('[Export] Failed to export user logs:', err.message);
    }

    // Note: Add more tables here if needed (transactions, orders, etc.)
    // For now, we export the core user data and logs

    return userData;
  } catch (error: any) {
    console.error('[Export] Failed to export user data:', error);
    throw error;
  }
}

// Create backup of user data
developerModeRouter.post("/users/:email/backup", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String(req.params.email || '').trim().toLowerCase();
    const { backupAllData, fromDate, toDate } = req.body;
    const developerEmail = req.user?.email || 'unknown@developer.local';

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    console.log(`[DeveloperMode] POST /users/${userEmail}/backup - Creating backup...`);

    // Find user in master tenant_users
    const tenantUserRecords = await masterDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    if (tenantUserRecords.length === 0) {
      return res.status(404).json({ ok: false, error: 'User not found in any tenant' });
    }

    // Use primary tenant for backup
    const primaryTenant = tenantUserRecords[0];

    // Determine date range
    let dateRange: { fromDate?: string; toDate?: string } | undefined;
    if (!backupAllData && (fromDate || toDate)) {
      dateRange = {
        fromDate: fromDate || undefined,
        toDate: toDate || new Date().toISOString().split('T')[0], // Default to today
      };
    }

    // Export user data
    const userData = await exportUserData(userEmail, primaryTenant.tenantId, dateRange);

    // Calculate backup size (approximate JSON size)
    const backupJson = JSON.stringify(userData, null, 2);
    const fileSizeBytes = Buffer.byteLength(backupJson, 'utf8');

    // Get retention policy ID if exists
    const retentionPolicyResult = await masterPool.query(
      `SELECT id FROM user_retention_policies WHERE user_email = $1 AND tenant_id = $2 LIMIT 1`,
      [userEmail, primaryTenant.tenantId]
    );
    const retentionPolicyId = retentionPolicyResult.rows[0]?.id || null;

    // Save backup to database
    const backupResult = await masterPool.query(
      `INSERT INTO user_data_backups (
        user_email, tenant_id, backup_type, 
        backup_all_data, date_range_start, date_range_end,
        backup_data, file_size_bytes, retention_policy_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at`,
      [
        userEmail,
        primaryTenant.tenantId,
        'manual',
        backupAllData !== false, // Default to true if not specified
        dateRange?.fromDate || null,
        dateRange?.toDate || null,
        backupJson, // Store as JSONB
        fileSizeBytes,
        retentionPolicyId,
        developerEmail,
      ]
    );

    const backupId = backupResult.rows[0].id;
    const createdAt = backupResult.rows[0].created_at;

    // Log to audit
    await masterPool.query(
      `INSERT INTO developer_audit_logs (developer_email, target_user_email, action, created_at)
       VALUES ($1, $2, 'backup_created', NOW())`,
      [developerEmail, userEmail]
    );

    console.log(`[DeveloperMode] ✅ Backup created for ${userEmail} (ID: ${backupId}, Size: ${(fileSizeBytes / 1024).toFixed(2)} KB)`);

    res.json({
      ok: true,
      message: 'Backup created successfully',
      backupId: backupId,
      userEmail: userEmail,
      fileSizeBytes: fileSizeBytes,
      createdAt: createdAt,
      dateRange: dateRange || null,
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to create backup:', msg);
    res.status(500).json({ ok: false, error: 'Failed to create backup', details: msg });
  }
});

// List backups for a user
developerModeRouter.get("/users/:email/backups", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userEmail = String(req.params.email || '').trim().toLowerCase();

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: 'User email is required' });
    }

    const result = await masterPool.query(
      `SELECT 
        id,
        backup_type,
        backup_all_data,
        date_range_start,
        date_range_end,
        file_size_bytes,
        created_at,
        created_by
       FROM user_data_backups
       WHERE user_email = $1
       ORDER BY created_at DESC`,
      [userEmail]
    );

    const backups = result.rows.map((row: any) => ({
      id: row.id,
      backupType: row.backup_type,
      backupAllData: row.backup_all_data,
      dateRangeStart: row.date_range_start,
      dateRangeEnd: row.date_range_end,
      fileSizeBytes: row.file_size_bytes,
      fileSizeKB: row.file_size_bytes ? (row.file_size_bytes / 1024).toFixed(2) : '0',
      createdAt: row.created_at,
      createdBy: row.created_by,
    }));

    res.json({
      ok: true,
      backups: backups,
    });
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to list backups:', msg);
    res.status(500).json({ ok: false, error: 'Failed to list backups', details: msg });
  }
});

// Download backup file
developerModeRouter.get("/backups/:backupId/download", requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const backupId = String(req.params.backupId || '').trim();

    if (!backupId) {
      return res.status(400).json({ ok: false, error: 'Backup ID is required' });
    }

    const result = await masterPool.query(
      `SELECT 
        id,
        user_email,
        backup_data,
        backup_all_data,
        date_range_start,
        date_range_end,
        created_at
       FROM user_data_backups
       WHERE id = $1
       LIMIT 1`,
      [backupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Backup not found' });
    }

    const backup = result.rows[0];
    const backupData = backup.backup_data;
    const userEmail = backup.user_email;

    // Convert JSONB to JSON string
    const jsonString = typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);

    // Generate filename
    const dateStr = new Date(backup.created_at).toISOString().split('T')[0];
    const rangeStr = backup.backup_all_data
      ? 'all_data'
      : `${backup.date_range_start || 'start'}_to_${backup.date_range_end || 'end'}`;
    const filename = `${userEmail.replace('@', '_')}_backup_${rangeStr}_${dateStr}.json`;

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(jsonString, 'utf8'));

    res.send(jsonString);
  } catch (error: any) {
    const msg = String(error?.message || error || 'Unknown error');
    console.error('[DeveloperMode] Failed to download backup:', msg);
    res.status(500).json({ ok: false, error: 'Failed to download backup', details: msg });
  }
});


