import { eq } from "drizzle-orm";
import { store } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type {
  AutoMessage,
  AutoResponse,
  CountingSettings,
  MessageSettings,
  StarboardSettings,
  StickyMessage,
} from "../../db/settings.ts";

type Cfg = {
  welcome: MessageSettings;
  leave: MessageSettings;
  boost: MessageSettings;
  autoroles: string[];
  autoresponders: AutoResponse[];
  starboard: StarboardSettings;
  counting: CountingSettings;
  stickyMessages: StickyMessage[];
  automessages: AutoMessage[];
};

const defaults = (): Cfg => ({
  welcome: {},
  leave: {},
  boost: {},
  autoroles: [],
  autoresponders: [],
  starboard: {},
  counting: {},
  stickyMessages: [],
  automessages: [],
});

const settings = store<string, Cfg>({
  ttl: 300,
  max: 10_000,
  load: async (id) => {
    const [row] = await db
      .select({
        welcome: guilds.welcome,
        leave: guilds.leave,
        boost: guilds.boost,
        autoroles: guilds.autoroles,
        autoresponders: guilds.autoresponders,
        starboard: guilds.starboard,
        counting: guilds.counting,
        stickyMessages: guilds.stickyMessages,
        automessages: guilds.automessages,
      })
      .from(guilds)
      .where(eq(guilds.id, id))
      .limit(1);
    return row ? clone(row) : defaults();
  },
  save: async (id, value) => {
    const values = { ...clone(value), updatedAt: new Date() };
    await db
      .insert(guilds)
      .values({ id, ...values })
      .onConflictDoUpdate({ target: guilds.id, set: values });
  },
});

export function communitySettings(guildId: string): Promise<Cfg> {
  return settings.get(guildId);
}
export function updateCommunity(
  guildId: string,
  change: (value: Cfg) => Cfg,
): Promise<Cfg> {
  return settings.update(guildId, (current) => change(clone(current)));
}

function clone(value: Cfg): Cfg {
  return structuredClone(value);
}
