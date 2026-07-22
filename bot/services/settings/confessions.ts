import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { ConfessionSettings } from "../../utils/config/schema.ts";

const settings = store<string, ConfessionSettings>({
  ttl: 300,
  max: 10_000,
  load: async (guildId) => {
    const [row] = await db
      .select({ value: guilds.confessions })
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);
    return structuredClone(row?.value ?? {});
  },
  save: async (guildId, value) => {
    const data = { confessions: structuredClone(value), updatedAt: new Date() };
    await db
      .insert(guilds)
      .values({ id: guildId, ...data })
      .onConflictDoUpdate({ target: guilds.id, set: data });
  },
});

export function confessionSettings(
  guildId: string,
): Promise<ConfessionSettings> {
  return settings.get(guildId);
}

export function updateConfessions(
  guildId: string,
  change: (value: ConfessionSettings) => ConfessionSettings,
) {
  return settings.update(guildId, (current) =>
    change(structuredClone(current)),
  );
}
