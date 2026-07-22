import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { MessageFilterSettings } from "../../utils/config/schema.ts";

export interface FilterSettings {
  antilink: MessageFilterSettings;
  antiinvite: MessageFilterSettings;
}

const settings = store<string, FilterSettings>({
  ttl: 300,
  max: 10_000,
  load: async (guildId) => {
    const [row] = await db
      .select({
        antilink: guilds.antilink,
        antiinvite: guilds.antiinvite,
      })
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);
    return structuredClone(row ?? { antilink: {}, antiinvite: {} });
  },
  save: async (guildId, value) => {
    const data = { ...structuredClone(value), updatedAt: new Date() };
    await db
      .insert(guilds)
      .values({ id: guildId, ...data })
      .onConflictDoUpdate({ target: guilds.id, set: data });
  },
});

export function filterSettings(guildId: string): Promise<FilterSettings> {
  return settings.get(guildId);
}

export function updateFilters(
  guildId: string,
  change: (value: FilterSettings) => FilterSettings,
): Promise<FilterSettings> {
  return settings.update(guildId, (current) =>
    change(structuredClone(current)),
  );
}
