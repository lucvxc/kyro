import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { setLoggerChannel } from "../../../../features/settings/logger.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "logger channel",
  aliases: ["log channel"],
  description: "Change the logging channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "logger channel <channel>",
  example: "logger channel #logs",
  args: {
    channel: {
      type: "channel",
      required: true,
      description: "New logging channel",
    },
  },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!channel.isSendable())
      throw new UserError("Choose a channel where I can send messages.");
    await setLoggerChannel(ctx.guild!.id, channel.id);
    return ctx.reply(
      embeds.success(`Logs will now be sent to <#${channel.id}>.`),
    );
  },
});
