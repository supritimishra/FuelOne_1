-- Migration: Add developer_audit_logs table to master database
-- This table tracks all Developer Mode actions (feature access changes)
-- Date: 2025-01-02

-- Create developer_audit_logs table in master database
CREATE TABLE IF NOT EXISTS developer_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_email text NOT NULL,
  target_user_email text NOT NULL,
  feature_key text,
  action text NOT NULL, -- 'enabled', 'disabled', 'bulk_enabled', 'bulk_disabled'
  created_at timestamp DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON developer_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON developer_audit_logs(target_user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_developer_email ON developer_audit_logs(developer_email);

-- Add comment to table
COMMENT ON TABLE developer_audit_logs IS 'Tracks all Developer Mode actions for feature access changes';

