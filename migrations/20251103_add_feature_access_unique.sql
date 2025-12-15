-- Ensure unique feature key per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_access_user_feature
ON feature_access (user_id, feature_key);


