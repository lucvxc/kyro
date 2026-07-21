import { ChannelType, PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { setupLogger } from "../../../services/settings/logger.ts";
import { loggerEmbeds } from "../../../utils/config/logger.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "logger setup",
  description: "Set up this server's logging channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "logger setup (channel)",
  example: "logger setup #logs",
  args: { channel: { type: "channel", description: "Existing logging channel" } },
  run: async ctx => {
    let channel = ctx.channel("channel");
    if (channel && !channel.isSendable()) throw new UserError("Choose a channel where I can send messages.");
    channel ??= await ctx.guild!.channels.create({ name: "logs", type: ChannelType.GuildText });

    await setupLogger(ctx.guild!.id, channel.id);
    await channel.send({ embeds: [loggerEmbeds.configured(channel.id).toJSON()], allowedMentions: { parse: [] } });
    return ctx.reply(embeds.success(`Logger configured in <#${channel.id}>.`));
  },
});
