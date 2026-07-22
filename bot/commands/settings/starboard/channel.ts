import { PermissionFlagsBits } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { updateCommunity } from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permissions = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "starboard channel",
  description: "Change the starboard channel.",
  type: "message",
  context: "guild",
  permissions,
  args: {
    channel: {
      type: "channel",
      required: true,
      description: "New starboard channel",
    },
  },
  run: async (ctx) => {
    const channel = ctx.channel("channel")!;
    if (!channel.isSendable()) {
      throw new UserError("Choose a channel where I can send messages.");
    }
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      starboard: { ...value.starboard, channelId: channel.id },
    }));
    return ctx.reply(
      embeds.success(`Starboard channel changed to ${channel}.`),
    );
  },
});
