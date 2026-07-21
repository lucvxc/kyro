import { eq } from "drizzle-orm";
import { MessageFlags, type Guild } from "discord.js";
import { Cache, type Container } from "../../../index.ts";
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

export const logEvents: readonly LogEvent[] = [
  "messageDelete", "messageEdit", "memberJoin", "memberLeave",
  "memberBan", "memberUnban", "memberTimeout", "memberRoles",
  "voiceJoin", "voiceLeave", "voiceMove", "inviteCreate",
];

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
  const current = await loggerSettings(guildId);
  await save(guildId, { ...current, enabled: true, channelId });
}

export async function setLoggerEnabled(guildId: string, enabled: boolean): Promise<void> {
  const current = await loggerSettings(guildId);
  await save(guildId, { ...current, enabled });
}

export async function setLoggerChannel(guildId: string, channelId: string): Promise<void> {
  const current = await loggerSettings(guildId);
  await save(guildId, { ...current, channelId });
}

export async function setLogEvent(guildId: string, event: LogEvent, enabled: boolean): Promise<boolean> {
  const current = await loggerSettings(guildId);
  const active = current.events?.length ? [...current.events] : [...logEvents];
  const exists = active.includes(event);
  if (exists === enabled) return false;
  const events = enabled ? [...active, event] : active.filter(value => value !== event);
  await save(guildId, { ...current, events });
  return true;
}

export async function setIgnoredChannel(guildId: string, channelId: string, ignored: boolean): Promise<boolean> {
  const current = await loggerSettings(guildId);
  const channels = [...(current.ignoredChannels ?? [])];
  const exists = channels.includes(channelId);
  if (exists === ignored) return false;
  const ignoredChannels = ignored ? [...channels, channelId] : channels.filter(value => value !== channelId);
  await save(guildId, { ...current, ignoredChannels });
  return true;
}

export async function sendLog(guild: Guild, event: LogEvent, value: Container, sourceChannelId?: string): Promise<boolean> {
  const config = await loggerSettings(guild.id);
  if (!config.enabled || !config.channelId) return false;
  if (config.events?.length && !config.events.includes(event)) return false;
  if (sourceChannelId && config.ignoredChannels?.includes(sourceChannelId)) return false;

  const channel = guild.channels.cache.get(config.channelId) ?? await guild.channels.fetch(config.channelId).catch(() => null);
  if (!channel?.isSendable()) return false;
  await channel.send({
    components: [value.toJSON()],
    flags: MessageFlags.IsComponentsV2,
    files: value.files,
    allowedMentions: { parse: [] },
  });
  return true;
}

async function save(guildId: string, logging: LogSettings): Promise<void> {
  const value = {
    ...logging,
    events: [...(logging.events ?? [])],
    ignoredChannels: [...(logging.ignoredChannels ?? [])],
  };
  await db.insert(guilds).values({ id: guildId, logging: value })
    .onConflictDoUpdate({ target: guilds.id, set: { logging: value, updatedAt: new Date() } });
  settings.set(guildId, Object.freeze(value));
}
