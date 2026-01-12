CREATE TABLE "lubricant_loss" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loss_date" date DEFAULT CURRENT_DATE NOT NULL,
	"lubricant_id" uuid NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "lubricant_loss" ADD CONSTRAINT "lubricant_loss_lubricant_id_lubricants_id_fk" FOREIGN KEY ("lubricant_id") REFERENCES "public"."lubricants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lubricant_loss" ADD CONSTRAINT "lubricant_loss_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;