-- Migration: Add invalidated_tokens table to master database for session management
-- This enables force logout functionality by blacklisting tokens
-- Date: 2025-01-03

-- Create invalidated_tokens table in master database
CREATE TABLE IF NOT EXISTS invalidated_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_signature text NOT NULL, -- JWT signature portion for identification
  user_email text NOT NULL,
  tenant_id uuid,
  expires_at timestamp NOT NULL, -- Original token expiry
  invalidated_at timestamp DEFAULT now(),
  reason text -- 'force_logout', 'logout', etc.
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_invalidated_tokens_signature ON invalidated_tokens(token_signature);
CREATE INDEX IF NOT EXISTS idx_invalidated_tokens_user_email ON invalidated_tokens(user_email);
CREATE INDEX IF NOT EXISTS idx_invalidated_tokens_expires_at ON invalidated_tokens(expires_at);

-- Add comment
COMMENT ON TABLE invalidated_tokens IS 'Blacklist of invalidated JWT tokens for session management';

