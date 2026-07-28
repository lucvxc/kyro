import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { BoosterRoleSettings } from "../../db/settings.ts";

const settings = store<string, BoosterRoleSettings>({
  ttl: 300,
  max: 10_000,
  load: async (guildId) => {
    const [row] = await db
      .select({ value: guilds.boosterRoleSettings })
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);
    return structuredClone(row?.value ?? {});
  },
  save: async (guildId, value) => {
    const values = {
      boosterRoleSettings: structuredClone(value),
      updatedAt: new Date(),
    };
    await db
      .insert(guilds)
      .values({ id: guildId, ...values })
      .onConflictDoUpdate({ target: guilds.id, set: values });
  },
});

export function boosterSettings(guildId: string): Promise<BoosterRoleSettings> {
  return settings.get(guildId);
}

export function updateBoosterSettings(
  guildId: string,
  change: (value: BoosterRoleSettings) => BoosterRoleSettings,
) {
  return settings.update(guildId, (current) =>
    change(structuredClone(current)),
  );
}
