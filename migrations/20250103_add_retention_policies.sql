-- Migration: Add user retention policies and backup system tables to master database
-- This enables data retention policies and backup functionality in Developer Mode
-- Date: 2025-01-03

-- Create user_retention_policies table in master database
CREATE TABLE IF NOT EXISTS user_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  tenant_id uuid NOT NULL,
  retention_period_days integer, -- NULL = forever (never delete)
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  expires_at timestamp, -- NULL if retention_period_days is NULL (forever)
  UNIQUE(user_email, tenant_id)
);

-- Create user_data_backups table in master database
CREATE TABLE IF NOT EXISTS user_data_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  tenant_id uuid NOT NULL,
  backup_type text NOT NULL, -- 'manual', 'auto_before_deletion'
  date_range_start date, -- NULL if backup_all_data = true
  date_range_end date, -- NULL if backup_all_data = true
  backup_all_data boolean DEFAULT true,
  backup_data jsonb, -- Stores user data snapshot
  file_path text, -- Path to backup file if stored as file
  file_size_bytes integer,
  created_at timestamp DEFAULT now(),
  retention_policy_id uuid REFERENCES user_retention_policies(id) ON DELETE SET NULL,
  created_by text -- developer email who created the backup
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_retention_policies_user_email ON user_retention_policies(user_email);
CREATE INDEX IF NOT EXISTS idx_retention_policies_tenant_id ON user_retention_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_retention_policies_expires_at ON user_retention_policies(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_backups_user_email ON user_data_backups(user_email);
CREATE INDEX IF NOT EXISTS idx_backups_tenant_id ON user_data_backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON user_data_backups(created_at DESC);

-- Add comments to tables
COMMENT ON TABLE user_retention_policies IS 'Tracks data retention policies for users across all tenants';
COMMENT ON TABLE user_data_backups IS 'Stores user data backups created manually or automatically before deletion';

