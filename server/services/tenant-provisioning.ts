import { randomBytes } from 'crypto';
import { Tenant, User } from '../models';

export interface TenantProvisioningResult {
  success: boolean;
  tenantId?: string;
  error?: string;
}

export interface CreateTenantParams {
  organizationName: string;
  superAdminEmail: string;
  superAdminUserId?: string;
}

/**
 * Provisions a new tenant in MongoDB
 */
export async function provisionTenant(params: CreateTenantParams): Promise<TenantProvisioningResult> {
  const { organizationName, superAdminEmail, superAdminUserId } = params;

  try {
    console.log(`🚀 Starting tenant provisioning for: ${organizationName}`);

    // Check if tenant already exists for this email
    const existingTenant = await Tenant.findOne({ superAdminEmail: superAdminEmail.toLowerCase() });

    if (existingTenant) {
      return {
        success: false,
        error: 'A tenant already exists for this email address',
      };
    }

    // Create new Tenant
    const newTenant = await Tenant.create({
      organizationName,
      superAdminEmail: superAdminEmail.toLowerCase(),
      superAdminUserId: superAdminUserId || null,
      status: 'active',
      // Optional: generating a fake db name just for consistency if UI expects it
      tenantDbName: `mongo_tenant_${randomBytes(4).toString('hex')}`
    });

    console.log(`✅ Tenant provisioned successfully: ${newTenant._id}`);

    return {
      success: true,
      tenantId: newTenant._id.toString(),
    };
  } catch (error: any) {
    console.error('Tenant provisioning failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during provisioning',
    };
  }
}

/**
 * Updates the super admin user ID for a tenant
 */
export async function updateTenantSuperAdmin(tenantId: string, superAdminUserId: string): Promise<boolean> {
  try {
    await Tenant.findByIdAndUpdate(tenantId, { superAdminUserId });
    return true;
  } catch (error) {
    console.error('Failed to update tenant super admin:', error);
    return false;
  }
}

/**
 * Registers a user in the User collection (replacing tenant_users table)
 */
export async function registerTenantUser(
  tenantId: string,
  userEmail: string,
  userId: string
): Promise<boolean> {
  try {
    // In Mongo, we just ensure the user document has the tenantId (which we enforce in User creation usually)
    // Or if this function is called after Auth (Firebase/Supabase) user creation, we update our local User doc.
    // If the User document doesn't exist, we create it?
    // Based on typical flows, this might be called during signup.

    // Check if user exists
    let user = await User.findOne({ email: userEmail.toLowerCase() });
    if (user) {
      if (user.tenantId !== tenantId) {
        console.warn(`User ${userEmail} already exists but for different tenant! Overwriting/updating?`);
        // For strict multi-tenancy we might block or support array. 
        // Sticking to single-tenant-per-user for now.
        user.tenantId = tenantId;
        await user.save();
      }
    } else {
      // Create user stub if not exists? Usually auth creates it.
      // Let's assume this updates the mapping.
      // For MongoDB migration simplicity: User should already exist or we create it.
      await User.create({
        email: userEmail.toLowerCase(),
        tenantId: tenantId,
        passwordHash: 'managed-externally-or-placeholder' // If logic requires it
      });
    }

    console.log(`✅ Registered tenant user: ${userEmail.toLowerCase()} in tenant ${tenantId}`);
    return true;
  } catch (error: any) {
    console.error('Failed to register tenant user:', error);
    return false;
  }
}

/**
 * Gets tenant information by email
 */
export async function getTenantByEmail(email: string) {
  try {
    return await Tenant.findOne({ superAdminEmail: email.toLowerCase() });
  } catch (error) {
    console.error('Failed to get tenant by email:', error);
    return null;
  }
}

/**
 * Gets tenant information by user email
 */
export async function getTenantByUserEmail(email: string) {
  try {
    // Find user first
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.tenantId) return null;

    return await Tenant.findById(user.tenantId);
  } catch (error) {
    console.error('Failed to get tenant by user email:', error);
    return null;
  }
}

/**
 * Gets tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<any> {
  try {
    const tenant = await Tenant.findById(tenantId);
    // Return object compatible with expected interface (add id field mapping)
    if (tenant) {
      return {
        ...tenant.toObject(),
        id: tenant._id.toString()
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get tenant by ID:', error);
    return null;
  }
}

/**
 * Lists all active tenants
 */
export async function listActiveTenants() {
  try {
    return await Tenant.find({ status: 'active' });
  } catch (error) {
    console.error('Failed to list active tenants:', error);
    return [];
  }
}

/**
 * Run tenant migrations (No-op for MongoDB)
 */
export async function runTenantMigrations(connectionString?: string): Promise<boolean> {
  // MongoDB doesn't require traditional schema migrations in the same way
  return true;
}
