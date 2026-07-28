import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { TicketSettings } from "../../db/settings.ts";

const tickets = store<string, TicketSettings>({
  ttl: 300,
  max: 10_000,
  load: async (guildId) => {
    const [row] = await db
      .select({ value: guilds.tickets })
      .from(guilds)
      .where(eq(guilds.id, guildId))
      .limit(1);
    return structuredClone(row?.value ?? {});
  },
  save: async (guildId, value) => {
    const next = { tickets: structuredClone(value), updatedAt: new Date() };
    await db
      .insert(guilds)
      .values({ id: guildId, ...next })
      .onConflictDoUpdate({ target: guilds.id, set: next });
  },
});

export const getTicketSettings = (guildId: string) => tickets.get(guildId);
export const editTicketSettings = (
  guildId: string,
  change: (settings: TicketSettings) => TicketSettings,
) => tickets.update(guildId, (settings) => change(structuredClone(settings)));
