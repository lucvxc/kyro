import { and, eq } from "drizzle-orm";
import type { GuildMember } from "discord.js";
import { Server } from "../../../index.ts";
import { db } from "../../db/database.ts";
import { guilds, stickyMembers } from "../../db/schema.ts";

export async function toggleSticky(guildId: string): Promise<boolean> {
  const [guild] = await db.select({ enabled: guilds.stickyRoles }).from(guilds).where(eq(guilds.id, guildId)).limit(1);
  const enabled = !guild?.enabled;
  await db.insert(guilds).values({ id: guildId, stickyRoles: enabled })
    .onConflictDoUpdate({ target: guilds.id, set: { stickyRoles: enabled, updatedAt: new Date() } });
  if (!enabled) await db.delete(stickyMembers).where(eq(stickyMembers.guildId, guildId));
  return enabled;
}

export async function rememberRoles(member: GuildMember): Promise<void> {
  if (!await enabled(member.guild.id)) return;
  const roleIDs = await new Server(member.guild).roles.snapshot(member.id);
  await db.transaction(async tx => {
    await tx.delete(stickyMembers).where(and(
      eq(stickyMembers.guildId, member.guild.id),
      eq(stickyMembers.userId, member.id),
    ));
    if (roleIDs.length) {
      await tx.insert(stickyMembers).values(roleIDs.map(roleId => ({
        guildId: member.guild.id,
        userId: member.id,
        roleId,
      })));
    }
  });
}

export async function restoreRoles(member: GuildMember): Promise<void> {
  if (!await enabled(member.guild.id)) return;
  const rows = await db.select().from(stickyMembers).where(and(
    eq(stickyMembers.guildId, member.guild.id),
    eq(stickyMembers.userId, member.id),
  ));
  await new Server(member.guild).roles.restore(member.id, rows.map(row => row.roleId), "Restoring sticky roles");
  if (rows.length) await db.delete(stickyMembers).where(and(
    eq(stickyMembers.guildId, member.guild.id),
    eq(stickyMembers.userId, member.id),
  ));
}

async function enabled(guildId: string): Promise<boolean> {
  const [guild] = await db.select({ enabled: guilds.stickyRoles }).from(guilds).where(eq(guilds.id, guildId)).limit(1);
  return guild?.enabled ?? false;
}
