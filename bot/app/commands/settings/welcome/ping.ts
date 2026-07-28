import { PermissionFlagsBits, type GuildBasedChannel } from "discord.js";
import { cmd, UserError } from "../../../../../index.ts";
import {
  communitySettings,
  updateCommunity,
} from "../../../../features/settings/community.ts";
import embeds from "../../../../shared/config/embeds.ts";

const permission = [PermissionFlagsBits.ManageGuild];

export default cmd({
  name: "welcome ping",
  aliases: ["wel ping"],
  description: "Toggle a channel for join pings.",
  syntax: "welcome ping <channel>",
  example: "welcome ping channel",
  type: "message" as const,
  context: "guild" as const,
  permissions: permission,
  args: {
    channel: {
      type: "channel" as const,
      required: true,
      description: "Channel to toggle",
    },
  },
  run: async (ctx) => {
    const channel = sendable(ctx.channel("channel"));
    const current =
      (await communitySettings(ctx.guild!.id)).welcome.pingChannels ?? [];
    const enabled = !current.includes(channel.id);
    await updateCommunity(ctx.guild!.id, (value) => ({
      ...value,
      welcome: {
        ...value.welcome,
        pingChannels: enabled
          ? [...current, channel.id]
          : current.filter((id) => id !== channel.id),
      },
    }));
    return ctx.reply(
      embeds.success(
        `${enabled ? "Enabled" : "Disabled"} join pings in ${channel}.`,
      ),
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
