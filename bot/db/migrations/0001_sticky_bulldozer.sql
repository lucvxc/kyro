CREATE TABLE "sticky_members" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "sticky_members_guild_id_user_id_role_id_pk" PRIMARY KEY("guild_id","user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "temp_roles" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "temp_roles_guild_id_user_id_role_id_pk" PRIMARY KEY("guild_id","user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "warnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"moderator_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "temp_roles_expiry_idx" ON "temp_roles" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "warnings_member_idx" ON "warnings" USING btree ("guild_id","user_id");