import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { setIgnoredChannel } from "../../../../features/settings/logger.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "logger ignore",
  aliases: ["log ignore"],
  description: "Ignore activity from a channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "logger ignore <channel>",
  example: "logger ignore #staff",
  args: {
    channel: {
      type: "channel",
      required: true,
      description: "Channel to ignore",
    },
  },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!(await setIgnoredChannel(ctx.guild!.id, channel.id, true)))
      throw new UserError(`<#${channel.id}> is already ignored.`);
    return ctx.reply(
      embeds.success(`Ignoring logger activity from <#${channel.id}>.`),
    );
  },
});
