// Quick script to initialize master DB tables directly
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function quickInit() {
  console.log('\n🚀 Creating master tables...\n');
  
  try {
    // Create tenants table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_db_name TEXT NOT NULL UNIQUE,
        organization_name TEXT NOT NULL,
        super_admin_user_id UUID,
        super_admin_email TEXT NOT NULL UNIQUE,
        connection_string TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created tenants table');

    // Create tenant_users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tenant_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, user_email)
      );
    `);
    console.log('✅ Created tenant_users table');

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tenants_super_admin_email ON tenants(super_admin_email);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(user_email);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);`);
    console.log('✅ Created indexes');

    // Create trigger function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✅ Created trigger function');

    // Create trigger
    await db.execute(sql`DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;`);
    await db.execute(sql`
      CREATE TRIGGER update_tenants_updated_at
        BEFORE UPDATE ON tenants
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Created trigger');

    console.log('\n🎉 Master database initialization complete!\n');
    console.log('You can now register organizations.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickInit();
