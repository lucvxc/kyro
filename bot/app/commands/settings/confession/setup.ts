import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { updateConfessions } from "../../../../features/settings/confessions.ts";
import embeds from "../../../../shared/config/embeds.ts";

export default cmd({
  name: "confession setup",
  aliases: ["conf setup"],
  description: "Set the anonymous confession channel.",
  syntax: "confession setup <channel>",
  example: "confession setup #channel",
  type: "message",
  context: "guild",
  permissions: [PermissionFlagsBits.ManageGuild],
  args: {
    channel: {
      type: "channel",
      required: true,
      description: "Confession channel",
    },
  },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!channel.isSendable())
      throw new UserError("Choose a channel where I can send messages.");
    await updateConfessions(ctx.guild!.id, (value) => ({
      ...value,
      channelId: channel.id,
      enabled: true,
    }));
    return ctx.reply(embeds.success(`Confessions will be sent in ${channel}.`));
  },
});
