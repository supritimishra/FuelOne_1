CREATE TABLE "feature_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_key" text NOT NULL,
	"label" text NOT NULL,
	"feature_group" text,
	"description" text,
	"default_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "feature_permissions_feature_key_unique" UNIQUE("feature_key")
);
--> statement-breakpoint
CREATE TABLE "liquid_purchase_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"purchase_rate" numeric(10, 2),
	"quantity" numeric(10, 2),
	"cost" numeric(12, 2),
	"vat" numeric(12, 2),
	"other_taxes" numeric(12, 2),
	"tcs" numeric(12, 2),
	"item_total" numeric(12, 2),
	"cess" numeric(12, 2),
	"add_vat" numeric(12, 2),
	"inv_density" numeric(10, 2),
	"measured_density" numeric(12, 2),
	"vari_density" numeric(12, 2),
	"other" numeric(12, 2),
	"lfr" numeric(12, 2),
	"dc" numeric(12, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tank_daily_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reading_date" date DEFAULT CURRENT_DATE NOT NULL,
	"tank_id" uuid,
	"opening_stock" numeric(12, 3),
	"stock_received" numeric(12, 3) DEFAULT '0',
	"meter_sale" numeric(12, 3) DEFAULT '0',
	"closing_stock" numeric(12, 3),
	"dip_reading" numeric(12, 3),
	"variation" numeric(12, 3),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "user_feature_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"allowed" boolean NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "business_parties" ADD COLUMN "party_type" text;--> statement-breakpoint
ALTER TABLE "business_parties" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "business_parties" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "business_parties" ADD COLUMN "opening_date" date;--> statement-breakpoint
ALTER TABLE "business_parties" ADD COLUMN "opening_type" text;--> statement-breakpoint
ALTER TABLE "business_parties" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "last_payment_date" date;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "registered_date" date;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "tin_gst_no" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "representative_name" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "organization_address" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "advance_no" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "alt_phone_no" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "opening_date" date;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "balance_type" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "penalty_interest" boolean;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "discount_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "offer_type" text;--> statement-breakpoint
ALTER TABLE "credit_customers" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "daily_sale_rates" ADD COLUMN "shift" text DEFAULT 'S-1' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "join_date" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employee_number" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "phone_no" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "id_proof_no" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "salary_type" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "has_pf" boolean;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "has_esi" boolean;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "has_income_tax" boolean;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "liquid_purchases" ADD COLUMN "amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "lub_purchases" ADD COLUMN "amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "swipe_machines" ADD COLUMN "attach_type" text;--> statement-breakpoint
ALTER TABLE "swipe_machines" ADD COLUMN "bank_type" text;--> statement-breakpoint
ALTER TABLE "swipe_machines" ADD COLUMN "vendor_id" uuid;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "opening_date" date;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "opening_type" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "liquid_purchase_items" ADD CONSTRAINT "liquid_purchase_items_purchase_id_liquid_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."liquid_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tank_daily_readings" ADD CONSTRAINT "tank_daily_readings_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tank_daily_readings" ADD CONSTRAINT "tank_daily_readings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_access" ADD CONSTRAINT "user_feature_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_access" ADD CONSTRAINT "user_feature_access_feature_id_feature_permissions_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."feature_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_feature_access_user_feature_idx" ON "user_feature_access" USING btree ("user_id","feature_id");--> statement-breakpoint
ALTER TABLE "swipe_machines" ADD CONSTRAINT "swipe_machines_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_daily_rate_entry" ON "daily_sale_rates" USING btree ("rate_date","shift","fuel_product_id");