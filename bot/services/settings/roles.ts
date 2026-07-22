import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { RoleMenu } from "../../utils/config/schema.ts";

export interface RoleSettings {
  reactionRoles: RoleMenu[];
}

const settings = store<string, RoleSettings>({
  ttl: 300,
  max: 10_000,
  load: async (guildId) => {
    const [row] = await db
      .select({
        reactionRoles: guilds.reactionRoles,
      })
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);
    return structuredClone(row ?? { reactionRoles: [] });
  },
  save: async (guildId, value) => {
    const data = { ...structuredClone(value), updatedAt: new Date() };
    await db
      .insert(guilds)
      .values({ id: guildId, ...data })
      .onConflictDoUpdate({ target: guilds.id, set: data });
  },
});

export function roleSettings(guildId: string): Promise<RoleSettings> {
  return settings.get(guildId);
}

export function updateRoleSettings(
  guildId: string,
  change: (value: RoleSettings) => RoleSettings,
): Promise<RoleSettings> {
  return settings.update(guildId, (current) =>
    change(structuredClone(current)),
  );
}
