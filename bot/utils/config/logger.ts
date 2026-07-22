import type {
  GuildBan,
  GuildMember,
  Invite,
  Message,
  PartialGuildMember,
  PartialMessage,
  VoiceState,
} from "discord.js";
import { container, thumb, type Container } from "../../../index.ts";
import { colors } from "./config.ts";

type Member = GuildMember | PartialGuildMember;
type AnyMessage = Message | PartialMessage;
type Actor = { id: string };

function card(
  title: string,
  color: string,
  body: string,
  thumbnail?: string,
): Container {
  return container()
    .accent(color)
    .section(
      `## ${title}\n-# <t:${Math.floor(Date.now() / 1_000)}:R>`,
      thumbnail ? thumb(thumbnail) : undefined,
    )
    .separator()
    .text(body);
}

const user = (id: string): string => `<@${id}>  ·  \`${id}\``;
const value = (label: string, content: string): string =>
  `**${label}**\n${content}`;
const quote = (content?: string | null, limit = 1_000): string =>
  `> ${(content?.slice(0, limit) || "No content").replace(/\n/g, "\n> ")}`;

export const loggerCards = {
  configured: (channelId: string) =>
    card(
      "Logger configured",
      colors.success,
      `${value("Destination", `<#${channelId}>`)}\n${value("Coverage", "All supported events")}`,
    ),

  messageDelete: (message: AnyMessage, actor?: Actor) =>
    card(
      "Message deleted",
      colors.error,
      `${value("Author", message.author ? user(message.author.id) : "Unknown")}${actor && actor.id !== message.author?.id ? `\n${value("Deleted by", user(actor.id))}` : ""}\n${value("Channel", `<#${message.channelId}>`)}\n\n${value("Deleted content", quote(message.content))}`,
      message.author?.displayAvatarURL(),
    ),

  messageEdit: (before: AnyMessage, after: AnyMessage) =>
    card(
      "Message edited",
      colors.warning,
      `${value("Author", after.author ? user(after.author.id) : "Unknown")}\n${value("Channel", `<#${after.channelId}>`)}\n\n${value("Before", quote(before.content, 650))}\n\n${value("After", quote(after.content, 650))}`,
      after.author?.displayAvatarURL(),
    ),

  memberJoin: (member: Member) => {
    const age = Math.floor(
      (Date.now() - member.user.createdTimestamp) / 86_400_000,
    );
    const risk =
      age < 7 ? "\n\n> ⚠ New account · less than seven days old" : "";
    return card(
      "Member joined",
      colors.success,
      `${value("Member", user(member.id))}\n${value("Account created", `<t:${Math.floor(member.user.createdTimestamp / 1_000)}:R>`)}\n${value("Population", member.guild.memberCount.toLocaleString())}${risk}`,
      member.user.displayAvatarURL(),
    );
  },

  memberLeave: (member: Member, actor?: Actor) =>
    card(
      actor ? "Member kicked" : "Member left",
      actor ? colors.error : colors.default,
      `${value("Member", user(member.id))}${actor ? `\n${value("Kicked by", user(actor.id))}` : ""}\n${value("Joined", member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1_000)}:R>` : "Unknown")}\n${value("Population", member.guild.memberCount.toLocaleString())}`,
      member.user.displayAvatarURL(),
    ),

  memberBan: (ban: GuildBan, actor?: Actor) =>
    card(
      "Member banned",
      colors.error,
      `${value("Member", user(ban.user.id))}${actor ? `\n${value("Banned by", user(actor.id))}` : ""}\n\n${value("Reason", quote(ban.reason || "No reason provided", 700))}`,
      ban.user.displayAvatarURL(),
    ),

  memberUnban: (ban: GuildBan, actor?: Actor) =>
    card(
      "Member unbanned",
      colors.success,
      `${value("Member", user(ban.user.id))}${actor ? `\n${value("Unbanned by", user(actor.id))}` : ""}`,
      ban.user.displayAvatarURL(),
    ),

  timeout: (member: GuildMember, removed = false, actor?: Actor) =>
    card(
      removed ? "Timeout removed" : "Member timed out",
      removed ? colors.success : colors.warning,
      `${value("Member", user(member.id))}${actor ? `\n${value("Updated by", user(actor.id))}` : ""}${removed ? "" : `\n${value("Expires", `<t:${Math.floor(member.communicationDisabledUntilTimestamp! / 1_000)}:F>`)}`}`,
      member.user.displayAvatarURL(),
    ),

  roles: (
    member: GuildMember,
    added: readonly string[],
    removed: readonly string[],
    actor?: Actor,
  ) =>
    card(
      "Member roles updated",
      colors.default,
      [
        value("Member", user(member.id)),
        actor ? value("Updated by", user(actor.id)) : "",
        added.length
          ? value("Granted", added.map((id) => `<@&${id}>`).join("  ·  "))
          : "",
        removed.length
          ? value("Removed", removed.map((id) => `<@&${id}>`).join("  ·  "))
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      member.user.displayAvatarURL(),
    ),

  voice: (
    state: VoiceState,
    action: "joined" | "left" | "moved",
    from?: string,
    to?: string,
  ) =>
    card(
      action === "moved" ? "Voice channel moved" : `Voice channel ${action}`,
      action === "joined"
        ? colors.success
        : action === "left"
          ? colors.error
          : colors.default,
      [
        value("Member", user(state.id)),
        from ? value("From", `<#${from}>`) : "",
        to ? value("To", `<#${to}>`) : "",
      ]
        .filter(Boolean)
        .join("\n"),
      state.member?.user.displayAvatarURL(),
    ),

  invite: (invite: Invite) =>
    card(
      "Invite created",
      colors.success,
      `${value("Code", `\`${invite.code}\``)}\n${value("Channel", invite.channelId ? `<#${invite.channelId}>` : "Unknown")}\n${value("Created by", invite.inviter ? user(invite.inviter.id) : "Unknown")}\n${value("Usage", invite.maxUses ? `${invite.maxUses} maximum` : "Unlimited")}\n${value("Expires", invite.expiresTimestamp ? `<t:${Math.floor(invite.expiresTimestamp / 1_000)}:R>` : "Never")}`,
      invite.inviter?.displayAvatarURL(),
    ),
};
