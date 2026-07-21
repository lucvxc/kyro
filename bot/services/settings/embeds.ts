import { eq } from "drizzle-orm";
import type { Guild, User } from "discord.js";
import { Cache, UserError } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds } from "../../db/schema.ts";
import type { SavedEmbed, SavedEmbedMap } from "../../utils/config/schema.ts";
import { isEmbedFormat, parseGeneric, parseMessageFormat } from "../../utils/parser.ts";

const cache = new Cache<SavedEmbedMap>({ ttl: 300, max: 10_000 });

export async function savedEmbeds(guildId: string, userId: string): Promise<SavedEmbed[]> {
  const embeds = await all(guildId);
  return Object.values(embeds)
    .filter(embed => embed.userId === userId)
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}

export async function saveEmbed(
  guildId: string,
  userId: string,
  name: string | undefined,
  code: string,
): Promise<{ created: boolean; embed: SavedEmbed }> {
  validateCode(code);
  const current = await all(guildId);
  const cleanName = name?.trim().slice(0, 100);
  const existing = cleanName
    ? Object.values(current).find(embed => embed.userId === userId && embed.name.toLowerCase() === cleanName.toLowerCase())
    : undefined;
  if (!existing && (await savedEmbeds(guildId, userId)).length >= 15) {
    throw new UserError("You can only save 15 embeds per server.");
  }

  const id = existing?.id ?? createId(current);
  const embed: SavedEmbed = {
    id,
    name: cleanName || id,
    userId,
    code,
    savedAt: existing?.savedAt ?? new Date().toISOString(),
  };
  await save(guildId, { ...current, [id]: embed });
  return { created: !existing, embed };
}

export async function deleteEmbed(guildId: string, userId: string, query: string): Promise<SavedEmbed | undefined> {
  const current = await all(guildId);
  const embed = find(current, userId, query);
  if (!embed) return undefined;
  const embeds = { ...current };
  delete embeds[embed.id];
  await save(guildId, embeds);
  return embed;
}

export async function savedEmbed(guildId: string, userId: string, query: string): Promise<SavedEmbed> {
  const embed = find(await all(guildId), userId, query);
  if (!embed) throw new UserError(`No saved embed named **${query}** exists.`);
  return embed;
}

export function renderEmbed(code: string, guild: Guild, author: User) {
  validateCode(code);
  return parseMessageFormat(parseGeneric(code, guild, author));
}

function find(embeds: SavedEmbedMap, userId: string, query: string): SavedEmbed | undefined {
  const value = query.trim().toLowerCase();
  return Object.values(embeds).find(embed =>
    embed.userId === userId && (embed.id === value || embed.name.toLowerCase() === value));
}

function createId(embeds: SavedEmbedMap): string {
  let id: string;
  do id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  while (id in embeds);
  return id;
}

function validateCode(code: string): void {
  if (!isEmbedFormat(code)) throw new UserError("That is not a valid embed code.");
  const parsed = parseMessageFormat(code);
  if (!parsed.content && !parsed.embeds?.length) throw new UserError("That embed code does not produce any content.");
}

async function all(guildId: string): Promise<SavedEmbedMap> {
  const cached = cache.get(guildId);
  if (cached) return cached;
  const [guild] = await db.select({ embeds: guilds.savedEmbeds })
    .from(guilds)
    .where(eq(guilds.id, guildId))
    .limit(1);
  const embeds = Object.freeze({ ...(guild?.embeds ?? {}) });
  cache.set(guildId, embeds);
  return embeds;
}

async function save(guildId: string, embeds: SavedEmbedMap): Promise<void> {
  await db.insert(guilds).values({ id: guildId, savedEmbeds: embeds })
    .onConflictDoUpdate({ target: guilds.id, set: { savedEmbeds: embeds, updatedAt: new Date() } });
  cache.set(guildId, Object.freeze({ ...embeds }));
}
