import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { VoiceMasterSettings } from "../../db/settings.ts";

const settings = store<string, VoiceMasterSettings>({
  ttl: 300,
  max: 10_000,
  load: async (guildId) => {
    const [row] = await db
      .select({ value: guilds.voiceMaster })
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);
    return structuredClone(row?.value ?? {});
  },
  save: async (guildId, value) => {
    const values = {
      voiceMaster: structuredClone(value),
      updatedAt: new Date(),
    };
    await db
      .insert(guilds)
      .values({ id: guildId, ...values })
      .onConflictDoUpdate({ target: guilds.id, set: values });
  },
});

export function voiceMasterSettings(
  guildId: string,
): Promise<VoiceMasterSettings> {
  return settings.get(guildId);
}

export function updateVoiceMaster(
  guildId: string,
  change: (value: VoiceMasterSettings) => VoiceMasterSettings,
) {
  return settings.update(guildId, (current) =>
    change(structuredClone(current)),
  );
}
