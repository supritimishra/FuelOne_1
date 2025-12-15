-- Multi-Tenant Master Database Schema
-- This should be run on the master database (DATABASE_URL)

-- Create tenants table
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

-- Create tenant_users mapping table
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, user_email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_super_admin_email ON tenants(super_admin_email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(user_email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);

-- Create updated_at trigger for tenants table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON tenants TO your_app_user;
-- GRANT SELECT, INSERT ON tenant_users TO your_app_user;

COMMENT ON TABLE tenants IS 'Master registry of all tenant databases';
COMMENT ON TABLE tenant_users IS 'Mapping of users to their respective tenants';
COMMENT ON COLUMN tenants.status IS 'Tenant status: active, suspended, deleted';
COMMENT ON COLUMN tenants.connection_string IS 'Connection string for the tenant''s isolated database';
