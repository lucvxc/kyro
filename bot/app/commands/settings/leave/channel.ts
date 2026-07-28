import { PermissionFlagsBits, type GuildBasedChannel } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import { updateCommunity } from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: `leave channel`,
  description: `Set the leave message channel.`,
  syntax: "leave channel <channel>",
  example: "leave channel #goodbye",
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
      leave: { ...value.leave, channelId: channel.id },
    }));
    return ctx.reply(
      embeds.success(`Leave messages will be sent to ${channel}.`),
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
