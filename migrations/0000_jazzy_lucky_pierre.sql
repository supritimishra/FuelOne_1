-- Enable required extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"record_id" uuid,
	"details" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "app_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" text NOT NULL,
	"config_value" text,
	"config_type" text DEFAULT 'string',
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "app_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_date" date DEFAULT CURRENT_DATE NOT NULL,
	"employee_id" uuid NOT NULL,
	"status" text,
	"shift_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "business_parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"party_name" text NOT NULL,
	"contact_person" text,
	"mobile_number" text,
	"address" text,
	"opening_balance" numeric(12, 2),
	"current_balance" numeric(12, 2),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "business_parties_party_name_unique" UNIQUE("party_name")
);
--> statement-breakpoint
CREATE TABLE "business_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_date" date DEFAULT CURRENT_DATE NOT NULL,
	"transaction_type" text,
	"party_name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "credit_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_name" text NOT NULL,
	"phone_number" text,
	"mobile_number" text,
	"email" text,
	"address" text,
	"credit_limit" numeric(12, 2),
	"opening_balance" numeric(12, 2),
	"current_balance" numeric(12, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_date" date DEFAULT CURRENT_DATE NOT NULL,
	"credit_customer_id" uuid NOT NULL,
	"fuel_product_id" uuid,
	"ordered_quantity" numeric(12, 3),
	"status" text DEFAULT 'Pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "credit_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_date" date DEFAULT CURRENT_DATE NOT NULL,
	"credit_customer_id" uuid NOT NULL,
	"vehicle_number" text,
	"fuel_product_id" uuid,
	"quantity" numeric(12, 3) NOT NULL,
	"price_per_unit" numeric(10, 2) NOT NULL,
	"total_amount" numeric(12, 2),
	"employee_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "daily_sale_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rate_date" date DEFAULT CURRENT_DATE NOT NULL,
	"fuel_product_id" uuid NOT NULL,
	"open_rate" numeric(10, 2),
	"close_rate" numeric(10, 2),
	"variation_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "day_cash_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date DEFAULT CURRENT_DATE,
	"inflows" numeric(12, 2) DEFAULT 0,
	"outflows" numeric(12, 2) DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "day_settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settlement_date" date DEFAULT CURRENT_DATE NOT NULL,
	"opening_balance" numeric(12, 2),
	"meter_sale" numeric(12, 2),
	"lubricant_sale" numeric(12, 2),
	"total_sale" numeric(12, 2),
	"credit_amount" numeric(12, 2),
	"expenses" numeric(12, 2),
	"shortage" numeric(12, 2) DEFAULT '0',
	"closing_balance" numeric(12, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "denominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"denomination_date" date DEFAULT CURRENT_DATE NOT NULL,
	"note_2000" integer DEFAULT 0,
	"note_500" integer DEFAULT 0,
	"note_200" integer DEFAULT 0,
	"note_100" integer DEFAULT 0,
	"note_50" integer DEFAULT 0,
	"note_20" integer DEFAULT 0,
	"note_10" integer DEFAULT 0,
	"coin_10" integer DEFAULT 0,
	"coin_5" integer DEFAULT 0,
	"coin_2" integer DEFAULT 0,
	"coin_1" integer DEFAULT 0,
	"total_amount" numeric(12, 2),
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "duty_pay" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pay_month" date NOT NULL,
	"total_salary" numeric(12, 2),
	"total_employees" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "duty_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_name" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"duties" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_cash_recovery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recovery_date" date DEFAULT CURRENT_DATE NOT NULL,
	"employee_id" uuid NOT NULL,
	"balance_amount" numeric(12, 2),
	"collection_amount" numeric(12, 2) NOT NULL,
	"shortage_amount" numeric(12, 2) DEFAULT '0',
	"total_recovery_cash" numeric(12, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_name" text NOT NULL,
	"designation" text,
	"phone_number" text,
	"mobile_number" text,
	"address" text,
	"salary" numeric(10, 2),
	"joining_date" date,
	"status" text DEFAULT 'Active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expense_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_type_name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_date" date DEFAULT CURRENT_DATE NOT NULL,
	"expense_type_id" uuid,
	"flow_type" text,
	"payment_mode" text,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"employee_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "expiry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_name" text NOT NULL,
	"issue_date" date,
	"expiry_date" date,
	"status" text DEFAULT 'Active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "fuel_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_name" text NOT NULL,
	"short_name" text NOT NULL,
	"gst_percentage" numeric(5, 2),
	"tds_percentage" numeric(5, 2),
	"wgt_percentage" numeric(5, 2),
	"lfrn" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guest_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_date" date DEFAULT CURRENT_DATE NOT NULL,
	"mobile_number" text,
	"vehicle_number" text,
	"fuel_product_id" uuid NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"price_per_unit" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"payment_mode" text,
	"total_amount" numeric(12, 2),
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "interest_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_date" date DEFAULT CURRENT_DATE NOT NULL,
	"transaction_type" text,
	"party_name" text NOT NULL,
	"loan_amount" numeric(12, 2),
	"interest_amount" numeric(12, 2),
	"principal_paid" numeric(12, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "liquid_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"invoice_date" date,
	"invoice_no" text NOT NULL,
	"description" text,
	"vendor_id" uuid,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lub_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"invoice_date" date,
	"invoice_no" text NOT NULL,
	"description" text,
	"vendor_id" uuid,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lub_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_date" date NOT NULL,
	"shift" text,
	"employee_id" uuid,
	"product" text NOT NULL,
	"sale_rate" numeric(10, 2) DEFAULT 0,
	"quantity" numeric(10, 2) DEFAULT 0,
	"discount" numeric(10, 2) DEFAULT 0,
	"amount" numeric(12, 2) DEFAULT 0,
	"description" text,
	"sale_type" text DEFAULT 'Cash',
	"gst" numeric(5, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lubricant_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_date" date DEFAULT CURRENT_DATE NOT NULL,
	"lubricant_id" uuid,
	"sale_rate" numeric(10, 2),
	"quantity" integer NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"sale_type" text,
	"credit_customer_id" uuid,
	"total_amount" numeric(12, 2),
	"employee_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "lubricants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lubricant_name" text NOT NULL,
	"product_code" text,
	"mrp_rate" numeric(10, 2),
	"sale_rate" numeric(10, 2),
	"gst_percentage" numeric(5, 2),
	"current_stock" integer DEFAULT 0,
	"minimum_stock" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nozzles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nozzle_number" text NOT NULL,
	"tank_id" uuid,
	"fuel_product_id" uuid,
	"pump_station" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opening_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product" text NOT NULL,
	"unit" text,
	"opening_stock" numeric(12, 3),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_name" text NOT NULL,
	"owner_name" text,
	"address" text,
	"phone_number" text,
	"mobile_number" text,
	"email" text,
	"gst_number" text,
	"pan_number" text,
	"bank_name" text,
	"account_number" text,
	"ifsc_code" text,
	"branch_name" text,
	"upi_id" text,
	"logo_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "print_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"content" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "recoveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recovery_date" date DEFAULT CURRENT_DATE NOT NULL,
	"credit_customer_id" uuid NOT NULL,
	"received_amount" numeric(12, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"payment_mode" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "sale_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_date" date DEFAULT CURRENT_DATE NOT NULL,
	"shift_id" uuid,
	"pump_station" text,
	"nozzle_id" uuid,
	"fuel_product_id" uuid,
	"opening_reading" numeric(12, 3),
	"closing_reading" numeric(12, 3),
	"quantity" numeric(12, 3),
	"price_per_unit" numeric(10, 2),
	"net_sale_amount" numeric(12, 2),
	"employee_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "sales_officer_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_date" date DEFAULT CURRENT_DATE NOT NULL,
	"fuel_product_id" uuid NOT NULL,
	"dip_value" numeric(12, 3),
	"total_sale_liters" numeric(12, 3),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "sheet_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date DEFAULT CURRENT_DATE,
	"sheet_name" text,
	"open_reading" numeric(12, 3) DEFAULT 0,
	"close_reading" numeric(12, 3) DEFAULT 0,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "swipe_machines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"machine_name" text NOT NULL,
	"machine_type" text NOT NULL,
	"provider" text NOT NULL,
	"machine_id" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "swipe_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_date" date DEFAULT CURRENT_DATE NOT NULL,
	"employee_id" uuid,
	"swipe_type" text,
	"swipe_mode" text,
	"amount" numeric(12, 2) NOT NULL,
	"batch_number" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_name" text NOT NULL,
	"setting_value" text,
	"setting_category" text,
	"description" text,
	"is_editable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "system_settings_setting_name_unique" UNIQUE("setting_name")
);
--> statement-breakpoint
CREATE TABLE "tanker_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_date" date DEFAULT CURRENT_DATE NOT NULL,
	"fuel_product_id" uuid NOT NULL,
	"before_dip_stock" numeric(12, 3),
	"gross_stock" numeric(12, 3),
	"tanker_sale_quantity" numeric(12, 3) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "tanks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tank_number" text NOT NULL,
	"fuel_product_id" uuid,
	"capacity" numeric(12, 3),
	"current_stock" numeric(12, 3),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_email" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_db_name" text NOT NULL,
	"organization_name" text NOT NULL,
	"super_admin_user_id" uuid,
	"super_admin_email" text NOT NULL,
	"connection_string" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_tenant_db_name_unique" UNIQUE("tenant_db_name"),
	CONSTRAINT "tenants_super_admin_email_unique" UNIQUE("super_admin_email")
);
--> statement-breakpoint
CREATE TABLE "user_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"module" text,
	"details" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text,
	"password_hash" text NOT NULL,
	"full_name" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vendor_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_date" date DEFAULT CURRENT_DATE NOT NULL,
	"invoice_number" text NOT NULL,
	"vendor_id" uuid NOT NULL,
	"invoice_type" text,
	"amount" numeric(12, 2) NOT NULL,
	"gst_amount" numeric(12, 2),
	"total_amount" numeric(12, 2),
	"payment_status" text DEFAULT 'Pending',
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "vendor_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_date" date DEFAULT CURRENT_DATE NOT NULL,
	"vendor_id" uuid NOT NULL,
	"transaction_type" text,
	"amount" numeric(12, 2) NOT NULL,
	"payment_mode" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_name" text NOT NULL,
	"vendor_type" text,
	"contact_person" text,
	"phone_number" text,
	"mobile_number" text,
	"email" text,
	"address" text,
	"gst_number" text,
	"pan_number" text,
	"opening_balance" numeric(12, 2),
	"current_balance" numeric(12, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_shift_id_duty_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."duty_shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_transactions" ADD CONSTRAINT "business_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_requests" ADD CONSTRAINT "credit_requests_credit_customer_id_credit_customers_id_fk" FOREIGN KEY ("credit_customer_id") REFERENCES "public"."credit_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_requests" ADD CONSTRAINT "credit_requests_fuel_product_id_fuel_products_id_fk" FOREIGN KEY ("fuel_product_id") REFERENCES "public"."fuel_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_requests" ADD CONSTRAINT "credit_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_sales" ADD CONSTRAINT "credit_sales_credit_customer_id_credit_customers_id_fk" FOREIGN KEY ("credit_customer_id") REFERENCES "public"."credit_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_sales" ADD CONSTRAINT "credit_sales_fuel_product_id_fuel_products_id_fk" FOREIGN KEY ("fuel_product_id") REFERENCES "public"."fuel_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_sales" ADD CONSTRAINT "credit_sales_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_sales" ADD CONSTRAINT "credit_sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_sale_rates" ADD CONSTRAINT "daily_sale_rates_fuel_product_id_fuel_products_id_fk" FOREIGN KEY ("fuel_product_id") REFERENCES "public"."fuel_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_sale_rates" ADD CONSTRAINT "daily_sale_rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_settlements" ADD CONSTRAINT "day_settlements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denominations" ADD CONSTRAINT "denominations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_cash_recovery" ADD CONSTRAINT "employee_cash_recovery_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_cash_recovery" ADD CONSTRAINT "employee_cash_recovery_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expense_type_id_expense_types_id_fk" FOREIGN KEY ("expense_type_id") REFERENCES "public"."expense_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_sales" ADD CONSTRAINT "guest_sales_fuel_product_id_fuel_products_id_fk" FOREIGN KEY ("fuel_product_id") REFERENCES "public"."fuel_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_sales" ADD CONSTRAINT "guest_sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_transactions" ADD CONSTRAINT "interest_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquid_purchases" ADD CONSTRAINT "liquid_purchases_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lub_purchases" ADD CONSTRAINT "lub_purchases_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lub_sales" ADD CONSTRAINT "lub_sales_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lubricant_sales" ADD CONSTRAINT "lubricant_sales_lubricant_id_lubricants_id_fk" FOREIGN KEY ("lubricant_id") REFERENCES "public"."lubricants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lubricant_sales" ADD CONSTRAINT "lubricant_sales_credit_customer_id_credit_customers_id_fk" FOREIGN KEY ("credit_customer_id") REFERENCES "public"."credit_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lubricant_sales" ADD CONSTRAINT "lubricant_sales_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lubricant_sales" ADD CONSTRAINT "lubricant_sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nozzles" ADD CONSTRAINT "nozzles_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nozzles" ADD CONSTRAINT "nozzles_fuel_product_id_fuel_products_id_fk" FOREIGN KEY ("fuel_product_id") REFERENCES "public"."fuel_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_templates" ADD CONSTRAINT "print_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recoveries" ADD CONSTRAINT "recoveries_credit_customer_id_credit_customers_id_fk" FOREIGN KEY ("credit_customer_id") REFERENCES "public"."credit_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recoveries" ADD CONSTRAINT "recoveries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_entries" ADD CONSTRAINT "sale_entries_shift_id_duty_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."duty_shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_entries" ADD CONSTRAINT "sale_entries_nozzle_id_nozzles_id_fk" FOREIGN KEY ("nozzle_id") REFERENCES "public"."nozzles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_entries" ADD CONSTRAINT "sale_entries_fuel_product_id_fuel_products_id_fk" FOREIGN KEY ("fuel_product_id") REFERENCES "public"."fuel_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_entries" ADD CONSTRAINT "sale_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_entries" ADD CONSTRAINT "sale_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_officer_inspections" ADD CONSTRAINT "sales_officer_inspections_fuel_product_id_fuel_products_id_fk" FOREIGN KEY ("fuel_product_id") REFERENCES "public"."fuel_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_officer_inspections" ADD CONSTRAINT "sales_officer_inspections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sheet_records" ADD CONSTRAINT "sheet_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipe_machines" ADD CONSTRAINT "swipe_machines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipe_transactions" ADD CONSTRAINT "swipe_transactions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipe_transactions" ADD CONSTRAINT "swipe_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tanker_sales" ADD CONSTRAINT "tanker_sales_fuel_product_id_fuel_products_id_fk" FOREIGN KEY ("fuel_product_id") REFERENCES "public"."fuel_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tanker_sales" ADD CONSTRAINT "tanker_sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_fuel_product_id_fuel_products_id_fk" FOREIGN KEY ("fuel_product_id") REFERENCES "public"."fuel_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_transactions" ADD CONSTRAINT "vendor_transactions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_transactions" ADD CONSTRAINT "vendor_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;