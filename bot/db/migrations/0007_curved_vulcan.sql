ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "button_roles" jsonb DEFAULT '[]'::jsonb NOT NULL;
