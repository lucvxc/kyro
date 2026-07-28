import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { JailSettings } from "../../db/settings.ts";

const settings = store<string, JailSettings>({
  ttl: 300,
  max: 10_000,
  load: async (guildId) => {
    const [row] = await db
      .select({ value: guilds.jail })
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);
    return {
      ...structuredClone(row?.value ?? {}),
      jailed: structuredClone(row?.value.jailed ?? {}),
    };
  },
  save: async (guildId, value) => {
    const values = { jail: structuredClone(value), updatedAt: new Date() };
    await db
      .insert(guilds)
      .values({ id: guildId, ...values })
      .onConflictDoUpdate({ target: guilds.id, set: values });
  },
});

export const jailSettings = (guildId: string) => settings.get(guildId);
export const updateJail = (
  guildId: string,
  change: (value: JailSettings) => JailSettings,
) => settings.update(guildId, (value) => change(structuredClone(value)));
