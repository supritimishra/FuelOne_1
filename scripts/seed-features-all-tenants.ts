import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function seedAllTenants() {
  const masterPool = new Pool({ connectionString: masterDbUrl, ssl: { rejectUnauthorized: false } });
  try {
    const sqlPath = path.resolve(process.cwd(), 'migrations', '20251101_complete_feature_permissions_setup.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Migration SQL not found at ${sqlPath}`);
      process.exit(1);
    }
    const migrationSql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔧 Seeding feature permissions across all tenants (idempotent)...');

    const tenantsRes = await masterPool.query(`SELECT id, organization_name, connection_string FROM tenants ORDER BY organization_name`);
    const tenants = tenantsRes.rows;
    console.log(`📋 Tenants found: ${tenants.length}`);

    for (const tenant of tenants) {
      const { id: tenantId, organization_name: orgName, connection_string: conn } = tenant;
      console.log(`\n➡️ Seeding tenant: ${orgName} (${tenantId})`);

      const tenantPool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
      try {
        await tenantPool.query(migrationSql);
        console.log('   ✅ Feature permissions ensured (tables + data)');

        // Verify quickly
        const verify = await tenantPool.query(`SELECT COUNT(*)::int AS cnt FROM feature_permissions`);
        console.log(`   📊 feature_permissions rows: ${verify.rows[0]?.cnt ?? 0}`);
      } catch (e: any) {
        console.error(`   ❌ Failed to seed tenant ${tenantId}:`, e.message);
      } finally {
        await tenantPool.end();
      }
    }

    console.log('\n🎉 Done seeding all tenants.');
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await masterPool.end();
  }
}

seedAllTenants();
