import type {
  GuildBan,
  GuildMember,
  Invite,
  Message,
  PartialGuildMember,
  PartialMessage,
  VoiceState,
} from "discord.js";
import { embed, type Embed } from "../../../index.ts";
import { colors } from "./config.ts";

type Member = GuildMember | PartialGuildMember;
type AnyMessage = Message | PartialMessage;

const base = (title: string, color: string, description: string, thumbnail?: string): Embed => embed({
  title,
  color,
  description,
  thumbnail,
  timestamp: true,
});

const user = (id: string): string => `<@${id}> (\`${id}\`)`;
const content = (value?: string | null, limit = 1_000): string => value?.slice(0, limit) || "No content";

export const loggerEmbeds = {
  configured: (channelId: string) => base(
    "Logger configured",
    colors.success,
    `Logs will be sent to <#${channelId}>.`,
  ),

  messageDelete: (message: AnyMessage) => base(
    "Message deleted",
    colors.error,
    `**Author:** ${message.author ? user(message.author.id) : "Unknown"}\n**Channel:** <#${message.channelId}>\n\n**Content**\n${content(message.content)}`,
    message.author?.displayAvatarURL(),
  ),

  messageEdit: (before: AnyMessage, after: AnyMessage) => base(
    "Message edited",
    colors.warning,
    `**Author:** ${after.author ? user(after.author.id) : "Unknown"}\n**Channel:** <#${after.channelId}>\n\n**Before**\n${content(before.content, 700)}\n\n**After**\n${content(after.content, 700)}`,
    after.author?.displayAvatarURL(),
  ),

  memberJoin: (member: Member) => {
    const age = Math.floor((Date.now() - member.user.createdTimestamp) / 86_400_000);
    const warning = age < 7 ? "\n\n⚠️ This account is less than seven days old." : "";
    return base(
      "Member joined",
      colors.success,
      `**User:** ${user(member.id)}\n**Account created:** <t:${Math.floor(member.user.createdTimestamp / 1_000)}:R>\n**Member count:** ${member.guild.memberCount}${warning}`,
      member.user.displayAvatarURL(),
    );
  },

  memberLeave: (member: Member) => base(
    "Member left",
    colors.default,
    `**User:** ${user(member.id)}\n**Joined:** ${member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1_000)}:R>` : "Unknown"}\n**Member count:** ${member.guild.memberCount}`,
    member.user.displayAvatarURL(),
  ),

  memberBan: (ban: GuildBan) => base(
    "Member banned",
    colors.error,
    `**User:** ${user(ban.user.id)}\n**Reason:** ${ban.reason || "No reason provided"}`,
    ban.user.displayAvatarURL(),
  ),

  memberUnban: (ban: GuildBan) => base(
    "Member unbanned",
    colors.success,
    `**User:** ${user(ban.user.id)}`,
    ban.user.displayAvatarURL(),
  ),

  timeout: (member: GuildMember, removed = false) => base(
    removed ? "Timeout removed" : "Member timed out",
    removed ? colors.success : colors.warning,
    `**User:** ${user(member.id)}${removed ? "" : `\n**Until:** <t:${Math.floor(member.communicationDisabledUntilTimestamp! / 1_000)}:F>`}`,
    member.user.displayAvatarURL(),
  ),

  roles: (member: GuildMember, added: readonly string[], removed: readonly string[]) => base(
    "Member roles updated",
    colors.default,
    [`**User:** ${user(member.id)}`, added.length ? `**Added:** ${added.map(id => `<@&${id}>`).join(", ")}` : "", removed.length ? `**Removed:** ${removed.map(id => `<@&${id}>`).join(", ")}` : ""].filter(Boolean).join("\n"),
    member.user.displayAvatarURL(),
  ),

  voice: (state: VoiceState, action: "joined" | "left" | "moved", from?: string, to?: string) => base(
    `Voice channel ${action}`,
    action === "joined" ? colors.success : action === "left" ? colors.error : colors.default,
    [`**User:** ${user(state.id)}`, from ? `**From:** <#${from}>` : "", to ? `**To:** <#${to}>` : ""].filter(Boolean).join("\n"),
    state.member?.user.displayAvatarURL(),
  ),

  invite: (invite: Invite) => base(
    "Invite created",
    colors.success,
    `**Code:** \`${invite.code}\`\n**Channel:** ${invite.channelId ? `<#${invite.channelId}>` : "Unknown"}\n**Created by:** ${invite.inviter ? user(invite.inviter.id) : "Unknown"}\n**Uses:** ${invite.maxUses || "Unlimited"}\n**Expires:** ${invite.expiresTimestamp ? `<t:${Math.floor(invite.expiresTimestamp / 1_000)}:R>` : "Never"}`,
    invite.inviter?.displayAvatarURL(),
  ),
};
