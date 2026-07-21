import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/database.ts";
import { guilds, warnings } from "../../db/schema.ts";
import type { WarnPunishment } from "../../utils/config/schema.ts";

export type Warning = typeof warnings.$inferSelect;

export async function warn(guildId: string, userId: string, moderatorId: string, reason: string) {
  const [warning] = await db.insert(warnings).values({ guildId, userId, moderatorId, reason }).returning();
  const records = await listWarnings(guildId, userId);
  const punishment = (await punishments(guildId)).find(value => value.warnings === records.length);
  return { warning: warning!, count: records.length, punishment };
}

export function listWarnings(guildId: string, userId: string): Promise<Warning[]> {
  return db.select().from(warnings)
    .where(and(eq(warnings.guildId, guildId), eq(warnings.userId, userId)))
    .orderBy(desc(warnings.id));
}

export async function removeWarning(guildId: string, id: number): Promise<Warning | undefined> {
  const [warning] = await db.delete(warnings)
    .where(and(eq(warnings.guildId, guildId), eq(warnings.id, id)))
    .returning();
  return warning;
}

export async function clearWarnings(guildId: string, userId: string): Promise<number> {
  const removed = await db.delete(warnings)
    .where(and(eq(warnings.guildId, guildId), eq(warnings.userId, userId)))
    .returning({ id: warnings.id });
  return removed.length;
}

export async function punishments(guildId: string): Promise<WarnPunishment[]> {
  const [guild] = await db.select({ value: guilds.warnPunishments }).from(guilds).where(eq(guilds.id, guildId)).limit(1);
  return guild?.value ?? [];
}

export async function setPunishment(guildId: string, value: WarnPunishment | number): Promise<boolean> {
  const current = await punishments(guildId);
  const count = typeof value === "number" ? value : value.warnings;
  const exists = current.some(item => item.warnings === count);
  const next = typeof value === "number"
    ? current.filter(item => item.warnings !== count)
    : [...current.filter(item => item.warnings !== count), value].sort((a, b) => a.warnings - b.warnings);

  await db.insert(guilds).values({ id: guildId, warnPunishments: next })
    .onConflictDoUpdate({ target: guilds.id, set: { warnPunishments: next, updatedAt: new Date() } });
  return typeof value === "number" ? exists : true;
}
