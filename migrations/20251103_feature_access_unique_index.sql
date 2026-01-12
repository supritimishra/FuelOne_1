-- Ensure unique feature assignment per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'ux_feature_access_user_feature'
  ) THEN
    CREATE UNIQUE INDEX ux_feature_access_user_feature
      ON feature_access (user_id, feature_key);
  END IF;
END $$;


