import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { listActiveTenants } from '../server/services/tenant-provisioning.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(process.cwd(), '.local.env') });

/**
 * Runs migrations on a specific tenant database
 */
async function migrateTenant(tenantId: string, connectionString: string, tenantName: string) {
  let pool: Pool | null = null;
  
  try {
    console.log(`\n📦 Migrating tenant: ${tenantName} (${tenantId})`);
    
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    const db = drizzle({ client: pool });
    
    // Run migrations
    const migrationsFolder = path.resolve(__dirname, '../migrations');
    await migrate(db, { migrationsFolder });
    
    console.log(`✅ Migrations completed for tenant: ${tenantName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to migrate tenant ${tenantName}:`, error);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

/**
 * Main function to migrate all tenant databases
 */
async function migrateAllTenants() {
  try {
    console.log('🚀 Starting migration for all tenant databases...\n');
    
    // Get all active tenants
    const tenants = await listActiveTenants();
    
    if (tenants.length === 0) {
      console.log('ℹ️ No active tenants found');
      return;
    }

    console.log(`Found ${tenants.length} active tenant(s)\n`);

    let successCount = 0;
    let failureCount = 0;

    // Migrate each tenant
    for (const tenant of tenants) {
      const success = await migrateTenant(
        tenant.id,
        tenant.connectionString,
        tenant.organizationName
      );
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary:');
    console.log(`Total tenants: ${tenants.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log('='.repeat(50));

    if (failureCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllTenants()
    .then(() => {
      console.log('\n✅ All migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateAllTenants, migrateTenant };
