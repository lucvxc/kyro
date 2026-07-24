import { AuditLogEvent, PermissionFlagsBits, type Guild } from "discord.js";
import { evt } from "../../index.ts";
import { punishNukeActor } from "../services/security/punishment.ts";
import { reachesLimit } from "../services/security/windows.ts";
import { securitySettings } from "../services/settings/security.ts";
import { auditActor } from "../utils/audit.ts";
import type { AntiNukeProtectionName } from "../utils/config/schema.ts";

export default [
  evt({
    name: "channelCreate",
    run: async (channel) => {
      if (!channel.guild) return;
      await inspect(
        channel.guild,
        "channelcreate",
        AuditLogEvent.ChannelCreate,
        channel.id,
      );
    },
  }),
  evt({
    name: "channelDelete",
    run: async (channel) => {
      if (channel.isDMBased()) return;
      await inspect(
        channel.guild,
        "channeldelete",
        AuditLogEvent.ChannelDelete,
        channel.id,
      );
    },
  }),
  evt({
    name: "roleCreate",
    run: async (role) =>
      inspect(role.guild, "rolecreate", AuditLogEvent.RoleCreate, role.id),
  }),
  evt({
    name: "roleDelete",
    run: async (role) =>
      inspect(role.guild, "roledelete", AuditLogEvent.RoleDelete, role.id),
  }),
  evt({
    name: "guildBanAdd",
    run: async (ban) =>
      inspect(ban.guild, "ban", AuditLogEvent.MemberBanAdd, ban.user.id),
  }),
  evt({
    name: "guildMemberRemove",
    run: async (member) =>
      inspect(member.guild, "kick", AuditLogEvent.MemberKick, member.id),
  }),
  evt({
    name: "webhooksUpdate",
    run: async (channel) =>
      inspect(channel.guild, "webhook", AuditLogEvent.WebhookCreate),
  }),
  evt({
    name: "guildMemberAdd",
    run: async (member) => {
      if (!member.user.bot) return;
      await inspect(member.guild, "botadd", AuditLogEvent.BotAdd, member.id);
    },
  }),
  evt({
    name: "roleUpdate",
    run: async (before, after) => {
      if (
        before.permissions.has(PermissionFlagsBits.Administrator) ||
        !after.permissions.has(PermissionFlagsBits.Administrator)
      )
        return;
      await inspect(
        after.guild,
        "administrator",
        AuditLogEvent.RoleUpdate,
        after.id,
      );
    },
  }),
  evt({
    name: "guildMemberUpdate",
    run: async (before, after) => {
      if (
        before.permissions.has(PermissionFlagsBits.Administrator) ||
        !after.permissions.has(PermissionFlagsBits.Administrator)
      )
        return;
      await inspect(
        after.guild,
        "administrator",
        AuditLogEvent.MemberRoleUpdate,
        after.id,
      );
    },
  }),
];

async function inspect(
  guild: Guild,
  name: AntiNukeProtectionName,
  auditType: AuditLogEvent,
  targetId?: string,
): Promise<void> {
  const config = (await securitySettings(guild.id)).antinuke;
  const protection = config.protections[name];
  if (!config.enabled || !protection.enabled) return;

  const actor = await auditActor(guild, auditType, targetId, 7_000).catch(
    () => undefined,
  );
  if (!actor || actor.id === guild.client.user.id) return;
  if (
    actor.id === guild.ownerId ||
    config.whitelist.includes(actor.id) ||
    config.admins.includes(actor.id)
  )
    return;

  const triggered = reachesLimit(
    `${guild.id}:${actor.id}:${name}`,
    protection.threshold,
    protection.window,
  );
  if (!triggered) return;
  await punishNukeActor(
    guild,
    actor.id,
    config.punishment,
    `AntiNuke: ${name}`,
  );
}
