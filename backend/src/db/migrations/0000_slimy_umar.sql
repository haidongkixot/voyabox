CREATE TYPE "public"."role" AS ENUM('user', 'brand', 'admin');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('trial_register', 'review', 'photo_bonus', 'first_review_bonus', 'redeem', 'admin_adjust');--> statement-breakpoint
CREATE TYPE "public"."trial_status" AS ENUM('pending', 'approved', 'shipped', 'completed', 'rejected');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"name" varchar(150) NOT NULL,
	"description" text,
	"logo_url" text,
	"website" varchar(255),
	"category" varchar(80),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"image_url" text,
	"category" varchar(80),
	"tags" text[],
	"trial_duration_days" integer DEFAULT 14 NOT NULL,
	"spots_total" integer DEFAULT 100 NOT NULL,
	"spots_remaining" integer DEFAULT 100 NOT NULL,
	"avg_rating" real DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trial_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"content" text NOT NULL,
	"photo_url" text,
	"tokens_earned" integer DEFAULT 0 NOT NULL,
	"is_first_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"description" varchar(255) NOT NULL,
	"reference_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"status" "trial_status" DEFAULT 'pending' NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"shipping_address" text NOT NULL,
	"preferred_date" timestamp,
	"admin_note" text,
	"has_review" boolean DEFAULT false NOT NULL,
	"tokens_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"phone" varchar(20),
	"address" text,
	"avatar_url" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"token_balance" integer DEFAULT 0 NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_trial_id_trials_id_fk" FOREIGN KEY ("trial_id") REFERENCES "public"."trials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trials" ADD CONSTRAINT "trials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trials" ADD CONSTRAINT "trials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brands_owner_idx" ON "brands" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("is_featured");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_trial_idx" ON "reviews" USING btree ("trial_id");--> statement-breakpoint
CREATE INDEX "transactions_user_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_created_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "trials_user_idx" ON "trials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trials_product_idx" ON "trials" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "trials_status_idx" ON "trials" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "trials_user_product_idx" ON "trials" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");