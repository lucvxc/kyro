import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { setIgnoredChannel } from "../../../../features/settings/logger.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "logger unignore",
  aliases: ["log unignore"],
  description: "Stop ignoring activity from a channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "logger unignore <channel>",
  example: "logger unignore #staff",
  args: {
    channel: {
      type: "channel",
      required: true,
      description: "Channel to unignore",
    },
  },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!(await setIgnoredChannel(ctx.guild!.id, channel.id, false)))
      throw new UserError(`<#${channel.id}> is not ignored.`);
    return ctx.reply(
      embeds.success(
        `Logger activity from <#${channel.id}> is no longer ignored.`,
      ),
    );
  },
});
