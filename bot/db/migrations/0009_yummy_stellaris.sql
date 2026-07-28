CREATE TABLE "stat_days" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text,
	"day" varchar(10) NOT NULL,
	"messages" bigint DEFAULT 0 NOT NULL,
	"commands" bigint DEFAULT 0 NOT NULL,
	"reactions" bigint DEFAULT 0 NOT NULL,
	"deleted" bigint DEFAULT 0 NOT NULL,
	"edited" bigint DEFAULT 0 NOT NULL,
	"attachments" bigint DEFAULT 0 NOT NULL,
	"links" bigint DEFAULT 0 NOT NULL,
	"voice_seconds" bigint DEFAULT 0 NOT NULL,
	"members_joined" bigint DEFAULT 0 NOT NULL,
	"members_left" bigint DEFAULT 0 NOT NULL,
	"moderation_actions" bigint DEFAULT 0 NOT NULL,
	"command_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guilds" ADD COLUMN "case_log_channel_id" text;--> statement-breakpoint
CREATE INDEX "stat_days_guild_day_idx" ON "stat_days" USING btree ("guild_id","day");