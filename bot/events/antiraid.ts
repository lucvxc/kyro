import {
  PermissionFlagsBits,
  type GuildMember,
  type Message,
} from "discord.js";
import { evt } from "../../index.ts";
import { lockGuild } from "../services/security/lockdown.ts";
import { punishRaider } from "../services/security/punishment.ts";
import { reachesLimit } from "../services/security/windows.ts";
import { securitySettings } from "../services/settings/security.ts";
import type { AntiRaidSettings, RaidAction } from "../utils/config/schema.ts";

const invitePattern = /(?:discord\.gg|discord(?:app)?\.com\/invite)\/[\w-]+/i;
const linkPattern = /https?:\/\/\S+/i;

export default [
  evt({
    name: "guildMemberAdd",
    run: async (member) => handleJoin(member),
  }),
  evt({
    name: "messageCreate",
    run: async (message) => handleMessage(message),
  }),
];

async function handleJoin(member: GuildMember): Promise<void> {
  const config = (await securitySettings(member.guild.id)).antiraid;
  if (!config.enabled || trusted(member, config)) return;

  const age = config.protections.accountage;
  const accountDays = (Date.now() - member.user.createdTimestamp) / 86_400_000;
  if (age.enabled && accountDays < age.minimumDays) {
    await punishRaider(
      member.guild,
      member,
      age.action,
      "AntiRaid: new account",
    );
    return;
  }

  const avatar = config.protections.defaultavatar;
  if (avatar.enabled && !member.user.avatar) {
    await punishRaider(
      member.guild,
      member,
      avatar.action,
      "AntiRaid: default avatar",
    );
    return;
  }

  const joins = config.protections.joinrate;
  if (!joins.enabled) return;
  if (!reachesLimit(`${member.guild.id}:joins`, joins.threshold, joins.window))
    return;
  await punishRaider(
    member.guild,
    member,
    joins.action,
    "AntiRaid: join rate exceeded",
  );
  if (joins.lockdown && !config.lockdown.active) await lockGuild(member.guild);
}

async function handleMessage(message: Message): Promise<void> {
  if (!message.guild || !message.member || message.author.bot) return;
  const config = (await securitySettings(message.guild.id)).antiraid;
  if (!config.enabled || trusted(message.member, config)) return;

  if (
    config.protections.invite.enabled &&
    invitePattern.test(message.content)
  ) {
    await enforce(message, config.protections.invite.action, "invite posting");
    return;
  }

  const links = config.protections.linkspam;
  if (
    links.enabled &&
    linkPattern.test(message.content) &&
    reachesLimit(key(message, "links"), links.threshold, links.window)
  ) {
    await enforce(message, links.action, "link spam");
    return;
  }

  const mentions = config.protections.massmention;
  const mentionCount =
    message.mentions.users.size +
    message.mentions.roles.size +
    Number(message.mentions.everyone);
  if (
    mentions.enabled &&
    mentionCount > 0 &&
    reachesLimit(key(message, "mentions"), mentions.threshold, mentions.window)
  ) {
    await enforce(message, mentions.action, "mass mentions");
    return;
  }

  const duplicate = config.protections.duplicatemessage;
  const normalized = message.content.trim().toLowerCase().slice(0, 200);
  if (
    duplicate.enabled &&
    normalized &&
    reachesLimit(
      key(message, `duplicate:${normalized}`),
      duplicate.threshold,
      duplicate.window,
    )
  ) {
    await enforce(message, duplicate.action, "duplicate message spam");
    return;
  }

  const spam = config.protections.messagespam;
  if (
    spam.enabled &&
    reachesLimit(key(message, "messages"), spam.threshold, spam.window)
  ) {
    await enforce(message, spam.action, "message spam");
  }
}

async function enforce(
  message: Message,
  action: RaidAction,
  reason: string,
): Promise<void> {
  await message.delete().catch(() => undefined);
  if (action !== "delete" && action !== "none" && message.member) {
    await punishRaider(
      message.guild!,
      message.member,
      action,
      `AntiRaid: ${reason}`,
    );
  }
}

function trusted(member: GuildMember, config: AntiRaidSettings): boolean {
  return (
    member.id === member.guild.ownerId ||
    config.whitelist.includes(member.id) ||
    config.admins.includes(member.id) ||
    member.permissions.has(PermissionFlagsBits.ManageMessages)
  );
}

function key(message: Message, action: string): string {
  return `${message.guildId}:${message.author.id}:${action}`;
}
