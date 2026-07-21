import { eq } from "drizzle-orm";
import type { Guild } from "discord.js";
import { Cache, type Embed } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { LogSettings } from "../../utils/config/schema.ts";

export type LogEvent =
  | "messageDelete"
  | "messageEdit"
  | "memberJoin"
  | "memberLeave"
  | "memberBan"
  | "memberUnban"
  | "memberTimeout"
  | "memberRoles"
  | "voiceJoin"
  | "voiceLeave"
  | "voiceMove"
  | "inviteCreate";

const settings = new Cache<LogSettings>({ ttl: 300, max: 10_000 });

export async function loggerSettings(guildId: string): Promise<LogSettings> {
  const cached = settings.get(guildId);
  if (cached) return cached;
  const [guild] = await db.select({ logging: guilds.logging })
    .from(guilds)
    .where(eq(guilds.id, guildId))
    .limit(1);
  const value = Object.freeze({ ...(guild?.logging ?? {}) });
  settings.set(guildId, value);
  return value;
}

export async function setupLogger(guildId: string, channelId: string): Promise<void> {
  const logging: LogSettings = { enabled: true, channelId, events: [], ignoredChannels: [] };
  await db.insert(guilds).values({ id: guildId, logging })
    .onConflictDoUpdate({ target: guilds.id, set: { logging, updatedAt: new Date() } });
  settings.set(guildId, Object.freeze(logging));
}

export async function sendLog(guild: Guild, event: LogEvent, value: Embed, sourceChannelId?: string): Promise<boolean> {
  const config = await loggerSettings(guild.id);
  if (!config.enabled || !config.channelId) return false;
  if (config.events?.length && !config.events.includes(event)) return false;
  if (sourceChannelId && config.ignoredChannels?.includes(sourceChannelId)) return false;

  const channel = guild.channels.cache.get(config.channelId) ?? await guild.channels.fetch(config.channelId).catch(() => null);
  if (!channel?.isSendable()) return false;
  await channel.send({ embeds: [value.toJSON()], allowedMentions: { parse: [] } });
  return true;
}
