import { PermissionFlagsBits, type GuildBasedChannel } from "discord.js";
import { cmd, UserError } from "../../../../index.ts";
import { updateCommunity } from "../../../services/settings/community.ts";
import embeds from "../../../utils/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `welcome channel`,
  description: `Set the welcome message channel.`,
  type: "message",
  context: "guild",
  permissions: permission,
  args: {
    channel: {
      type: "channel",
      required: true,
      description: "Destination channel",
    },
  },
  run: async (ctx) => {
    const channel = sendable(ctx.channel("channel"));
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      welcome: { ...value.welcome, channelId: channel.id },
    }));
    return ctx.reply(
      embeds.success(`Welcome messages will be sent to ${channel}.`),
    );
  },
});

function sendable(
  channel: GuildBasedChannel | null,
): Extract<GuildBasedChannel, { send: Function }> {
  if (!channel?.isSendable())
    throw new UserError("Choose a channel where I can send messages.");
  return channel as never;
}
