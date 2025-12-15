import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function clearJayOverrides() {
  const masterPool = new Pool({ connectionString: masterDbUrl, ssl: { rejectUnauthorized: false } });
  try {
    const email = 'jay@gmail.com';
    console.log(`\n🧹 Clearing all feature overrides for ${email} across all tenants...`);

    const tuRes = await masterPool.query(
      `SELECT tu.user_id, tu.tenant_id, t.organization_name, t.connection_string
       FROM tenant_users tu
       JOIN tenants t ON t.id = tu.tenant_id
       WHERE LOWER(tu.user_email) = LOWER($1)`,
      [email]
    );

    if (tuRes.rows.length === 0) {
      console.log('No tenant_users records found for Jay. Nothing to clear.');
      return;
    }

    for (const row of tuRes.rows) {
      const tenantId: string = row.tenant_id;
      const userId: string = row.user_id;
      const org: string = row.organization_name || 'Unknown';
      const conn: string = row.connection_string;

      console.log(`\n➡️ Tenant: ${org} (${tenantId})`);
      console.log(`   User ID: ${userId}`);

      const tenantPool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
      try {
        const delRes = await tenantPool.query(
          `DELETE FROM user_feature_access WHERE user_id = $1`,
          [userId]
        );
        console.log(`   ✅ Deleted ${delRes.rowCount ?? 0} override(s)`);

        // Optional: show how many features will be enabled by default
        const countRes = await tenantPool.query(`SELECT COUNT(*)::int AS cnt, SUM(CASE WHEN default_enabled THEN 1 ELSE 0 END)::int AS defaults_on FROM feature_permissions`);
        const cnt = countRes.rows[0]?.cnt ?? 0;
        const defaultsOn = countRes.rows[0]?.defaults_on ?? 0;
        console.log(`   📋 Catalog features: ${cnt}, defaults enabled: ${defaultsOn}`);
      } finally {
        await tenantPool.end();
      }
    }

    console.log(`\n🎉 Done. Have Jay refresh the browser (Ctrl+Shift+R).`);
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await masterPool.end();
  }
}

clearJayOverrides();
