CREATE TABLE "bot_stats" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
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
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"number" integer NOT NULL,
	"user_id" text NOT NULL,
	"moderator_id" text NOT NULL,
	"action" varchar(32) NOT NULL,
	"reason" text DEFAULT 'No reason provided' NOT NULL,
	"duration" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "giveaways" (
	"id" varchar(12) PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"message_id" text NOT NULL,
	"host_id" text NOT NULL,
	"prize" text NOT NULL,
	"winner_count" integer DEFAULT 1 NOT NULL,
	"entries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_stats" (
	"guild_id" text PRIMARY KEY NOT NULL,
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
	"peak_voice" integer DEFAULT 0 NOT NULL,
	"command_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"guild_id" text,
	"channel_id" text NOT NULL,
	"content" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"number" integer NOT NULL,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"claimed_by" text,
	"closed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "tickets_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
ALTER TABLE "guilds" ADD COLUMN "tickets" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "afk_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "afk_since" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "cases_guild_number_idx" ON "moderation_cases" USING btree ("guild_id","number");--> statement-breakpoint
CREATE INDEX "cases_user_idx" ON "moderation_cases" USING btree ("guild_id","user_id");--> statement-breakpoint
CREATE INDEX "giveaways_due_idx" ON "giveaways" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "giveaways_guild_idx" ON "giveaways" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "reminders_due_idx" ON "reminders" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "reminders_user_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tickets_guild_idx" ON "tickets" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "tickets_user_idx" ON "tickets" USING btree ("guild_id","user_id");