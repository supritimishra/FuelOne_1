-- Migration: Add status field to users table for account control (active/suspended/deleted)
-- This enables suspend/activate functionality in Developer Mode
-- Date: 2025-01-03

-- Add status column to users table in tenant databases
-- Note: This migration should be run on each tenant database
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

-- Add constraint to ensure valid status values (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_status_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_status_check 
      CHECK (status IN ('active', 'suspended', 'deleted'));
  END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status != 'active';

-- Add comment (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    COMMENT ON COLUMN users.status IS 'User account status: active (can login), suspended (cannot login), deleted (soft delete)';
  END IF;
END $$;

