import { and, eq, lte } from "drizzle-orm";
import type { Client, GuildMember } from "discord.js";
import { db } from "../db/database.ts";
import { guilds, stickyMembers, tempRoles } from "../db/schema.ts";

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export async function toggleSticky(guildId: string): Promise<boolean> {
  const [guild] = await db.select({ enabled: guilds.stickyRoles }).from(guilds).where(eq(guilds.id, guildId)).limit(1);
  const enabled = !guild?.enabled;
  await db.insert(guilds).values({ id: guildId, stickyRoles: enabled })
    .onConflictDoUpdate({ target: guilds.id, set: { stickyRoles: enabled, updatedAt: new Date() } });
  if (!enabled) await db.delete(stickyMembers).where(eq(stickyMembers.guildId, guildId));
  return enabled;
}

export async function rememberRoles(member: GuildMember): Promise<void> {
  const [guild] = await db.select({ enabled: guilds.stickyRoles }).from(guilds).where(eq(guilds.id, member.guild.id)).limit(1);
  if (!guild?.enabled) return;
  const roles = [...member.roles.cache.values()]
    .filter(role => role.id !== member.guild.id && !role.managed && role.editable)
    .map(role => role.id);
  await db.transaction(async tx => {
    await tx.delete(stickyMembers).where(and(eq(stickyMembers.guildId, member.guild.id), eq(stickyMembers.userId, member.id)));
    if (roles.length) await tx.insert(stickyMembers).values(roles.map(roleId => ({ guildId: member.guild.id, userId: member.id, roleId })));
  });
}

export async function restoreRoles(member: GuildMember): Promise<void> {
  const [guild] = await db.select({ enabled: guilds.stickyRoles }).from(guilds).where(eq(guilds.id, member.guild.id)).limit(1);
  if (!guild?.enabled) return;
  const rows = await db.select().from(stickyMembers)
    .where(and(eq(stickyMembers.guildId, member.guild.id), eq(stickyMembers.userId, member.id)));
  const roles = rows.map(row => member.guild.roles.cache.get(row.roleId)).filter(role => role?.editable).map(role => role!.id);
  if (roles.length) await member.roles.add(roles, "Restoring sticky roles");
  if (rows.length) await db.delete(stickyMembers)
    .where(and(eq(stickyMembers.guildId, member.guild.id), eq(stickyMembers.userId, member.id)));
}

export async function addTempRole(client: Client, guildId: string, userId: string, roleId: string, expiresAt: Date): Promise<void> {
  await db.insert(tempRoles).values({ guildId, userId, roleId, expiresAt })
    .onConflictDoUpdate({
      target: [tempRoles.guildId, tempRoles.userId, tempRoles.roleId],
      set: { expiresAt },
    });
  schedule(client, { guildId, userId, roleId, expiresAt });
}

export async function restoreTempRoles(client: Client): Promise<void> {
  const rows = await db.select().from(tempRoles);
  for (const row of rows) schedule(client, row);
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
  if (role.expiresAt.getTime() > Date.now()) { schedule(client, role); return; }
  timers.delete(key);
  const guild = client.guilds.cache.get(role.guildId);
  const member = await guild?.members.fetch(role.userId).catch(() => null);
  if (member?.roles.cache.has(role.roleId)) await member.roles.remove(role.roleId, "Temporary role expired").catch(() => undefined);
  await db.delete(tempRoles).where(and(
    eq(tempRoles.guildId, role.guildId),
    eq(tempRoles.userId, role.userId),
    eq(tempRoles.roleId, role.roleId),
    lte(tempRoles.expiresAt, new Date()),
  ));
}
