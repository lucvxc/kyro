import { ChannelType, MessageFlags, PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { setupLogger } from "../../../services/settings/logger.ts";
import { loggerCards } from "../../../utils/config/logger.ts";
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
    if (!channel) {
      const guild = ctx.guild!;
      const me = guild.members.me ?? await guild.members.fetchMe();
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
    await channel.send({
      components: [card.toJSON()],
      flags: MessageFlags.IsComponentsV2,
      files: card.files,
      allowedMentions: { parse: [] },
    });
    return ctx.reply(embeds.success(`Logger configured in <#${channel.id}>.`));
  },
});
