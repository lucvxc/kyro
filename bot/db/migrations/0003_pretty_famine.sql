CREATE TABLE "saved_embeds" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"share_code" varchar(16),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "saved_embeds_user_idx" ON "saved_embeds" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_embeds_share_code_idx" ON "saved_embeds" USING btree ("share_code");