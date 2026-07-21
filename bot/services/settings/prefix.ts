import { eq } from "drizzle-orm";
import type { Message } from "discord.js";
import { Cache, UserError } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";

export const defaultPrefix = "$";

const prefixes = new Cache<string>({ ttl: 300, max: 10_000 });

export function getprefix(message: Message): Promise<string> {
  return prefixFor(message.guildId);
}

export async function prefixFor(guildId: string | null): Promise<string> {
  if (!guildId) return defaultPrefix;
  const cached = prefixes.get(guildId);
  if (cached !== undefined) return cached;

  const [guild] = await db.select({ prefix: guilds.prefix })
    .from(guilds)
    .where(eq(guilds.id, guildId))
    .limit(1);
  const prefix = guild?.prefix ?? defaultPrefix;
  prefixes.set(guildId, prefix);
  return prefix;
}

export async function setPrefix(guildId: string, value: string): Promise<string> {
  const prefix = value.trim();
  if (!prefix || prefix.length > 5) throw new UserError("Prefixes must be between 1 and 5 characters.");
  if (/\s/.test(prefix)) throw new UserError("Prefixes cannot contain spaces.");

  await db.insert(guilds).values({ id: guildId, prefix })
    .onConflictDoUpdate({ target: guilds.id, set: { prefix, updatedAt: new Date() } });
  prefixes.set(guildId, prefix);
  return prefix;
}

export function resetPrefix(guildId: string): Promise<string> {
  return setPrefix(guildId, defaultPrefix);
}
