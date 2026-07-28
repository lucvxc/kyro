CREATE TABLE "invite_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"member_id" text NOT NULL,
	"inviter_id" text,
	"code" varchar(32),
	"fake" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" varchar(64);--> statement-breakpoint
CREATE INDEX "invite_members_inviter_idx" ON "invite_members" USING btree ("guild_id","inviter_id");--> statement-breakpoint
CREATE INDEX "invite_members_member_idx" ON "invite_members" USING btree ("guild_id","member_id");