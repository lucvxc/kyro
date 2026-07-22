import type { Client } from "discord.js";
import type { AutoMessage } from "../../utils/config/schema.ts";
import { parseMessageFormat } from "../../utils/parser.ts";
import { communitySettings, updateCommunity } from "./community.ts";

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export async function addAutomessage(
  guildId: string,
  entry: AutoMessage,
  client: Client,
): Promise<void> {
  await updateCommunity(guildId, (value) => ({
    ...value,
    automessages: [...value.automessages, entry],
  }));
  schedule(client, guildId, entry);
}

export async function removeAutomessage(
  guildId: string,
  id: string,
): Promise<boolean> {
  const current = await communitySettings(guildId);
  if (!current.automessages.some((item) => item.id === id)) return false;
  clear(guildId, id);
  await updateCommunity(guildId, (value) => ({
    ...value,
    automessages: value.automessages.filter((item) => item.id !== id),
  }));
  return true;
}

export async function toggleAutomessage(
  guildId: string,
  id: string,
  client: Client,
): Promise<boolean | undefined> {
  const current = (await communitySettings(guildId)).automessages.find(
    (item) => item.id === id,
  );
  if (!current) return undefined;
  const enabled = !current.enabled;
  await updateCommunity(guildId, (value) => ({
    ...value,
    automessages: value.automessages.map((item) =>
      item.id === id ? { ...item, enabled } : item,
    ),
  }));
  if (enabled) schedule(client, guildId, { ...current, enabled });
  else clear(guildId, id);
  return enabled;
}

export async function restoreAutomessages(client: Client): Promise<void> {
  for (const guild of client.guilds.cache.values()) {
    const { automessages } = await communitySettings(guild.id);
    for (const entry of automessages) {
      schedule(client, guild.id, entry);
    }
  }
}

function schedule(client: Client, guildId: string, entry: AutoMessage): void {
  clear(guildId, entry.id);
  if (!entry.enabled) return;
  const delay = Math.max(
    1_000,
    entry.interval - Math.max(0, Date.now() - entry.lastSent),
  );
  const timer = setTimeout(
    () => void send(client, guildId, entry.id),
    Math.min(delay, 2_147_000_000),
  );
  timer.unref?.();
  timers.set(`${guildId}:${entry.id}`, timer);
}

async function send(
  client: Client,
  guildId: string,
  id: string,
): Promise<void> {
  const entry = (await communitySettings(guildId)).automessages.find(
    (item) => item.id === id,
  );
  if (!entry?.enabled) return;
  const channel =
    client.channels.cache.get(entry.channelId) ??
    (await client.channels.fetch(entry.channelId).catch(() => null));
  if (channel?.isSendable() && entry.message) {
    await channel
      .send({
        ...parseMessageFormat(entry.message),
        allowedMentions: { parse: [] },
      })
      .catch(() => undefined);
  }
  const lastSent = Date.now();
  await updateCommunity(guildId, (value) => ({
    ...value,
    automessages: value.automessages.map((item) =>
      item.id === id ? { ...item, lastSent } : item,
    ),
  }));
  schedule(client, guildId, { ...entry, lastSent });
}

function clear(guildId: string, id: string): void {
  const key = `${guildId}:${id}`;
  const timer = timers.get(key);
  if (timer) clearTimeout(timer);
  timers.delete(key);
}
