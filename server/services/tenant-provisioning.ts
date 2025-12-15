import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { randomBytes } from 'crypto';
import * as schema from '../../shared/schema.js';
import { tenants, tenantUsers } from '../../shared/schema.js';
import { db as masterDb } from '../db.js';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Retry mechanism with exponential backoff for database operations
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode === '42P01' || errorCode === '42703') { // Table/column doesn't exist
          throw error;
        }
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TenantProvisioningResult {
  success: boolean;
  tenantId?: string;
  tenantDbName?: string;
  connectionString?: string;
  error?: string;
}

export interface CreateTenantParams {
  organizationName: string;
  superAdminEmail: string;
  superAdminUserId?: string;
}

/**
 * Generates a unique database name for a new tenant
 */
function generateTenantDbName(): string {
  const randomId = randomBytes(6).toString('hex');
  return `petropal_tenant_${randomId}`;
}

/**
 * Parses DATABASE_URL and constructs connection string for tenant database
 */
function constructTenantConnectionString(baseUrl: string, tenantDbName: string): string {
  try {
    const url = new URL(baseUrl);
    
    // Replace the database name in the path
    const pathParts = url.pathname.split('/');
    pathParts[pathParts.length - 1] = tenantDbName;
    url.pathname = pathParts.join('/');
    
    return url.toString();
  } catch (error) {
    console.error('Failed to construct tenant connection string:', error);
    throw new Error('Invalid DATABASE_URL format');
  }
}

/**
 * Creates a new PostgreSQL database for a tenant
 */
async function createTenantDatabase(baseUrl: string, tenantDbName: string): Promise<boolean> {
  let adminPool: Pool | null = null;
  
  try {
    // Parse base URL to get postgres database connection
    const url = new URL(baseUrl);
    const pathParts = url.pathname.split('/');
    pathParts[pathParts.length - 1] = 'postgres'; // Connect to postgres database to create new DB
    url.pathname = pathParts.join('/');
    
    adminPool = new Pool({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000, // 30 seconds
      statement_timeout: 60000, // 60 seconds
      query_timeout: 60000, // 60 seconds
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Create the new database
    await adminPool.query(`CREATE DATABASE ${tenantDbName}`);
    console.log(`✅ Created database: ${tenantDbName}`);
    
    return true;
  } catch (error: any) {
    // Database might already exist
    if (error.code === '42P04') {
      console.log(`⚠️ Database ${tenantDbName} already exists, continuing...`);
      return true;
    }
    
    console.error('Failed to create tenant database:', error);
    return false;
  } finally {
    if (adminPool) {
      await adminPool.end();
    }
  }
}

/**
 * Runs database migrations on the tenant database
 * Creates schema using Drizzle's push functionality
 */
export async function runTenantMigrations(connectionString: string): Promise<boolean> {
  let pool: Pool | null = null;
  
  try {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000, // 30 seconds
      statement_timeout: 60000, // 60 seconds
      query_timeout: 60000, // 60 seconds
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Step 1: Create required extensions FIRST
    console.log(`🔧 Creating required extensions...`);
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    `);
    console.log(`✅ Extensions created successfully`);

    // Step 2: Try Drizzle migrations first
    try {
      console.log(`🔄 Attempting to run Drizzle migrations...`);
      const { migrate: drizzleMigrate } = await import('drizzle-orm/node-postgres/migrator');
      const tenantDb = drizzle({ client: pool, schema });
      
      const migrationsFolder = path.resolve(__dirname, '../../migrations');
      console.log(`📁 Migrations folder: ${migrationsFolder}`);
      await drizzleMigrate(tenantDb, { migrationsFolder });
      console.log(`✅ Drizzle migrations completed for tenant database`);
    } catch (migrationError: any) {
      // If Drizzle migrations are unavailable, attempt Supabase SQL migrations
      console.log(`ℹ️  Drizzle migrations unavailable: ${migrationError?.message}`);
      const repoRoot = path.resolve(__dirname, '../../');
      const supaMigrationsDir = path.join(repoRoot, 'supabase', 'migrations');
      console.log(`📂 Trying Supabase migrations at: ${supaMigrationsDir}`);

      try {
        await fsp.access(supaMigrationsDir, fs.constants.R_OK);
        const files = (await fsp.readdir(supaMigrationsDir))
          .filter(f => f.toLowerCase().endsWith('.sql'))
          .sort();

        if (files.length === 0) {
          throw new Error('No .sql migration files found');
        }

        for (const f of files) {
          const sqlPath = path.join(supaMigrationsDir, f);
          const sqlText = await fsp.readFile(sqlPath, 'utf8');
          console.log(`🧩 Applying migration: ${f}`);
          try {
            await pool.query('BEGIN');
            await pool.query(sqlText);
            await pool.query('COMMIT');
            console.log(`✅ Applied ${f}`);
          } catch (err: any) {
            const msg = String(err?.message || err);
            if (/already exists|duplicate column|column .* already exists|relation .* already exists/i.test(msg)) {
              await pool.query('ROLLBACK').catch(() => {});
              console.warn(`⚠️  Skipping ${f} (non-fatal): ${msg}`);
              continue;
            }
            await pool.query('ROLLBACK').catch(() => {});
            console.error(`❌ Failed applying ${f}: ${msg}`);
            throw err;
          }
        }

        console.log('✅ Supabase migrations applied for tenant');
      } catch (sqlMigErr: any) {
        console.log(`ℹ️  Supabase migrations not available or failed: ${sqlMigErr?.message}`);
        console.log(`🔨 Falling back to minimal schema (users, user_roles)...`);
        
        // Create essential tables with extensions already available
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            username TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
        
        // Create feature_access table if it doesn't exist (critical for feature management)
        await pool.query(`
          CREATE TABLE IF NOT EXISTS feature_access (
            user_id UUID NOT NULL,
            feature_key TEXT NOT NULL,
            allowed BOOLEAN NOT NULL DEFAULT true,
            updated_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (user_id, feature_key),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        
        console.log(`✅ Basic schema created for tenant database (including feature_access table)`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to run tenant migrations:', error);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

/**
 * Provisions a new tenant database and registers it in the master database
 */
export async function provisionTenant(params: CreateTenantParams): Promise<TenantProvisioningResult> {
  const { organizationName, superAdminEmail, superAdminUserId } = params;
  
  try {
    console.log(`🚀 Starting tenant provisioning for: ${organizationName}`);
    
    // Check if tenant already exists for this email
    const existingTenant = await masterDb
      .select()
      .from(tenants)
      .where(eq(tenants.superAdminEmail, superAdminEmail.toLowerCase()))
      .limit(1);
    
    if (existingTenant.length > 0) {
      return {
        success: false,
        error: 'A tenant already exists for this email address',
      };
    }
    
    // Get base database URL
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    // Generate unique database name
    const tenantDbName = generateTenantDbName();
    const connectionString = constructTenantConnectionString(baseUrl, tenantDbName);
    
    // Step 1: Create the database
    const dbCreated = await createTenantDatabase(baseUrl, tenantDbName);
    if (!dbCreated) {
      return {
        success: false,
        error: 'Failed to create tenant database',
      };
    }
    
    // Step 2: Run migrations on the new database
    const migrationsSuccess = await runTenantMigrations(connectionString);
    if (!migrationsSuccess) {
      return {
        success: false,
        error: 'Failed to run migrations on tenant database',
      };
    }
    
    // Step 3: Register tenant in master database
    const [newTenant] = await masterDb
      .insert(tenants)
      .values({
        tenantDbName,
        organizationName,
        superAdminEmail: superAdminEmail.toLowerCase(),
        superAdminUserId: superAdminUserId || null,
        connectionString,
        status: 'active',
      })
      .returning();
    
    console.log(`✅ Tenant provisioned successfully: ${tenantDbName}`);
    
    return {
      success: true,
      tenantId: newTenant.id,
      tenantDbName: newTenant.tenantDbName,
      connectionString: newTenant.connectionString,
    };
  } catch (error) {
    console.error('Tenant provisioning failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during provisioning',
    };
  }
}

/**
 * Updates the super admin user ID for a tenant after user creation
 */
export async function updateTenantSuperAdmin(tenantId: string, superAdminUserId: string): Promise<boolean> {
  try {
    await masterDb
      .update(tenants)
      .set({ 
        superAdminUserId,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
    
    return true;
  } catch (error) {
    console.error('Failed to update tenant super admin:', error);
    return false;
  }
}

/**
 * Registers a user in the tenant users mapping table
 */
export async function registerTenantUser(
  tenantId: string,
  userEmail: string,
  userId: string
): Promise<boolean> {
  try {
    // Use ON CONFLICT to handle duplicate registrations gracefully
    // This ensures users always appear in Developer Mode even if registration is called multiple times
    const sql = `
      INSERT INTO tenant_users (tenant_id, user_email, user_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (tenant_id, user_email)
      DO UPDATE SET 
        user_id = EXCLUDED.user_id,
        updated_at = COALESCE(EXCLUDED.updated_at, NOW())
    `;
    
    const { pool } = await import('../db.js');
    await pool.query(sql, [tenantId, userEmail.toLowerCase(), userId]);
    
    console.log(`✅ Registered tenant user: ${userEmail.toLowerCase()} in tenant ${tenantId}`);
    return true;
  } catch (error: any) {
    console.error('Failed to register tenant user:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
    });
    return false;
  }
}

/**
 * Gets tenant information by email
 */
export async function getTenantByEmail(email: string): Promise<typeof tenants.$inferSelect | null> {
  try {
    return await retryWithBackoff(async () => {
      const [tenant] = await masterDb
        .select()
        .from(tenants)
        .where(eq(tenants.superAdminEmail, email.toLowerCase()))
        .limit(1);
      
      return tenant || null;
    });
  } catch (error) {
    console.error('Failed to get tenant by email:', error);
    return null;
  }
}

/**
 * Gets tenant information by user email from tenant_users mapping
 */
export async function getTenantByUserEmail(email: string): Promise<typeof tenants.$inferSelect | null> {
  try {
    return await retryWithBackoff(async () => {
      const [mapping] = await masterDb
        .select({
          tenant: tenants,
        })
        .from(tenantUsers)
        .innerJoin(tenants, eq(tenantUsers.tenantId, tenants.id))
        .where(eq(tenantUsers.userEmail, email.toLowerCase()))
        .limit(1);
      
      return mapping?.tenant || null;
    });
  } catch (error) {
    console.error('Failed to get tenant by user email:', error);
    return null;
  }
}

/**
 * Gets tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<typeof tenants.$inferSelect | null> {
  try {
    return await retryWithBackoff(async () => {
      const [tenant] = await masterDb
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      
      return tenant || null;
    });
  } catch (error) {
    console.error('Failed to get tenant by ID:', error);
    return null;
  }
}

/**
 * Lists all active tenants
 */
export async function listActiveTenants(): Promise<typeof tenants.$inferSelect[]> {
  try {
    return await masterDb
      .select()
      .from(tenants)
      .where(eq(tenants.status, 'active'));
  } catch (error) {
    console.error('Failed to list active tenants:', error);
    return [];
  }
}
