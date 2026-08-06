import {
  BitwisePermissionFlags,
  OverwriteTypes,
  type Channel,
  type Guild,
  type Member,
  type PermissionStrings,
} from "discordeno";
import type { DiscordBot } from "../core/Discord.ts";

export function missingPermissions(
  permissions: bigint | undefined,
  required: readonly PermissionStrings[],
) {
  if (permissions === undefined) return [...required];
  if (has(permissions, "ADMINISTRATOR")) return [];
  return required.filter((permission) => !has(permissions, permission));
}

export async function getMemberPermissions(
  bot: DiscordBot,
  guildId: bigint,
  channelId: bigint,
  userId: bigint,
  cachedGuild?: Guild | null,
  cachedMember?: Member,
) {
  const guild =
    cachedGuild ?? (await bot.helpers.getGuild(guildId).catch(() => null));
  if (!guild) return undefined;
  if (guild.ownerId === userId) return BitwisePermissionFlags.ADMINISTRATOR;

  const member =
    cachedMember ??
    guild.members.get(userId) ??
    (await bot.helpers.getMember(guildId, userId).catch(() => null));
  if (!member) return undefined;

  let permissions = guild.roles.get(guildId)?.permissions.bitfield ?? 0n;
  for (const roleId of member.roles)
    permissions |= guild.roles.get(roleId)?.permissions.bitfield ?? 0n;
  if (has(permissions, "ADMINISTRATOR")) return permissions;

  const channel =
    guild.channels.get(channelId) ??
    (await bot.helpers.getChannel(channelId).catch(() => null));
  return channel
    ? channelPermissions(permissions, channel, guildId, member)
    : permissions;
}

function channelPermissions(
  base: bigint,
  channel: Channel,
  guildId: bigint,
  member: Member,
) {
  let permissions = base;
  const everyone = channel.permissionOverwrites.find(
    (overwrite) =>
      overwrite.type === OverwriteTypes.Role && overwrite.id === guildId,
  );
  permissions = apply(permissions, everyone?.allow, everyone?.deny);

  let allow = 0n;
  let deny = 0n;
  for (const overwrite of channel.permissionOverwrites) {
    if (
      overwrite.type !== OverwriteTypes.Role ||
      !member.roles.includes(overwrite.id)
    )
      continue;
    allow |= bits(overwrite.allow);
    deny |= bits(overwrite.deny);
  }
  permissions = (permissions & ~deny) | allow;

  const memberOverwrite = channel.permissionOverwrites.find(
    (overwrite) =>
      overwrite.type === OverwriteTypes.Member && overwrite.id === member.id,
  );
  return apply(permissions, memberOverwrite?.allow, memberOverwrite?.deny);
}

function apply(
  permissions: bigint,
  allow?: PermissionStrings[],
  deny?: PermissionStrings[],
) {
  return (permissions & ~bits(deny)) | bits(allow);
}

function bits(permissions: readonly PermissionStrings[] = []) {
  return permissions.reduce(
    (value, permission) => value | BitwisePermissionFlags[permission],
    0n,
  );
}

function has(permissions: bigint, permission: PermissionStrings) {
  const flag = BitwisePermissionFlags[permission];
  return (permissions & flag) === flag;
}
