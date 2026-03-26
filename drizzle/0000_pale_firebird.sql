CREATE TABLE "abandoned_checkouts" (
	"id" integer PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"visit_number" integer DEFAULT 1,
	"name" text,
	"phone" text,
	"address" text,
	"items" text NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0',
	"delivery" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) DEFAULT '0',
	"status" text DEFAULT 'abandoned',
	"completed_order_id" text,
	"visit_time" text NOT NULL,
	"visit_date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cart_events" (
	"id" integer PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"action" text NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'icon',
	"icon" text,
	"image" text,
	"items" integer DEFAULT 0,
	"status" text DEFAULT 'Active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"scope" text NOT NULL,
	"expiry" text,
	"selected_products" text,
	"selected_categories" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text,
	"email" text,
	"total_spent" numeric(10, 2) DEFAULT '0',
	"total_orders" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"variant" text,
	"qty" integer NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"offer_text" text,
	"offer_discount" numeric(10, 2) DEFAULT '0',
	"coupon_code" text,
	"coupon_discount" numeric(10, 2) DEFAULT '0',
	"order_id" text NOT NULL,
	"product_id" integer
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"note" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'pending',
	"courier_status" text,
	"consignment_id" integer,
	"tracking_code" text,
	"courier_delivered_at" text,
	"subtotal" numeric(10, 2) NOT NULL,
	"delivery" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"coupon_codes" text DEFAULT '[]',
	"coupon_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"canceled_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" integer PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"page" text NOT NULL,
	"product_id" integer,
	"referrer" text,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_faqs" (
	"id" integer PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"product_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" integer PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"product_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_views" (
	"id" integer PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"view_count" integer DEFAULT 1,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"category_id" text,
	"image" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"old_price" numeric(10, 2),
	"discount" text DEFAULT '0%',
	"discount_type" text DEFAULT 'pct',
	"discount_value" numeric(10, 2) DEFAULT '0',
	"offer" boolean DEFAULT false,
	"status" text DEFAULT 'active',
	"short_desc" text,
	"long_desc" text,
	"weight" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "related_products" (
	"id" integer PRIMARY KEY NOT NULL,
	"related_product_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0,
	"product_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" integer PRIMARY KEY NOT NULL,
	"initials" text NOT NULL,
	"name" text NOT NULL,
	"rating" integer NOT NULL,
	"text" text NOT NULL,
	"date" text NOT NULL,
	"product_id" integer,
	"customer_id" integer
);
--> statement-breakpoint
CREATE TABLE "session_analytics" (
	"id" integer PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"last_activity_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer DEFAULT 0,
	"page_views" integer DEFAULT 1,
	"product_views" integer DEFAULT 0,
	"is_bounced" boolean DEFAULT false,
	"device_type" text NOT NULL,
	"browser" text NOT NULL,
	"os" text NOT NULL,
	"cart_adds" integer DEFAULT 0,
	"cart_removes" integer DEFAULT 0,
	"did_order" boolean DEFAULT false,
	"order_id" text,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "session_analytics_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"website_name" text DEFAULT 'EcoMart',
	"slogan" text,
	"logo_url" text,
	"favicon_url" text,
	"hero_images" text,
	"inside_dhaka_delivery" numeric(10, 2) DEFAULT '60',
	"outside_dhaka_delivery" numeric(10, 2) DEFAULT '120',
	"free_delivery_min" numeric(10, 2) DEFAULT '500',
	"universal_delivery" boolean DEFAULT false,
	"universal_delivery_charge" numeric(10, 2) DEFAULT '60',
	"whatsapp_number" text,
	"phone_number" text,
	"facebook_url" text,
	"messenger_username" text,
	"about_us" text,
	"terms_conditions" text,
	"refund_policy" text,
	"privacy_policy" text,
	"offer_title" text DEFAULT 'Offers',
	"offer_slogan" text DEFAULT 'Exclusive deals just for you',
	"first_section_name" text DEFAULT 'Categories',
	"first_section_slogan" text DEFAULT 'Browse by category',
	"second_section_name" text DEFAULT 'Offers',
	"second_section_slogan" text DEFAULT 'Exclusive deals for you',
	"third_section_name" text DEFAULT 'Featured',
	"third_section_slogan" text DEFAULT 'Handpicked products',
	"hero_animation_speed" integer DEFAULT 3000,
	"hero_animation_type" text DEFAULT 'Fade',
	"stock_low_percent" integer DEFAULT 25,
	"stock_medium_percent" integer DEFAULT 50,
	"courier_enabled" boolean DEFAULT false,
	"courier_api_key" text,
	"courier_secret_key" text,
	"admin_username" text DEFAULT 'admin',
	"admin_password" text,
	"steadfast_api_key" text,
	"steadfast_secret_key" text,
	"steadfast_webhook_url" text,
	"cloudinary_cloud_name" text,
	"cloudinary_api_key" text,
	"cloudinary_api_secret" text,
	"admin_username_updated_at" text,
	"admin_password_updated_at" text,
	"steadfast_api_updated_at" text,
	"cloudinary_updated_at" text
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stock" integer NOT NULL,
	"initial_stock" integer NOT NULL,
	"price" numeric(10, 2) DEFAULT '0',
	"discount" text DEFAULT '0%',
	"discount_type" text DEFAULT 'pct',
	"discount_value" numeric(10, 2) DEFAULT '0',
	"product_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor_sessions" (
	"id" integer PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"device_type" text NOT NULL,
	"browser" text NOT NULL,
	"os" text NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cart_events" ADD CONSTRAINT "cart_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_faqs" ADD CONSTRAINT "product_faqs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_products" ADD CONSTRAINT "related_products_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_products" ADD CONSTRAINT "related_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;