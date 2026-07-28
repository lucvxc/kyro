import type { Guild, GuildMember } from "discord.js";
import type { AntiNukeSettings, RaidAction } from "../../db/settings.ts";

const active = new Set<string>();
const timeout = 28 * 24 * 60 * 60 * 1_000;

export async function punishNukeActor(
  guild: Guild,
  userId: string,
  punishment: AntiNukeSettings["punishment"],
  reason: string,
): Promise<string> {
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member && punishment === "ban") {
    await guild.members.ban(userId, { reason });
    return "banned";
  }
  if (!member) return "user is no longer in the server";
  if (!canModerate(guild, member))
    return "could not moderate due to role hierarchy";
  return once(guild.id, userId, async () => {
    if (punishment === "ban") await member.ban({ reason });
    if (punishment === "kick") await member.kick(reason);
    if (punishment === "timeout") await member.timeout(timeout, reason);
    if (punishment === "strip") {
      const roles = member.roles.cache.filter(
        (role) => role.id !== guild.id && !role.managed && role.editable,
      );
      if (roles.size) await member.roles.remove(roles, reason);
    }
    return punishment === "strip" ? "roles removed" : `${punishment}ed`;
  });
}

export async function punishRaider(
  guild: Guild,
  member: GuildMember,
  action: RaidAction,
  reason: string,
): Promise<string> {
  if (action === "none") return "logged";
  if (action === "delete") return "message deleted";
  if (!canModerate(guild, member))
    return "could not moderate due to role hierarchy";
  return once(guild.id, member.id, async () => {
    if (action === "ban") await member.ban({ reason });
    if (action === "kick") await member.kick(reason);
    if (action === "timeout") await member.timeout(timeout, reason);
    if (action === "softban") {
      await member.ban({ reason, deleteMessageSeconds: 86_400 });
      await guild.members.unban(member.id, reason);
    }
    return action === "softban" ? "softbanned" : `${action}ed`;
  });
}

function canModerate(guild: Guild, member: GuildMember): boolean {
  const bot = guild.members.me;
  return Boolean(
    bot &&
    member.id !== guild.ownerId &&
    member.id !== bot.id &&
    member.roles.highest.position < bot.roles.highest.position,
  );
}

async function once(
  guildId: string,
  userId: string,
  action: () => Promise<string>,
): Promise<string> {
  const key = `${guildId}:${userId}`;
  if (active.has(key)) return "already handled";
  active.add(key);
  try {
    return await action();
  } finally {
    setTimeout(() => active.delete(key), 10_000).unref?.();
  }
}
