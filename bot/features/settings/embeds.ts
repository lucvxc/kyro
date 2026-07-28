import type { Guild, User } from "discord.js";
import { eq } from "drizzle-orm";
import { UserError } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { savedEmbeds as table } from "../../db/schema.ts";
import {
  isEmbedFormat,
  parseGeneric,
  parseMessageFormat,
} from "../../shared/parser.ts";

export type SavedEmbed = typeof table.$inferSelect;

export function savedEmbeds(userId: string): Promise<SavedEmbed[]> {
  return db
    .select()
    .from(table)
    .where(eq(table.userId, userId))
    .orderBy(table.createdAt);
}

export async function saveEmbed(
  userId: string,
  name: string | undefined,
  code: string,
): Promise<{ created: boolean; embed: SavedEmbed }> {
  validateCode(code);
  const current = await savedEmbeds(userId);
  const cleanName = name?.trim().slice(0, 100);
  const existing = cleanName
    ? current.find(
        (embed) => embed.name.toLowerCase() === cleanName.toLowerCase(),
      )
    : undefined;
  if (!existing && current.length >= 15)
    throw new UserError("You can only save 15 embeds.");

  if (existing) {
    const [embed] = await db
      .update(table)
      .set({ code, updatedAt: new Date() })
      .where(eq(table.id, existing.id))
      .returning();
    return { created: false, embed: embed! };
  }

  const id = createId();
  const [embed] = await db
    .insert(table)
    .values({ id, userId, name: cleanName || id, code })
    .returning();
  return { created: true, embed: embed! };
}

export async function deleteEmbed(
  userId: string,
  query: string,
): Promise<SavedEmbed | undefined> {
  const embed = await savedEmbed(userId, query, false);
  if (!embed) return undefined;
  await db.delete(table).where(eq(table.id, embed.id));
  return embed;
}

export async function savedEmbed(
  userId: string,
  query: string,
  required?: true,
): Promise<SavedEmbed>;
export async function savedEmbed(
  userId: string,
  query: string,
  required: false,
): Promise<SavedEmbed | undefined>;
export async function savedEmbed(
  userId: string,
  query: string,
  required = true,
): Promise<SavedEmbed | undefined> {
  const value = query.trim().toLowerCase();
  const embed = (await savedEmbeds(userId)).find(
    (item) => item.id === value || item.name.toLowerCase() === value,
  );
  if (!embed && required)
    throw new UserError(`No saved embed named **${query}** exists.`);
  return embed;
}

export async function shareEmbed(
  userId: string,
  id: string,
): Promise<SavedEmbed> {
  const embed = await savedEmbed(userId, id);
  if (embed.shareCode && embed.isPublic) return embed;
  const [shared] = await db
    .update(table)
    .set({
      isPublic: true,
      shareCode: createShareCode(),
      updatedAt: new Date(),
    })
    .where(eq(table.id, embed.id))
    .returning();
  return shared!;
}

export async function copySharedEmbed(
  userId: string,
  shareCode: string,
): Promise<SavedEmbed> {
  const [source] = await db
    .select()
    .from(table)
    .where(eq(table.shareCode, shareCode.trim()))
    .limit(1);
  if (!source?.isPublic)
    throw new UserError("That embed share code is invalid or private.");
  const current = await savedEmbeds(userId);
  if (current.length >= 15) throw new UserError("You can only save 15 embeds.");
  const id = createId();
  const name = uniqueName(source.name, current);
  const [copied] = await db
    .insert(table)
    .values({ id, userId, name, code: source.code })
    .returning();
  return copied!;
}

export async function updateEmbedCode(
  userId: string,
  id: string,
  code: string,
): Promise<SavedEmbed> {
  validateCode(code);
  const embed = await savedEmbed(userId, id);
  const [updated] = await db
    .update(table)
    .set({ code, updatedAt: new Date() })
    .where(eq(table.id, embed.id))
    .returning();
  return updated!;
}

export function renderEmbed(code: string, guild: Guild, author: User) {
  validateCode(code);
  return parseMessageFormat(parseGeneric(code, guild, author));
}

function validateCode(code: string): void {
  if (!isEmbedFormat(code))
    throw new UserError("That is not a valid embed code.");
  const parsed = parseMessageFormat(code);
  if (!parsed.content && !parsed.embeds?.length)
    throw new UserError("That embed code does not produce any content.");
}

function createId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

function createShareCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function uniqueName(name: string, current: readonly SavedEmbed[]): string {
  if (!current.some((embed) => embed.name.toLowerCase() === name.toLowerCase()))
    return name;
  for (let number = 2; number <= 15; number += 1) {
    const value = `${name} ${number}`.slice(0, 100);
    if (
      !current.some((embed) => embed.name.toLowerCase() === value.toLowerCase())
    )
      return value;
  }
  return createId();
}
