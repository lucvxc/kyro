ALTER TABLE "users" ADD COLUMN "lastfm_session" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastfm_embed" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastfm_reactions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastfm_hidden" boolean DEFAULT false NOT NULL;