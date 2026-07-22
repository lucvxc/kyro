import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { updateConfessions } from "../../../services/settings/confessions.ts";
import embeds from "../../../utils/config/embeds.ts";

export default cmd({
  name: "confession setup",
  description: "Set the anonymous confession channel.",
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
