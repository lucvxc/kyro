import type { GuildMember, Role } from "discord.js";
import { and, eq } from "drizzle-orm";
import { UserError } from "../../index.ts";
import { db } from "../db/database.ts";
import { boosterRoleMembers } from "../db/schema.ts";
import { boosterSettings } from "./settings/boosterroles.ts";

export async function personalBoosterRole(
  member: GuildMember,
  create = false,
): Promise<Role> {
  const [record] = await db
    .select()
    .from(boosterRoleMembers)
    .where(
      and(
        eq(boosterRoleMembers.guildId, member.guild.id),
        eq(boosterRoleMembers.userId, member.id),
      ),
    )
    .limit(1);
  const existing = record && member.guild.roles.cache.get(record.roleId);
  if (existing) return existing;
  if (!create)
    throw new UserError("You do not have a personal booster role yet.");
  if (!member.premiumSince)
    throw new UserError(
      "You must be boosting this server to create a booster role.",
    );
  const settings = await boosterSettings(member.guild.id);
  if (!settings.baseRoleId)
    throw new UserError("Booster roles have not been set up yet.");
  const base = member.guild.roles.cache.get(settings.baseRoleId);
  if (!base)
    throw new UserError("The configured booster role base no longer exists.");
  const role = await member.guild.roles.create({
    name: `${member.displayName}'s role`,
    position: base.position + 1,
    reason: "Personal booster role",
  });
  await member.roles.add(role);
  await db
    .insert(boosterRoleMembers)
    .values({ guildId: member.guild.id, userId: member.id, roleId: role.id })
    .onConflictDoUpdate({
      target: [boosterRoleMembers.guildId, boosterRoleMembers.userId],
      set: { roleId: role.id },
    });
  return role;
}
