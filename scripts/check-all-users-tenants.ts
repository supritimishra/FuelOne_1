import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function checkAllUsersTenants() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(`\n🔍 Checking all users and their tenants...\n`);

    // Get all users from tenant_users
    const tenantUsersResult = await pool.query(`
      SELECT 
        tu.user_email,
        tu.user_id,
        tu.tenant_id,
        t.organization_name,
        t.connection_string IS NOT NULL as has_connection
      FROM tenant_users tu
      LEFT JOIN tenants t ON tu.tenant_id = t.id
      ORDER BY tu.user_email
    `);

    console.log(`📋 Total users in tenant_users table: ${tenantUsersResult.rows.length}\n`);

    const usersByEmail = new Map<string, any[]>();
    tenantUsersResult.rows.forEach((row: any) => {
      const email = row.user_email.toLowerCase();
      if (!usersByEmail.has(email)) {
        usersByEmail.set(email, []);
      }
      usersByEmail.get(email)!.push(row);
    });

    // Check each user
    const usersToCheck = ['rakhyhalder96625@gmail.com', 'jay@gmail.com', 'rickh5054@gmail.com', 'dev@developer.local'];
    
    for (const email of usersToCheck) {
      const emailLower = email.toLowerCase();
      const entries = usersByEmail.get(emailLower) || [];
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 ${email}`);
      console.log(`${'='.repeat(60)}`);
      
      if (entries.length === 0) {
        console.log(`   ❌ NOT FOUND in tenant_users table`);
        continue;
      }

      entries.forEach((entry: any, idx: number) => {
        console.log(`\n   Tenant ${idx + 1}:`);
        console.log(`      Tenant ID: ${entry.tenant_id}`);
        console.log(`      Organization: ${entry.organization_name || 'N/A'}`);
        console.log(`      User ID in tenant: ${entry.user_id}`);
        console.log(`      Has connection: ${entry.has_connection ? '✅' : '❌'}`);
      });
    }

    // Check dev tenant
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔧 Developer (dev@developer.local) Tenant Info`);
    console.log(`${'='.repeat(60)}`);
    
    const devTenantUsers = usersByEmail.get('dev@developer.local') || [];
    if (devTenantUsers.length > 0) {
      const devTenant = devTenantUsers[0];
      console.log(`   Dev Tenant ID: ${devTenant.tenant_id}`);
      console.log(`   Dev Organization: ${devTenant.organization_name || 'N/A'}`);
      
      // Get all users in dev's tenant
      const devTenantUsersInTenant = tenantUsersResult.rows.filter((tu: any) => tu.tenant_id === devTenant.tenant_id);
      console.log(`\n   Users in DEV's tenant (${devTenant.organization_name}):`);
      devTenantUsersInTenant.forEach((tu: any) => {
        console.log(`      - ${tu.user_email} (id: ${tu.user_id})`);
      });
    } else {
      console.log(`   ❌ Dev user not found in tenant_users`);
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n   Users checked: ${usersToCheck.length}`);
    console.log(`   Rakhy: ${usersByEmail.has('rakhyhalder96625@gmail.com') ? '✅ Found' : '❌ Not found'}`);
    console.log(`   Jay: ${usersByEmail.has('jay@gmail.com') ? '✅ Found' : '❌ Not found'}`);
    console.log(`   Rick: ${usersByEmail.has('rickh5054@gmail.com') ? '✅ Found' : '❌ Not found'}`);
    console.log(`   Dev: ${usersByEmail.has('dev@developer.local') ? '✅ Found' : '❌ Not found'}`);

    // Check if Rakhy is in same tenant as dev
    if (devTenantUsers.length > 0 && usersByEmail.has('rakhyhalder96625@gmail.com')) {
      const rakhyEntries = usersByEmail.get('rakhyhalder96625@gmail.com')!;
      const devTenantId = devTenantUsers[0].tenant_id;
      const rakhyInDevTenant = rakhyEntries.find((e: any) => e.tenant_id === devTenantId);
      
      console.log(`\n   🔍 Cross-tenant analysis:`);
      if (rakhyInDevTenant) {
        console.log(`      ✅ Rakhy IS in dev's tenant - that's why it works!`);
      } else {
        console.log(`      ❌ Rakhy is NOT in dev's tenant`);
      }
      
      const jayEntries = usersByEmail.get('jay@gmail.com') || [];
      const jayInDevTenant = jayEntries.find((e: any) => e.tenant_id === devTenantId);
      if (jayInDevTenant) {
        console.log(`      ✅ Jay IS in dev's tenant`);
      } else {
        console.log(`      ❌ Jay is NOT in dev's tenant - cross-tenant save needed`);
      }
      
      const rickEntries = usersByEmail.get('rickh5054@gmail.com') || [];
      const rickInDevTenant = rickEntries.find((e: any) => e.tenant_id === devTenantId);
      if (rickInDevTenant) {
        console.log(`      ✅ Rick IS in dev's tenant`);
      } else {
        console.log(`      ❌ Rick is NOT in dev's tenant - cross-tenant save needed`);
      }
    }

    await pool.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkAllUsersTenants();

