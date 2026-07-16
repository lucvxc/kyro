DO $$
DECLARE
  sticky_roles_type text;
BEGIN
  SELECT udt_name INTO sticky_roles_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'guilds'
    AND column_name = 'sticky_roles';

  IF sticky_roles_type = 'bool' THEN
    ALTER TABLE "guilds" ALTER COLUMN "sticky_roles" SET DEFAULT false;
  ELSIF sticky_roles_type = 'jsonb' THEN
    ALTER TABLE "guilds" ALTER COLUMN "sticky_roles" DROP DEFAULT;
    ALTER TABLE "guilds" ALTER COLUMN "sticky_roles" SET DATA TYPE boolean USING CASE
      WHEN jsonb_typeof("sticky_roles") = 'boolean' THEN ("sticky_roles" #>> '{}')::boolean
      WHEN jsonb_typeof("sticky_roles") = 'array' THEN jsonb_array_length("sticky_roles") > 0
      WHEN jsonb_typeof("sticky_roles") = 'object' THEN "sticky_roles" <> '{}'::jsonb
      ELSE false
    END;
    ALTER TABLE "guilds" ALTER COLUMN "sticky_roles" SET DEFAULT false;
  END IF;
END $$;
