import { ChannelType, PermissionFlagsBits } from "discord.js";
import { randomUUID } from "node:crypto";
import { cmd, dominant, UserError } from "../../../../index.ts";
import { honeypotPanel } from "../../../services/settings/honeypot.ts";
import {
  securitySettings,
  updateSecurity,
} from "../../../services/settings/security.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "honeypot setup",
  aliases: ["hp create"],
  description: "Create a channel that catches automated spam accounts.",
  syntax: "honeypot setup",
  example: "honeypot setup",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  run: async (ctx) => {
    const current = (await securitySettings(ctx.guild!.id)).honeypot;
    if (current.channelId && ctx.guild!.channels.cache.has(current.channelId)) {
      throw new UserError(
        `Honeypot already exists at <#${current.channelId}>.`,
      );
    }
    const me = ctx.guild!.members.me;
    if (
      !me?.permissions.has([
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.KickMembers,
      ])
    ) {
      throw new UserError(
        "I need Manage Channels and Kick Members permissions.",
      );
    }
    const icon = ctx.guild!.iconURL({ size: 256, extension: "png" });
    const accent = await dominant(icon ?? ctx.client.user!.displayAvatarURL());
    const channel = await ctx.guild!.channels.create({
      name: channelName(),
      type: ChannelType.GuildText,
      topic: "Automated account trap. Members should not post here.",
      reason: `Honeypot setup by ${ctx.author.tag}`,
    });
    try {
      const panel = await channel.send(honeypotPanel(0, accent, icon));
      await updateSecurity(ctx.guild!.id, (value) => ({
        ...value,
        honeypot: {
          enabled: true,
          channelId: channel.id,
          panelMessageId: panel.id,
          catches: 0,
          accent,
        },
      }));
      return ctx.reply(embeds.success(`Honeypot created at ${channel}.`));
    } catch (error) {
      await channel.delete("Honeypot setup failed").catch(() => undefined);
      throw error;
    }
  },
});

function channelName(): string {
  return randomUUID().replaceAll("-", "").slice(0, 10);
}
