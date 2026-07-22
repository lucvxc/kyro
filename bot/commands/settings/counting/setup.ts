import { ChannelType, PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { updateCommunity } from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "counting setup",
  description: "Set the counting channel.",
  type: "message",
  context: "guild",
  permissions,
  args: {
    channel: { type: "channel", description: "Existing counting channel" },
  },
  run: async (ctx) => {
    let channel = ctx.channel("channel");
    if (!channel)
      channel = await ctx.guild!.channels.create({
        name: "counting",
        type: ChannelType.GuildText,
        reason: `Counting setup by ${ctx.author.tag}`,
      });
    if (!channel.isSendable())
      throw new UserError("Choose a channel where I can send messages.");
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      counting: {
        channelId: channel.id,
        count: 0,
        highScore: value.counting.highScore ?? 0,
      },
    }));
    return ctx.reply(
      embeds.success(`Counting is active in ${channel}. Start at **1**.`),
    );
  },
});
