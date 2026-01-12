
-- Rename phone to phone_number if it exists and phone_number doesn't
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'organization_details' AND column_name = 'phone') AND
     NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'organization_details' AND column_name = 'phone_number') THEN
    ALTER TABLE "organization_details" RENAME COLUMN "phone" TO "phone_number";
  END IF;
END $$;

-- Add missing columns
ALTER TABLE "organization_details" 
ADD COLUMN IF NOT EXISTS "phone_number" text,
ADD COLUMN IF NOT EXISTS "mobile_number" text,
ADD COLUMN IF NOT EXISTS "bank_name" text,
ADD COLUMN IF NOT EXISTS "account_number" text,
ADD COLUMN IF NOT EXISTS "ifsc_code" text,
ADD COLUMN IF NOT EXISTS "branch_name" text,
ADD COLUMN IF NOT EXISTS "upi_id" text,
ADD COLUMN IF NOT EXISTS "logo_url" text,
ADD COLUMN IF NOT EXISTS "owner_name" text,
ADD COLUMN IF NOT EXISTS "pan_number" text;
