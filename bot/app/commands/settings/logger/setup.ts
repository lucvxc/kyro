import { ChannelType, PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { setupLogger } from "../../../../features/settings/logger.ts";
import embeds from "../../../../shared/config/embeds.ts";
import { loggerCards } from "../../../../shared/config/logger.ts";

export default cmd({
  name: "logger setup",
  aliases: ["log setup"],
  description: "Set up this server's logging channel.",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  syntax: "logger setup (channel)",
  example: "logger setup #logs",
  args: {
    channel: { type: "channel", description: "Existing logging channel" },
  },
  run: async (ctx) => {
    let channel = ctx.channel("channel");
    if (channel && !channel.isSendable())
      throw new UserError("Choose a channel where I can send messages.");
    if (!channel) {
      const guild = ctx.guild!;
      const me = guild.members.me ?? (await guild.members.fetchMe());
      channel = await guild.channels.create({
        name: "logs",
        type: ChannelType.GuildText,
        reason: `Logger setup by ${ctx.author.tag}`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: me.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });
    }

    await setupLogger(ctx.guild!.id, channel.id);
    const card = loggerCards.configured(channel.id);
    await ctx.send(channel, card);
    return ctx.reply(embeds.success(`Logger configured in <#${channel.id}>.`));
  },
});
