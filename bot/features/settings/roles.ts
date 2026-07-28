import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { ButtonRolePanel, RoleMenu } from "../../db/settings.ts";

type Cfg = {
  reactionRoles: RoleMenu[];
  buttonRoles: ButtonRolePanel[];
};

const settings = store<string, Cfg>({
  ttl: 300,
  max: 10_000,
  load: async (guildId) => {
    const [row] = await db
      .select({
        reactionRoles: guilds.reactionRoles,
        buttonRoles: guilds.buttonRoles,
      })
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);
    return structuredClone(row ?? { reactionRoles: [], buttonRoles: [] });
  },
  save: async (guildId, value) => {
    const values = { ...structuredClone(value), updatedAt: new Date() };
    await db
      .insert(guilds)
      .values({ id: guildId, ...values })
      .onConflictDoUpdate({ target: guilds.id, set: values });
  },
});

export function roleSettings(guildId: string): Promise<Cfg> {
  return settings.get(guildId);
}

export function updateRoleSettings(
  guildId: string,
  change: (value: Cfg) => Cfg,
): Promise<Cfg> {
  return settings.update(guildId, (current) =>
    change(structuredClone(current)),
  );
}
