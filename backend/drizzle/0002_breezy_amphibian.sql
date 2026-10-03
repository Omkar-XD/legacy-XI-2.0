ALTER TYPE "public"."order_status" ADD VALUE 'OUT_FOR_DELIVERY' BEFORE 'DELIVERED';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "courier" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipped_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_timeline" jsonb DEFAULT '[]'::jsonb;