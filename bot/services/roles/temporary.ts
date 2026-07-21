import { and, eq, lte } from "drizzle-orm";
import type { Client } from "discord.js";
import { db } from "../../db/database.ts";
import { tempRoles } from "../../db/schema.ts";

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export async function addTempRole(client: Client, guildId: string, userId: string, roleId: string, expiresAt: Date): Promise<void> {
  await db.insert(tempRoles).values({ guildId, userId, roleId, expiresAt })
    .onConflictDoUpdate({
      target: [tempRoles.guildId, tempRoles.userId, tempRoles.roleId],
      set: { expiresAt },
    });
  schedule(client, { guildId, userId, roleId, expiresAt });
}

export async function restoreTempRoles(client: Client): Promise<void> {
  for (const role of await db.select().from(tempRoles)) schedule(client, role);
}

function schedule(client: Client, role: typeof tempRoles.$inferSelect): void {
  const key = `${role.guildId}:${role.userId}:${role.roleId}`;
  const active = timers.get(key);
  if (active) clearTimeout(active);
  const delay = Math.min(Math.max(0, role.expiresAt.getTime() - Date.now()), 2_147_000_000);
  const timer = setTimeout(() => void expire(client, role), delay);
  timer.unref?.();
  timers.set(key, timer);
}

async function expire(client: Client, role: typeof tempRoles.$inferSelect): Promise<void> {
  const key = `${role.guildId}:${role.userId}:${role.roleId}`;
  if (role.expiresAt.getTime() > Date.now()) {
    schedule(client, role);
    return;
  }

  timers.delete(key);
  const guild = client.guilds.cache.get(role.guildId);
  const member = await guild?.members.fetch(role.userId).catch(() => null);
  if (member?.roles.cache.has(role.roleId)) {
    await member.roles.remove(role.roleId, "Temporary role expired").catch(() => undefined);
  }
  await db.delete(tempRoles).where(and(
    eq(tempRoles.guildId, role.guildId),
    eq(tempRoles.userId, role.userId),
    eq(tempRoles.roleId, role.roleId),
    lte(tempRoles.expiresAt, new Date()),
  ));
}
